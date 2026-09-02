const https = require('https');
const fs = require('fs');

const SUPABASE_URL = "https://ogfzfgsvmjuimjjhaubs.supabase.co";
const ANON_KEY = "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

// Load beaches_db from build script logic
const sqlText = fs.readFileSync('insert_kma_270_beaches.sql', 'utf-8');

// Parse the SQL insert values into JSON records
const lines = sqlText.split('\n');
const records = [];

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("('") && trimmed.endsWith("NOW())") || trimmed.endsWith("NOW()),")) {
        const match = trimmed.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),/);
        if (match) {
            const spot_id = match[1];
            const spot_name = match[2];
            const region_cat = match[3];
            const lat = parseFloat(match[4]);
            const lng = parseFloat(match[5]);
            const tide_code = match[6].trim().replace(/'/g, '') === 'NULL' ? null : match[6].trim().replace(/'/g, '');
            const buoy_code = match[7].trim().replace(/'/g, '') === 'NULL' ? null : match[7].trim().replace(/'/g, '');
            const scuba_code = match[8].trim().replace(/'/g, '') === 'NULL' ? null : match[8].trim().replace(/'/g, '');

            records.push({
                spot_id,
                spot_name,
                region_cat,
                lat,
                lng,
                tide_code,
                buoy_code,
                scuba_code,
                water_temp: '26.8°C',
                wave_height: '0.4m',
                wind_speed: '2.8 m/s',
                air_temp: '28.1°C',
                high_tide: '11:20 (102cm)',
                low_tide: '04:41 (21cm)',
                tide_name: '7물',
                scuba_index_grade: '좋음',
                updated_at: new Date().toISOString()
            });
        }
    }
}

console.log(`Extracted ${records.length} beach records from SQL.`);

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

async function runUpsert() {
    console.log("Upserting beaches into Supabase ocean_weather_cache...");
    const batchSize = 50;
    let totalSuccess = 0;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const res = await sendUpsertBatch(batch);
        if (res.success) {
            totalSuccess += batch.length;
            console.log(`  -> Batch [${i + 1} ~ ${i + batch.length} / ${records.length}] SUCCESS!`);
        } else {
            console.log(`  -> Batch [${i + 1} ~ ${i + batch.length}] FAILED:`, res.error);
        }
    }

    console.log(`\n🎉 Total successfully upserted beach spots to Supabase: ${totalSuccess} / ${records.length}`);
}

runUpsert();
