# ==========================================================================
# AquaBuddy (아쿠아버디) - Multi-User Realtime Threaded Server (v19.0)
# Uses socketserver.ThreadingTCPServer to prevent single-threaded blocking
# ==========================================================================

import http.server
import socketserver
import json
import os
import time

PORT = 8080
CLIENT_QUEUES = []
SHARED_POSTS = []
SHARED_CHATS = {}

class ThreadingHTTPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

class RealtimeHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/events':
            # Server-Sent Events (SSE) Real-time Stream endpoint
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('X-Accel-Buffering', 'no')
            self.end_headers()

            client_queue = []
            CLIENT_QUEUES.append(client_queue)

            try:
                # Send initial state broadcast
                init_msg = json.dumps({'type': 'INIT_STATE', 'posts': SHARED_POSTS, 'chats': SHARED_CHATS})
                self.wfile.write(f"data: {init_msg}\n\n".encode('utf-8'))
                self.wfile.flush()

                ping_counter = 0
                while True:
                    if client_queue:
                        event_data = client_queue.pop(0)
                        msg = json.dumps(event_data)
                        self.wfile.write(f"data: {msg}\n\n".encode('utf-8'))
                        self.wfile.flush()
                    
                    # Heartbeat ping every 15 seconds to keep connection alive on mobile
                    ping_counter += 1
                    if ping_counter >= 150:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
                        ping_counter = 0

                    time.sleep(0.1)
            except (ConnectionResetError, BrokenPipeError, Exception):
                pass
            finally:
                if client_queue in CLIENT_QUEUES:
                    CLIENT_QUEUES.remove(client_queue)
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/broadcast':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            
            try:
                data = json.loads(body)
                event_type = data.get('type')

                global SHARED_POSTS, SHARED_CHATS

                if event_type == 'NEW_POST':
                    new_post = data.get('post')
                    if new_post:
                        SHARED_POSTS.insert(0, new_post)
                elif event_type == 'UPDATE_POST':
                    updated_post = data.get('post')
                    if updated_post:
                        for idx, p in enumerate(SHARED_POSTS):
                            if p['id'] == updated_post['id']:
                                SHARED_POSTS[idx] = updated_post
                                break
                elif event_type == 'DELETE_POST':
                    post_id = data.get('postId')
                    if post_id:
                        SHARED_POSTS = [p for p in SHARED_POSTS if p['id'] != post_id]
                elif event_type == 'CHAT_MESSAGE':
                    post_id = data.get('postId')
                    msg = data.get('message')
                    if post_id and msg:
                        if post_id not in SHARED_CHATS:
                            SHARED_CHATS[post_id] = []
                        SHARED_CHATS[post_id].append(msg)

                # Broadcast to all connected SSE clients (Galaxy, iPhone, PC)
                for q in CLIENT_QUEUES:
                    q.append(data)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)

    with ThreadingHTTPServer(("", PORT), RealtimeHTTPHandler) as httpd:
        print(f"AquaBuddy Threaded Realtime Multi-User Server listening on http://0.0.0.0:{PORT}")
        httpd.serve_forever()
