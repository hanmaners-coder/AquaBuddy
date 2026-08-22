-- ==========================================================================
-- 🌊 AquaBuddy (아쿠아버디) - 통합 해양 기상 DB 테이블 DDL Script
-- 3대 공공데이터 API (조석 166곳, 해양부이 38곳, 스킨스쿠버 18곳) 단일 통합 테이블
-- Supabase SQL Editor용 복사 전용 스크립트
-- ==========================================================================

-- 1. 기존 테이블 및 트리거 초기화 (재생성 시 안전 조치)
DROP TRIGGER IF EXISTS set_ocean_weather_cache_updated_at ON public.ocean_weather_cache;
DROP FUNCTION IF EXISTS update_ocean_weather_cache_modtime();
DROP TABLE IF EXISTS public.ocean_weather_cache;

-- 2. 통합 해양 기상 테이블 생성 (ocean_weather_cache)
CREATE TABLE public.ocean_weather_cache (
    -- 📍 1. 기본 키 및 식별 정보 (Essential Identifiers)
    spot_id VARCHAR(50) PRIMARY KEY,                   -- 스팟 고유 식별자 (예: 'tide-spot-001', 'tide-haeundae', 'SS10')
    spot_name VARCHAR(100) NOT NULL,                    -- 스팟 명칭 (예: '인천', '부산 해운대 해수욕장', '문섬')
    region_cat VARCHAR(30) DEFAULT 'general',          -- 권역 분류 ('busan', 'jeju', 'gangwon', 'seohae', 'namhae', 'donghae')
    lat NUMERIC(10, 6) NOT NULL,                        -- 위도 (Latitude, 예: 35.158700)
    lng NUMERIC(10, 6) NOT NULL,                        -- 경도 (Longitude, 예: 129.160400)

    -- 🔗 2. 3대 공공데이터 API 매핑 코드 (NULL 허용: 미제공 지점 대응)
    tide_code VARCHAR(20) DEFAULT NULL,                 -- [조석 API] 예보지점 코드 (166곳, 예: 'DT_0001', 'SO_0553')
    buoy_code VARCHAR(20) DEFAULT NULL,                 -- [부이 API] 관측소 코드 (38곳, 예: 'TW_0062', 'HB_0001')
    scuba_code VARCHAR(20) DEFAULT NULL,                -- [스쿠버 API] 장소 코드 (18곳, 예: 'SS1' ~ 'SS18')

    -- 🌊 3. 해양 부이 관측 API 실시간 컬럼 (GetTWRecentApiService)
    water_temp VARCHAR(20) DEFAULT NULL,                -- [부이 API] 수온 (°C, 'wtem', 예: '25.55')
    wave_height VARCHAR(20) DEFAULT NULL,               -- [부이 API] 파고 (m, 'wvhgt', 예: '0.3')
    wind_speed VARCHAR(20) DEFAULT NULL,                -- [부이 API] 풍속 (m/s, 'wspd', 예: '3.7')
    air_temp VARCHAR(20) DEFAULT NULL,                  -- [부이 API] 기온 (°C, 'artmp', 예: '28.4')
    air_press NUMERIC(7, 2) DEFAULT NULL,               -- [부이 API] 기압 (hPa, 'atmpr', 예: 1002.10)
    wind_dir NUMERIC(6, 2) DEFAULT NULL,                -- [부이 API] 풍향 (deg, 'wndrct', 예: 77.84)
    wave_period NUMERIC(5, 2) DEFAULT NULL,             -- [부이 API] 파주기 (sec, 'wvpd', 예: 3.20)
    current_dir NUMERIC(6, 2) DEFAULT NULL,             -- [부이 API] 유향 (deg, 'crdir', 예: 276.04)
    current_speed NUMERIC(6, 2) DEFAULT NULL,           -- [부이 API] 유속 (cm/s, 'crsp', 예: 10.30)
    salinity NUMERIC(5, 2) DEFAULT NULL,                -- [부이 API] 염분 (psu, 'slnty', 예: 31.40)
    buoy_obs_date TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- [부이 API] 관측일시 ('obsrvnDt')

    -- 🌊 4. 조석 예보 API 실시간 컬럼 (GetTideFcstHghLwApiService)
    high_tide VARCHAR(255) DEFAULT NULL,                -- [조석 API] 만조(고조) 시각 및 조위 (예: '06:15 (122cm), 18:30 (130cm)')
    low_tide VARCHAR(255) DEFAULT NULL,                 -- [조석 API] 간조(저조) 시각 및 조위 (예: '12:40 (32cm), 23:15 (28cm)')
    tide_name VARCHAR(50) DEFAULT NULL,                 -- [조석 API] 물때 명칭 (예: '7물', '대조기')
    tide_obs_date TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- [조석 API] 예측일시 ('predcDt')

    -- 🤿 5. 스킨스쿠버 지수 API 실시간 컬럼 (GetFcstSkinScubaApiServicev2)
    scuba_index_grade VARCHAR(30) DEFAULT NULL,         -- [스쿠버 API] 입수 지수 ('totalIndex': 매우좋음, 좋음, 보통, 나쁨, 매우나쁨)
    scuba_min_wave NUMERIC(4, 2) DEFAULT NULL,          -- [스쿠버 API] 최저 파고 (m, 'minWvhgt')
    scuba_max_wave NUMERIC(4, 2) DEFAULT NULL,          -- [스쿠버 API] 최고 파고 (m, 'maxWvhgt')
    scuba_min_speed NUMERIC(5, 2) DEFAULT NULL,         -- [스쿠버 API] 최저 유속 (kn, 'minCrsp')
    scuba_max_speed NUMERIC(5, 2) DEFAULT NULL,         -- [스쿠버 API] 최고 유속 (kn, 'maxCrsp')
    scuba_min_temp NUMERIC(4, 2) DEFAULT NULL,          -- [스쿠버 API] 최저 수온 (°C, 'minWtem')
    scuba_max_temp NUMERIC(4, 2) DEFAULT NULL,          -- [스쿠버 API] 최고 수온 (°C, 'maxWtem')
    scuba_tide_phase VARCHAR(100) DEFAULT NULL,         -- [스쿠버 API] 물때/조기 ('tdlvHrCn', 예: '중조기', '5')
    scuba_noon_se VARCHAR(20) DEFAULT NULL,             -- [스쿠버 API] 오전/오후 구분 ('predcNoonSeCd')
    scuba_obs_date VARCHAR(50) DEFAULT NULL,            -- [스쿠버 API] 예보 날짜 ('predcYmd')

    -- ⚙️ 6. 시스템 관리 및 원본 JSON 컬럼
    raw_json JSONB DEFAULT NULL,                        -- API 응답 원본 JSON 객체
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),   -- 생성 시각
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()    -- 갱신 시각
);

