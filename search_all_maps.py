import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"app.js total lines: {len(lines)}")

print("\n--- ALL OCCURRENCES OF Map & Dashboard functions ---")
for i, l in enumerate(lines):
    if any(k in l for k in ['initKakaoOceanMap', 'renderUnifiedSpotDashboard', 'new kakao.maps.Map', 'new window.kakao.maps.Map', 'oceanKakaoMap']):
        print(f"L{i+1}: {l.strip()[:120]}")
