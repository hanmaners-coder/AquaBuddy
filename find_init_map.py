import sys

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if 'initKakaoOceanMap' in line:
        print(f"L{idx}: {line.strip()[:140]}")
