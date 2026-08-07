# auth_utils.py
"""Authentication utilities for AquaBuddy.
- bcrypt for password hashing
- PyJWT for token creation/verification

These functions are retained as comments for reference in case we need to revert to local JWT authentication.
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env from project root (scratch directory)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = 7

# ---- JWT functions (commented out) ----
# def hash_password(plain_password: str) -> str:
#     """Hash a plain password using bcrypt and return the hashed string."""
#     salt = bcrypt.gensalt()
#     hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
#     return hashed.decode('utf-8')

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Verify a plain password against the stored bcrypt hash."""
#     return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# def create_token(user_id: int, email: str) -> str:
#     """Create a JWT token valid for JWT_EXP_DAYS days.
#     Payload includes user_id and email.
#     """
#     expiration = datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)
#     payload = {
#         "sub": user_id,
#         "email": email,
#         "exp": expiration,
#         "iat": datetime.utcnow()
#     }
#     token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
#     if isinstance(token, bytes):
#         token = token.decode('utf-8')
#     return token

# def decode_token(token: str):
#     """Decode and verify JWT token. Returns payload dict or raises jwt exceptions."""
#     return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

# Note: Supabase authentication is now handled on the client side (app.js) using the JavaScript SDK.
