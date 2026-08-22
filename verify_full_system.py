import subprocess, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. JS Syntax tests
for js_file in ['app.js', 'config.js', 'sw.js']:
    res = subprocess.run(['node', '-c', js_file], capture_output=True, text=True)
    print(f"[{js_file}] Syntax check: code={res.returncode}")
    if res.returncode != 0:
        print(f"  Error: {res.stderr}")

# 2. HTML Tag Balance
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("\n=== index.html Verification ===")
print("Length:", len(html))
print("Lines:", len(html.splitlines()))
print("Has <!DOCTYPE html>:", '<!DOCTYPE html>' in html)
print("Has </html>:", '</html>' in html)
print("Has </body>:", '</body>' in html)
print("Korean chars count:", len(re.findall(r'[가-힣]', html)))
print("Corrupted '???' count:", html.count('???'))
print("Corrupted Unicode replacement count:", html.count('\ufffd'))

for tag in ['html', 'head', 'body', 'script', 'style']:
    opens = len(re.findall(r'<' + tag + r'(?:\s|>|$)', html, re.IGNORECASE))
    closes = len(re.findall(r'</' + tag + r'>', html, re.IGNORECASE))
    print(f"Tag <{tag}>: {opens} opens, {closes} closes")

# 3. Check for essential elements in index.html
elements = [
    'mainFeedViewSection',
    'tideViewSection',
    'cctvViewSection',
    'categoryFilterBar',
    'instructorSubFilterBar',
    'activitySubFilterBar',
    'partnershipSubFilterBar',
    'partnershipTeaserBanner',
    'oceanWeatherSection',
    'mainBannerSlider',
    'instructorAuthModal',
    'authModal',
    'adminDashboardModal',
    'certificateImageModal'
]
for el in elements:
    if f'id="{el}"' in html or f'id=\'{el}\'' in html:
        print(f"  [PASS] Element #{el} found")
    else:
        print(f"  [FAIL] Element #{el} MISSING!")
