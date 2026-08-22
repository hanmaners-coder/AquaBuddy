import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html2 = re.sub(r'app\.js\?v=[^"]+', 'app.js?v=V530_6CARD_DASHBOARD', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html2)

with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()

sw2 = re.sub(r"aquabuddy-cache-v[a-zA-Z0-9_\-]+", 'aquabuddy-cache-v530-6card-dashboard', sw)

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw2)

print('Cache version bumped to V530_6CARD_DASHBOARD')