-- 3. 검색 및 공간 조회 성능 향상을 위한 인덱스 생성
CREATE INDEX idx_ocean_weather_spot_id ON public.ocean_weather_cache(spot_id);
CREATE INDEX idx_ocean_weather_spot_name ON public.ocean_weather_cache(spot_name);
CREATE INDEX idx_ocean_weather_coords ON public.ocean_weather_cache(lat, lng);
CREATE INDEX idx_ocean_weather_tide_code ON public.ocean_weather_cache(tide_code);
CREATE INDEX idx_ocean_weather_buoy_code ON public.ocean_weather_cache(buoy_code);
CREATE INDEX idx_ocean_weather_scuba_code ON public.ocean_weather_cache(scuba_code);

-- 4. RLS (Row Level Security) 정책 및 모든 사용자/익명 클라이언트 읽기 허용
ALTER TABLE public.ocean_weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ocean_weather_cache"
ON public.ocean_weather_cache
FOR SELECT
USING (true);

CREATE POLICY "Allow anon insert/update access to ocean_weather_cache"
ON public.ocean_weather_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. updated_at 자동 갱신 트리거 생성
CREATE OR REPLACE FUNCTION update_ocean_weather_cache_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ocean_weather_cache_updated_at
BEFORE UPDATE ON public.ocean_weather_cache
FOR EACH ROW
EXECUTE FUNCTION update_ocean_weather_cache_modtime();

-- 6. 주석(Comment) 설정으로 테이블 및 주요 컬럼 명세 명시
COMMENT ON TABLE public.ocean_weather_cache IS '전국 192개 해양 관측 스팟 통합 기상/조석/스쿠버 지수 캐시 테이블';
COMMENT ON COLUMN public.ocean_weather_cache.spot_id IS '스팟 고유 PK (예: tide-spot-001, tide-haeundae, SS10)';
COMMENT ON COLUMN public.ocean_weather_cache.tide_code IS '국립해양조사원 조석 예보 지점 코드 (166곳)';
COMMENT ON COLUMN public.ocean_weather_cache.buoy_code IS '해양수산부 해양 관측 부이 코드 (38곳)';
COMMENT ON COLUMN public.ocean_weather_cache.scuba_code IS '국립해양조사원 공식 스킨스쿠버 지수 장소 코드 (18곳: SS1~SS18)';
