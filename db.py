# db.py
"""SQLite helper module for AquaBuddy.
Provides connection handling, table creation, and CRUD utilities.
All timestamps are stored as ISO strings (UTC).
"""
import os
import sqlite3
from contextlib import contextmanager
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "db.sqlite3")

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.commit()
        conn.close()

def init_db():
    """Create tables if they do not exist."""
    with get_conn() as conn:
        cur = conn.cursor()
        # Users table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            provider TEXT NOT NULL DEFAULT 'local',
            social_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """)
        # Posts table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            "desc" TEXT,
            category TEXT,
            category_name TEXT,
            user_name TEXT,
            user_id INTEGER,
            created_at TEXT,
            updated_at TEXT,
            is_premium INTEGER DEFAULT 0,
            price INTEGER,
            class_fee INTEGER,
            images TEXT,
            comments TEXT,
            likes INTEGER DEFAULT 0,
            wishlist_count INTEGER DEFAULT 0,
            status TEXT,
            region TEXT,
            map_address TEXT,
            location_name TEXT,
            req_license TEXT,
            instructor_license_code TEXT
        )
        """)
        # Chats table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            time TEXT NOT NULL
        )
        """)
        # Indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chats_post ON chats (post_id)")

def dict_from_row(row):
    return {k: row[k] for k in row.keys()}

# ----- User helpers -----
def get_user_by_email(email):
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        return dict_from_row(row) if row else None

def get_user_by_id(user_id):
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict_from_row(row) if row else None

def create_user(email, password_hash, provider='local', social_id=None):
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (email, password_hash, provider, social_id, created_at, updated_at) VALUES (?,?,?,?,?,?)",
            (email, password_hash, provider, social_id, now, now)
        )
        return cur.lastrowid

def update_user_password(user_id, password_hash):
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (password_hash, now, user_id)
        )

# ----- Post helpers -----
def get_post(post_id):
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
        row = cur.fetchone()
        return dict_from_row(row) if row else None

def get_posts(filter_clause="", params=()):
    with get_conn() as conn:
        query = "SELECT * FROM posts"
        if filter_clause:
            query += " WHERE " + filter_clause
        query += " ORDER BY created_at DESC"
        cur = conn.execute(query, params)
        return [dict_from_row(r) for r in cur.fetchall()]

def create_post(post_dict):
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    # Ensure JSON fields are stored as strings
    json_fields = ['images', 'comments']
    for f in json_fields:
        if isinstance(post_dict.get(f), (list, dict)):
            post_dict[f] = json.dumps(post_dict[f])
    fields = list(post_dict.keys()) + ["created_at", "updated_at"]
    placeholders = ",".join(["?"] * len(fields))
    values = list(post_dict.values()) + [now, now]
    with get_conn() as conn:
        conn.execute(
            f"INSERT INTO posts ({', '.join(fields)}) VALUES ({placeholders})",
            tuple(values)
        )

def update_post(post_id, updates):
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    json_fields = ['images', 'comments']
    for f in json_fields:
        if f in updates and isinstance(updates[f], (list, dict)):
            updates[f] = json.dumps(updates[f])
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()]) + ", updated_at = ?"
    values = list(updates.values()) + [now, post_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE posts SET {set_clause} WHERE id = ?", tuple(values))

def delete_post(post_id):
    with get_conn() as conn:
        conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        conn.execute("DELETE FROM chats WHERE post_id = ?", (post_id,))

# ----- Chat helpers -----
def add_chat_message(post_id, sender, author, text, time_str, timestamp):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO chats (post_id, sender, author, text, time, timestamp) VALUES (?,?,?,?,?,?)",
            (post_id, sender, author, text, time_str, timestamp)
        )

def get_chat_messages(post_id, since_timestamp=0):
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT * FROM chats WHERE post_id = ? AND timestamp >= ? ORDER BY timestamp ASC",
            (post_id, since_timestamp)
        )
        return [dict_from_row(r) for r in cur.fetchall()]
