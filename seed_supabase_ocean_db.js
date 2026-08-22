/**
 * ==========================================================================
 * AquaBuddy (아쿠아버디) - Supabase DB 222개소 마스터 데이터 시딩(Seed) 스크립트
 * ==========================================================================
 * [개소 수 명세]
 * - 조석 예보 관측소: 166개소
 * - 해양 부이 관측소: 38개소
 * - 스킨스쿠버 지수 포인트: 18개소
 * --------------------------------------------------------------------------
 * 🎯 총 222개소 (단 1개의 중복 병합 없이 222개 레코드 독립 보존)
 * ==========================================================================
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = "https://ogfzfgsvmjuimjjhaubs.supabase.co";
const ANON_KEY = "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

// 222개소 독립 해양 관측 스팟 데이터 로드
const rawSpots = JSON.parse(fs.readFileSync('master_222_ocean_spots.json', 'utf-8'));

// 신규 통합 스키마 규격에 맞춰 222개 독립 레코드 생성
const seedRecords = rawSpots.map(s => {
    return {
        spot_id: s.spot_id,
        spot_name: s.spot_name,
        region_cat: s.region_cat || 'general',
        lat: parseFloat(s.lat) || 35.1587,
        lng: parseFloat(s.lng) || 129.1604,
        
        // 3대 공공데이터 코드 (해당 관측 유형만 코드 포함, 나머지는 NULL)
        tide_code: s.tide_code || null,
        buoy_code: s.buoy_code || null,
        scuba_code: s.scuba_code || null,

        // 부이 관측 데이터 초기값
        water_temp: s.buoy_code ? '22.5°C' : null,
        wave_height: s.buoy_code ? '0.5m' : null,
        wind_speed: s.buoy_code ? '3.2 m/s' : null,
        air_temp: s.buoy_code ? '26.5°C' : null,

        // 조석 예보 데이터 초기값
        high_tide: s.tide_code ? '06:15 (122cm)' : null,
        low_tide: s.tide_code ? '12:40 (32cm)' : null,
        tide_name: s.tide_code ? '7물' : null,

        // 스쿠버 지수 데이터 초기값
        scuba_index_grade: s.scuba_code ? '매우좋음' : null,
        
        updated_at: new Date().toISOString()
    };
});

function sendUpsertBatch(batch) {
    return new Promise((resolve) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/ocean_weather_cache`);
        const postData = JSON.stringify(batch);
        const options = {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, count: batch.length, status: res.statusCode });
                } else {
                    resolve({ success: false, error: body, status: res.statusCode });
                }
            });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.write(postData);
        req.end();
    });
}

async function runSeed() {
    console.log("=================================================");
    console.log(`🚀 Supabase ocean_weather_cache 총 ${seedRecords.length}개소 시딩(Seed) 시작`);
    console.log("=================================================\n");
    console.log(`📊 개소 구성: 조석 166개소 + 부이 38개소 + 스쿠버 18개소 = 총 ${seedRecords.length}개소`);

    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < seedRecords.length; i += batchSize) {
        const batch = seedRecords.slice(i, i + batchSize);
        console.log(`📡 Batch [${i + 1} ~ ${i + batch.length} / ${seedRecords.length}] Upsert 요청 중...`);
        const res = await sendUpsertBatch(batch);
        if (res.success) {
            successCount += batch.length;
            console.log(`  ✅ Batch 성공! (${batch.length}건 완료)`);
        } else {
            console.error(`  ❌ Batch 실패 (HTTP ${res.status}):`, res.error);
        }
    }

    console.log("\n-------------------------------------------------");
    console.log(`🎉 DB 시딩 프로세스 종료! (최종 성공: ${successCount} / ${seedRecords.length}개소)`);
    console.log("=================================================");
}

runSeed();
