// ==========================================================================
// 🌊 AquaBuddy (아쿠아버디) - Supabase Edge Function: sync-ocean-weather
// 3대 공공데이터 API (조석 166곳, 해양부이 38곳, 스킨스쿠버 18곳) 실시간 동기화
// ⏰ 동기화 주기: 2시간마다 자동 실행 (Cron: 0 */2 * * *)
// ==========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REAL_KHOA_KEY = Deno.env.get("PUBLIC_DATA_API_KEY") || "8Vbb5%2BdWRNC4Axr8zc6rPuhLMQEm4Bxp6jTu9lyktrYc4a8KqanQRtb7KkgfnQ7fzsuQEJ%2Bl34wZAAqUIoRuMg%3D%3D";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://ogfzfgsvmjuimjjhaubs.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("🌊 [sync-ocean-weather] KHOA 공공데이터 3대 API 실시간 2시간 동기화 시작...");

        // 1. ocean_weather_cache 마스터 목록 조회
        const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/ocean_weather_cache?select=spot_id,spot_name,tide_code,buoy_code,scuba_code,lat,lng`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!fetchRes.ok) {
            const errText = await fetchRes.text();
            return new Response(JSON.stringify({ error: "Failed to fetch master spots", details: errText }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        const spots = await fetchRes.json();
        if (!Array.isArray(spots) || spots.length === 0) {
            return new Response(JSON.stringify({ error: "DB master spots empty" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const nowIso = new Date().toISOString();
        const updateMap = new Map();

        // 2. API 1: 해양관측부이 최신 데이터 (38곳)
        const buoySpots = spots.filter((s: any) => s.buoy_code);
        for (const spot of buoySpots) {
            try {
                const url = `https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService?serviceKey=${REAL_KHOA_KEY}&obsCode=${spot.buoy_code}&reqDate=${today}&min=60&type=json`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    const rawItem = json?.body?.items?.item ?? json?.response?.body?.items?.item;
                    const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
                    if (item && item.wtem) {
                        const existing = updateMap.get(spot.spot_id) || { spot_id: spot.spot_id };
                        existing.water_temp = item.wtem ? `${item.wtem}°C` : "정보없음";
                        existing.wave_height = item.wvhgt ? `${item.wvhgt}m` : "정보없음";
                        existing.wind_speed = item.wspd ? `${item.wspd} m/s` : "정보없음";
                        existing.air_temp = item.artmp ? `${item.artmp}°C` : "정보없음";
                        existing.air_press = item.atmpr ? parseFloat(item.atmpr) : null;
                        existing.wind_dir = item.wndrct ? parseFloat(item.wndrct) : null;
                        existing.wave_period = item.wvpd ? parseFloat(item.wvpd) : null;
                        existing.current_dir = item.crdir ? parseFloat(item.crdir) : null;
                        existing.current_speed = item.crsp ? parseFloat(item.crsp) : null;
                        existing.salinity = item.slnty ? parseFloat(item.slnty) : null;
                        existing.buoy_obs_date = item.obsrvnDt || nowIso;
                        updateMap.set(spot.spot_id, existing);
                    }
                }
            } catch (e) {
                console.warn(`부이 API 실패 [${spot.spot_id}]:`, e);
            }
        }

        // 3. API 2: 조석 예보 (166곳)
        const tideSpots = spots.filter((s: any) => s.tide_code);
        for (const spot of tideSpots) {
            try {
                const url = `https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=${REAL_KHOA_KEY}&obsCode=${spot.tide_code}&reqDate=${today}&type=json`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    let rawItems = json?.body?.items?.item ?? json?.response?.body?.items?.item ?? [];
                    const items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
                    if (Array.isArray(items) && items.length > 0) {
                        const highs: string[] = [];
                        const lows: string[] = [];
                        items.forEach((it: any) => {
                            const timeStr = it.predcDt ? (it.predcDt.split(" ")[1] || it.predcDt) : "";
                            const valStr = it.predcTdlvVl ? `${it.predcTdlvVl}cm` : "";
                            if (it.extrSe === "1" || it.extrSe === "3") highs.push(`${timeStr} (${valStr})`);
                            if (it.extrSe === "2" || it.extrSe === "4") lows.push(`${timeStr} (${valStr})`);
                        });
                        const existing = updateMap.get(spot.spot_id) || { spot_id: spot.spot_id };
                        existing.high_tide = highs.length > 0 ? highs.join(", ") : "정보없음";
                        existing.low_tide = lows.length > 0 ? lows.join(", ") : "정보없음";
                        existing.tide_obs_date = nowIso;
                        updateMap.set(spot.spot_id, existing);
                    }
                }
            } catch (e) {
                console.warn(`조석 API 실패 [${spot.spot_id}]:`, e);
            }
        }

        // 4. API 3: 스킨스쿠버 지수 (18곳 전용)
        const scubaSpots = spots.filter((s: any) => s.scuba_code);
        for (const spot of scubaSpots) {
            try {
                const url = `https://apis.data.go.kr/1192136/fcstSkinScubav2/GetFcstSkinScubaApiServicev2?serviceKey=${REAL_KHOA_KEY}&placeCode=${spot.scuba_code}&reqDate=${today}&type=json`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    const rawScubaItem = json?.body?.items?.item ?? json?.response?.body?.items?.item;
                    const item = Array.isArray(rawScubaItem) ? rawScubaItem[0] : rawScubaItem;
                    if (item) {
                        const existing = updateMap.get(spot.spot_id) || { spot_id: spot.spot_id };
                        existing.scuba_index_grade = item.totalIndex || "보통";
                        existing.scuba_min_wave = item.minWvhgt ? parseFloat(item.minWvhgt) : null;
                        existing.scuba_max_wave = item.maxWvhgt ? parseFloat(item.maxWvhgt) : null;
                        existing.scuba_min_speed = item.minCrsp ? parseFloat(item.minCrsp) : null;
                        existing.scuba_max_speed = item.maxCrsp ? parseFloat(item.maxCrsp) : null;
                        existing.scuba_min_temp = item.minWtem ? parseFloat(item.minWtem) : null;
                        existing.scuba_max_temp = item.maxWtem ? parseFloat(item.maxWtem) : null;
                        existing.scuba_tide_phase = item.tdlvHrCn || null;
                        existing.scuba_noon_se = item.predcNoonSeCd || null;
                        existing.scuba_obs_date = item.predcYmd || today;
                        updateMap.set(spot.spot_id, existing);
                    }
                }
            } catch (e) {
                console.warn(`스쿠버 API 실패 [${spot.spot_id}]:`, e);
            }
        }

        // 5. 222개 레코드 구성: 스쿠버 18곳을 제외한 204개 스팟의 scuba_index_grade는 반드시 NULL!
        const updateRecords = spots.map((s: any) => {
            const fetchedData = updateMap.get(s.spot_id) || {};
            const isScubaSpot = s.scuba_code || (s.spot_id && s.spot_id.startsWith("scuba-"));
            return {
                spot_id: s.spot_id,
                spot_name: s.spot_name,
                region_cat: s.region_cat || "general",
                lat: s.lat,
                lng: s.lng,
                tide_code: s.tide_code || null,
                buoy_code: s.buoy_code || null,
                scuba_code: s.scuba_code || null,
                water_temp: fetchedData.water_temp || "정보없음",
                wave_height: fetchedData.wave_height || "정보없음",
                wind_speed: fetchedData.wind_speed || "정보없음",
                air_temp: fetchedData.air_temp || "정보없음",
                air_press: fetchedData.air_press || null,
                wind_dir: fetchedData.wind_dir || null,
                wave_period: fetchedData.wave_period || null,
                current_dir: fetchedData.current_dir || null,
                current_speed: fetchedData.current_speed || null,
                salinity: fetchedData.salinity || null,
                buoy_obs_date: fetchedData.buoy_obs_date || null,
                high_tide: fetchedData.high_tide || "정보없음",
                low_tide: fetchedData.low_tide || "정보없음",
                tide_obs_date: fetchedData.tide_obs_date || null,
                // 🎯 스쿠버 지수: 18곳 스쿠버 스팟만 수치 입력, 나머지 204곳은 100% NULL!
                scuba_index_grade: isScubaSpot ? (fetchedData.scuba_index_grade || "보통") : null,
                scuba_min_wave: isScubaSpot ? (fetchedData.scuba_min_wave || null) : null,
                scuba_max_wave: isScubaSpot ? (fetchedData.scuba_max_wave || null) : null,
                scuba_min_speed: isScubaSpot ? (fetchedData.scuba_min_speed || null) : null,
                scuba_max_speed: isScubaSpot ? (fetchedData.scuba_max_speed || null) : null,
                scuba_min_temp: isScubaSpot ? (fetchedData.scuba_min_temp || null) : null,
                scuba_max_temp: isScubaSpot ? (fetchedData.scuba_max_temp || null) : null,
                scuba_tide_phase: isScubaSpot ? (fetchedData.scuba_tide_phase || null) : null,
                scuba_noon_se: isScubaSpot ? (fetchedData.scuba_noon_se || null) : null,
                scuba_obs_date: isScubaSpot ? (fetchedData.scuba_obs_date || null) : null,
                updated_at: nowIso
            };
        });

        // 6. DB REST UPSERT
        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/ocean_weather_cache`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify(updateRecords)
        });

        if (!upsertRes.ok) {
            const errBody = await upsertRes.text();
            return new Response(JSON.stringify({ error: "DB UPSERT failed", details: errBody }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            total_spots: spots.length,
            scuba_spots_count: scubaSpots.length,
            updated_at: nowIso
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }
});
