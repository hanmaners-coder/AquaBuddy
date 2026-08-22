-- ==============================================================================
-- 🌊 AquaBuddy (아쿠아버디) - Supabase 2시간 주기 해양 관측 데이터 자동 동기화 SQL
-- Supabase Dashboard > SQL Editor에 복사하여 바로 실행하는 전체 SQL 코드
-- ==============================================================================

-- 1. pg_cron 및 pg_net 필수 확장(Extension) 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. 기존 등록된 sync-ocean-weather 관련 크론 잡 안전 초기화 (삭제)
DO $$
DECLARE
    job_rec RECORD;
BEGIN
    FOR job_rec IN 
        SELECT jobid, jobname FROM cron.job WHERE jobname LIKE '%sync-ocean-weather%'
    LOOP
        PERFORM cron.unschedule(job_rec.jobid);
        RAISE NOTICE '기존 크론 잡 삭제 완료 (jobid: %, jobname: %)', job_rec.jobid, job_rec.jobname;
    END LOOP;
END $$;

-- 3. 2시간 주기(0 */2 * * *) Edge Function 자동 호출 크론 스케줄 등록
SELECT cron.schedule(
    'sync-ocean-weather-2hr',   -- 스케줄 이름 (Job Name)
    '0 */2 * * *',              -- 매 2시간마다 (0분 정각)
    $$
    SELECT net.http_post(
        url := 'https://ogfzfgsvmjuimjjhaubs.supabase.co/functions/v1/sync-ocean-weather',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- 4. 등록된 크론 스케줄 및 상태 확인 쿼리
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'sync-ocean-weather-2hr';
