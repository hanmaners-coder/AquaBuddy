import json
import sys
import time
import urllib.request
import urllib.error

BASE_URL = 'http://localhost:9090'

def post_json(path, data):
    url = f'{BASE_URL}{path}'
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.load(resp), resp.getcode()

def get_json(path):
    url = f'{BASE_URL}{path}'
    with urllib.request.urlopen(url) as resp:
        return json.load(resp), resp.getcode()

def run_test():
    email = f'test_user_{int(time.time())}@example.com'
    password = '123456'
    nick = '테스트닉네임'
    real_name = '테스트이름'
    phone = '010-1234-5678'
    license = '다이버카드123'

    print('--- 회원가입 시도 ---')
    signup_payload = {
        'email': email,
        'password': password,
        'realName': real_name,
        'nick': nick,
        'phone': phone,
        'license': license
    }
    resp, status = post_json('/api/signup', signup_payload)
    print('Signup status:', status, 'response:', resp)
    token = resp.get('token')
    if not token:
        print('Signup failed, aborting')
        sys.exit(1)

    print('--- 로그인 시도 (가입 직후 자동 로그인 확인) ---')
    login_payload = {'email': email, 'password': password}
    resp, status = post_json('/api/login', login_payload)
    print('Login status:', status, 'response:', resp)
    token = resp.get('token')
    if not token:
        print('Login failed')
        sys.exit(1)

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    # Create post
    print('--- 포스트 생성 ---')
    post_data = {
        'title': '테스트 포스트',
        'content': '이것은 자동화 테스트용 포스트입니다.',
        'category': 'test'
    }
    url = f'{BASE_URL}/api/posts'
    req = urllib.request.Request(url, data=json.dumps(post_data).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp_obj:
        post_resp = json.load(resp_obj)
        print('Create post response:', post_resp)
        post_id = post_resp.get('post', {}).get('id')
    if not post_id:
        print('Post creation failed')
        sys.exit(1)

    print('--- 포스트 목록 조회 ---')
    resp, status = get_json('/api/posts')
    print('Posts list status:', status)
    posts = resp.get('posts', [])
    found = any(p.get('id') == post_id for p in posts)
    print('Created post found in list:', found)

if __name__ == '__main__':
    run_test()
