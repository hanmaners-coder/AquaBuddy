import re

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if 'selectScubaPoint' in line or 'scubaPointSelect' in line or 'SS14' in line or '태종대' in line or '23.1' in line:
        print(f"L{idx}: {line.strip()[:140]}")
