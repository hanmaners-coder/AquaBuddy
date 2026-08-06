# ws_server.py
"""WebSocket server for real-time chat in AquaBuddy.
Clients connect, send a JSON message with a JWT token for authentication.
After authentication, messages are broadcast to all connected users.
Message format (client -> server):
    {"token": "<JWT>", "chat_id": 1, "message": "Hello"}
Server broadcasts messages to all clients in the same chat:
    {"user_id": 5, "user_name": "alice@example.com", "chat_id": 1, "message": "Hello", "timestamp": "2023-01-01T12:00:00Z"}
"""
import asyncio
import json
import os
from datetime import datetime
import websockets
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

# Ensure imports work from sibling files
import sys
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.append(BASE_DIR)

from auth_utils import decode_token
from db import add_chat_message, get_chat_messages

CONNECTED = set()  # set of (websocket, user_info)

async def handler(websocket, path):
    # Expect the first message to contain auth token
    try:
        auth_msg = await asyncio.wait_for(websocket.recv(), timeout=10)
        payload = json.loads(auth_msg)
        token = payload.get('token')
        if not token:
            await websocket.send(json.dumps({'error': 'Missing token'}))
            await websocket.close()
            return
        try:
            decoded = decode_token(token)
            user = {'id': decoded.get('sub'), 'email': decoded.get('email')}
        except Exception:
            await websocket.send(json.dumps({'error': 'Invalid token'}))
            await websocket.close()
            return
    except (asyncio.TimeoutError, json.JSONDecodeError):
        await websocket.send(json.dumps({'error': 'Auth required'}))
        await websocket.close()
        return

    # Register connection
    CONNECTED.add((websocket, user))
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                chat_id = data.get('chat_id')
                text = data.get('message')
                if not chat_id or not text:
                    continue
                chat_msg = {
                    'user_id': user['id'],
                    'user_name': user['email'],
                    'chat_id': chat_id,
                    'message': text,
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                }
                add_chat_message(chat_id, chat_msg)
                broadcast = json.dumps(chat_msg)
                await asyncio.gather(*[
                    ws.send(broadcast) for ws, u in CONNECTED if u['id'] != user['id']
                ])
            except json.JSONDecodeError:
                continue
    except (ConnectionClosedOK, ConnectionClosedError):
        pass
    finally:
        CONNECTED.discard((websocket, user))

if __name__ == '__main__':
    PORT = 8082
    # Use asyncio.run to start the server with a proper event loop
    async def main():
        async with websockets.serve(handler, "0.0.0.0", PORT):
            print(f"AquaBuddy WebSocket server listening on ws://0.0.0.0:{PORT}")
            await asyncio.Future()  # run forever
    asyncio.run(main())
