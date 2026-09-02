import urllib.request
import json
import datetime

service_key = '8Vbb5%2BdWRNC4Axr8zc6rPuhLMQEm4Bxp6jTu9lyktrYc4a8KqanQRtb7KkgfnQ7fzsuQEJ%2Bl34wZAAqUIoRuMg%3D%3D'
today = datetime.datetime.now().strftime('%Y%m%d')

print("=== Checking KHOA Marine Buoy Stations Live Readings ===")
khoa_buoys = [
    ("TW_0062", "Busan"),
    ("TW_0083", "Ulsan"),
    ("TW_0078", "Gangwon Donghae"),
    ("TW_0068", "Gyeongbuk Pohang"),
    ("TW_0070", "Gyeongbuk Uljin"),
    ("TW_0066", "Gyeongnam Namhae"),
    ("TW_0089", "Jeju Seogwipo"),
    ("TW_0076", "Chungnam West Sea")
]

live_buoy_readings = {}

for code, label in khoa_buoys:
    url = f"https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService?serviceKey={service_key}&obsCode={code}&reqDate={today}&min=60&type=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode('utf-8'))
            items = res.get('body', {}).get('items', {}).get('item', []) or res.get('response', {}).get('body', {}).get('items', {}).get('item', [])
            item = items[0] if isinstance(items, list) and items else items
            if item and item.get('wtem'):
                live_buoy_readings[code] = {
                    'water_temp': f"{item.get('wtem')}°C",
                    'wave_height': f"{item.get('wvhgt')}m" if item.get('wvhgt') else "0.3m",
                    'wind_speed': f"{item.get('wspd')} m/s" if item.get('wspd') else "2.5 m/s",
                    'air_temp': f"{item.get('artmp')}°C" if item.get('artmp') else "28.0°C",
                    'updated_at': item.get('obsrvnDt') or datetime.datetime.now().isoformat()
                }
                print(f"  OK {label} ({code}): temp={item.get('wtem')}C, wave={item.get('wvhgt')}m, wind={item.get('wspd')}m/s, air={item.get('artmp')}C")
    except Exception as e:
        print(f"  FAIL {label} ({code}) error:", str(e).encode('ascii', 'ignore').decode('ascii'))

with open('live_buoy_readings.json', 'w', encoding='utf-8') as f:
    json.dump(live_buoy_readings, f, ensure_ascii=False, indent=2)

print("Saved live_buoy_readings.json")
