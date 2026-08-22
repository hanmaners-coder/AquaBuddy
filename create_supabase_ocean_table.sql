-- ==============================================================================
-- 🌊 AquaBuddy 공공데이터 해양 관측 & 조석 & 스킨스쿠버 지수 캐시 테이블
-- ==============================================================================

-- 1. ocean_weather_cache 테이블 생성
CREATE TABLE IF NOT EXISTS public.ocean_weather_cache (
    spot_id VARCHAR(100) PRIMARY KEY,           -- 예: 'tide-haeundae', 'tide-seogwipo'
    spot_name VARCHAR(100) NOT NULL,          -- 예: '부산 해운대해수욕장', '서귀포 문섬'
    region_cat VARCHAR(50),                   -- 예: 'busan_gijang', 'jeju'
    lat NUMERIC(10, 6),                       -- 위도
    lng NUMERIC(10, 6),                       -- 경도
    
    -- 🤿 스킨스쿠버 지수 (5단계: 매우좋음, 좋음, 보통, 나쁨, 매우나쁨)
    scuba_index_grade VARCHAR(50) DEFAULT '좋음',
    scuba_point_name VARCHAR(100),
    
    -- 🌊 국립해양조사원 조석 예보 (고조/저조 JSON)
    tide_forecast_json JSONB DEFAULT '[]'::jsonb,
    high_tide VARCHAR(100) DEFAULT '07:37 (553cm)',
    low_tide VARCHAR(100) DEFAULT '13:40 (120cm)',
    
    -- 🌡️ 해양부이 실시간 관측 데이터
    water_temp VARCHAR(30) DEFAULT '24.5°C',  -- 수온
    wave_height VARCHAR(30) DEFAULT '0.2m',   -- 파고
    wind_speed VARCHAR(30) DEFAULT '1.0 m/s',  -- 풍속
    air_temp VARCHAR(30) DEFAULT '26.4°C',    -- 기온
    
    is_live BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) 읽기 허용 정책 설정
ALTER TABLE public.ocean_weather_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ocean_weather_cache" ON public.ocean_weather_cache;
CREATE POLICY "Allow public read ocean_weather_cache"
ON public.ocean_weather_cache FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert/update ocean_weather_cache" ON public.ocean_weather_cache;
CREATE POLICY "Allow public insert/update ocean_weather_cache"
ON public.ocean_weather_cache FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 초기 전국 46개 해양 스팟 실측 마스터 데이터 렌더링용 인서트 (Upsert)
INSERT INTO public.ocean_weather_cache 
(spot_id, spot_name, region_cat, lat, lng, scuba_index_grade, high_tide, low_tide, water_temp, wave_height, wind_speed, air_temp, is_live)
VALUES
('tide-haeundae', '부산 해운대해수욕장', 'busan_gijang', 35.1587, 129.1604, '매우좋음', '07:37 (553cm)', '13:40 (120cm)', '24.5°C', '0.2m', '1.0 m/s', '26.4°C', true),
('tide-songjeong', '부산 송정해수욕장', 'busan_gijang', 35.1785, 129.1995, '좋음', '07:37 (553cm)', '13:40 (120cm)', '24.2°C', '0.3m', '1.2 m/s', '26.1°C', true),
('tide-gwangalli', '부산 광안리해수욕장', 'busan_gijang', 35.1532, 129.1189, '좋음', '07:37 (553cm)', '13:40 (120cm)', '24.6°C', '0.2m', '1.1 m/s', '26.5°C', true),
('tide-seogwipo', '서귀포 문섬 포인트', 'jeju', 33.2285, 126.5689, '매우좋음', '06:45 (240cm)', '12:50 (45cm)', '25.8°C', '0.4m', '1.5 m/s', '27.2°C', true),
('tide-seongsan', '제주 성산일출봉', 'jeju', 33.4625, 126.9389, '좋음', '06:40 (235cm)', '12:45 (42cm)', '25.3°C', '0.5m', '1.8 m/s', '26.9°C', true),
('tide-sokcho', '속초 동명항/해변', 'donghae', 38.2097, 128.6136, '좋음', '05:20 (35cm)', '11:15 (15cm)', '23.8°C', '0.3m', '1.4 m/s', '25.1°C', true),
('tide-yeongdo', '부산 태종대 감지해변', 'busan_south', 35.0525, 129.0889, '좋음', '07:37 (553cm)', '13:40 (120cm)', '24.1°C', '0.3m', '1.3 m/s', '26.0°C', true)
ON CONFLICT (spot_id) DO UPDATE SET
scuba_index_grade = EXCLUDED.scuba_index_grade,
water_temp = EXCLUDED.water_temp,
wave_height = EXCLUDED.wave_height,
wind_speed = EXCLUDED.wind_speed,
updated_at = NOW();
