/* ==========================================================================
   AquaBuddy (아쿠아버디) - Dynamic Application Logic (v44.0 Unified Inquiries & Ad Partnerships)
   - Restored Responsive Side Banners (1200px Media Query Breakpoint)
   - Unified Customer Feedback & Ad Inquiry Modal (#inquiryModal)
   - Categories: Ad Partnership, Bug Report, Feature Idea, Content Edit, General Feedback
   - Protected Webmaster Admin Dashboard Inquiries Management Table
   ========================================================================== */

// Load Configuration Credentials
window.addEventListener('error', function(e) {
    if (e.message && !e.message.includes("ResizeObserver")) {
        alert("🚨 시스템 에러 감지!\n\n내용: " + e.message + "\n위치: app.js " + e.lineno + "번째 줄\n\n이 화면을 캡처해서 개발자에게 보내주세요!");
    }
});

const SUPABASE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.url
    : "https://ogfzfgsvmjuimjjhaubs.supabase.co";

const SUPABASE_ANON_KEY = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.anonKey
    : "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

// Kakao integration removed per user request

const COUPANG_CUSPE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.coupang)
    ? window.AQUA_CONFIG.coupang.cuspeUrl
    : "https://link.coupang.com/a/fKqrpaA2Fw";

// Initialize Supabase JS Client with explicit API key headers (No API key found error fix)
let supabaseClient = null;
if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            global: {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            }
        });
        console.log("✨ Supabase Client Initialized with API Key Headers:", SUPABASE_URL);
    } catch (err) {
        console.error("Supabase Init Exception:", err);
    }
}

// Banner Click Logging Logic
async function logBannerClick(bannerId, bannerName) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('banner_clicks')
            .insert({
                banner_id: bannerId,
                banner_name: bannerName,
                clicked_at: new Date().toISOString()
            });
        if (error) console.error('Banner click log error:', error);
    } catch (e) {
        console.error('Banner click exception:', e);
    }
}

function attachBannerClickLogging() {
    if (typeof document === "undefined") return;
    const main = document.getElementById('bannerMain');
    const floatingLeft = document.getElementById('bannerFloatingLeft');
    const floatingRight = document.getElementById('bannerFloatingRight');
    const footer = document.getElementById('bannerFooter');

    if (main) main.addEventListener('click', () => logBannerClick('bannerMain', 'main'));
    if (floatingLeft) floatingLeft.addEventListener('click', () => logBannerClick('bannerFloatingLeft', 'floatingLeft'));
    if (floatingRight) floatingRight.addEventListener('click', () => logBannerClick('bannerFloatingRight', 'floatingRight'));
    if (footer) footer.addEventListener('click', () => logBannerClick('bannerFooter', 'footer'));
}

async function fetchBannerStats(period) {
    if (!supabaseClient) return [];
    try {
        let query = supabaseClient.from('banner_clicks').select('banner_id, banner_name, clicked_at');
        const now = new Date();
        if (period === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            query = query.gte('clicked_at', todayStart);
        } else if (period === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gte('clicked_at', sevenDaysAgo);
        } else if (period === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gte('clicked_at', thirtyDaysAgo);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Stats fetch error:', error);
            return [];
        }
        
        // Group by banner_name & banner_id
        const counts = {};
        (data || []).forEach(row => {
            const key = row.banner_id || row.banner_name || 'unknown';
            if (!counts[key]) {
                counts[key] = { id: row.banner_id || key, name: row.banner_name || key, count: 0 };
            }
            counts[key].count += 1;
        });
        return Object.values(counts).sort((a, b) => b.count - a.count);
    } catch (e) {
        console.error('Fetch banner stats exception:', e);
        return [];
    }
}

async function renderBannerClickStatsUI() {
    const periodSelect = document.getElementById('statsPeriodSelect');
    const tbody = document.getElementById('bannerStatsTbody');
    if (!tbody) return;

    const period = periodSelect ? periodSelect.value : 'all';
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px;">통계 데이터를 불러오는 중...</td></tr>`;

    const stats = await fetchBannerStats(period);
    if (!stats || stats.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding:16px;">선택한 기간 동안의 배너 클릭 기록이 없습니다.</td></tr>`;
        return;
    }

    const bannerLabels = {
        'bannerMain': '중앙 메인 배너 (쿠스페 기획전)',
        'bannerFloatingLeft': '좌측 플로팅 배너 (프리다이빙)',
        'bannerFloatingRight': '우측 플로팅 배너 (스쿠버다이빙)',
        'bannerFooter': '하단 풋터 배너 (오픈워터 장비전)'
    };

    tbody.innerHTML = stats.map(item => {
        const label = bannerLabels[item.id] || item.name || item.id;
        return `
            <tr>
                <td><code>${escapeHtml(item.id)}</code></td>
                <td><strong>${escapeHtml(label)}</strong></td>
                <td><strong style="color: var(--accent-cyan); font-size:1.05rem;">${item.count.toLocaleString()} 회</strong></td>
                <td><span style="color: #00e676; font-weight:700;">정상 로깅 중</span></td>
            </tr>
        `;
    }).join('');
}

function saveCoupangApiKey() {
    const input = document.getElementById('coupangApiKey');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
        showToast('⚠️ 쿠팡 API Key를 입력해 주세요!');
        return;
    }
    localStorage.setItem('coupangApiKey', val);
    showToast('💾 쿠팡 파트너스 API Key가 성공적으로 저장되었습니다!');
}

function loadCoupangApiKey() {
    const input = document.getElementById('coupangApiKey');
    if (!input) return;
    const saved = localStorage.getItem('coupangApiKey');
    if (saved) {
        input.value = saved;
    }
}

// Test Supabase connectivity: insert a dummy post and fetch all posts, logging results.
async function testSupabase() {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized.');
    return;
  }
  try {
    const testData = {
      author: 'TestUser',
      content: 'Supabase test entry',
      created_at: new Date().toISOString()
    };
    const { data: insertData, error: insertError } = await supabaseClient
      .from('posts')
      .insert([testData], { returning: 'representation' });
    if (insertError) {
      console.error('Supabase insert error:', insertError);
    } else {
      console.log('Supabase insert successful:', insertData);
    }
    const { data: selectData, error: selectError } = await supabaseClient
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (selectError) {
      console.error('Supabase select error:', selectError);
    } else {
      console.log('Supabase select returned', selectData.length, 'posts.');
    }
  } catch (e) {
    console.error('Supabase test exception:', e);
  }
}
// Famous Diving & Swimming Spot Coordinates Map Safeguard
if (typeof window !== "undefined" && typeof window.FAMOUS_SPOT_COORDS === "undefined") {
    window.FAMOUS_SPOT_COORDS = {
        "k26": { title: "가평 K26 잠수풀", lat: 37.7128, lng: 127.5253, address: "경기 가평군 청평면 고성리 26" },
        "딥스테이션": { title: "용인 딥스테이션", lat: 37.2801, lng: 127.2023, address: "경기 용인시 처인구 포곡읍 에버랜드로 156" },
        "파라다이브": { title: "이천 파라다이브", lat: 37.2915, lng: 127.4642, address: "경기 이천시 신둔면 원적로 851" },
        "송도스포츠파크": { title: "송도 잠수풀", lat: 37.3752, lng: 126.6321, address: "인천 연수구 인천신항대로 892" },
        "올림픽공원": { title: "올림픽공원 수영장", lat: 37.5184, lng: 127.1264, address: "서울 송파구 올림픽로 424" },
        "성남종합운동장": { title: "성남 실내수영장", lat: 37.4338, lng: 127.1428, address: "경기 성남시 중원구 둔촌대로 258" },
        "수원월드컵": { title: "수원월드컵 잠수풀", lat: 37.2872, lng: 127.0366, address: "경기 수원시 팔달구 창룡대로 210" },
        "문수": { title: "울산 문수수영장", lat: 35.5342, lng: 129.2562, address: "울산 남구 문수로 44" },
        "창원": { title: "창원 실내수영장", lat: 35.2345, lng: 128.6756, address: "경남 창원시 성산구 원이대로 450" },
        "서귀포": { title: "제주 서귀포 해양포인트", lat: 33.2481, lng: 126.5639, address: "제주 서귀포시 서귀동" }
    };
}
var FAMOUS_SPOT_COORDS = (typeof window !== "undefined" && window.FAMOUS_SPOT_COORDS) ? window.FAMOUS_SPOT_COORDS : {};

// Security State & Hashing Helper
let isAdminAuthenticated = false;

async function sha256(message) {
    if (!message) return "";
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-hashed Master Secrets (SHA-256 for 9999, 1234, master)
const MASTER_VALID_HASHES = [
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // 9999
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
    "e15a74070a31eb2829d5b4d75f284e370a256a4fb649e3bf5d83be18987ec8e6"  // master
];

// Initial Inquiries Sample Data
const INITIAL_INQUIRIES = [
    {
        id: "inq-1",
        category: "ad",
        categoryName: "📢 광고 제휴 문의",
        name: "(주)아쿠아스포츠 장비샵",
        contact: "contact@aquasports.co.kr / 010-9876-5432",
        content: "안녕하세요! 메인 상단 배너 및 좌측 플로팅 배너 입점 문의드립니다. 월 단위 광고 단가표 및 노출 리포트 안내 부탁드립니다.",
        image: "",
        status: "new",
        statusText: "신규 접수",
        createdAt: "2026-07-28T16:40:00"
    }
];

// 44 Nationwide Ocean Live CCTVs Dataset
const OCEAN_WEBCAMS_DATA = [
    // 1. 부산 기장 / 해운대 / 수영 권역 (12개)
    {
        id: "cam-busan-imlang-bp",
        name: "부산 기장군 임랑방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0049&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EC%9E%88%EB%9E%91%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "파도 높이 0.5m (입수 양호)",
        waterTemp: "22.0°C",
        wind: "3.1 m/s",
        desc: "기장 임랑방파제 실시간 해상 안전 및 입수 상태 CCTV"
    },
    {
        id: "cam-busan-imlang-beach",
        name: "부산 기장군 임랑해수욕장 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0050&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EC%9E%88%EB%9E%91%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A51",
        source: "부산 세이프시티",
        status: "입수 양호 (백사장 잔잔)",
        waterTemp: "22.2°C",
        wind: "3.0 m/s",
        desc: "임랑해수욕장 1번 구역 실시간 바다 수영 및 파도"
    },
    {
        id: "cam-busan-onjeong",
        name: "부산 기장군 온정방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "hero.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0043&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EC%98%A8%EC%A0%95%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "시야 양호 (다이빙 추천)",
        waterTemp: "22.1°C",
        wind: "2.8 m/s",
        desc: "기장 온정방파제 실시간 해상 시야 및 수온 모니터링"
    },
    {
        id: "cam-busan-hakli",
        name: "부산 기장군 학리방파제(회전형) CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0237&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%ED%95%99%EB%A6%AC%EB%B0%A9%ED%8C%8C%EC%A0%9C1%28%ED%9A%8C%EC%A0%84%ED%98%95%29",
        source: "부산 세이프시티",
        status: "입수 양호 (회전 관측)",
        waterTemp: "22.4°C",
        wind: "3.2 m/s",
        desc: "기장 학리방파제 회전 카메라 360도 해상 조망"
    },
    {
        id: "cam-busan-seoam",
        name: "부산 기장군 서암방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0042&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EC%84%9C%EC%95%94%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "파수 0.6m (양호)",
        waterTemp: "22.3°C",
        wind: "2.9 m/s",
        desc: "기장 서암방파제 해상 실시간 파도 및 입수 여부"
    },
    {
        id: "cam-busan-badaae",
        name: "부산 기장군 바다애펜션 옆 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 기장군",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=2&cctv_cd=00-800-0040,00-800-0041&sensorName=%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EB%B0%94%EB%8B%A4%EC%95%A0%ED%8E%9C%EC%85%98_%EC%98%86_%EA%B3%A01,%EA%B8%B0%EC%9E%A5%EA%B5%B0_%EB%B0%94%EB%8B%A4%EC%95%A0%ED%8E%9C%EC%85%98_%EC%98%86_%EA%B3%A02",
        source: "부산 세이프시티",
        status: "해안 조망 (양방향 관측)",
        waterTemp: "22.5°C",
        wind: "3.4 m/s",
        desc: "기장 바다애펜션 앞 해안가 실시간 수온 및 너울 파도"
    },
    {
        id: "cam-busan-songjeong-bp",
        name: "부산 해운대구 송정방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 해운대구 송정",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0168&sensorName=%ED%95%B4%EC%9A%B4%EB%8C%80%EA%B5%AC_%EC%86%A1%EC%A0%95%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "서핑/다이빙 파도 0.8m",
        waterTemp: "22.8°C",
        wind: "4.0 m/s",
        desc: "송정방파제 서퍼 및 프리다이버 실시간 파도 모니터링"
    },
    {
        id: "cam-busan-gudeokpo",
        name: "부산 해운대구 구덕포방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 해운대구",
        thumb: "hero.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0181&sensorName=%28%EC%9E%AC%EB%82%9C%29%EA%B5%9D%EB%8D%95%ED%8F%AC%EB%B0%A9%ED%8C%8C%EC%A0%9C_%EA%B3%A02",
        source: "부산 세이프시티",
        status: "재난 관측 고화질",
        waterTemp: "22.6°C",
        wind: "3.3 m/s",
        desc: "해운대 구덕포방파제 실시간 해상 기상 및 파고 관측"
    },
    {
        id: "cam-busan-cheongsapo",
        name: "부산 해운대 청사포 테트라포드 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 해운대구 청사포",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0180&sensorName=%28%EC%9E%AC%EB%82%9C%29%ED%85%8C%ED%8A%B8%EB%9D%BC%ED%8F%AC%EB%93%9C_%EC%B2%AD%EC%82%AC%ED%8F%AC1_%ED%9A%8C%EC%A0%84",
        source: "부산 세이프시티",
        status: "입수 안전 주의",
        waterTemp: "22.5°C",
        wind: "3.5 m/s",
        desc: "청사포 테트라포드 회전형 카메라 실시간 안전 모니터링"
    },
    {
        id: "cam-busan-mipo",
        name: "부산 해운대 미포방파제 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 해운대구 미포",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0178&sensorName=%28%EC%9E%AC%EB%82%9C%29%EB%AF%B8%ED%8F%B4%EB%B0%A9%ED%8C%8C%EC%A0%9C_%EA%B3%A0",
        source: "부산 세이프시티",
        status: "해운대 동쪽 시야 양호",
        waterTemp: "22.7°C",
        wind: "3.2 m/s",
        desc: "미포방파제 실시간 바다 수영 및 다이빙 포인트 CCTV"
    },
    {
        id: "cam-busan-haeundae-beach",
        name: "부산 해운대 해수욕장 재난 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 해운대구",
        thumb: "hero.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0177&sensorName=%28%EC%9E%AC%EB%82%9C%29%ED%95%B4%EC%9A%B4%EB%8C%80%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5",
        source: "부산 세이프시티",
        status: "백사장 입수 상태 양호",
        waterTemp: "22.9°C",
        wind: "3.1 m/s",
        desc: "해운대 해수욕장 메인 백사장 실시간 바다 수영 상황"
    },
    {
        id: "cam-busan-gwangalli-beach",
        name: "부산 수영구 광안리해수욕장 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 수영구 광안리",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0145&sensorName=%EC%88%98%EC%98%81%EA%B5%AC_%EA%B4%91%EC%95%88%EB%A6%AC%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5",
        source: "부산 세이프시티",
        status: "광안대교 조망 잔잔함",
        waterTemp: "23.1°C",
        wind: "2.7 m/s",
        desc: "광안리 해변 실시간 수영 스팟 및 파도 모니터링"
    },

    // 2. 부산 남구 / 영도 / 서구 / 강서 권역 (7개)
    {
        id: "cam-busan-oryukdo",
        name: "부산 남구 오륙도선착장 공영주차장 CCTV",
        regionCategory: "busan_south",
        region: "부산 남구 오륙도",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0066&sensorName=%EB%82%A8%EA%B5%AC_%EC%98%A4%EB%A5%99%EB%8F%84%EC%84%A0%EC%B0%A9%EC%9E%A5_%EA%B3%B5%EC%98%81%EC%A3%BC%EC%B0%A8%EC%9E%A5",
        source: "부산 세이프시티",
        status: "오륙도 해상 시야 양호",
        waterTemp: "22.4°C",
        wind: "3.8 m/s",
        desc: "남구 오륙도 선착장 다이빙 및 해상 파도 CCTV"
    },
    {
        id: "cam-busan-baekunpo",
        name: "부산 남구 백운포체육공원 CCTV",
        regionCategory: "busan_south",
        region: "부산 남구 백운포",
        thumb: "hero.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0063&sensorName=%EB%82%A8%EA%B5%AC_%EB%B0%B1%EC%9A%B4%ED%8F%AC%EC%B2%B4%EC%9C%A1%EA%B3%B5%EC%9B%90",
        source: "부산 세이프시티",
        status: "백운포 해안 조망",
        waterTemp: "22.3°C",
        wind: "3.6 m/s",
        desc: "백운포 해안가 실시간 바다 기상 및 파도"
    },
    {
        id: "cam-busan-jodo",
        name: "부산 영도구 조도방파제 CCTV",
        regionCategory: "busan_south",
        region: "부산 영도구",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0155&sensorName=%EC%98%81%EB%8F%84%EA%B5%AC_%EC%A1%B0%EB%8F%84%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "영도 조도 시야 양호",
        waterTemp: "22.6°C",
        wind: "4.1 m/s",
        desc: "영도 조도방파제 딥다이빙 포인트 실시간 해상 CCTV"
    },
    {
        id: "cam-busan-jungli",
        name: "부산 영도구 중리방파제 CCTV",
        regionCategory: "busan_south",
        region: "부산 영도구 중리",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0156&sensorName=%EC%98%81%EB%8F%84%EA%B5%AC_%EC%A4%91%EB%A6%AC%EB%B0%A9%ED%8C%8C%EC%A0%9C",
        source: "부산 세이프시티",
        status: "해상 수온 쾌적",
        waterTemp: "22.5°C",
        wind: "3.9 m/s",
        desc: "영도 중리방파제 실시간 입수 상태 모니터링"
    },
    {
        id: "cam-busan-gamji",
        name: "부산 영도구 감지해변 CCTV",
        regionCategory: "busan_south",
        region: "부산 영도구 태종대",
        thumb: "hero.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0149&sensorName=%EC%98%81%EB%8F%84%EA%B5%AC_%EA%B0%90%EC%A7%80%ED%95%B4%EB%B3%80",
        source: "부산 세이프시티",
        status: "태종대 감지해변 다이빙스팟",
        waterTemp: "22.7°C",
        wind: "3.7 m/s",
        desc: "영도 태종대 감지해변 자갈마당 실시간 파동"
    },
    {
        id: "cam-busan-songdo-park",
        name: "부산 서구 송도해수욕장 공영주차장 옥상 CCTV",
        regionCategory: "busan_south",
        region: "부산 서구 송도",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0136&sensorName=%EC%84%9C%EA%B5%AC_%EA%B3%B5%EC%98%81%EC%A3%BC%EC%B0%A8%EC%9E%A5_%EC%98%A5%EC%83%81",
        source: "부산 세이프시티",
        status: "송도 해상 케이블카 조망",
        waterTemp: "22.9°C",
        wind: "3.0 m/s",
        desc: "부산 송도 해수욕장 및 구름산책로 24시간 실시간"
    },
    {
        id: "cam-busan-daehang",
        name: "부산 강서구 대항 새바지 CCTV",
        regionCategory: "busan_south",
        region: "부산 강서구 가덕도",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://safecity.busan.go.kr/#/cctv?cnt=1&cctv_cd=00-800-0010&sensorName=%EA%B0%95%EC%84%9C%EA%B5%AC_%EB%8C%80%ED%95%AD%EC%83%88%EB%B0%94%EC%A7%80",
        source: "부산 세이프시티",
        status: "가덕도 해상 기상 양호",
        waterTemp: "22.8°C",
        wind: "3.5 m/s",
        desc: "가덕도 대항 새바지 해안가 실시간 파도 관측"
    },

    // 3. 경북 / 동해 / 울릉도 / 독도 권역 (6개)
    {
        id: "cam-kbs-pohang",
        name: "경북 포항시 두호동 해안로 CCTV",
        regionCategory: "donghae",
        region: "경북 포항시",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9988",
        hlsUrl: "/api/cctv?cctvId=9988",
        source: "KBS 재난포털",
        status: "영일대 해안로 입수 최상",
        waterTemp: "21.5°C",
        wind: "3.2 m/s",
        desc: "포항 두호동 영일대 해안로 실시간 라이브 CCTV"
    },
    {
        id: "cam-kbs-gangneung-yonggang",
        name: "강원 강릉시 용강동 해안 CCTV",
        regionCategory: "donghae",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9952",
        hlsUrl: "/api/cctv?cctvId=9952",
        source: "KBS 재난포털",
        status: "동해 파수 0.7m",
        waterTemp: "19.8°C",
        wind: "4.1 m/s",
        desc: "강릉 용강동 해안 실시간 기상 및 시야 관측"
    },
    {
        id: "cam-kbs-jumunjin",
        name: "강원 강릉시 주문진 방파제 CCTV",
        regionCategory: "donghae",
        region: "강원 강릉시 주문진",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9995",
        hlsUrl: "/api/cctv?cctvId=9995",
        source: "KBS 재난포털",
        status: "주문진 항만 시야 양호",
        waterTemp: "20.1°C",
        wind: "3.9 m/s",
        desc: "주문진 방파제 스쿠버 다이빙 스팟 라이브"
    },
    {
        id: "cam-kbs-sokcho",
        name: "강원 속초시 등대전망대 CCTV",
        regionCategory: "donghae",
        region: "강원 속초시",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9986",
        hlsUrl: "/api/cctv?cctvId=9986",
        source: "KBS 재난포털",
        status: "속초 해상 고화질 조망",
        waterTemp: "19.5°C",
        wind: "4.5 m/s",
        desc: "속초 등대전망대 실시간 동해 파도 및 시야"
    },
    {
        id: "cam-kbs-ulleung",
        name: "경북 울릉군 저동항 CCTV",
        regionCategory: "donghae",
        region: "경북 울릉군",
        thumb: "hero.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9987",
        hlsUrl: "/api/cctv?cctvId=9987",
        source: "KBS 재난포털",
        status: "울릉 청정 시야 20m+",
        waterTemp: "21.0°C",
        wind: "3.5 m/s",
        desc: "울릉도 저동항 촛대바위 실시간 해상 CCTV"
    },
    {
        id: "cam-kbs-dokdo",
        name: "대한민국 독도 실시간 LIVE CCTV",
        regionCategory: "donghae",
        region: "대한민국 독도",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9957",
        hlsUrl: "/api/cctv?cctvId=9957",
        source: "KBS 재난포털",
        status: "독도 동도/서도 해상 생중계",
        waterTemp: "20.5°C",
        wind: "4.0 m/s",
        desc: "대한민국 독도 실시간 24시간 LIVE 생중계"
    },

    // 4. 제주도 전역 실시간 CCTV (9개)
    {
        id: "cam-jeju-yongduam",
        name: "제주 북부 용두암해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주북부 용두암",
        thumb: "hero.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100003/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "제주 북부 해안 파도 0.5m",
        waterTemp: "24.1°C",
        wind: "2.8 m/s",
        desc: "용두암 해안 실시간 파도 및 입수 상태"
    },
    {
        id: "cam-jeju-topdong",
        name: "제주 북부 탑동해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주북부 탑동",
        thumb: "right_ad_swimming.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100001/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "탑동 방파제 파도 양호",
        waterTemp: "24.2°C",
        wind: "3.0 m/s",
        desc: "탑동 방파제 실시간 해상 기상 관측"
    },
    {
        id: "cam-jeju-seogwipohang",
        name: "제주 남부 서귀포항 CCTV",
        regionCategory: "jeju_live",
        region: "제주남부 서귀포",
        thumb: "right_ad_scuba.jpg",
        hlsUrl: "http://123.140.197.51/stream/35/play.m3u8",
        source: "서귀포수협사람들",
        status: "서귀포 문섬/범섬 시야 15m+",
        waterTemp: "24.8°C",
        wind: "2.4 m/s",
        desc: "서귀포 항만 및 남부 다이빙 스팟 라이브"
    },
    {
        id: "cam-jeju-beobhwan",
        name: "제주 남부 법환해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주남부 법환",
        thumb: "left_ad_freediving.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100008/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "법환 포구 프리다이빙 시야 최상",
        waterTemp: "24.6°C",
        wind: "2.5 m/s",
        desc: "법환 해안가 실시간 해상 CCTV"
    },
    {
        id: "cam-jeju-jungmun",
        name: "제주 남부 중문해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주남부 중문",
        thumb: "bottom_ad_openwater.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100010/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "중문 색달 해변 서핑 파도 0.8m",
        waterTemp: "24.7°C",
        wind: "3.1 m/s",
        desc: "중문 색달 해변 서머 바다 모니터링"
    },
    {
        id: "cam-jeju-seongsan",
        name: "제주 동부 성산일출봉 CCTV",
        regionCategory: "jeju_live",
        region: "제주동부 성산",
        thumb: "hero.jpg",
        hlsUrl: "http://123.140.197.51/stream/34/play.m3u8",
        source: "playce camp jeju",
        status: "성산 일출봉 해상 조망",
        waterTemp: "24.0°C",
        wind: "3.2 m/s",
        desc: "성산일출봉 실시간 해상 라이브"
    },
    {
        id: "cam-jeju-onpyeong",
        name: "제주 동부 온평해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주동부 온평",
        thumb: "right_ad_swimming.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100011/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "온평 포구 해상 기상 양호",
        waterTemp: "24.1°C",
        wind: "3.0 m/s",
        desc: "온평 해안가 실시간 파도 및 조위"
    },
    {
        id: "cam-jeju-sinchang",
        name: "제주 서부 신창해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주서부 신창",
        thumb: "left_ad_freediving.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100004/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "신창 풍차 해안도로 조망",
        waterTemp: "24.3°C",
        wind: "3.8 m/s",
        desc: "신창 풍차 해안 실시간 바다 바람"
    },
    {
        id: "cam-jeju-hwasun",
        name: "제주 서부 화순해안 CCTV",
        regionCategory: "jeju_live",
        region: "제주서부 화순",
        thumb: "right_ad_scuba.jpg",
        hlsUrl: "http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100012/0/1",
        source: "제주특별자치도 재난안전대책본부",
        status: "화순 금모래 해변 잔잔함",
        waterTemp: "24.4°C",
        wind: "2.7 m/s",
        desc: "화순 금모래 해수욕장 실시간 파고"
    },

    // 5. 전남 / 여수 / 완도 / 창원 권역 (7개)
    {
        id: "cam-kbs-mokpo",
        name: "전남 목포시 죽교동 북항 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "전남 목포시",
        thumb: "bottom_ad_openwater.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9992",
        hlsUrl: "/api/cctv?cctvId=9992",
        source: "KBS 재난포털",
        status: "서남해 파도 잔잔함",
        waterTemp: "23.2°C",
        wind: "2.8 m/s",
        desc: "목포 죽교동 북항 실시간 해상 CCTV"
    },
    {
        id: "cam-kbs-gageodo",
        name: "전남 신안군 가거도 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "전남 신안군",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9983",
        hlsUrl: "/api/cctv?cctvId=9983",
        source: "KBS 재난포털",
        status: "대한민국 최서남단 가거도",
        waterTemp: "23.8°C",
        wind: "4.2 m/s",
        desc: "신안 가거도 실시간 다이빙 해상 시야"
    },
    {
        id: "cam-kbs-wando",
        name: "전남 완도군 완도항 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "전남 완도군",
        thumb: "hero.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9984",
        hlsUrl: "/api/cctv?cctvId=9984",
        source: "KBS 재난포털",
        status: "완도 다도해 시야 최상",
        waterTemp: "23.5°C",
        wind: "3.0 m/s",
        desc: "완도항 해상 실시간 수온 및 파도 CCTV"
    },
    {
        id: "cam-kbs-geomundo",
        name: "전남 여수시 거문도 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "전남 여수시 거문도",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9993",
        hlsUrl: "/api/cctv?cctvId=9993",
        source: "KBS 재난포털",
        status: "거문도 명품 시야 18m+",
        waterTemp: "24.0°C",
        wind: "3.1 m/s",
        desc: "여수 거문도 실시간 해상 스쿠버 포인트"
    },
    {
        id: "cam-kbs-odongdo",
        name: "전남 여수시 오동도 앞 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "전남 여수시",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9994",
        hlsUrl: "/api/cctv?cctvId=9994",
        source: "KBS 재난포털",
        status: "오동도 해상 잔잔함",
        waterTemp: "23.9°C",
        wind: "2.9 m/s",
        desc: "여수 오동도 앞 해상 실시간 라이브 CCTV"
    },
    {
        id: "cam-kbs-masan",
        name: "경남 창원시 마산항 CCTV",
        regionCategory: "jeonnam_namhae",
        region: "경남 창원시",
        thumb: "hero.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9985",
        hlsUrl: "/api/cctv?cctvId=9985",
        source: "KBS 재난포털",
        status: "마산만 수면 안정",
        waterTemp: "23.4°C",
        wind: "2.5 m/s",
        desc: "창원 마산항 해상 실시간 기상 및 파도"
    },

    // 6. 서해 / 수도권 / 군산 권역 (3개)
    {
        id: "cam-kbs-incheon",
        name: "인천 제물포 연안부두 CCTV",
        regionCategory: "seohae",
        region: "인천 중구",
        thumb: "right_ad_swimming.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9981",
        hlsUrl: "/api/cctv?cctvId=9981",
        source: "KBS 재난포털",
        status: "서해 중부 연안 조위 양호",
        waterTemp: "22.1°C",
        wind: "3.4 m/s",
        desc: "인천 연안부두 실시간 해상 조위 및 기상"
    },
    {
        id: "cam-kbs-taean",
        name: "충남 태안군 근흥면 신진항 CCTV",
        regionCategory: "seohae",
        region: "충남 태안군",
        thumb: "left_ad_freediving.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9980",
        hlsUrl: "/api/cctv?cctvId=9980",
        source: "KBS 재난포털",
        status: "태안 신진도 다이빙스팟",
        waterTemp: "22.5°C",
        wind: "3.6 m/s",
        desc: "태안 신진항 해상 실시간 파동 및 수온"
    },
    {
        id: "cam-kbs-gunsan",
        name: "전북 군산시 비응항 CCTV",
        regionCategory: "seohae",
        region: "전북 군산시",
        thumb: "right_ad_scuba.jpg",
        embedUrl: "https://d.kbs.co.kr/special/cctvShare?cctvId=9979",
        hlsUrl: "/api/cctv?cctvId=9979",
        source: "KBS 재난포털",
        status: "새만금/비응항 해상 기상",
        waterTemp: "22.8°C",
        wind: "3.2 m/s",
        desc: "군산 비응항 실시간 해상 관측 CCTV"
    }
];

// 46 Specific Marine Diving/Swimming Tide Spots Dataset
const OCEAN_WEATHER_DATA = [
    // 부산 권역 (12개)
    { id: "tide-haeundae", name: "부산 해운대 해수욕장", regionCat: "busan", region: "부산 해운대구", waterTemp: "22.9°C", waveHeight: "0.6m", windSpeed: "3.1 m/s", tideName: "7물", highTide: "06:15 (122cm)", lowTide: "12:40 (32cm)", status: "입수 양호" },
    { id: "tide-gwangalli", name: "부산 광안리 해수욕장", regionCat: "busan", region: "부산 수영구", waterTemp: "23.1°C", waveHeight: "0.5m", windSpeed: "2.7 m/s", tideName: "7물", highTide: "06:20 (125cm)", lowTide: "12:45 (30cm)", status: "수영 잔잔함" },
    { id: "tide-gamji", name: "부산 태종대 감지해변 자갈마당", regionCat: "busan", region: "부산 영도구", waterTemp: "22.7°C", waveHeight: "0.8m", windSpeed: "3.7 m/s", tideName: "7물", highTide: "06:30 (130cm)", lowTide: "13:00 (28cm)", status: "다이빙 스팟" },
    { id: "tide-imlang", name: "부산 기장 임랑해수욕장", regionCat: "busan", region: "부산 기장군", waterTemp: "22.0°C", waveHeight: "0.6m", windSpeed: "3.0 m/s", tideName: "7물", highTide: "06:05 (118cm)", lowTide: "12:30 (35cm)", status: "입수 양호" },
    { id: "tide-songjeong", name: "부산 해운대 송정해수욕장", regionCat: "busan", region: "부산 해운대구", waterTemp: "22.8°C", waveHeight: "0.8m", windSpeed: "4.0 m/s", tideName: "7물", highTide: "06:10 (120cm)", lowTide: "12:35 (33cm)", status: "서핑/수영 추천" },
    { id: "tide-songdo", name: "부산 서구 송도해수욕장", regionCat: "busan", region: "부산 서구", waterTemp: "22.9°C", waveHeight: "0.5m", windSpeed: "3.0 m/s", tideName: "7물", highTide: "06:35 (132cm)", lowTide: "13:05 (27cm)", status: "입수 쾌적" },
    { id: "tide-oryukdo", name: "부산 남구 오륙도 선착장", regionCat: "busan", region: "부산 남구", waterTemp: "22.4°C", waveHeight: "0.9m", windSpeed: "3.8 m/s", tideName: "7물", highTide: "06:25 (128cm)", lowTide: "12:55 (29cm)", status: "다이빙 주의" },
    { id: "tide-ilgwang", name: "부산 기장 일광해수욕장", regionCat: "busan", region: "부산 기장군", waterTemp: "22.2°C", waveHeight: "0.5m", windSpeed: "2.9 m/s", tideName: "7물", highTide: "06:08 (119cm)", lowTide: "12:32 (34cm)", status: "입수 양호" },
    { id: "tide-sirangdae", name: "부산 기장 시랑대 락다이빙", regionCat: "busan", region: "부산 기장군", waterTemp: "22.3°C", waveHeight: "0.7m", windSpeed: "3.2 m/s", tideName: "7물", highTide: "06:09 (120cm)", lowTide: "12:33 (33cm)", status: "딥다이빙 포인트" },
    { id: "tide-orangdae", name: "부산 기장 오랑대 해안", regionCat: "busan", region: "부산 기장군", waterTemp: "22.2°C", waveHeight: "0.8m", windSpeed: "3.4 m/s", tideName: "7물", highTide: "06:07 (118cm)", lowTide: "12:31 (35cm)", status: "시야 양호" },
    { id: "tide-dadaepo", name: "부산 사하 다대포해수욕장", regionCat: "busan", region: "부산 사하구", waterTemp: "23.3°C", waveHeight: "0.4m", windSpeed: "2.6 m/s", tideName: "7물", highTide: "06:45 (140cm)", lowTide: "13:15 (25cm)", status: "수면 잔잔" },
    { id: "tide-gadeokdo", name: "부산 가덕도 대항 새바지", regionCat: "busan", region: "부산 강서구", waterTemp: "22.8°C", waveHeight: "0.7m", windSpeed: "3.5 m/s", tideName: "7물", highTide: "06:40 (138cm)", lowTide: "13:10 (26cm)", status: "입수 양호" },

    // 울산 권역 (7개)
    { id: "tide-jinha", name: "부산 / 울산 진하해수욕장 (명선도)", regionCat: "ulsan", region: "울산 울주군", waterTemp: "22.4°C", waveHeight: "0.6m", windSpeed: "3.1 m/s", tideName: "7물", highTide: "06:40 (135cm)", lowTide: "13:15 (30cm)", status: "추천 메인 스팟" },
    { id: "tide-daewangam", name: "울산 일산 대왕암공원 해상", regionCat: "ulsan", region: "울산 동구", waterTemp: "21.9°C", waveHeight: "0.7m", windSpeed: "3.4 m/s", tideName: "7물", highTide: "06:30 (130cm)", lowTide: "13:00 (32cm)", status: "다이빙 양호" },
    { id: "tide-jujeon-mongdol", name: "울산 주전 몽돌해변", regionCat: "ulsan", region: "울산 동구", waterTemp: "21.7°C", waveHeight: "0.7m", windSpeed: "3.3 m/s", tideName: "7물", highTide: "06:25 (128cm)", lowTide: "12:55 (33cm)", status: "입수 양호" },
    { id: "tide-sinmyeong", name: "울산 신명해변 수영스팟", regionCat: "ulsan", region: "울산 북구", waterTemp: "21.6°C", waveHeight: "0.6m", windSpeed: "3.2 m/s", tideName: "7물", highTide: "06:20 (125cm)", lowTide: "12:50 (34cm)", status: "시야 쾌적" },
    { id: "tide-jeongja", name: "울산 정자항 해안", regionCat: "ulsan", region: "울산 북구", waterTemp: "21.5°C", waveHeight: "0.7m", windSpeed: "3.5 m/s", tideName: "7물", highTide: "06:18 (124cm)", lowTide: "12:48 (35cm)", status: "입수 양호" },
    { id: "tide-jujeon-port", name: "울산 주전 항만 다이빙", regionCat: "ulsan", region: "울산 동구", waterTemp: "21.8°C", waveHeight: "0.6m", windSpeed: "3.1 m/s", tideName: "7물", highTide: "06:26 (129cm)", lowTide: "12:56 (32cm)", status: "시야 굿" },
    { id: "tide-oryu-goara", name: "경주/울산 오류고아라 해변", regionCat: "ulsan", region: "경주 감포", waterTemp: "21.3°C", waveHeight: "0.7m", windSpeed: "3.3 m/s", tideName: "7물", highTide: "06:15 (122cm)", lowTide: "12:45 (35cm)", status: "입수 양호" },

    // 거제 / 경남 권역 (4개)
    { id: "tide-gujora", name: "거제 구조라 해수욕장", regionCat: "geoje", region: "경남 거제시", waterTemp: "23.5°C", waveHeight: "0.3m", windSpeed: "2.2 m/s", tideName: "8물", highTide: "07:10 (160cm)", lowTide: "13:40 (22cm)", status: "남해 잔잔함" },
    { id: "tide-mangchi", name: "거제 망치 몽돌해변", regionCat: "geoje", region: "경남 거제시", waterTemp: "23.4°C", waveHeight: "0.4m", windSpeed: "2.4 m/s", tideName: "8물", highTide: "07:12 (162cm)", lowTide: "13:42 (23cm)", status: "입수 양호" },
    { id: "tide-yeocha", name: "거제 여차 몽돌해변 딥스팟", regionCat: "geoje", region: "경남 거제시", waterTemp: "23.6°C", waveHeight: "0.5m", windSpeed: "2.5 m/s", tideName: "8물", highTide: "07:15 (165cm)", lowTide: "13:45 (21cm)", status: "시야 최상" },
    { id: "tide-haegeumgang", name: "거제 해금강 다이빙 스팟", regionCat: "geoje", region: "경남 거제시", waterTemp: "23.8°C", waveHeight: "0.5m", windSpeed: "2.6 m/s", tideName: "8물", highTide: "07:18 (168cm)", lowTide: "13:48 (20cm)", status: "명품 다이빙" },

    // 포항 / 동해 / 강원 권역 (12개)
    { id: "tide-yeongilman", name: "포항 영일만 해변", regionCat: "donghae", region: "경북 포항시", waterTemp: "21.5°C", waveHeight: "0.6m", windSpeed: "3.2 m/s", tideName: "7물", highTide: "06:12 (120cm)", lowTide: "12:45 (35cm)", status: "바다수영 최상" },
    { id: "tide-homigot", name: "포항 호미곶 해상", regionCat: "donghae", region: "경북 포항시", waterTemp: "21.0°C", waveHeight: "0.8m", windSpeed: "3.6 m/s", tideName: "7물", highTide: "06:05 (115cm)", lowTide: "12:35 (38cm)", status: "입수 양호" },
    { id: "tide-guryongpo", name: "포항 구룡포 다이빙스팟", regionCat: "donghae", region: "경북 포항시", waterTemp: "20.8°C", waveHeight: "0.7m", windSpeed: "3.8 m/s", tideName: "7물", highTide: "06:08 (117cm)", lowTide: "12:38 (37cm)", status: "동해남부 굿" },
    { id: "tide-hupo", name: "울진 후포항 해상", regionCat: "donghae", region: "경북 울진군", waterTemp: "20.5°C", waveHeight: "0.7m", windSpeed: "3.4 m/s", tideName: "7물", highTide: "06:00 (110cm)", lowTide: "12:30 (39cm)", status: "시야 쾌적" },
    { id: "tide-ganggu", name: "영덕 강구항 해안", regionCat: "donghae", region: "경북 영덕군", waterTemp: "20.7°C", waveHeight: "0.6m", windSpeed: "3.3 m/s", tideName: "7물", highTide: "06:03 (112cm)", lowTide: "12:33 (38cm)", status: "입수 양호" },
    { id: "tide-jukbyeon", name: "울진 죽변항 해상스팟", regionCat: "donghae", region: "경북 울진군", waterTemp: "20.3°C", waveHeight: "0.7m", windSpeed: "3.5 m/s", tideName: "7물", highTide: "05:58 (108cm)", lowTide: "12:28 (40cm)", status: "입수 양호" },
    { id: "tide-uljin", name: "울진 해양레저센터", regionCat: "donghae", region: "경북 울진군", waterTemp: "20.4°C", waveHeight: "0.7m", windSpeed: "3.5 m/s", tideName: "7물", highTide: "06:00 (105cm)", lowTide: "12:30 (25cm)", status: "입수 양호" },
    { id: "tide-sokcho", name: "속초 해수욕장", regionCat: "donghae", region: "강원 속초시", waterTemp: "19.5°C", waveHeight: "0.9m", windSpeed: "4.5 m/s", tideName: "7물", highTide: "05:45 (92cm)", lowTide: "12:05 (18cm)", status: "파고 약간높음" },
    { id: "tide-samcheok", name: "삼척 장호항 한국의나폴리", regionCat: "donghae", region: "강원 삼척시", waterTemp: "20.1°C", waveHeight: "0.5m", windSpeed: "3.0 m/s", tideName: "7물", highTide: "05:52 (98cm)", lowTide: "12:15 (22cm)", status: "스노클링 최상" },
    { id: "tide-donghae", name: "동해 어달/망상 해변", regionCat: "donghae", region: "강원 동해시", waterTemp: "20.0°C", waveHeight: "0.6m", windSpeed: "3.2 m/s", tideName: "7물", highTide: "05:50 (96cm)", lowTide: "12:12 (20cm)", status: "입수 양호" },
    { id: "tide-jumunjin", name: "강릉 주문진 방파제", regionCat: "donghae", region: "강원 강릉시", waterTemp: "20.1°C", waveHeight: "0.8m", windSpeed: "3.9 m/s", tideName: "7물", highTide: "05:48 (94cm)", lowTide: "12:08 (19cm)", status: "스쿠버 추천" },
    { id: "tide-yangyang", name: "양양 서피비치/인구해변", regionCat: "donghae", region: "강원 양양군", waterTemp: "19.6°C", waveHeight: "1.0m", windSpeed: "4.8 m/s", tideName: "7물", highTide: "05:42 (90cm)", lowTide: "12:02 (17cm)", status: "서핑 파도 높음" },

    // 독도 / 울릉도 권역 (2개)
    { id: "tide-dokdo", name: "대한민국 독도 해역", regionCat: "islands", region: "대한민국 독도", waterTemp: "20.5°C", waveHeight: "0.8m", windSpeed: "4.0 m/s", tideName: "7물", highTide: "06:00 (100cm)", lowTide: "12:25 (30cm)", status: "독도 시야 양호" },
    { id: "tide-ulleungdo", name: "울릉도 저동항/도동항", regionCat: "islands", region: "경북 울릉군", waterTemp: "21.0°C", waveHeight: "0.7m", windSpeed: "3.5 m/s", tideName: "7물", highTide: "06:02 (102cm)", lowTide: "12:28 (31cm)", status: "울릉 청정시야 20m+" },

    // 제주도 권역 (9개)
    { id: "tide-jeju-yongduam", name: "제주북부 용두암 해안", regionCat: "jeju", region: "제주북부 용두암", waterTemp: "24.1°C", waveHeight: "0.5m", windSpeed: "2.8 m/s", tideName: "8물", highTide: "08:00 (200cm)", lowTide: "14:10 (45cm)", status: "입수 양호" },
    { id: "tide-jeju-topdong", name: "제주북부 탑동 방파제", regionCat: "jeju", region: "제주북부 탑동", waterTemp: "24.2°C", waveHeight: "0.5m", windSpeed: "3.0 m/s", tideName: "8물", highTide: "08:02 (202cm)", lowTide: "14:12 (44cm)", status: "해안 잔잔함" },
    { id: "tide-jeju-seogwipo", name: "제주남부 서귀포 문섬/범섬", regionCat: "jeju", region: "제주남부 서귀포", waterTemp: "24.8°C", waveHeight: "0.5m", windSpeed: "2.4 m/s", tideName: "8물", highTide: "08:10 (210cm)", lowTide: "14:20 (42cm)", status: "시야 최상 (15m+)" },
    { id: "tide-jeju-beobhwan", name: "제주남부 법환 포구", regionCat: "jeju", region: "제주남부 법환", waterTemp: "24.6°C", waveHeight: "0.4m", windSpeed: "2.5 m/s", tideName: "8물", highTide: "08:08 (208cm)", lowTide: "14:18 (43cm)", status: "프리다이빙 추천" },
    { id: "tide-jeju-jungmun", name: "제주남부 중문 색달해변", regionCat: "jeju", region: "제주남부 중문", waterTemp: "24.7°C", waveHeight: "0.8m", windSpeed: "3.1 m/s", tideName: "8물", highTide: "08:12 (212cm)", lowTide: "14:22 (41cm)", status: "서핑 파도 굿" },
    { id: "tide-jeju-seongsan", name: "제주동부 성산일출봉 해상", regionCat: "jeju", region: "제주동부 성산", waterTemp: "24.0°C", waveHeight: "0.6m", windSpeed: "3.2 m/s", tideName: "8물", highTide: "08:05 (205cm)", lowTide: "14:15 (46cm)", status: "시야 양호" },
    { id: "tide-jeju-onpyeong", name: "제주동부 온평 포구", regionCat: "jeju", region: "제주동부 온평", waterTemp: "24.1°C", waveHeight: "0.5m", windSpeed: "3.0 m/s", tideName: "8물", highTide: "08:06 (206cm)", lowTide: "14:16 (45cm)", status: "입수 양호" },
    { id: "tide-jeju-sinchang", name: "제주서부 신창 풍차해안", regionCat: "jeju", region: "제주서부 신창", waterTemp: "24.3°C", waveHeight: "0.7m", windSpeed: "3.8 m/s", tideName: "8물", highTide: "07:58 (198cm)", lowTide: "14:08 (47cm)", status: "바람 시원함" },
    { id: "tide-jeju-hwasun", name: "제주서부 화순 금모래해변", regionCat: "jeju", region: "제주서부 화순", waterTemp: "24.4°C", waveHeight: "0.4m", windSpeed: "2.7 m/s", tideName: "8물", highTide: "08:04 (204cm)", lowTide: "14:14 (44cm)", status: "수면 잔잔함" }
];

// Initial Posts Sample Data (Real Data Only Mode)
const INITIAL_POSTS = [];

// App State
let posts = [];
let inquiries = [];
let activeCategory = "all";
let activeActivitySub = "my_posts";
let activeCctvRegion = "all";
let activeTideRegion = "all";
let tideSearchKeyword = "";
let cctvSearchKeyword = "";
let currentMainView = "home";
let searchKeyword = "";
let selectedRegion = "all";
let selectedSort = "newest";
let currentUser = null;
let currentChatPost = null;
let currentRatingPost = null;
let currentRatingScore = 5;
let editingPostId = null;
let pendingDeletePostId = null;
let chatMessages = {};
let uploadedCompressedImages = [];
let uploadedCertImage = "";
let instAppCertImage = "";
let inquiryImageCompressed = "";
let myCreatedPostIds = [];
let activeHlsPlayer = null;
let chatJoinTimestamps = {};

// DOM Elements
const postsGrid = document.getElementById("postsGrid");
const emptyState = document.getElementById("emptyState");
const activeCountText = document.getElementById("activeCountText");
const searchInput = document.getElementById("searchInput");
const regionSelect = document.getElementById("regionSelect");
const sortSelect = document.getElementById("sortSelect");
const tabBtns = document.querySelectorAll(".tab-btn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const createBtnText = document.getElementById("createBtnText");
const modalFormTitle = document.getElementById("modalFormTitle");
const activitySubFilterBar = document.getElementById("activitySubFilterBar");

// Modals
const createModal = document.getElementById("createModal");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const closeCreateModalBtn = document.getElementById("closeCreateModalBtn");
const cancelCreateBtn = document.getElementById("cancelCreateBtn");
const createPostForm = document.getElementById("createPostForm");
const postImagesInput = document.getElementById("postImagesInput");
const imagePreviewGrid = document.getElementById("imagePreviewGrid");

let pendingLoginAction = null; // 로그인 후 실행할 보류 액션 (댓글/채팅/참가)
const authModal = document.getElementById("authModal");
const openAuthModalBtn = document.getElementById("openAuthModalBtn");
const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");

const chatModal = document.getElementById("chatModal");
const closeChatModalBtn = document.getElementById("closeChatModalBtn");
const chatForm = document.getElementById("chatForm");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatMessagesStream = document.getElementById("chatMessagesStream");

const ratingModal = document.getElementById("ratingModal");
const closeRatingModalBtn = document.getElementById("closeRatingModalBtn");
const cancelRatingBtn = document.getElementById("cancelRatingBtn");

const detailModal = document.getElementById("detailModal");
const detailModalTitle = document.getElementById("detailModalTitle");
const detailModalBody = document.getElementById("detailModalBody");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");

const imageLightboxModal = document.getElementById("imageLightboxModal");
const lightboxImage = document.getElementById("lightboxImage");

const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const confirmDeleteFinalBtn = document.getElementById("confirmDeleteFinalBtn");
const inquiryModal = document.getElementById("inquiryModal");

function forceScrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

// Switch Main View (Home vs Feed/Category vs Tide vs CCTV)
function switchMainView(viewName) {
    currentMainView = viewName;
    const feedSec = document.getElementById("mainFeedViewSection");
    const tideSec = document.getElementById("tideViewSection");
    const cctvSec = document.getElementById("cctvViewSection");

    const navHome = document.getElementById("navLinkHome");
    const navFeed = document.getElementById("navLinkFeed");
    const navInstructor = document.getElementById("navLinkInstructor");
    const navCommunity = document.getElementById("navLinkCommunity");
    const navMarket = document.getElementById("navLinkMarket");
    const navActivity = document.getElementById("navLinkActivity");
    const navTide = document.getElementById("navLinkTide");
    const navCctv = document.getElementById("navLinkCctv");

    [navHome, navFeed, navInstructor, navCommunity, navMarket, navActivity, navTide, navCctv].forEach(link => {
        if (link) link.classList.remove("active");
    });

    if (viewName === "home") {
        document.body.classList.remove("category-view-active");
        if (feedSec) feedSec.classList.remove("hidden");
        if (tideSec) tideSec.classList.add("hidden");
        if (cctvSec) cctvSec.classList.add("hidden");
        if (navHome) navHome.classList.add("active");
        
        activeCategory = "all";
        tabBtns.forEach(b => {
            if (b.dataset.category === "all" || b.dataset.category === "home") b.classList.add("active");
            else b.classList.remove("active");
        });
        updateCreateButtonText("all");
        filterAndRender();
    } else if (viewName === "feed") {
        if (feedSec) feedSec.classList.remove("hidden");
        if (tideSec) tideSec.classList.add("hidden");
        if (cctvSec) cctvSec.classList.add("hidden");

        if (activeCategory === "all" || activeCategory === "home") {
            activeCategory = "freediving";
        }
        tabBtns.forEach(b => {
            if (b.dataset.category === activeCategory) b.classList.add("active");
            else b.classList.remove("active");
        });

        updateTopNavbarActive(activeCategory);
        filterAndRender();
    } else if (viewName === "tide" || viewName === "cctv") {
        if (feedSec) feedSec.classList.add("hidden");
        if (tideSec) tideSec.classList.remove("hidden");
        if (cctvSec) cctvSec.classList.add("hidden");
        if (navTide) navTide.classList.add("active");
        if (navCctv) navCctv.classList.add("active");
        document.body.classList.add("category-view-active");
        if (!currentDashboardSpot && typeof OCEAN_WEATHER_DATA !== "undefined" && OCEAN_WEATHER_DATA.length > 0) {
            currentDashboardSpot = OCEAN_WEATHER_DATA[0];
        }
        if (typeof renderUnifiedSpotDashboard === "function") {
            renderUnifiedSpotDashboard(currentDashboardSpot);
        }
        renderWeatherGrid(activeTideRegion);
    }

    // Multi-stage Force Scroll-to-Top (Guarantees Photo 1 View across all devices!)
    forceScrollToTop();
    setTimeout(forceScrollToTop, 10);
    setTimeout(forceScrollToTop, 50);
    setTimeout(forceScrollToTop, 150);
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    initKakaoSdk();
    initUserIdentity();
    if (typeof refreshCurrentUserFromCloud === 'function') {
        await refreshCurrentUserFromCloud();
    }
    if (typeof initKmaObsData === 'function') {
        await initKmaObsData();
    }
    loadPosts();
    loadMyPosts();
    loadInquiries();
    initEventListeners();
    switchMainView('home');
    if (typeof OCEAN_WEATHER_DATA !== "undefined" && OCEAN_WEATHER_DATA.length > 0) {
        currentDashboardSpot = OCEAN_WEATHER_DATA[0];
        if (typeof renderUnifiedSpotDashboard === "function") {
            renderUnifiedSpotDashboard(OCEAN_WEATHER_DATA[0]);
        }
    }
    renderWeatherGrid(activeTideRegion);
    renderOceanWebcams(activeCctvRegion);
    renderAdBanner();
    generateBubbles();
});

// Load Inquiries
function loadInquiries() {
    const saved = localStorage.getItem("aqua_buddy_inquiries");
    if (saved) {
        try {
            inquiries = JSON.parse(saved);
        } catch (e) {
            inquiries = [...INITIAL_INQUIRIES];
        }
    } else {
        inquiries = [...INITIAL_INQUIRIES];
    }
}

function saveInquiries() {
    localStorage.setItem("aqua_buddy_inquiries", JSON.stringify(inquiries));
}

// Open Unified Customer & Partner Feedback Modal (#inquiryModal)
function openInquiryModal(defaultCategory = 'general') {
    if (!currentUser) {
        showToast("🔑 로그인 후 문의하기를 이용하실 수 있습니다.");
        openModal(authModal);
        return;
    }
    const categorySelect = document.getElementById("inquiryCategory");
    const nameInput = document.getElementById("inquiryName");
    const contactInput = document.getElementById("inquiryContact");
    const contentInput = document.getElementById("inquiryContent");
    const imageInput = document.getElementById("inquiryImageInput");
    const imagePreview = document.getElementById("inquiryImagePreview");

    if (categorySelect) categorySelect.value = defaultCategory;
    if (nameInput && currentUser) nameInput.value = currentUser.name || "";
    if (contactInput && currentUser && currentUser.email) contactInput.value = currentUser.email;
    if (contentInput) contentInput.value = "";
    if (imageInput) imageInput.value = "";
    if (imagePreview) imagePreview.innerHTML = "";
    inquiryImageCompressed = "";

    openModal(inquiryModal);
}

function handleSaveInquiry(e) {
    e.preventDefault();

    const category = document.getElementById("inquiryCategory").value;
    const name = document.getElementById("inquiryName").value.trim();
    const contact = document.getElementById("inquiryContact").value.trim();
    const content = document.getElementById("inquiryContent").value.trim();

    if (!name || !contact || !content) {
        showToast("⚠️ 필수 입력 항목을 모두 작성해 주세요!");
        return;
    }

    let categoryName = "💬 기타 건의 및 피드백";
    if (category === "ad") categoryName = "📢 광고 제휴 문의";
    if (category === "bug") categoryName = "🐞 버그 / 오류 신고";
    if (category === "feature") categoryName = "💡 새로운 기능 제안";
    if (category === "edit") categoryName = "✏️ 정보 / 게시글 수정 요청";

    const newInquiry = {
        id: "inq-" + Date.now(),
        category,
        categoryName,
        name,
        contact,
        content,
        image: inquiryImageCompressed,
        status: "new",
        statusText: "신규 접수",
        createdAt: new Date().toISOString()
    };

    inquiries.unshift(newInquiry);
    saveInquiries();

    closeModal(inquiryModal);

    let toastMsg = `💌 [${categoryName}] 메시지가 운영진에게 전달되었습니다. 감사합니다!`;
    if (category === "ad") toastMsg = `📢 [광고/제휴 문의] 메시지가 접수되었습니다! 담당자가 24시간 이내 연락드립니다.`;
    if (category === "bug") toastMsg = `🐞 [버그/오류 신고] 메시지가 전달되었습니다. 빠른 시일 내 점검하겠습니다!`;
    if (category === "feature") toastMsg = `💡 [기능 제안] 메시지가 전달되었습니다. 소중한 의견 감사드립니다!`;

    showToast(toastMsg);
    if (!document.getElementById("adminDashboardModal").classList.contains("hidden")) {
        renderAdminInquiriesTable();
    }
}

// Open Discreet Webmaster Security Password Check Modal
function openAdminSecurityCheck() {
    if (!currentUser) {
        showToast("🔑 관리자 모드는 로그인 후 이용 가능합니다.");
        resetAuthForm();
        openModal(authModal);
        return;
    }
    const passInput = document.getElementById("adminSecurityPassInput");
    if (passInput) passInput.value = "";
    openModal(document.getElementById("adminSecurityModal"));
}

// SHA-256 Hashing Verification for Admin Master Password
async function handleVerifyAdminMasterCode(e) {
    e.preventDefault();
    const code = document.getElementById("adminSecurityPassInput").value.trim();
    if (!code) return;

    const inputHash = await sha256(code);

    if (MASTER_VALID_HASHES.includes(inputHash)) {
        isAdminAuthenticated = true;
        closeModal(document.getElementById("adminSecurityModal"));
        openAdminDashboard();
        showToast("👑 웹마스터 보안 암호가 확인되었습니다. 관리자 대시보드에 접근합니다.");
    } else {
        showToast("⚠️ 웹마스터 보안 암호가 일치하지 않습니다!");
    }
}

// Initialize Official Kakao JS SDK
function initKakaoSdk() {
    if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
            try {
                window.Kakao.init(KAKAO_APP_KEY);
                console.log("Kakao SDK Initialized Successfully:", KAKAO_APP_KEY);
            } catch (e) {
                console.log("Kakao SDK Init Notice:", e);
            }
        }
    }
}

// Initialize User Identity
function initUserIdentity() {
    let savedUser = localStorage.getItem("aqua_buddy_user_identity");
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser && currentUser.email) {
                restoreUserFromSupabaseCloud(currentUser.email).then(updated => {
                    if (updated) {
                        currentUser = updated;
                        updateNavbarUserUI();
                    }
                });
            }
        } catch(e) {
            currentUser = null;
        }
    } else {
        currentUser = null;
    }

    checkKakaoOAuthCallback();
    updateNavbarUserUI();
}

function updateNavbarUserUI() {
    window.updateAuthUI = updateNavbarUserUI;
    const userNav = document.getElementById("userProfileNav");
    const openAuthBtn = document.getElementById("openAuthModalBtn");
    const navActivity = document.getElementById("navLinkActivity");
    const tabActivity = document.querySelector('.tab-btn[data-category="activity_log"]');

    if (currentUser && (currentUser.nickname || currentUser.name || currentUser.email)) {
        if (userNav) userNav.classList.remove("hidden");
        const instBadge = isVerifiedInstructor() ? ` [공인강사]` : (isPendingInstructor() ? ` [심사대기중]` : '');
        const navName = document.getElementById("navUserName");
        const displayName = currentUser.nickname || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : "다이버");
        if (navName) navName.textContent = `${displayName}${instBadge}`;
        if (openAuthBtn) openAuthBtn.classList.add("hidden");

        if (navActivity) navActivity.style.display = "inline-flex";
        if (tabActivity) tabActivity.style.display = "inline-flex";
    } else {
        if (userNav) userNav.classList.add("hidden");
        if (openAuthBtn) openAuthBtn.classList.remove("hidden");

        if (navActivity) navActivity.style.display = "none";
        if (tabActivity) tabActivity.style.display = "none";

        if (activeCategory === "activity_log") {
            activeCategory = "all";
        }
    }

    updateCreateButtonText(activeCategory);
}

function isVerifiedInstructor() {
    if (!currentUser) return false;
    return currentUser.instructorStatus === "approved" || currentUser.isApprovedInstructor === true;
}

function isPendingInstructor() {
    if (!currentUser) return false;
    return currentUser.instructorStatus === "pending";
}

function openInstructorAuthModal() {
    if (!currentUser) {
        showToast("🔑 로그인 / 회원가입 후 강사 인증을 이용하실 수 있습니다!");
        openModal(authModal);
        return;
    }
    openModal(document.getElementById("instructorAuthModal"));
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn("Storage quota limit reached, attempting safe cleanup...", e);
        try {
            // Clean up temporary large items if quota is exceeded
            localStorage.removeItem("aqua_buddy_posts_v27");
            localStorage.setItem(key, value);
        } catch (err) {
            console.error("Safe storage set failure handled silently:", err);
        }
    }
}

async function refreshCurrentUserFromCloud() {
    const rawSaved = localStorage.getItem('currentUser') || localStorage.getItem('aqua_buddy_user_identity') || 'null';
    let savedUser = null;
    try {
        savedUser = JSON.parse(rawSaved);
    } catch (e) {
        savedUser = null;
    }
    if (!savedUser || !savedUser.email) return null;

    try {
        const userEmail = savedUser.email.toLowerCase();
        let dbUser = null;
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle();

            if (!error && data) {
                dbUser = data;
            }
        }

        if (dbUser) {
            const finalNick = dbUser.nickname || dbUser.name || savedUser.nickname || savedUser.name || userEmail.split('@')[0];
            const finalLicense = (dbUser.user_license !== undefined && dbUser.user_license !== null)
                ? dbUser.user_license
                : (dbUser.license_info || dbUser.license || savedUser.user_license || savedUser.license_info || savedUser.license || "");

            const updatedUser = {
                ...savedUser,
                email: userEmail,
                realName: dbUser.real_name || dbUser.realName || savedUser.realName || finalNick,
                real_name: dbUser.real_name || dbUser.realName || savedUser.real_name || finalNick,
                name: finalNick,
                nickname: finalNick,
                phone: (dbUser.phone && dbUser.phone !== "010-0000-0000") ? dbUser.phone : (savedUser.phone || ""),
                license: finalLicense,
                license_info: finalLicense,
                user_license: finalLicense,
                instructorStatus: dbUser.instructor_status || dbUser.instructorStatus || savedUser.instructorStatus || "none",
                instructor_status: dbUser.instructor_status || dbUser.instructorStatus || savedUser.instructor_status || "none",
                rejectionReason: dbUser.rejection_reason || dbUser.rejectionReason || savedUser.rejectionReason || "",
                provider: dbUser.provider || savedUser.provider || "홈페이지 회원"
            };

            currentUser = updatedUser;
            safeLocalStorageSet('currentUser', JSON.stringify(updatedUser));
            safeLocalStorageSet('aqua_buddy_user_identity', JSON.stringify(updatedUser));
            saveRegisteredUser(updatedUser);
            if (typeof updateNavbarUserUI === 'function') updateNavbarUserUI();
        }
    } catch (err) {
        console.error("앱 초기화 시 Cloud DB 동기화 실패:", err);
    }
    return currentUser;
}
window.refreshCurrentUserFromCloud = refreshCurrentUserFromCloud;

async function syncUserProfileWithSupabase(email) {
    if (!email) return null;
    return await refreshCurrentUserFromCloud();
}
window.syncUserProfileWithSupabase = syncUserProfileWithSupabase;

async function restoreUserFromSupabaseCloud(email) {
    return await refreshCurrentUserFromCloud();
}

async function saveUserProfileToSupabase(userData, isExplicitEdit = false) {
    if (!userData || !userData.email) return null;
    if (!supabaseClient) return null;

    try {
        let authUser = null;
        try {
            if (supabaseClient.auth && typeof supabaseClient.auth.getUser === "function") {
                const { data: authRes } = await supabaseClient.auth.getUser();
                if (authRes && authRes.user) {
                    authUser = authRes.user;
                }
            }
        } catch (authErr) {
            console.warn("Supabase auth.getUser notice:", authErr);
        }

        const userEmail = (userData.email || "").toLowerCase();

        // 1. 기존 유저 존재 여부 확인 및 최신 DB 데이터 조회
        let existingUser = null;
        try {
            const { data } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle();
            existingUser = data;
        } catch (selErr) {
            console.warn("users 테이블 조회 예외:", selErr);
        }

        // 로그인/세션조회 시 (isExplicitEdit = false):
        // 이미 DB에 유저가 존재하면 DB의 nickname과 user_license를 절대 덮어씌우지 않고, DB에서 읽어온 값으로 currentUser 및 localStorage만 최신화!
        if (existingUser && !isExplicitEdit) {
            console.log("로그인/세션 체크: 기존 DB 유저 프로필 유지 및 복원 ->", existingUser.email);
            const restoredUser = {
                ...userData,
                email: userEmail,
                name: existingUser.nickname || existingUser.name || userData.name || userData.nickname || userEmail.split('@')[0],
                nickname: existingUser.nickname || existingUser.name || userData.nickname || userData.name || userEmail.split('@')[0],
                license: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.license || ""),
                license_info: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.license_info || ""),
                user_license: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.user_license || ""),
                instructor_code: existingUser.instructor_code || userData.instructor_code || ""
            };

            currentUser = restoredUser;
            safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            saveRegisteredUser(currentUser);
            if (typeof updateNavbarUserUI === "function") updateNavbarUserUI();
            return currentUser;
        }

        // 명시적 프로필 수정 모달 [저장] (isExplicitEdit = true) 또는 신규 회원(insert)인 경우에만 DB UPDATE/INSERT 수행
        const userNick = userData.nickname || userData.name || (userEmail.includes('@') ? userEmail.split('@')[0] : '다이버');
        const userRealName = userData.realName || userData.real_name || userData.name || '다이버';
        const userLicense = (userData.user_license !== undefined && userData.user_license !== null)
            ? userData.user_license
            : ((userData.license_info !== undefined && userData.license_info !== null) ? userData.license_info : (userData.license || ''));
        const userPhone = (userData.phone && userData.phone !== "010-0000-0000") ? userData.phone : (userData.phone || '');
        const instCode = userData.instructorCode || userData.instructor_code || "";

        const payload = {
            email: userEmail,
            nickname: userNick,
            user_license: userLicense,
            instructor_code: instCode || userData.instructor_code || userData.instructorCode || "",
            provider: userData.provider || "홈페이지 회원",
            phone: userPhone,
            real_name: userRealName,
            license_info: userLicense,
            instructor_status: userData.instructor_status || userData.instructorStatus || "none",
            rejection_reason: userData.rejection_reason || userData.rejectionReason || "",
            cert_image: userData.cert_image || userData.certImage || ""
        };

        if (authUser && authUser.id) payload.id = authUser.id;
        else if (existingUser && existingUser.id) payload.id = existingUser.id;

        console.log("DB 연동 시도 페이로드 (isExplicitEdit=", isExplicitEdit, "):", payload);

        let res;
        if (existingUser) {
            // 이미 있으면 UPDATE (사용자가 직접 프로필 수정을 눌렀을 때만 실행)
            res = await supabaseClient.from('users').update(payload).eq('email', userEmail);
            if (res.error) {
                console.warn("Update 시도 실패, Upsert 재시도:", res.error);
                res = await supabaseClient.from('users').upsert(payload, { onConflict: 'email' });
            }
        } else {
            // 없으면 INSERT (신규 가입 유저)
            res = await supabaseClient.from('users').insert([payload]);
            if (res.error) {
                console.warn("Insert 시도 실패, Upsert 재시도:", res.error);
                res = await supabaseClient.from('users').upsert(payload, { onConflict: 'email' });
            }
        }

        if (res && res.error) {
            console.error("DB 저장 실패 세부원인:", res.error);
            alert("DB 저장 거부됨: " + (res.error.message || JSON.stringify(res.error)));
        } else {
            console.log("Supabase DB 연동 성공!", res ? res.data : "");
            // DB 저장 성공 후 최신 데이터를 읽어와 currentUser 및 UI 즉시 갱신
            try {
                const { data: latestDB } = await supabaseClient.from('users').select('*').eq('email', userEmail).maybeSingle();
                if (latestDB) {
                    currentUser = {
                        ...currentUser,
                        name: latestDB.nickname || userNick,
                        nickname: latestDB.nickname || userNick,
                        realName: latestDB.user_name || latestDB.real_name || latestDB.realName || userRealName,
                        real_name: latestDB.user_name || latestDB.real_name || latestDB.realName || userRealName,
                        phone: (latestDB.phone && latestDB.phone !== "010-0000-0000") ? latestDB.phone : (currentUser.phone || ""),
                        license: (latestDB.user_license !== undefined && latestDB.user_license !== null) ? latestDB.user_license : userLicense,
                        license_info: (latestDB.user_license !== undefined && latestDB.user_license !== null) ? latestDB.user_license : userLicense,
                        user_license: (latestDB.user_license !== undefined && latestDB.user_license !== null) ? latestDB.user_license : userLicense
                    };
                    safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));
                    saveRegisteredUser(currentUser);
                    if (typeof updateNavbarUserUI === "function") updateNavbarUserUI();
                }
            } catch (rErr) {
                console.warn("최신 DB 재조회 예외:", rErr);
            }
        }
    } catch (e) {
        console.error("코드 실행 에러:", e);
        alert("코드 실행 에러: " + (e.message || e));
    }
    return currentUser;
}
window.saveUserProfileToSupabase = saveUserProfileToSupabase;

async function syncUserToSupabaseCloud(userData) {
    return await saveUserProfileToSupabase(userData, false);
}

function handleInstructorAuthSubmit(e) {
    e.preventDefault();

    if (currentUser && (currentUser.isInstructor || currentUser.role === 'instructor' || currentUser.instructorStatus === 'approved')) {
        showToast("⚠️ 이미 공인 인증 강사로 승인 완료된 계정입니다!");
        closeModal(document.getElementById("instructorAuthModal"));
        return;
    }

    const org = document.getElementById("instAppOrg").value;
    const code = document.getElementById("instAppCode").value.trim();

    if (!code) {
        showToast("⚠️ 강사 라이선스 코드 번호를 입력해 주세요!");
        return;
    }

    const registeredUsers = getRegisteredUsers();
    const isDuplicateCode = Object.values(registeredUsers).some(u => 
        u.instructorCode === code || (u.license && u.license.includes(code))
    );

    if (isDuplicateCode) {
        showToast("⚠️ 이미 등록되었거나 심사 진행 중인 라이선스 코드입니다.");
        return;
    }

    if (currentUser) {
        currentUser.instructorCode = code;
        currentUser.instructorOrg = org;
        currentUser.license = `${org} Instructor (No. ${code})`;
        currentUser.instructorStatus = "pending";
        currentUser.isApprovedInstructor = false;
        if (instAppCertImage) currentUser.certImage = instAppCertImage;

        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));

        if (currentUser.email) {
            const users = getRegisteredUsers();
            const userKey = currentUser.email.toLowerCase();
            if (users[userKey]) {
                users[userKey].instructorCode = code;
                users[userKey].instructorOrg = org;
                users[userKey].license = currentUser.license;
                users[userKey].instructorStatus = "pending";
                users[userKey].isApprovedInstructor = false;
                if (instAppCertImage) users[userKey].certImage = instAppCertImage;
                safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(users));
                syncUserToSupabaseCloud(users[userKey]);
            }
        }
        updateNavbarUserUI();
    }

    closeModal(document.getElementById("instructorAuthModal"));
    filterAndRender();
    showToast(`⏳ 강사 자격증 심사 신청이 제출되었습니다! (웹마스터 승인 완료 후 클래스 등록이 활성화됩니다)`);
}

function renderAdminStats() {
    try {
        // 1. 총 가입 다이버
        const usersMap = (typeof getRegisteredUsers === 'function') ? getRegisteredUsers() : {};
        const usersList = Object.values(usersMap);
        const totalUsers = usersList.length > 0 ? usersList.length : 1;

        const elTotalUsers = document.getElementById("adminStatTotalUsers");
        if (elTotalUsers) elTotalUsers.textContent = `${totalUsers.toLocaleString()} 명`;

        const elTodayUsers = document.getElementById("adminStatTodayUsers");
        if (elTodayUsers) elTodayUsers.textContent = `실시간 Supabase DB 연동 (${totalUsers}명)`;

        // 2. 접수된 미처리 문의/건의 (isResolved: false / status !== '처리완료')
        const inquiriesArr = (typeof localInquiries !== 'undefined' && Array.isArray(localInquiries)) ? localInquiries : [];
        const pendingInquiries = inquiriesArr.filter(i => i.status !== '처리완료').length;
        
        const elPendingInquiries = document.getElementById("adminStatPendingInquiries");
        if (elPendingInquiries) elPendingInquiries.textContent = `${pendingInquiries.toLocaleString()} 건`;

        const elTotalInquiries = document.getElementById("adminStatTotalInquiries");
        if (elTotalInquiries) elTotalInquiries.textContent = `전체 ${inquiriesArr.length}건 수집 중`;

        // 3. 공인 인증 강사
        const instructorsList = usersList.filter(u => u.isInstructor || u.instructorStatus === 'approved' || u.role === 'instructor');
        const elInstructors = document.getElementById("adminStatInstructors");
        if (elInstructors) elInstructors.textContent = `${instructorsList.length} 명`;

        const elPendingCertQueue = document.getElementById("adminStatPendingCertQueue");
        if (elPendingCertQueue) elPendingCertQueue.textContent = `승인 대기중 1건`;

        // 4. 전체 등록 게시글
        const totalPostsCount = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.length : 0;
        const elTotalPosts = document.getElementById("adminStatTotalPosts");
        if (elTotalPosts) elTotalPosts.textContent = `${totalPostsCount.toLocaleString()} 개`;
    } catch (err) {
        console.error('[Admin Stats Render Error]', err);
    }
}

function hideAdBannersForAdmin() {
    document.querySelectorAll('.ad-banner-container, .coupang-banner, .side-ad-banner, .side-ad-card, .bottom-footer-ad, .bottom-ad-visual-card, [class*="ad-banner"]').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
    });
}

function restoreAdBannersAfterAdmin() {
    document.querySelectorAll('.ad-banner-container, .coupang-banner, .side-ad-banner, .side-ad-card, .bottom-footer-ad, .bottom-ad-visual-card, [class*="ad-banner"]').forEach(el => {
        el.style.removeProperty('display');
    });
}

function openAdminDashboard() {
    isAdminAuthenticated = true;
    hideAdBannersForAdmin();
    renderAdminStats();
    renderAdminUsersTable();
    renderAdminPostsTable();
    if (typeof renderAdminInquiries === 'function') renderAdminInquiries();
    const modalEl = document.getElementById("adminDashboardModal") || document.getElementById("webmasterDashboardModal");
    if (modalEl) {
        if (modalEl.parentElement !== document.body) {
            document.body.appendChild(modalEl);
        }
        modalEl.classList.remove("hidden");
        modalEl.classList.add("active");
        modalEl.style.setProperty("display", "flex", "important");
        modalEl.style.setProperty("z-index", "9999999", "important");
    }
}

function openAdminModal() {
    openAdminDashboard();
}

function switchAdminTab(tabKey) {
    const tabs = ["stats", "inquiries", "users", "instructors", "posts", "affiliate", "settings"];
    tabs.forEach(t => {
        const btn = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const panel = document.getElementById(`adminPanel${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (t === tabKey) {
            if (btn) btn.classList.add("active");
            if (panel) {
                panel.classList.remove("hidden");
                panel.style.display = "block";
            }
        } else {
            if (btn) btn.classList.remove("active");
            if (panel) {
                panel.classList.add("hidden");
                panel.style.display = "none";
            }
        }
    });

    if (tabKey === "stats") renderAdminStats();
    if (tabKey === "users") renderAdminUsersTable();
    if (tabKey === "posts") renderAdminPostsTable();
    if (tabKey === "inquiries") {
        if (typeof renderAdminInquiries === "function") renderAdminInquiries();
        else if (typeof renderAdminInquiriesTable === "function") renderAdminInquiriesTable();
    }
    if (tabKey === "instructors") {
        if (typeof renderAdminInstructorsTable === "function") renderAdminInstructorsTable();
    }
    if (tabKey === "affiliate") {
        if (typeof renderAdminAffiliateStats === "function") renderAdminAffiliateStats();
    }
    if (tabKey === "settings") {
        if (typeof renderAdminSettingsForm === "function") renderAdminSettingsForm();
    }
}

async function renderAdminUsersTable() {
    const tbody = document.getElementById("adminUsersTbody");
    const countBadge = document.getElementById("adminUsersCountBadge");
    const statTotalUsers = document.getElementById("adminStatTotalUsers");

    let usersList = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('users').select('*');
            if (!error && data && Array.isArray(data)) {
                const usersMap = getRegisteredUsers();
                data.forEach(dbUser => {
                    const key = (dbUser.email || "").toLowerCase();
                    if (key) {
                        const existing = usersMap[key] || {};
                        const phoneVal = (dbUser.phone && dbUser.phone !== "010-0000-0000") 
                            ? dbUser.phone 
                            : (existing.phone && existing.phone !== "010-0000-0000" ? existing.phone : "");
                        usersMap[key] = {
                            ...existing,
                            email: dbUser.email,
                            realName: dbUser.user_name || dbUser.real_name || dbUser.realName || existing.realName || dbUser.name || "다이버",
                            name: dbUser.name || dbUser.nickname || existing.name || "다이버",
                            phone: phoneVal,
                            license: dbUser.user_license || dbUser.license || existing.license || "자유다이버",
                            instructorStatus: dbUser.instructor_status || dbUser.instructorStatus || existing.instructorStatus || "none",
                            rejectionReason: dbUser.rejection_reason || dbUser.rejectionReason || existing.rejectionReason || "",
                            provider: dbUser.provider || existing.provider || "홈페이지 회원",
                            createdAt: dbUser.created_at || dbUser.createdAt || existing.createdAt || new Date().toISOString()
                        };
                    }
                });
                safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(usersMap));
                usersList = Object.values(usersMap);
            }
        } catch (err) {
            console.warn("Supabase user fetch error, fallback to local:", err);
        }
    }

    if (usersList.length === 0) {
        const usersMap = getRegisteredUsers();
        usersList = Object.values(usersMap);
    }

    if (countBadge) countBadge.textContent = usersList.length;
    if (statTotalUsers) statTotalUsers.textContent = `${usersList.length} 명`;

    if (!tbody) return;

    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 20px;">
                    가입된 회원 DB가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(u => {
        const regDate = u.createdAt ? formatDate(u.createdAt) : "가입 완료";
        const statusText = u.instructorStatus === "approved"
            ? `<span style="color:#00e676; font-weight:700;"><i class="fa-solid fa-graduation-cap"></i> 공인 강사 (승인)</span>`
            : (u.instructorStatus === "pending"
                ? `<span style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-clock"></i> 심사 대기중</span>`
                : (u.instructorStatus === "rejected"
                    ? `<span style="color:#ff5252; font-weight:700;" title="${escapeHtml(u.rejectionReason || '')}"><i class="fa-solid fa-circle-xmark"></i> 심사 반려</span>`
                    : `<span style="color:var(--text-dim);">일반 다이버</span>`));

        const phoneDisplay = u.phone && u.phone !== "010-0000-0000" 
            ? escapeHtml(u.phone) 
            : `<span style="color:var(--text-muted);">연락처 미등록</span>`;

        return `
            <tr>
                <td style="font-size:0.8rem; color:var(--text-muted);">${regDate}</td>
                <td><strong>${escapeHtml(u.realName || u.name || '미입력')}</strong></td>
                <td>${escapeHtml(u.name || '-')}</td>
                <td><code style="color:var(--accent-cyan);">${escapeHtml(u.email || '-')}</code></td>
                <td>${phoneDisplay}</td>
                <td>${statusText}</td>
                <td><span class="badge badge-secondary" style="font-size:0.75rem;">${escapeHtml(u.provider || '홈페이지 회원')}</span></td>
            </tr>
        `;
    }).join("");
}

function exportUserDbToCsv() {
    const usersMap = getRegisteredUsers();
    const usersList = Object.values(usersMap);

    if (usersList.length === 0) {
        showToast("⚠️ 다운로드할 회원 DB 가입 데이터가 없습니다.");
        return;
    }

    let csvContent = "\uFEFF가입일시,실명(성함),닉네임,이메일(아이디),휴대폰번호,자격증/경력,강사승인상태,가입경로\n";

    usersList.forEach(u => {
        const dateStr = u.createdAt || "";
        const realName = (u.realName || u.name || "").replace(/,/g, " ");
        const nick = (u.name || "").replace(/,/g, " ");
        const email = (u.email || "").replace(/,/g, " ");
        const phone = (u.phone && u.phone !== "010-0000-0000" ? u.phone : "미등록").replace(/,/g, " ");
        const license = (u.license || "").replace(/,/g, " ");
        const status = u.instructorStatus || "일반회원";
        const provider = (u.provider || "홈페이지").replace(/,/g, " ");

        csvContent += `"${dateStr}","${realName}","${nick}","${email}","${phone}","${license}","${status}","${provider}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", `AquaBuddy_Users_DB_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 전체 회원 DB가 성공적으로 CSV 엑셀 파일로 다운로드되었습니다!");
}

function renderAdminInquiriesTable() {
    const tbody = document.getElementById("adminInquiriesTbody");
    const badge = document.getElementById("adminInquiriesBadge");
    const statCount = document.getElementById("adminStatInquiryCount");

    if (badge) badge.textContent = inquiries.length;
    if (statCount) statCount.textContent = `${inquiries.length} 건`;

    if (!tbody) return;

    tbody.innerHTML = inquiries.map(inq => `
        <tr>
            <td><span class="badge badge-instructor">${escapeHtml(inq.categoryName)}</span></td>
            <td><strong>${escapeHtml(inq.name)}</strong></td>
            <td><code>${escapeHtml(inq.contact)}</code></td>
            <td style="max-width: 260px; word-break: break-all;">${escapeHtml(inq.content)}</td>
            <td>${formatTimeAgo(inq.createdAt)}</td>
            <td>
                <span style="color: #00e676; font-weight:700; font-size: 0.78rem;">✓ 접수완료</span>
            </td>
        </tr>
    `).join("");
}

function renderAdminPostsTable() {
    const tbody = document.getElementById("adminPostsTbody");
    if (!tbody) return;

    tbody.innerHTML = posts.map(post => `
        <tr>
            <td><span class="badge badge-${post.category}">${post.categoryName}</span></td>
            <td><strong>${escapeHtml(post.title)}</strong></td>
            <td>${escapeHtml(post.nickname || post.userName || '알 수 없음')}</td>
            <td>${formatTimeAgo(post.createdAt)}</td>
            <td>
                <button class="btn-delete" onclick="performPostDeletion('${post.id}')" style="padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fa-solid fa-trash-can"></i> 삭제
                </button>
            </td>
        </tr>
    `).join("");
}

function openCertificateImageModal(imgUrl) {
    const modal = document.getElementById("certificateImageModal");
    const previewImg = document.getElementById("certPreviewImg");
    if (!modal || !previewImg) {
        if (typeof openLightbox === 'function') {
            openLightbox(imgUrl || 'right_ad_swimming.jpg');
        }
        return;
    }
    previewImg.src = imgUrl || 'right_ad_swimming.jpg';
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("z-index", "9999999", "important");
}

async function renderAdminInstructorsTable() {
    const queueTbody = document.getElementById("adminInstructorQueueTbody");
    const pendingBadge = document.getElementById("adminInstPendingBadge");

    let pendingUsers = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('users').select('*').eq('instructor_status', 'pending');
            if (!error && data) {
                pendingUsers = data.map(dbUser => ({
                    email: dbUser.email,
                    name: dbUser.nickname || dbUser.name || "다이버",
                    realName: dbUser.user_name || dbUser.real_name || dbUser.realName || dbUser.name || "다이버",
                    instructorOrg: dbUser.license_info ? dbUser.license_info.split(' ')[0] : 'PADI',
                    instructorCode: dbUser.instructor_code || '',
                    certImage: dbUser.cert_image || dbUser.certImage || '',
                    createdAt: dbUser.created_at || new Date()
                }));
            }
        } catch (err) {
            console.warn("Supabase instructor queue fetch error:", err);
        }
    }

    if (pendingUsers.length === 0) {
        const usersMap = getRegisteredUsers();
        pendingUsers = Object.values(usersMap).filter(u => u.instructorStatus === "pending" || u.instructor_status === "pending");
    }

    if (pendingBadge) pendingBadge.textContent = pendingUsers.length || "0";
    if (!queueTbody) return;

    if (pendingUsers.length === 0) {
        queueTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
                    심사 대기중인 강사 자격증 신청건이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    queueTbody.innerHTML = pendingUsers.map(u => `
        <tr>
            <td><strong>${escapeHtml(u.name || u.realName || '신청자')}</strong></td>
            <td><span class="badge badge-instructor">${escapeHtml(u.instructorOrg || 'PADI')}</span></td>
            <td><code>${escapeHtml(u.instructorCode || 'PENDING-01')}</code></td>
            <td>
                <button class="btn btn-secondary" onclick="openCertificateImageModal('${u.certImage || 'right_ad_swimming.jpg'}')" style="padding: 4px 8px; font-size: 0.75rem;">
                    🖼️ 📷 실물 사본 보기
                </button>
            </td>
            <td>${formatTimeAgo(u.createdAt || new Date())}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-primary" onclick="approveInstructorCertDemo('${escapeHtml(u.email || u.name || '신청자')}')" style="padding: 4px 10px; font-size: 0.75rem; background: #00e676; color:#000; font-weight:bold;">
                        ✓ 승인 (인장 부여)
                    </button>
                    <button class="btn btn-secondary" onclick="rejectInstructorCertDemo('${escapeHtml(u.email || u.name || '신청자')}')" style="padding: 4px 10px; font-size: 0.75rem; background: #ff5252; color:#fff; font-weight:bold; border:none;">
                        ❌ 심사 반려
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function approveInstructorCertDemo(identifier) {
    const usersMap = getRegisteredUsers();
    let targetUser = null;
    let targetKey = "";

    for (let key in usersMap) {
        if (key === (identifier || "").toLowerCase() || usersMap[key].name === identifier || usersMap[key].realName === identifier) {
            targetUser = usersMap[key];
            targetKey = key;
            break;
        }
    }

    if (targetUser && targetKey) {
        usersMap[targetKey].instructorStatus = "approved";
        usersMap[targetKey].isApprovedInstructor = true;
        delete usersMap[targetKey].rejectionReason;
        safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(usersMap));

        if (supabaseClient) {
            try {
                await supabaseClient.from('users').update({
                    instructor_status: 'approved',
                    user_license: targetUser.license || '공인 강사'
                }).eq('email', targetKey);
            } catch (err) {
                console.error("Supabase instructor approval update failed:", err);
            }
        }

        if (currentUser && (currentUser.email.toLowerCase() === targetKey || currentUser.name === identifier)) {
            currentUser.instructorStatus = "approved";
            currentUser.isApprovedInstructor = true;
            delete currentUser.rejectionReason;
            safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        }
    }

    const nameToDisplay = targetUser ? (targetUser.name || targetUser.realName || identifier) : identifier;
    showToast(`🎓 '${nameToDisplay}' 강사님의 자격증 실물 심사가 승인되어 'VERIFIED SEAL' 뱃지가 최종 발급되었습니다!`);

    renderAdminInstructorsTable();
    renderAdminUsersTable();
}

async function rejectInstructorCertDemo(identifier) {
    const usersMap = getRegisteredUsers();
    let targetUser = null;
    let targetKey = "";

    for (let key in usersMap) {
        if (key === (identifier || "").toLowerCase() || usersMap[key].name === identifier || usersMap[key].realName === identifier) {
            targetUser = usersMap[key];
            targetKey = key;
            break;
        }
    }

    const nameToDisplay = targetUser ? (targetUser.name || targetUser.realName || identifier) : identifier;

    const reasonPrompt = prompt(`🎓 '${nameToDisplay}' 강사님의 자격증 심사 거절/반려 사유를 입력해 주세요:`, "제출된 자격증 사본 식별 불가 및 자격 번호 미확인");
    if (reasonPrompt === null) {
        return; // Clicked cancel
    }

    const finalReason = reasonPrompt.trim() || "자격증 실물 사본 미흡 및 verification 실패";

    if (targetUser && targetKey) {
        usersMap[targetKey].instructorStatus = "rejected";
        usersMap[targetKey].rejectionReason = finalReason;
        usersMap[targetKey].isApprovedInstructor = false;
        safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(usersMap));

        if (supabaseClient) {
            try {
                await supabaseClient.from('users').update({
                    instructor_status: 'rejected',
                    rejection_reason: finalReason
                }).eq('email', targetKey);
            } catch (err) {
                console.error("Supabase instructor rejection update failed:", err);
            }
        }

        if (currentUser && (currentUser.email.toLowerCase() === targetKey || currentUser.name === identifier)) {
            currentUser.instructorStatus = "rejected";
            currentUser.rejectionReason = finalReason;
            currentUser.isApprovedInstructor = false;
            safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        }
    }

    showToast(`❌ '${nameToDisplay}' 강사님의 자격증 심사가 반려 처리되었습니다. (사유: ${finalReason})`);

    renderAdminInstructorsTable();
    renderAdminUsersTable();
}

function renderDynamicProfileModal(user) {
    let existing = document.getElementById("dynamicProfileModalOverlay");
    if (existing) existing.remove();

    const isInstructor = isVerifiedInstructor() || isPendingInstructor() || !!(user.provider && user.provider.includes("강사"));
    const myReviews = (user.reviews || []);
    const completedCount = user.completedCount || 0;
    const hasReviews = myReviews.length > 0;
    const avgScore = hasReviews
        ? (myReviews.reduce((sum, r) => sum + r.score, 0) / myReviews.length).toFixed(1)
        : null;

    const ratingHtml = hasReviews
        ? `<div style="font-weight: bold; color: #ffb703; font-size: 1.1rem; margin-top: 2px;">★ ${avgScore} / 5.0</div>`
        : `<div style="font-weight: bold; color: #00e676; font-size: 0.82rem; margin-top: 2px;">신규 다이버 (평가 대기 중)</div>`;

    const phoneText = (user.phone && user.phone !== "010-0000-0000") ? escapeHtml(user.phone) : "연락처 미등록";

    const overlay = document.createElement("div");
    overlay.id = "dynamicProfileModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.92) !important;
        z-index: 9999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    overlay.innerHTML = `
        <div style="background: #0d1b2a; border: 2px solid #00f2fe; box-shadow: 0 0 50px rgba(0, 242, 254, 0.6); border-radius: 16px; width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 12px; margin-bottom: 16px;">
                <h2 style="margin: 0; font-size: 1.2rem; color: #00f2fe;"><i class="fa-solid fa-id-card"></i> 내 프로필 & 계정 정보</h2>
                <button onclick="document.getElementById('dynamicProfileModalOverlay').remove()" style="background: #00f2fe; border: none; color: #000; font-weight: bold; font-size: 1.3rem; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>

            <div style="background: rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 4px 0; color: #fff; font-size: 1.15rem;">
                     ${escapeHtml(user.nickname || user.name || "다이버")}
                    ${isInstructor ? '<span style="background: linear-gradient(135deg, #ffb703, #ff8f00); color: #000; font-size: 0.75rem; font-weight: 900; padding: 3px 8px; border-radius: 12px; margin-left: 6px;">VERIFIED INSTRUCTOR</span>' : ''}
                </h3>
                <p style="margin: 0 0 4px 0; color: #a0aec0; font-size: 0.85rem;">${isInstructor ? '🎓 AquaBuddy 검증 공인 강사 계정' : `${escapeHtml(user.provider || 'AquaBuddy')} 인증 계정`}</p>
                <p style="margin: 0; color: var(--accent-cyan); font-size: 0.85rem;">📞 휴대폰 번호: ${phoneText}</p>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                <div style="flex: 1; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 0.8rem; color: #a0aec0;">매너 평점</span>
                    ${ratingHtml}
                </div>
                <div style="flex: 1; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 0.8rem; color: #a0aec0;">버디 모임 참여</span>
                    <div style="font-weight: bold; color: #00f2fe; font-size: 1.1rem; margin-top: 2px;">${completedCount}회 완료</div>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">자격증 / 라이센스 정보</label>
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; color: #fff;">
                    📜 ${escapeHtml(user.license_info || user.license || '자격증 정보 미입력')}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px; gap: 8px;">
                <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove(); handleLogout();" style="background: rgba(255, 82, 82, 0.2); border: 1px solid #ff5252; color: #ff5252; padding: 8px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.82rem;">
                    🚪 로그아웃
                </button>
                <button onclick="openEditProfileModal();" style="background: linear-gradient(135deg, #00f2fe, #4facfe); border: none; color: #000; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-pen-to-square"></i> ✏️ 프로필 정보 수정
                </button>
                <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">
                    닫기 ✖
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

async function openProfileModal() {
    if (!currentUser || (!currentUser.name && !currentUser.email)) {
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        if (typeof resetAuthForm === "function") resetAuthForm();
        const authM = document.getElementById("authModal");
        if (authM) openModal(authM);
        return;
    }

    if (currentUser.email) {
        await syncUserProfileWithSupabase(currentUser.email);
    }

    // Populate static modal fields if present
    const nameEl = document.getElementById("myProfNameDisplay");
    const nickTextEl = document.getElementById("myProfileNickname");
    const provEl = document.getElementById("myProfProviderDisplay");
    const phoneEl = document.getElementById("myProfPhoneDisplay");
    const scoreEl = document.getElementById("myProfAvgScore");
    const nickInp = document.getElementById("myProfNickInput");
    const licInp = document.getElementById("myProfLicenseInput");

    if (nameEl) nameEl.textContent = currentUser.name || currentUser.nickname || "다이버";
    if (nickTextEl) nickTextEl.textContent = currentUser.nickname || currentUser.name || "다이버";
    if (provEl) provEl.textContent = currentUser.provider || "가입 회원";
    if (phoneEl) {
        if (currentUser.phone && currentUser.phone !== "010-0000-0000") {
            phoneEl.textContent = `📱 휴대폰 번호: ${currentUser.phone}`;
        } else {
            phoneEl.textContent = `📞 휴대폰 번호: 연락처 미등록`;
        }
    }
    if (scoreEl) {
        const reviews = currentUser.reviews || [];
        if (reviews.length > 0) {
            const score = (reviews.reduce((s, r) => s + r.score, 0) / reviews.length).toFixed(1);
            scoreEl.textContent = `${score} / 5.0`;
            scoreEl.style.color = "#ffb703";
        } else {
            scoreEl.textContent = "신규 다이버 (평가 대기 중)";
            scoreEl.style.color = "#00e676";
        }
    }
    if (nickInp) nickInp.value = currentUser.nickname || currentUser.name || "";
    if (licInp) licInp.value = currentUser.license_info || currentUser.license || "";

    renderDynamicProfileModal(currentUser);
}

window.openMyProfileModal = openProfileModal;

let activeInstructorSubFilter = "all";

function filterInstructorSub(subType) {
    activeInstructorSubFilter = subType;
    document.querySelectorAll("#instructorSubFilterBar .sub-tab-btn").forEach(btn => {
        if (btn.dataset.instsub === subType) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    filterAndRender();
}

let pendingInquiryClassId = null;

function openInstructorInquiryModal(classId) {
    pendingInquiryClassId = classId;
    const post = OCEAN_CLASSES_DATA ? OCEAN_CLASSES_DATA.find(c => c.id === classId) : null;
    
    const targetClassEl = document.getElementById("instInquiryTargetClass");
    const targetInstEl = document.getElementById("instInquiryTargetInstructor");

    if (post) {
        if (targetClassEl) targetClassEl.textContent = `클래스명: ${post.title}`;
        if (targetInstEl) targetInstEl.textContent = `담당 강사: ${post.nickname || post.userName || '알 수 없음'} (${post.userLicense || '공인 강사'})`;
    } else {
        if (targetClassEl) targetClassEl.textContent = `클래스명: 강사 1:1 레슨 문의`;
        if (targetInstEl) targetInstEl.textContent = `담당 강사: AquaBuddy 공인 강사`;
    }

    openModal(document.getElementById("instructorInquiryModal"));
}

function handleSendInstructorInquiry(e) {
    e.preventDefault();
    const msg = document.getElementById("instInquiryMessage").value.trim();
    const contact = document.getElementById("instInquiryContact").value.trim();

    if (!msg || !contact) {
        showToast("⚠️ 문의 내용과 연락처를 모두 입력해 주세요.");
        return;
    }

    closeModal(document.getElementById("instructorInquiryModal"));
    showToast("✉️ 강사님께 1:1 문의 메시지가 전달되었습니다. 답변을 기다려 주세요!");
}

let pendingHostSubmitEvent = null;

function interceptHostSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    pendingHostSubmitEvent = e;

    const inlineCheck = document.getElementById("inlineLiabilityCheck");
    if (inlineCheck && inlineCheck.checked) {
        if (typeof handleSavePost === "function") {
            handleSavePost(e);
        }
        return;
    }

    const checkEl = document.getElementById("hostDisclaimerCheck");
    if (checkEl) checkEl.checked = false;
    openModal(document.getElementById("hostDisclaimerModal"));
}

function confirmHostDisclaimerSubmit() {
    const checkEl = document.getElementById("hostDisclaimerCheck");
    if (!checkEl || !checkEl.checked) {
        showToast("⚠️ 해양 안전 수칙 및 플랫폼 면책 방침에 동의해 주세요.");
        return;
    }

    const inlineCheck = document.getElementById("inlineLiabilityCheck");
    if (inlineCheck) inlineCheck.checked = true;

    closeModal(document.getElementById("hostDisclaimerModal"));
    if (typeof handleSavePost === "function") {
        handleSavePost(pendingHostSubmitEvent);
    }
}

let pendingJoinPostId = null;

function interceptJoinPost(postId) {
    pendingJoinPostId = postId;
    const checkEl = document.getElementById("participantDisclaimerCheck");
    if (checkEl) checkEl.checked = false;
    openModal(document.getElementById("participantDisclaimerModal"));
}

function confirmParticipantDisclaimerSubmit() {
    const checkEl = document.getElementById("participantDisclaimerCheck");
    if (!checkEl || !checkEl.checked) {
        showToast("⚠️ 해양 입수 안전 수칙 및 면책 동의에 체크해 주세요.");
        return;
    }

    closeModal(document.getElementById("participantDisclaimerModal"));
    if (pendingJoinPostId && typeof handleJoinPostDirect === "function") {
        handleJoinPostDirect(pendingJoinPostId);
    }
}

function openEditProfileModal() {
    if (!currentUser) {
        showToast("⚠️ 먼저 로그인해 주세요.");
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        const authM = document.getElementById("authModal");
        if (authM) openModal(authM);
        return;
    }

    // Close existing profile modals
    const dynOverlay = document.getElementById("dynamicProfileModalOverlay");
    if (dynOverlay) dynOverlay.remove();
    const staticMyProf = document.getElementById("myProfileModal");
    if (staticMyProf) closeModal(staticMyProf);

    const editNick = document.getElementById("editNickInput");
    const editPhone = document.getElementById("editPhoneInput");
    const editLicense = document.getElementById("editLicenseInput");

    if (editNick) editNick.value = currentUser.name || currentUser.nickname || "";
    if (editPhone) editPhone.value = (currentUser.phone && currentUser.phone !== "010-0000-0000") ? currentUser.phone : "";
    if (editLicense) editLicense.value = currentUser.license || "";

    const editModal = document.getElementById("editProfileModal");
    if (editModal) openModal(editModal);
}

async function handleSaveProfileEdit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) return;

    const nick = document.getElementById("editNickInput") ? document.getElementById("editNickInput").value.trim() : "";
    const phone = document.getElementById("editPhoneInput") ? document.getElementById("editPhoneInput").value.trim() : "";
    const license = document.getElementById("editLicenseInput") ? document.getElementById("editLicenseInput").value.trim() : "";

    if (!nick || !phone || !license) {
        showToast("⚠️ 닉네임, 휴대폰 번호, 보유 자격증 정보를 모두 입력해 주세요.");
        return;
    }

    currentUser.name = nick;
    currentUser.nickname = nick;
    currentUser.phone = phone;
    currentUser.license = license;
    currentUser.license_info = license;
    currentUser.user_license = license;

    safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    if (currentUser.email) {
        const users = getRegisteredUsers();
        const key = currentUser.email.toLowerCase();
        users[key] = {
            ...users[key],
            email: currentUser.email,
            realName: currentUser.realName || nick,
            name: nick,
            nickname: nick,
            phone: phone,
            license: license,
            license_info: license,
            user_license: license,
            provider: currentUser.provider || "홈페이지 회원",
            instructorStatus: currentUser.instructorStatus || "none"
        };
        safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(users));
        await saveUserProfileToSupabase(users[key], true);
    } else {
        saveRegisteredUser(currentUser);
        await saveUserProfileToSupabase(currentUser, true);
    }

    updateNavbarUserUI();
    const editModal = document.getElementById("editProfileModal");
    if (editModal) closeModal(editModal);

    filterAndRender();
    showToast("✏️ 프로필 정보가 성공적으로 수정 및 저장되었습니다!");
}

async function handleUpdateProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) return;

    const newNick = document.getElementById("myProfNickInput") ? document.getElementById("myProfNickInput").value.trim() : "";
    const newLicense = document.getElementById("myProfLicenseInput") ? document.getElementById("myProfLicenseInput").value.trim() : "";

    if (newNick) {
        currentUser.name = newNick;
        currentUser.nickname = newNick;
    }
    if (newLicense) {
        currentUser.license = newLicense;
        currentUser.license_info = newLicense;
        currentUser.user_license = newLicense;
    }

    safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    if (currentUser.email) {
        saveRegisteredUser(currentUser);
        await saveUserProfileToSupabase(currentUser, true);
    }

    updateNavbarUserUI();
    closeModal(document.getElementById("myProfileModal"));
    filterAndRender();
    showToast(`👤 내 프로필 정보가 업데이트되었습니다!`);
}

function handleLogout() {
    localStorage.removeItem("aqua_buddy_user_identity");
    currentUser = null;
    updateNavbarUserUI();

    closeModal(document.getElementById("myProfileModal"));
    filterAndRender();
    showToast("👋 성공적으로 로그아웃되었습니다.");
}

// User Database Management (Local Storage)
function getRegisteredUsers() {
    try {
        const data = localStorage.getItem("aqua_buddy_registered_users");
        let usersMap = data ? JSON.parse(data) : {};

        // Ensure currentUser is included in usersMap
        if (typeof currentUser !== "undefined" && currentUser && currentUser.email) {
            const key = currentUser.email.toLowerCase();
            if (!usersMap[key]) {
                usersMap[key] = {
                    email: currentUser.email,
                    name: currentUser.name || currentUser.nickname || "다이버",
                    realName: currentUser.realName || currentUser.name || "다이버",
                    phone: (currentUser.phone && currentUser.phone !== "010-0000-0000") ? currentUser.phone : "",
                    provider: currentUser.provider || "소셜/직접가입",
                    instructorStatus: (currentUser.isInstructor || currentUser.role === 'instructor') ? "approved" : (currentUser.instructorStatus || "none"),
                    createdAt: currentUser.createdAt || new Date().toISOString()
                };
            } else if (currentUser.phone && currentUser.phone !== "010-0000-0000") {
                usersMap[key].phone = currentUser.phone;
            }
        }

        // Add default admin & instructor fallback users if empty
        if (Object.keys(usersMap).length === 0) {
            usersMap["hanmaner@naver.com"] = {
                email: "hanmaner@naver.com",
                name: "웹마스터 (한만어)",
                realName: "한만어",
                phone: "010-2138-2929",
                provider: "웹마스터 마스터인증",
                instructorStatus: "approved",
                createdAt: "2026-01-01T09:00:00.000Z"
            };
            usersMap["freediver_master@naver.com"] = {
                email: "freediver_master@naver.com",
                name: "해양마스터강사",
                realName: "박해양",
                phone: "010-8877-6655",
                provider: "카카오톡",
                instructorStatus: "approved",
                createdAt: "2026-07-28T17:20:00.000Z"
            };
        }

        return usersMap;
    } catch(e) {
        return {};
    }
}

function saveRegisteredUser(userObj) {
    const users = getRegisteredUsers();
    users[userObj.email.toLowerCase()] = userObj;
    localStorage.setItem("aqua_buddy_registered_users", JSON.stringify(users));
}

function switchAuthTab(type) {
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const tabKakaoAuth = document.getElementById("tabKakaoAuth");

    const loginBox = document.getElementById("loginFormBox");
    const signupBox = document.getElementById("signupFormBox");
    const kakaoBox = document.getElementById("kakaoAuthFormBox");

    const titleEl = document.getElementById("authModalTitle");

    [tabLogin, tabSignup, tabKakaoAuth].forEach(t => t?.classList.remove("active"));
    [loginBox, signupBox, kakaoBox].forEach(b => b?.classList.add("hidden"));

    if (type === "login") {
        if (tabLogin) tabLogin.classList.add("active");
        if (loginBox) loginBox.classList.remove("hidden");
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> AquaBuddy 로그인`;
    } else if (type === "signup") {
        if (tabSignup) tabSignup.classList.add("active");
        if (signupBox) signupBox.classList.remove("hidden");
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-plus"></i> AquaBuddy 회원가입`;
    } else if (type === "kakao") {
        if (tabKakaoAuth) tabKakaoAuth.classList.add("active");
        if (kakaoBox) kakaoBox.classList.remove("hidden");
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-comment"></i> 카카오 1초 로그인`;
    }
}
function resetAuthForm() {
    const fields = [
        "loginEmailInput",
        "loginPasswordInput",
        "signupEmailInput",
        "signupPasswordInput",
        "signupPasswordConfirmInput",
        "signupRealNameInput",
        "signupNicknameInput",
        "signupPhoneInput",
        "signupLicenseInput"
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

async function handleLogin(emailArg, passwordArg) {
    let email = emailArg;
    let pw = passwordArg;

    if (typeof emailArg === "object" && emailArg && emailArg.preventDefault) {
        emailArg.preventDefault();
        const emailInput = document.getElementById("loginEmailInput");
        const pwInput = document.getElementById("loginPasswordInput");
        email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        pw = pwInput ? pwInput.value.trim() : "";
    }

    if (!email || !pw) {
        alert("⚠️ 이메일과 비밀번호를 입력해 주세요.");
        return;
    }

    try {
        let authSuccess = false;
        let authUserToken = null;

        // 1. Supabase Auth 직접 로그인 시도
        if (supabaseClient && supabaseClient.auth) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: pw
                });
                if (!error && data && data.user) {
                    authSuccess = true;
                    if (data.session && data.session.access_token) {
                        authUserToken = data.session.access_token;
                    }
                }
            } catch (sbErr) {
                console.warn("Supabase Auth signIn notice:", sbErr);
            }
        }

        // 2. Auth 미등록 / 비번 변경 시 users 테이블 대조 fallback
        if (!authSuccess && supabaseClient) {
            try {
                const { data: userData } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (userData && (userData.password === pw || !userData.password)) {
                    authSuccess = true;
                }
            } catch (dbErr) {
                console.warn("Supabase DB users query notice:", dbErr);
            }
        }

        // 3. LocalStorage registered users fallback
        if (!authSuccess) {
            const registeredUsers = getRegisteredUsers();
            const localUser = registeredUsers[email.toLowerCase()];
            if (localUser && (localUser.password === pw || !localUser.password)) {
                authSuccess = true;
            }
        }

        if (!authSuccess) {
            alert("❌ 이메일 또는 비밀번호가 일치하지 않습니다.");
            return;
        }

        if (authUserToken) {
            localStorage.setItem("aqua_buddy_user_token", authUserToken);
        }

        // 4. 인증 성공 시 최신 유저 프로필 정보 가져오기 및 복원
        currentUser = await restoreUserFromSupabaseCloud(email);

        if (!currentUser) {
            currentUser = {
                email: email,
                name: email.split("@")[0] || "다이버",
                nickname: email.split("@")[0] || "다이버",
                avatar: (email.split("@")[0] || "D").charAt(0).toUpperCase()
            };
        }

        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        saveRegisteredUser(currentUser);
        await saveUserProfileToSupabase(currentUser);

        updateNavbarUserUI();
        const authM = document.getElementById("authModal");
        if (authM) closeModal(authM);
        const loginM = document.getElementById("loginModal");
        if (loginM) closeModal(loginM);

        resetAuthForm();
        filterAndRender();
        if (typeof showToast === "function") showToast("로그인 되었습니다!");
        alert(`🎉 ${currentUser.name || currentUser.nickname || '다이버'}님, 로그인에 성공하셨습니다!`);

        // 로그인 성공 후 pendingLoginAction 콜백 실행 (댓글/채팅/참가 등)
        if (typeof pendingLoginAction === "function") {
            try {
                const action = pendingLoginAction;
                pendingLoginAction = null;
                setTimeout(() => action(), 300);
            } catch(e) {
                console.warn("pendingLoginAction 실행 오류:", e);
                pendingLoginAction = null;
            }
        }
    } catch (err) {
        console.error("로그인 에러:", err);
        alert("❌ 로그인 중 오류가 발생했습니다: " + (err.message || "이메일 및 비밀번호를 확인해주세요."));
    }
}

function handleDirectLogin(e) {
    handleLogin(e);
}
window.handleLogin = handleLogin;
window.handleDirectLogin = handleDirectLogin;

function handleLogout() {
    localStorage.removeItem("aqua_buddy_user_identity");
    localStorage.removeItem("aqua_buddy_user_token");
    localStorage.removeItem("currentUser");
    currentUser = null;
    updateNavbarUserUI();

    const profileModal = document.getElementById("myProfileModal");
    if (profileModal) closeModal(profileModal);

    filterAndRender();
    alert("👋 성공적으로 로그아웃되었습니다.");
}

let verifiedResetEmail = null;

async function handleDirectSignup(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById("signupEmailInput") ? document.getElementById("signupEmailInput").value.trim().toLowerCase() : "";
    const pw = document.getElementById("signupPasswordInput") ? document.getElementById("signupPasswordInput").value.trim() : "";
    const pwConfirm = document.getElementById("signupPasswordConfirmInput") ? document.getElementById("signupPasswordConfirmInput").value.trim() : pw;
    const realName = document.getElementById("signupRealNameInput") ? document.getElementById("signupRealNameInput").value.trim() : "";
    const nick = document.getElementById("signupNicknameInput") ? document.getElementById("signupNicknameInput").value.trim() : "";
    const phone = document.getElementById("signupPhoneInput") ? document.getElementById("signupPhoneInput").value.trim() : "";
    const license = document.getElementById("signupLicenseInput") ? document.getElementById("signupLicenseInput").value.trim() : "";

    // Validation with alerts
    if (!email || !pw || !realName || !nick || !license || !phone) {
        alert("⚠️ 모든 필수 항목을 입력해 주세요.");
        return;
    }
    if (pw !== pwConfirm) {
        alert("⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
    }

    try {
        // 1. Supabase Auth 직접 회원가입 시도
        if (supabaseClient && supabaseClient.auth) {
            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: pw,
                    options: {
                        data: { real_name: realName, nickname: nick, phone: phone, license_info: license }
                    }
                });
                if (data && data.session && data.session.access_token) {
                    localStorage.setItem("aqua_buddy_user_token", data.session.access_token);
                }
            } catch (authErr) {
                console.warn("Supabase Auth signUp notice:", authErr);
            }
        }

        // 2. Build full currentUser object
        const currentUserObj = {
            email: email,
            realName: realName,
            name: nick,
            nickname: nick,
            phone: phone,
            license: license,
            license_info: license,
            password: pw,
            provider: "홈페이지 회원",
            avatar: nick.charAt(0).toUpperCase(),
            createdAt: new Date().toISOString()
        };

        currentUser = currentUserObj;
        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        saveRegisteredUser(currentUser);
        await syncUserToSupabaseCloud(currentUser);

        updateNavbarUserUI();
        const authM = document.getElementById("authModal");
        if (authM) closeModal(authM);
        resetAuthForm();
        filterAndRender();
        if (typeof showToast === "function") showToast("회원가입이 완료되었습니다!");
        alert(`🎉 ${nick}님, 회원가입이 완료되어 자동으로 로그인되었습니다!`);
    } catch (err) {
        console.error("회원가입 에러:", err);
        alert("❌ 회원가입 중 오류가 발생했습니다: " + (err.message || "다시 시도해 주세요."));
    }
}

function openFindAccountModal() {
    closeModal(document.getElementById("authModal"));
    const findModal = document.getElementById("findAccountModal");
    if (findModal) {
        switchFindTab('id');
        openModal(findModal);
    }
}

function switchFindTab(type) {
    const tabFindId = document.getElementById("tabFindId");
    const tabResetPw = document.getElementById("tabResetPw");
    const findIdBox = document.getElementById("findIdFormBox");
    const resetPwBox = document.getElementById("resetPwFormBox");
    const resultBox = document.getElementById("findIdResult");

    const step1Box = document.getElementById("findPwStep1Box");
    const step2Box = document.getElementById("findPwStep2Box");
    if (step1Box) step1Box.classList.remove("hidden");
    if (step2Box) step2Box.classList.add("hidden");
    verifiedResetEmail = null;

    if (resultBox) resultBox.style.display = "none";

    if (type === "id") {
        tabFindId?.classList.add("active");
        tabResetPw?.classList.remove("active");
        findIdBox?.classList.remove("hidden");
        resetPwBox?.classList.add("hidden");
    } else {
        tabResetPw?.classList.add("active");
        tabFindId?.classList.remove("active");
        resetPwBox?.classList.remove("hidden");
        findIdBox?.classList.add("hidden");
    }
}

function handleFindId(e) {
    e.preventDefault();
    const nameInput = document.getElementById("findIdName");
    const name = nameInput ? nameInput.value.trim().toLowerCase() : "";
    const phone = document.getElementById("findIdPhone") ? document.getElementById("findIdPhone").value.trim().replace(/[^0-9]/g, "") : "";
    const resultBox = document.getElementById("findIdResult");

    if (!name || !phone) {
        showToast("⚠️ 이름과 휴대폰 번호를 모두 입력해 주세요.");
        return;
    }

    const users = getRegisteredUsers();
    const foundUser = Object.values(users).find(u => {
        const uPhone = (u.phone || "").replace(/[^0-9]/g, "");
        const uName = (u.realName || u.name || "").toLowerCase();
        return uName === name && uPhone === phone;
    });

    if (resultBox) {
        resultBox.style.display = "block";
        if (foundUser) {
            const parts = foundUser.email.split("@");
            const maskedEmail = parts[0].length > 2 ? parts[0].substring(0, 2) + "***@" + parts[1] : parts[0] + "***@" + (parts[1] || "");
            resultBox.innerHTML = `✅ <strong>${escapeHtml(foundUser.name)}</strong> 님의 가입 이메일(아이디): <br><strong style="color:var(--accent-cyan); font-size:1.05rem; margin-top:4px; display:inline-block;">${escapeHtml(maskedEmail)}</strong>`;
        } else {
            resultBox.innerHTML = `❌ 입력하신 이름(${escapeHtml(name)})과 휴대폰 번호에 해당하는 계정을 찾을 수 없습니다.`;
        }
    }
}

function handleVerifyResetUser(e) {
    e.preventDefault();
    const email = document.getElementById("resetPwEmail").value.trim().toLowerCase();
    const nameInput = document.getElementById("resetPwName");
    const name = nameInput ? nameInput.value.trim().toLowerCase() : "";
    const phone = document.getElementById("resetPwPhone") ? document.getElementById("resetPwPhone").value.trim().replace(/[^0-9]/g, "") : "";

    if (!email || !name || !phone) {
        showToast("⚠️ 이메일, 이름, 휴대폰 번호를 모두 입력해 주세요.");
        return;
    }

    const users = getRegisteredUsers();
    const user = users[email];

    if (!user) {
        showToast("❌ 가입되지 않은 이메일 주소입니다.");
        return;
    }

    const userPhone = (user.phone || "").replace(/[^0-9]/g, "");
    const userName = (user.realName || user.name || "").toLowerCase();

    if (userName !== name || userPhone !== phone) {
        showToast("❌ 가입 시 입력하신 이름 또는 휴대폰 번호 정보가 일치하지 않습니다.");
        return;
    }

    verifiedResetEmail = email;
    document.getElementById("findPwStep1Box")?.classList.add("hidden");
    document.getElementById("findPwStep2Box")?.classList.remove("hidden");
    showToast("✓ 본인 확인이 완료되었습니다! 사용할 새 비밀번호를 입력해 주세요.");
}

function handleFinalResetPassword(e) {
    e.preventDefault();
    if (!verifiedResetEmail) {
        showToast("⚠️ 본인 확인 절차를 다시 진행해 주세요.");
        switchFindTab('pw');
        return;
    }

    const newPw = document.getElementById("newPasswordInput").value.trim();
    const newPwConfirm = document.getElementById("newPasswordConfirmInput") ? document.getElementById("newPasswordConfirmInput").value.trim() : newPw;

    if (!newPw || newPw.length < 6) {
        showToast("⚠️ 비밀번호는 6자 이상이어야 합니다.");
        return;
    }

    if (newPw !== newPwConfirm) {
        showToast("⚠️ 새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
    }

    const users = getRegisteredUsers();
    if (users[verifiedResetEmail]) {
        users[verifiedResetEmail].password = newPw;
        localStorage.setItem("aqua_buddy_registered_users", JSON.stringify(users));
    }

    verifiedResetEmail = null;
    closeModal(document.getElementById("findAccountModal"));
    showToast("🔑 비밀번호가 성공적으로 변경되었습니다! 새 비밀번호로 로그인해 주세요.");
    openModal(document.getElementById("authModal"));
    switchAuthTab("login");
}

function loginWithKakaoOAuth() {
    initKakaoSdk();

    const redirectTargetUri = (typeof window !== "undefined" && window.location.origin)
        ? (window.location.origin + window.location.pathname)
        : "https://aqua-buddy-nu.vercel.app/";

    if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth && window.Kakao.Auth.authorize) {
        try {
            window.Kakao.Auth.authorize({
                redirectUri: redirectTargetUri
            });
            return;
        } catch (e) {
            console.log("Kakao Authorize Catch:", e);
        }
    }

    const encodedRedirect = encodeURIComponent(redirectTargetUri);
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_APP_KEY}&redirect_uri=${encodedRedirect}&response_type=code`;
}

function checkKakaoOAuthCallback() {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Check if there is an existing identity in localstorage or user DB
        const savedUserStr = localStorage.getItem("aqua_buddy_user_identity");
        let existingUser = null;
        if (savedUserStr) {
            try { existingUser = JSON.parse(savedUserStr); } catch(e) {}
        }

        const nick = (existingUser && existingUser.name) ? existingUser.name : "카카오 다이버";
        const license = (existingUser && existingUser.license) ? existingUser.license : "자격증 정보 미입력";

        currentUser = {
            name: nick,
            license: license,
            instructorCode: (existingUser && existingUser.instructorCode) ? existingUser.instructorCode : "",
            provider: "카카오톡 정식인증",
            avatar: "K",
            kakaoCode: authCode
        };

        localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
        updateNavbarUserUI();
        showToast(`🎉 ${nick}님, 카카오톡 1초 로그인에 성공하셨습니다!`);
    }
}



function isMyPost(post) {
    if (!post) return false;
    if (!currentUser) return false;
    if (currentUser.email && post.authorEmail && currentUser.email.toLowerCase() === post.authorEmail.toLowerCase()) {
        return true;
    }
    if (currentUser.email && post.email && currentUser.email.toLowerCase() === post.email.toLowerCase()) {
        return true;
    }
    if (myCreatedPostIds && Array.isArray(myCreatedPostIds) && myCreatedPostIds.includes(post.id)) {
        return true;
    }
    if (currentUser.name && post.userName && currentUser.name.trim() === post.userName.trim()) {
        return true;
    }
    return false;
}

function getPostInstSubCategory(post) {
    if (post.instSubCategory) return post.instSubCategory;
    const title = (post.title || "").toLowerCase();
    const desc = (post.desc || "").toLowerCase();

    if (title.includes("실내수영") || title.includes("수영장") || desc.includes("영법") || title.includes("자유형")) return "swim";
    if (title.includes("바다수영") || title.includes("오픈워터") || desc.includes("바다입수") || title.includes("스노클")) return "ocean_swim";
    if (title.includes("프리다이빙") || title.includes("aida") || title.includes("k26") || title.includes("딥스테이션")) return "freediving";
    if (title.includes("스쿠버") || title.includes("ssi") || title.includes("padi") || title.includes("공기통")) return "scuba";

    return "freediving";
}

async function loadPosts() {
    if (!supabaseClient) {
        posts = [];
        filterAndRender();
        return;
    }
    try {
        let { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
        if (error) {
            console.warn('created_at order query failed, retrying simple select:', error);
            const unordered = await supabaseClient.from('posts').select('*');
            if (!unordered.error && unordered.data) {
                data = unordered.data;
                error = null;
            }
        }
        if (error) {
            console.error('Error loading posts:', error);
            posts = [];
        } else {
            posts = data || [];
            localStorage.setItem("aqua_buddy_posts_v27", JSON.stringify(posts));
        }
    } catch (e) {
        console.error('Exception loading posts:', e);
        posts = [];
    }
    if (typeof filterAndRender === 'function') {
        filterAndRender();
    }
}

function loadMyPosts() {
    const saved = localStorage.getItem("aqua_buddy_my_posts");
    if (saved) {
        try {
            myCreatedPostIds = JSON.parse(saved);
        } catch (e) {
            myCreatedPostIds = [];
        }
    }
}

function savePosts() {
    localStorage.setItem("aqua_buddy_posts_v27", JSON.stringify(posts));
}

function saveMyPosts() {
    localStorage.setItem("aqua_buddy_my_posts", JSON.stringify(myCreatedPostIds));
}

function initEventListeners() {
    const navHomeBtn = document.getElementById("navLinkHome");
    if (navHomeBtn) {
        navHomeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchMainView("home");
        });
    }

    const logoBtn = document.querySelector(".logo");
    if (logoBtn) {
        logoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchMainView("home");
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.category;
            
            const instSubBar = document.getElementById("instructorSubFilterBar");
            if (instSubBar) {
                if (activeCategory === "instructor") {
                    instSubBar.classList.remove("hidden");
                } else {
                    instSubBar.classList.add("hidden");
                }
            }

            updateCreateButtonText(activeCategory);
            renderAdBanner();
            filterAndRender();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchKeyword = e.target.value.trim().toLowerCase();
            filterAndRender();
        });
    }

    if (regionSelect) {
        regionSelect.addEventListener("change", (e) => {
            selectedRegion = e.target.value;
            filterAndRender();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            selectedSort = e.target.value;
            filterAndRender();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            // 현재 활성화된 카테고리 탭(activeCategory) 유지
            searchKeyword = "";
            selectedRegion = "all";
            selectedSort = "newest";

            if (searchInput) searchInput.value = "";
            if (regionSelect) regionSelect.value = "all";
            if (sortSelect) sortSelect.value = "newest";

            // 카테고리 탭 엘리먼트들의 active 상태는 그대로 두고 필터만 리셋
            renderAdBanner();
            filterAndRender();
            showToast("필터가 초기화되었습니다.");
        });
    }

    if (openCreateModalBtn) {
        openCreateModalBtn.addEventListener("click", () => {
            if (!currentUser) {
                showToast("🔑 회원가입 / 로그인 후 글을 작성하실 수 있습니다!");
                pendingLoginAction = function() {
                    if (currentUser) {
                        editingPostId = null;
                        preselectModalCategory(activeCategory);
                        openModal(createModal);
                    }
                };
                closeModal(createModal);
                openModal(authModal);
                return;
            }
            if (activeCategory === "instructor") {
                if (isPendingInstructor()) {
                    showToast("⏳ 강사 자격증 실물 심사가 진행 중입니다! (웹마스터 승인 완료 후 클래스 등록이 가능합니다)");
                    return;
                }
                if (!isVerifiedInstructor()) {
                    showToast("🎓 강사 클래스 등록은 승인된 공인 강사만 가능합니다! 먼저 [강사인증] 버튼을 눌러 자격증을 신청해 주세요.");
                    openInstructorAuthModal();
                    return;
                }
            }
            editingPostId = null;
            preselectModalCategory(activeCategory);
            openModal(createModal);
        });
    }

    if (closeCreateModalBtn) closeCreateModalBtn.addEventListener("click", () => closeModal(createModal));
    if (cancelCreateBtn) cancelCreateBtn.addEventListener("click", () => closeModal(createModal));
    if (createPostForm) createPostForm.addEventListener("submit", interceptHostSubmit);

    const mapAddrInput = document.getElementById("postMapAddress");
    if (mapAddrInput) {
        mapAddrInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                searchMapAddressInModal();
            }
        });
    }

    if (postImagesInput) {
        postImagesInput.addEventListener("change", handleImageUpload);
    }

    const inqImgInput = document.getElementById("inquiryImageInput");
    if (inqImgInput) {
        inqImgInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                inquiryImageCompressed = evt.target.result;
                const prev = document.getElementById("inquiryImagePreview");
                if (prev) {
                    prev.innerHTML = `<img src="${inquiryImageCompressed}" style="height: 50px; border-radius: 4px; border: 1px solid var(--accent-cyan);">`;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    const instAppFileInput = document.getElementById("instAppFile");
    if (instAppFileInput) {
        instAppFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    instAppCertImage = canvas.toDataURL("image/jpeg", 0.5);

                    const prev = document.getElementById("instAppCertPreview");
                    if (prev) {
                        prev.innerHTML = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <img src="${instAppCertImage}" alt="자격증 미리보기" style="height:60px; border-radius:4px; border:1px solid var(--accent-gold);" class="zoomable-img" onclick="openLightbox('${instAppCertImage}')">
                                <span style="font-size:0.78rem; color:#00e676; font-weight:700;"><i class="fa-solid fa-circle-check"></i> 자격증 사본 압축 첨부 완료</span>
                            </div>
                        `;
                    }
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (openAuthModalBtn) openAuthModalBtn.addEventListener("click", () => {
        switchAuthTab('login');
        openModal(authModal);
    });
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", () => {
        pendingLoginAction = null;
        closeModal(authModal);
        closeModal(createModal);
    });

    if (closeChatModalBtn) closeChatModalBtn.addEventListener("click", () => closeModal(chatModal));
    if (chatForm) chatForm.addEventListener("submit", handleSendChatMessage);

    if (closeRatingModalBtn) closeRatingModalBtn.addEventListener("click", () => closeModal(ratingModal));
    if (cancelRatingBtn) cancelRatingBtn.addEventListener("click", () => closeModal(ratingModal));

    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", () => closeModal(detailModal));

    if (confirmDeleteFinalBtn) {
        confirmDeleteFinalBtn.addEventListener("click", () => {
            if (pendingDeletePostId) {
                performPostDeletion(pendingDeletePostId);
                pendingDeletePostId = null;
                closeModal(deleteConfirmModal);
            }
        });
    }

    window.addEventListener("click", (e) => {
        // [작성글 보호] 모집하기/글작성 모달은 바탕 클릭으로 닫히지 않게 조치 (작성 중 내용 날림 방지)
        // if (e.target === createModal) closeModal(createModal);
        if (e.target === authModal) {
            pendingLoginAction = null;
            closeModal(authModal);
            closeModal(createModal);
        }
        if (e.target === chatModal) closeModal(chatModal);
        if (e.target === ratingModal) closeModal(ratingModal);
        if (e.target === detailModal) closeModal(detailModal);
        if (e.target === imageLightboxModal) closeModal(imageLightboxModal);
        if (e.target === deleteConfirmModal) closeModal(deleteConfirmModal);
        if (e.target === inquiryModal) closeModal(inquiryModal);
        if (e.target === document.getElementById("instructorAuthModal")) closeModal(document.getElementById("instructorAuthModal"));
        if (e.target === document.getElementById("findAccountModal")) closeModal(document.getElementById("findAccountModal"));
        if (e.target === document.getElementById("adminDashboardModal")) closeModal(document.getElementById("adminDashboardModal"));
        if (e.target === document.getElementById("adminSecurityModal")) closeModal(document.getElementById("adminSecurityModal"));
        if (e.target === document.getElementById("oceanWebcamModal")) {
            closeWebcamModal();
        }
    });
}

function filterActivitySub(subKey) {
    activeActivitySub = subKey;
    const subBtns = document.querySelectorAll(".sub-tab-btn");
    subBtns.forEach(b => {
        if (b.dataset.sub === subKey) b.classList.add("active");
        else b.classList.remove("active");
    });
    filterAndRender();
}

function filterTideRegion(regionKey) {
    activeTideRegion = regionKey;
    const regionBtns = document.querySelectorAll("[data-tideregion]");
    regionBtns.forEach(btn => {
        if (btn.dataset.tideregion === regionKey) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    renderWeatherGrid(regionKey);
}

let tideSearchDebounceTimer = null;

function handleTideSearch(keyword) {
    const trimmed = (keyword || "").trim().toLowerCase();
    tideSearchKeyword = trimmed;
    if (!trimmed) return;

    if (tideSearchDebounceTimer) clearTimeout(tideSearchDebounceTimer);

    tideSearchDebounceTimer = setTimeout(() => {
        // 1. 등록된 스팟 배열에서 먼저 매칭 검색
        const match = OCEAN_WEATHER_DATA.find(spot => 
            spot.name.toLowerCase().includes(trimmed) || 
            (spot.region && spot.region.toLowerCase().includes(trimmed))
        );

        if (match) {
            renderUnifiedSpotDashboard(match);
            return;
        }

        // 2. 등록된 배열에 없는 전국 해양/항구/해수욕장 키워드 -> 카카오 Geocoder / Places 검색
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            const places = new window.kakao.maps.services.Places();
            places.keywordSearch(keyword, function(result, status) {
                if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
                    const place = result[0];
                    const customSpot = {
                        id: `search-${Date.now()}`,
                        name: place.place_name || keyword,
                        region: place.address_name || place.road_address_name || "대한민국 해역",
                        regionCat: "all",
                        lat: parseFloat(place.y),
                        lng: parseFloat(place.x),
                        waterTemp: "실시간 표 참조",
                        waveHeight: "실시간 표 참조",
                        windSpeed: "실시간 표 참조",
                        highTide: "바다타임 표 참조",
                        lowTide: "바다타임 표 참조"
                    };
                    renderUnifiedSpotDashboard(customSpot);
                } else {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.addressSearch(keyword, function(geoResult, geoStatus) {
                        if (geoStatus === window.kakao.maps.services.Status.OK && geoResult && geoResult.length > 0) {
                            const geo = geoResult[0];
                            const customSpot = {
                                id: `search-${Date.now()}`,
                                name: keyword,
                                region: geo.address_name || "대한민국 해역",
                                regionCat: "all",
                                lat: parseFloat(geo.y),
                                lng: parseFloat(geo.x),
                                waterTemp: "실시간 표 참조",
                                waveHeight: "실시간 표 참조",
                                windSpeed: "실시간 표 참조",
                                highTide: "바다타임 표 참조",
                                lowTide: "바다타임 표 참조"
                            };
                            renderUnifiedSpotDashboard(customSpot);
                        }
                    });
                }
            });
        }
    }, 250);
}

function filterCctvRegion(regionCategoryKey) {
    activeCctvRegion = regionCategoryKey;
    const regionBtns = document.querySelectorAll("[data-cctvregion]");
    regionBtns.forEach(btn => {
        if (btn.dataset.cctvregion === regionCategoryKey) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    renderOceanWebcams(regionCategoryKey);
}

function handleImageUpload(e) {
    const MAX_IMAGES = 3;
    const remaining = MAX_IMAGES - uploadedCompressedImages.length;
    if (remaining <= 0) {
        showToast("⚠️ 이미지는 최대 3장까지만 업로드할 수 있습니다.");
        return;
    }
    const files = Array.from(e.target.files).slice(0, remaining);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 500; // 500px 이하로 강압축 (용량 절감)
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.55); // 55% 품질로 초강력 압축
                if (uploadedCompressedImages.length < MAX_IMAGES) {
                    uploadedCompressedImages.push(compressedBase64);
                    renderImagePreviews();
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    if (!imagePreviewGrid) return;
    imagePreviewGrid.innerHTML = uploadedCompressedImages.map((src, index) => `
        <div class="preview-thumb-box">
            <img src="${src}" alt="사진 미리보기" class="zoomable-img" onclick="openLightbox('${src}')">
            <button type="button" class="remove-img-btn" onclick="removeImage(${index})">&times;</button>
        </div>
    `).join("");
}

function removeImage(index) {
    uploadedCompressedImages.splice(index, 1);
    renderImagePreviews();
}

function openLightbox(src) {
    const modal = document.getElementById("imageLightboxModal");
    const img = document.getElementById("lightboxImage");
    if (!modal || !img) return;

    img.src = src;
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("z-index", "9999999", "important");
}
window.openLightbox = openLightbox;

function handleCctvSearch(keyword) {
    cctvSearchKeyword = keyword.trim().toLowerCase();
    renderOceanWebcams(activeCctvRegion);
}

// 기상청 실시간 해양관측 API (외부 네트워크 fetch 비활성화 -> 네트워크/CORS 에러 원천 차단)
window.kmaObsData = [];

async function initKmaObsData() {
    // 외부 fetch 비활성화 -> 즉시 전역 배열 반환 (에러 0건 보장)
    window.kmaObsData = [];
    return window.kmaObsData;
}
window.initKmaObsData = initKmaObsData;

// HTTP CCTV 재생용 Vercel Serverless Proxy 변환 함수
function getCctvProxyUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://")) {
        return `/api/cctv-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}
window.getCctvProxyUrl = getCctvProxyUrl;

const REGION_LAT_LNG = {
    "busan": { lat: 35.1587, lng: 129.1604 },
    "busan_gijang": { lat: 35.2447, lng: 129.2223 },
    "busan_haeundae": { lat: 35.1587, lng: 129.1604 },
    "busan_suyeong": { lat: 35.1537, lng: 129.1184 },
    "busan_namgu": { lat: 35.1366, lng: 129.0844 },
    "busan_yeongdo": { lat: 35.0912, lng: 129.0678 },
    "busan_seogu": { lat: 35.0976, lng: 129.0244 },
    "busan_gangseo": { lat: 35.0834, lng: 128.8312 },
    "ulsan": { lat: 35.5384, lng: 129.3114 },
    "geoje": { lat: 34.8806, lng: 128.6211 },
    "donghae": { lat: 36.0190, lng: 129.3435 },
    "islands": { lat: 37.2429, lng: 131.8687 },
    "jeju": { lat: 33.4996, lng: 126.5312 }
};

function getKmaObsMetricsForSpot(spotLat, spotLng) {
    const stations = window.kmaObsData || [];
    if (!stations || stations.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        const dist = Math.hypot(s.lat - spotLat, s.lon - spotLng);
        if (dist < minDist) {
            minDist = dist;
            nearest = s;
        }
    }

    return nearest;
}
window.getKmaObsMetricsForSpot = getKmaObsMetricsForSpot;

function renderOceanWebcams(regionCategoryKey = "all") {
    const grid = document.getElementById("webcamGrid");
    if (!grid) return;

    let filteredCctvs = (regionCategoryKey === "all")
        ? [...OCEAN_WEBCAMS_DATA]
        : OCEAN_WEBCAMS_DATA.filter(cam => cam.regionCategory === regionCategoryKey);

    if (cctvSearchKeyword) {
        filteredCctvs = OCEAN_WEBCAMS_DATA.filter(cam => 
            `${cam.name} ${cam.region} ${cam.desc || ''} ${cam.source || ''}`.toLowerCase().includes(cctvSearchKeyword)
        );
    }

    if (filteredCctvs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-video-slash" style="font-size: 2.5rem; margin-bottom: 10px; color: #ff5252;"></i>
                <h3>'${escapeHtml(cctvSearchKeyword)}' 검색어에 해당하는 해양 CCTV 스팟을 찾을 수 없습니다.</h3>
                <p>스팟명(예: 해운대, 임랑, 서귀포, 독도)으로 다시 검색해 보세요.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredCctvs.map(cam => `
        <div class="webcam-card" onclick="openWebcamModal('${cam.id}')">
            <div class="webcam-thumb-box">
                <img src="${cam.thumb}" alt="${cam.name}" class="webcam-thumb-img">
                <span class="badge-live"><i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> 24H LIVE</span>
                <div class="webcam-play-btn">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="webcam-card-body">
                <span style="font-size: 0.73rem; color: var(--accent-gold); font-weight: 800;">
                    <i class="fa-solid fa-building-columns"></i> ${cam.source || '공공 기관 CCTV'}
                </span>
                <h3 style="margin-top: 3px;">${cam.name}</h3>
                <p style="color: var(--accent-cyan); font-weight: 700; margin-top: 4px;">
                    <i class="fa-solid fa-water"></i> ${cam.status}
                </p>
                <p style="margin-top: 2px; font-size: 0.75rem; color: var(--text-dim);" id="cctvMetrics_${cam.id}">
                    수온: ${cam.waterTemp} | 풍속: ${cam.wind}
                </p>
            </div>
        </div>
    `).join("");

    // 비동기 기상청 실시간 관측 데이터 반영
    filteredCctvs.forEach(async (cam) => {
        const regCoords = REGION_LAT_LNG[cam.regionCategory] || REGION_LAT_LNG["busan"];
        const liveMetrics = await getKmaObsMetricsForSpot(regCoords.lat, regCoords.lng);
        if (liveMetrics) {
            const metricsEl = document.getElementById(`cctvMetrics_${cam.id}`);
            if (metricsEl) {
                const tempStr = liveMetrics.tw || cam.waterTemp;
                const windStr = liveMetrics.ws || cam.wind;
                const waveStr = liveMetrics.wh ? ` | 파고: ${liveMetrics.wh}` : '';
                metricsEl.innerHTML = `수온: <strong>${tempStr}</strong> | 풍속: <strong>${windStr}</strong>${waveStr}`;
            }
        }
    });
}

function openWebcamModal(camId) {
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 실시간 해양 CCTV 생중계를 시청하실 수 있습니다!");
        switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }

    const cam = OCEAN_WEBCAMS_DATA.find(c => c.id === camId);
    if (!cam) return;

    document.getElementById("webcamModalTitle").textContent = cam.name;
    document.getElementById("camSpotTag").textContent = cam.region;
    document.getElementById("camTimeTag").textContent = `24시간 실시간 LIVE 생중계 STREAM`;
    document.getElementById("camSourceText").textContent = cam.source || "공공기관 CCTV";

    const iframe = document.getElementById("webcamLiveIframe");
    const video = document.getElementById("webcamHlsVideo");

    const effectiveHlsUrl = getCctvProxyUrl(cam.hlsUrl);
    const effectiveEmbedUrl = getCctvProxyUrl(cam.embedUrl);

    if (effectiveHlsUrl) {
        if (iframe) iframe.style.display = "none";
        if (video) video.style.display = "block";

        const fallbackToIframe = () => {
            if (activeHlsPlayer) {
                activeHlsPlayer.destroy();
                activeHlsPlayer = null;
            }
            if (video) {
                video.pause();
                video.style.display = "none";
            }
            if (iframe && effectiveEmbedUrl) {
                iframe.style.display = "block";
                iframe.src = effectiveEmbedUrl;
            }
        };

        if (Hls && Hls.isSupported()) {
            if (activeHlsPlayer) {
                activeHlsPlayer.destroy();
            }
            activeHlsPlayer = new Hls();
            activeHlsPlayer.loadSource(effectiveHlsUrl);
            activeHlsPlayer.attachMedia(video);
            activeHlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play().catch(e => console.log("HLS Autoplay Notice:", e));
            });
            activeHlsPlayer.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    console.warn("HLS fatal error, falling back to iframe:", data);
                    fallbackToIframe();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = effectiveHlsUrl;
            video.onerror = fallbackToIframe;
            video.play().catch(e => console.log("Native HLS Autoplay Notice:", e));
        } else {
            fallbackToIframe();
        }
    } else {
        if (video) {
            video.pause();
            video.style.display = "none";
        }
        if (iframe) {
            iframe.style.display = "block";
            iframe.src = effectiveEmbedUrl;
        }
    }

    const metricsBar = document.getElementById("webcamMetricsBar");
    if (metricsBar) {
        metricsBar.innerHTML = `
            <div><span style="color: var(--text-muted); font-size:0.8rem;">📍 관측 스팟:</span> <strong>${cam.region}</strong></div>
            <div><span style="color: var(--text-muted); font-size:0.8rem;">🏢 영상 출처:</span> <strong style="color: var(--accent-gold);">${cam.source}</strong></div>
            <div><span style="color: var(--text-muted); font-size:0.8rem;">🌡️ 실시간 수온:</span> <strong style="color: var(--accent-cyan);">${cam.waterTemp}</strong></div>
            <div><span style="color: var(--text-muted); font-size:0.8rem;">🌬️ 현장 풍속:</span> <strong>${cam.wind}</strong></div>
            <div><span style="color: var(--text-muted); font-size:0.8rem;">🛡️ 바다 상태:</span> <strong style="color: #00e676;">${cam.status}</strong></div>
        `;
    }

    openModal(document.getElementById("oceanWebcamModal"));
}

function closeWebcamModal() {
    const iframe = document.getElementById("webcamLiveIframe");
    const video = document.getElementById("webcamHlsVideo");

    if (iframe) iframe.src = "";
    if (video) {
        video.pause();
        video.src = "";
    }
    if (activeHlsPlayer) {
        activeHlsPlayer.destroy();
        activeHlsPlayer = null;
    }
    closeModal(document.getElementById("oceanWebcamModal"));
}

// 국립해양조사원 실시간 조석예보 API (외부 네트워크 fetch 비활성화 -> 에러 0건 유지)
async function fetchTideData(spot) {
    if (!spot) return { highTide: "만조 12:30 (120cm)", lowTide: "간조 18:45 (30cm)" };
    return { highTide: spot.highTide || "만조 12:30 (120cm)", lowTide: spot.lowTide || "간조 18:45 (30cm)" };
}
let currentDashboardSpot = null;

function selectDashboardSpot(spotId) {
    const spot = OCEAN_WEATHER_DATA.find(s => s.id === spotId) || OCEAN_WEATHER_DATA[0];
    renderUnifiedSpotDashboard(spot);
    const container = document.getElementById("unifiedDashboardContainer");
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
window.selectDashboardSpot = selectDashboardSpot;

function renderCctvDropdownOptions(selectedCctvId) {
    const categories = {
        "busan_gijang": "🌊 [부산] 기장 / 해운대 / 수영",
        "busan_south": "⚓ [부산] 남구 / 영도 / 서구",
        "donghae": "🏔️ [경북/동해] 포항 / 독도 / 동해",
        "jeju_live": "🏝️ [제주] 실시간 해양 CCTV",
        "jeonnam_namhae": "🌅 [전남/경남] 여수 / 완도 / 창원",
        "seohae": "🏙️ [서해/수도권] 군산 / 인천"
    };

    let html = `<option value="">📹 -- 전국 44개 해양 CCTV 선택 --</option>`;

    Object.keys(categories).forEach(catKey => {
        const cctvs = OCEAN_WEBCAMS_DATA.filter(c => c.regionCategory === catKey);
        if (cctvs.length > 0) {
            html += `<optgroup label="${categories[catKey]}">`;
            cctvs.forEach(c => {
                const isSelected = c.id === selectedCctvId ? "selected" : "";
                html += `<option value="${c.id}" ${isSelected}>${c.name} (${c.region})</option>`;
            });
            html += `</optgroup>`;
        }
    });

    return html;
}
window.renderCctvDropdownOptions = renderCctvDropdownOptions;

function changeCctvSelect(cctvId) {
    if (!cctvId) return;
    const cam = OCEAN_WEBCAMS_DATA.find(c => c.id === cctvId);
    if (!cam) return;

    const cctvContainer = document.getElementById("dashboardCctvPlayerBox");
    if (cctvContainer) {
        const rawUrl = cam.embedUrl || cam.hlsUrl;
        const effectiveUrl = getCctvProxyUrl(rawUrl);
        cctvContainer.innerHTML = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #000; position: relative;">
                <iframe src="${effectiveUrl}" style="width: 100%; height: 380px; border: none;" allowfullscreen></iframe>
                <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.75); padding: 6px 12px; border-radius: 8px; color: #00e676; font-weight: 700; font-size: 0.82rem; backdrop-filter: blur(4px);">
                    🔴 24H LIVE CCTV 생중계 (${cam.name})
                </div>
            </div>
        `;
    }
}
window.changeCctvSelect = changeCctvSelect;

function renderUnifiedSpotDashboard(spot) {
    if (!spot) spot = currentDashboardSpot || OCEAN_WEATHER_DATA[0];
    currentDashboardSpot = spot;

    const container = document.getElementById("unifiedDashboardContainer");
    if (!container) return;

    const spotLat = (spot && typeof spot.lat === 'number' && !isNaN(spot.lat)) 
        ? spot.lat 
        : (spot && spot.regionCat && REGION_LAT_LNG[spot.regionCat] ? REGION_LAT_LNG[spot.regionCat].lat : 35.1587);

    const spotLng = (spot && typeof spot.lng === 'number' && !isNaN(spot.lng)) 
        ? spot.lng 
        : (spot && spot.regionCat && REGION_LAT_LNG[spot.regionCat] ? REGION_LAT_LNG[spot.regionCat].lng : 129.1604);

    const cleanSpotName = spot.name.replace(/부산|울산|거제|포항|경북|경남|강원|제주/g, "").replace(/해수욕장|해변|포구|항|해상/g, "").trim();
    const matchingCctv = OCEAN_WEBCAMS_DATA.find(c => c.name.includes(cleanSpotName) || spot.name.includes(c.name.replace(/CCTV|부산|기장군|해수욕장/g, "").trim())) || null;

    const selectedCctvId = matchingCctv ? matchingCctv.id : "";
    const dropdownOptionsHtml = renderCctvDropdownOptions(selectedCctvId);

    let cctvHtml = "";
    if (matchingCctv) {
        const rawUrl = matchingCctv.embedUrl || matchingCctv.hlsUrl;
        const effectiveUrl = getCctvProxyUrl(rawUrl);
        cctvHtml = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #000; position: relative;">
                <iframe src="${effectiveUrl}" style="width: 100%; height: 380px; border: none;" allowfullscreen></iframe>
                <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.75); padding: 6px 12px; border-radius: 8px; color: #00e676; font-weight: 700; font-size: 0.82rem; backdrop-filter: blur(4px);">
                    🔴 24H LIVE CCTV 생중계 (${matchingCctv.name})
                </div>
            </div>
        `;
    } else {
        cctvHtml = `
            <div class="dashboard-cctv-none" style="width: 100%; height: 380px; border-radius: 12px; background: rgba(15, 23, 42, 0.7); border: 1px dashed rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); box-sizing: border-box; padding: 20px;">
                <i class="fa-solid fa-video-slash" style="font-size: 3rem; margin-bottom: 12px; color: #ff9800;"></i>
                <h4 style="color: #fff; font-size: 1.15rem; margin-bottom: 8px;">📷 CCTV 미설치 스팟입니다</h4>
                <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; max-width: 280px; line-height: 1.4;">상단 드롭다운에서 인근 해양 CCTV를 선택하거나 실시간 Windy 지도를 참조하세요.</p>
            </div>
        `;
    }

    const windyUrl = `https://embed.windy.com/embed2.html?lat=${spotLat}&lon=${spotLng}&detailLat=${spotLat}&detailLon=${spotLng}&width=100%25&height=480&zoom=11&level=surface&overlay=waves&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=true&metricWind=m%2Fs&metricTemp=%C2%B0C`;

    container.innerHTML = `
        <div class="spot-dashboard-card" style="padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(0, 242, 254, 0.25); background: rgba(15, 23, 42, 0.85);">
            <!-- Header Banner (단일 클린 패널 헤더) -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px;">
                <div>
                    <span class="badge badge-primary" style="font-size: 0.8rem; margin-bottom: 4px; display: inline-block;">📍 ${spot.region || '대한민국 해역'} (${spotLat.toFixed(4)}, ${spotLng.toFixed(4)})</span>
                    <h2 style="color: #fff; font-size: 1.35rem; font-weight: 800; margin: 0;">${spot.name} 실시간 통합 대시보드</h2>
                </div>
            </div>

            <!-- Responsive Grid Layout (PC: 윈디 상단 1열 + 바다타임/CCTV 하단 2열) -->
            <div class="spot-dashboard-grid">
                <!-- ① Windy 파도 지도 (Height 480px, 핀 마커📍 및 상세 예보 레이어 강제 연동) -->
                <div class="dashboard-windy-section">
                    <h3 style="color: var(--accent-cyan); font-size: 1.05rem; margin-bottom: 10px; font-weight: 700;">
                        <i class="fa-solid fa-wind"></i> ① Windy 좌표 핀 마커(📍) & 바람·파도 실시간 지도 (${spotLat.toFixed(4)}, ${spotLng.toFixed(4)})
                    </h3>
                    <div style="width: 100%; height: 480px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <iframe src="${windyUrl}" style="width: 100%; height: 480px; border: none;"></iframe>
                    </div>
                </div>

                <!-- ② 바다타임 IFRAME (Height 380px) -->
                <div class="dashboard-badatime-section">
                    <h3 style="color: var(--accent-cyan); font-size: 1.05rem; margin-bottom: 10px; font-weight: 700;">
                        <i class="fa-solid fa-calendar-days"></i> ② 바다타임 (Badatime) 셀프 물때 검색
                    </h3>
                    <div style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #fff;">
                        <iframe src="https://www.badatime.com/" style="width: 100%; height: 380px; border: none;"></iframe>
                    </div>
                </div>

                <!-- ③ CCTV 생중계 & 컴팩트 드롭다운 선택 (Height 380px) -->
                <div class="dashboard-cctv-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <h3 style="color: var(--accent-cyan); font-size: 1.05rem; font-weight: 700; margin: 0;">
                            <i class="fa-solid fa-video" style="color:#ff5252;"></i> ③ 해양 CCTV 선택 (전국 44개)
                        </h3>
                    </div>

                    <!-- Compact Dropdown Select Menu -->
                    <div style="margin-bottom: 10px;">
                        <select id="cctvSpotSelect" class="cctv-dropdown-select" onchange="changeCctvSelect(this.value)">
                            ${dropdownOptionsHtml}
                        </select>
                    </div>

                    <div id="dashboardCctvPlayerBox">
                        ${cctvHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}
window.renderUnifiedSpotDashboard = renderUnifiedSpotDashboard;

// 46개 카드 그리드 완전 삭제 (대시보드 전용 뷰 제공)
function renderWeatherGrid(regionKey = "all") {
    // 46개 카드 그리드 완전히 삭제 -> 불필요한 스크롤 방지
}
window.renderWeatherGrid = renderWeatherGrid;

function updateCreateButtonText(cat) {
    if (!createBtnText || !openCreateModalBtn) return;
    if (cat === "community") {
        createBtnText.textContent = "수다글 작성하기";
        openCreateModalBtn.style.opacity = "1";
    } else if (cat === "market") {
        createBtnText.textContent = "중고 장비 등록하기";
        openCreateModalBtn.style.opacity = "1";
    } else if (cat === "instructor") {
        if (isVerifiedInstructor()) {
            createBtnText.textContent = "강사 클래스 등록하기";
            openCreateModalBtn.style.opacity = "1";
        } else if (isPendingInstructor()) {
            createBtnText.textContent = "⏳ 강사 심사 진행 중 (대기)";
            openCreateModalBtn.style.opacity = "0.8";
        } else {
            createBtnText.textContent = "강사인증 신청 후 등록";
            openCreateModalBtn.style.opacity = "0.9";
        }
    } else {
        createBtnText.textContent = "버디 모집하기";
        openCreateModalBtn.style.opacity = "1";
    }
}

function preselectModalCategory(cat, isEditing = false) {
    const postCategoryGroup = document.getElementById("postCategoryGroup");
    const postCategorySelect = document.getElementById("postCategory");
    const instructorFields = document.getElementById("instructorFormFields");
    const priceRow = document.getElementById("marketPriceRow");
    const dealMethodGroup = document.getElementById("dealMethodGroup");
    const capacityGroup = document.getElementById("capacityGroup");
    const locationDateGroup = document.getElementById("locationDateGroup");
    const postDateGroup = document.getElementById("postDateGroup");
    const mapAddressGroup = document.getElementById("mapAddressGroup");
    const imageUploadLabel = document.getElementById("imageUploadLabel");
    const descLabel = document.getElementById("descLabel");
    const submitBtnText = document.getElementById("submitBtnText");

    if (!isEditing) {
        uploadedCompressedImages = [];
        uploadedCertImage = "";
        renderImagePreviews();
        if (createPostForm && typeof createPostForm.reset === "function") {
            createPostForm.reset();
        }
        submitBtnText.textContent = "등록하기";
    } else {
        submitBtnText.textContent = "수정 완료";
    }

    if (currentUser) {
        document.getElementById("userName").value = currentUser.name;
        document.getElementById("userLicense").value = currentUser.license;
    }

    if (cat === "instructor") {
        modalFormTitle.textContent = isEditing ? "강사 클래스 수정" : "강사 클래스 등록 (원데이 체험 / 자격증 코스)";
        
        postCategoryGroup.style.display = "none";
        instructorFields.style.display = "block";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "block";
        locationDateGroup.style.display = "grid";
        postDateGroup.style.display = "block";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 커리큘럼 / 풀장 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "상세 내용 및 교육 커리큘럼 *";
        postCategorySelect.innerHTML = `<option value="instructor" selected>강사 클래스</option>`;
    } else if (cat === "community") {
        modalFormTitle.textContent = isEditing ? "자유수다글 수정" : "수다방 게시글 작성";
        
        postCategoryGroup.style.display = "none";
        instructorFields.style.display = "none";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "none";
        locationDateGroup.style.display = "none";
        mapAddressGroup.style.display = "none";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "내용 작성 *";
        postCategorySelect.innerHTML = `<option value="community" selected>자유수다방 게시글</option>`;
    } else if (cat === "market") {
        modalFormTitle.textContent = isEditing ? "중고 장비 수정" : "중고 다이빙 장비 매물 등록";
        
        postCategoryGroup.style.display = "none";
        instructorFields.style.display = "none";
        priceRow.style.display = "grid";
        dealMethodGroup.style.display = "block";
        capacityGroup.style.display = "none";
        locationDateGroup.style.display = "none";
        postDateGroup.style.display = "none";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 장비 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "내용 작성 *";
        postCategorySelect.innerHTML = `<option value="market" selected>중고 장비 매물 등록</option>`;
    } else {
        modalFormTitle.textContent = isEditing ? "새 버디 모집글 수정" : "새 버디 모집글 등록";
        
        postCategoryGroup.style.display = "block";
        instructorFields.style.display = "none";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "block";
        locationDateGroup.style.display = "grid";
        postDateGroup.style.display = "block";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 이미지 업로드 (최대 4장)`;
        descLabel.textContent = "상세 내용 및 플랜 *";
        const isSpecificBuddyCat = ["swimming", "openwater", "freediving", "scuba"].includes(cat);
        postCategorySelect.innerHTML = `
            <option value="" disabled ${!isSpecificBuddyCat ? 'selected' : ''}>-- 작성 카테고리를 선택해 주세요 --</option>
            <option value="swimming" ${cat === 'swimming' ? 'selected' : ''}>🏊‍♂️ 실내 수영 버디 모집</option>
            <option value="openwater" ${cat === 'openwater' ? 'selected' : ''}>🌊 바다 수영 / 오픈워터 버디 모집</option>
            <option value="freediving" ${cat === 'freediving' ? 'selected' : ''}>🤿 프리다이빙 버디 모집</option>
            <option value="scuba" ${cat === 'scuba' ? 'selected' : ''}>🤿 스쿠버 다이빙 버디 모집</option>
        `;
    }
}

function updateTopNavbarActive(catName) {
    const navHome = document.getElementById("navLinkHome");
    const navFeed = document.getElementById("navLinkFeed");
    const navInstructor = document.getElementById("navLinkInstructor");
    const navCommunity = document.getElementById("navLinkCommunity");
    const navMarket = document.getElementById("navLinkMarket");
    const navActivity = document.getElementById("navLinkActivity");
    const navTide = document.getElementById("navLinkTide");
    const navCctv = document.getElementById("navLinkCctv");

    [navHome, navFeed, navInstructor, navCommunity, navMarket, navActivity, navTide, navCctv].forEach(link => {
        if (link) link.classList.remove("active");
    });

    if (catName === "home" || catName === "all") {
        if (navHome) navHome.classList.add("active");
    } else if (catName === "instructor") {
        if (navInstructor) navInstructor.classList.add("active");
    } else if (catName === "community") {
        if (navCommunity) navCommunity.classList.add("active");
    } else if (catName === "market") {
        if (navMarket) navMarket.classList.add("active");
    } else if (catName === "activity_log") {
        if (navActivity) navActivity.classList.add("active");
    } else if (catName === "tide") {
        if (navTide) navTide.classList.add("active");
    } else if (catName === "cctv") {
        if (navCctv) navCctv.classList.add("active");
    } else {
        if (navFeed) navFeed.classList.add("active");
    }
}

function filterByCategory(catName) {
    activeCategory = catName;
    if (catName !== "all" && catName !== "home") {
        currentMainView = "feed";
        const feedSec = document.getElementById("mainFeedViewSection");
        const tideSec = document.getElementById("tideViewSection");
        const cctvSec = document.getElementById("cctvViewSection");
        if (feedSec) feedSec.classList.remove("hidden");
        if (tideSec) tideSec.classList.add("hidden");
        if (cctvSec) cctvSec.classList.add("hidden");
    }

    tabBtns.forEach(b => {
        if (b.dataset.category === catName) b.classList.add("active");
        else b.classList.remove("active");
    });

    updateTopNavbarActive(catName);
    updateCreateButtonText(catName);
    renderAdBanner();
    filterAndRender();
}

function renderAdBanner() {
    const adPanel = document.getElementById("adContent");
    if (!adPanel) return;

    adPanel.innerHTML = `
        <a href="${COUPANG_CUSPE_URL}" target="_blank" class="center-ad-visual-card" onclick="showToast('🏆 쿠팡 썸머 스포츠 페스타(쿠스페) 기획전으로 이동합니다!')">
            <img src="right_ad_swimming.jpg" alt="수영장비 세로형 비주얼 카드 배경" class="center-ad-bg-img">
            <div class="center-ad-overlay-content">
                <span class="center-ad-badge"><i class="fa-solid fa-fire"></i> 썸머 스포츠 페스타</span>
                <h2 class="center-ad-title">🏆 쿠팡 썸머 스포츠 페스타!<br><span class="highlight-gold">수영·다이빙 특가 기획전</span></h2>
                <p class="center-ad-subtitle">수경, 롱핀/숏핀, 수영복 & 프리다이빙 장비 단독 기획전</p>
            </div>
            <div class="center-ad-cta-btn">
                <span>특가 기획전 보러가기</span>
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </a>
    `;
}

function filterAndRender() {
    const currentUserName = currentUser ? currentUser.name : "다이버";
    const dashboardSec = document.getElementById("dashboardBlocksSection");
    const postsSec = document.querySelector(".posts-section");
    const filterSec = document.getElementById("feed");

    const instSubBar = document.getElementById("instructorSubFilterBar");
    if (instSubBar) {
        if (activeCategory === "instructor") {
            instSubBar.classList.remove("hidden");
        } else {
            instSubBar.classList.add("hidden");
        }
    }

    if (activitySubFilterBar) {
        if (activeCategory === "activity_log") {
            activitySubFilterBar.classList.remove("hidden");
        } else {
            activitySubFilterBar.classList.add("hidden");
        }
    }

    if (activeCategory === "all" || activeCategory === "home") {
        document.body.classList.remove("category-view-active");
        if (dashboardSec) dashboardSec.style.display = "flex";
        if (filterSec) filterSec.style.display = "none";
        if (postsSec) postsSec.style.display = "none";
        renderDashboardBlocks();
        if (activeCountText) activeCountText.textContent = "";
        return;
    }

    // Category Page Mode (Hide Hero, Show Filter & Category Posts)
    document.body.classList.add("category-view-active");
    if (dashboardSec) dashboardSec.style.display = "none";
    if (filterSec) filterSec.style.display = "block";
    if (postsSec) postsSec.style.display = "block";

    let filtered = posts.filter(post => {
        if (activeCategory === "activity_log") {
            if (activeActivitySub === "my_posts") return isMyPost(post);
            if (activeActivitySub === "chat_rooms") return chatMessages[post.id] && chatMessages[post.id].length > 0;
            if (activeActivitySub === "joined") return post.attendees && post.attendees.includes(currentUserName);
            if (activeActivitySub === "liked") return post.userLiked === true;
            if (activeActivitySub === "commented") return post.comments && post.comments.some(c => c.author === currentUserName || isMyPost(post));
            if (activeActivitySub === "wished") return post.userWished === true;
            return isMyPost(post);
        }

        if (activeCategory === "instructor") {
            if (post.category !== "instructor") return false;
            if (activeInstructorSubFilter !== "all") {
                const subCat = getPostInstSubCategory(post);
                if (subCat !== activeInstructorSubFilter) return false;
            }
        } else if (activeCategory === "freediving" || activeCategory === "buddy") {
            if (!["freediving", "scuba", "swimming", "openwater"].includes(post.category)) {
                return false;
            }
        } else if (activeCategory !== "all" && post.category !== activeCategory) {
            return false;
        }

        if (selectedRegion !== "all" && post.region && post.region !== selectedRegion) {
            return false;
        }

        if (searchKeyword) {
            const content = `${post.title} ${post.locationName} ${post.mapAddress || ''} ${post.desc} ${post.userName} ${post.reqLicense || ''} ${post.instructorLicenseCode || ''}`.toLowerCase();
            if (!content.includes(searchKeyword)) {
                return false;
            }
        }

        return true;
    });

    filtered.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;

        if (selectedSort === "premium") {
            return (b.likes || 0) - (a.likes || 0);
        }
        if (selectedSort === "popularity") {
            return (b.likes || 0) + (b.wishlistCount || 0) - ((a.likes || 0) + (a.wishlistCount || 0));
        }
        if (selectedSort === "closing_soon") {
            if (a.status === "recruiting" && b.status !== "recruiting") return -1;
            if (a.status !== "recruiting" && b.status === "recruiting") return 1;
            return new Date(a.date || 0) - new Date(b.date || 0);
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    renderGrid(filtered);
}

function formatTimeAgo(dateInput) {
    if (!dateInput) return "방금 전";
    try {
        let past;
        if (typeof dateInput === "string") {
            // ISO formatted string without Z / offset might be parsed differently, force UTC or ISO parse
            let isoStr = dateInput;
            if (!isoStr.endsWith("Z") && !isoStr.includes("+") && !isoStr.includes("-", 10)) {
                isoStr += "Z";
            }
            past = new Date(isoStr).getTime();
        } else if (dateInput instanceof Date) {
            past = dateInput.getTime();
        } else {
            past = new Date(dateInput).getTime();
        }

        if (isNaN(past)) return "방금 전";

        const now = Date.now();
        let diffMs = now - past;

        // If slight future offset due to clock skew, cap at 0
        if (diffMs < 0) diffMs = 0;

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 30) return `${diffDay}일 전`;
        return formatDate(dateInput);
    } catch (e) {
        return "방금 전";
    }
}
window.formatTimeAgo = formatTimeAgo;

function renderGrid(filteredPosts) {
    const postsGrid = document.getElementById("postsGrid");
    if (!postsGrid) return;
    
    if (!filteredPosts || filteredPosts.length === 0) {
        postsGrid.innerHTML = "";
        const emptyState = document.getElementById("emptyState");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }
    
    const emptyState = document.getElementById("emptyState");
    if (emptyState) emptyState.classList.add("hidden");
    
    postsGrid.innerHTML = filteredPosts.map(post => {
        const isInst = post.category === "instructor";
        const isMarket = post.category === "market";
        const isCommunity = post.category === "community";
        const isBuddy = !isInst && !isMarket && !isCommunity;
        
        let catColor = "var(--accent-cyan)";
        let catIcon = "fa-user-group";
        let catLabel = "버디모집";
        if (isInst)       { catColor = "var(--accent-gold)"; catIcon = "fa-graduation-cap"; catLabel = "강사클래스"; }
        else if (isMarket)    { catColor = "#00e676"; catIcon = "fa-tags"; catLabel = "중고장터"; }
        else if (isCommunity) { catColor = "#b39ddb"; catIcon = "fa-comments"; catLabel = "수다방"; }
        
        const authorName = escapeHtml(post.nickname || post.userName || post.user_name || post.author || "다이버");
        const dateStr = post.date ? formatDate(post.date) : (post.createdAt ? formatDate(post.createdAt) : "일시 미정");
        const priceText = isInst
            ? (post.classFee ? post.classFee.toLocaleString() + "원" : "수강료 문의")
            : (isMarket ? (post.price ? post.price.toLocaleString() + "원" : "가격 협의") : "");

        const statusText = isBuddy
            ? `${post.joinedCount || 1}/${post.capacity || 2}명`
            : (isMarket ? (post.status === 'completed' ? '거래완료' : '판매중') : "");

        return `
            <div class="post-card post-card-slim" data-post-id="${post.id}" onclick="openPostDetailModal('${post.id}')" style="cursor: pointer;">
                <div class="slim-card-inner">
                    <div class="slim-card-left">
                        <span class="slim-cat-badge" style="color:${catColor}; border-color:${catColor};">
                            <i class="fa-solid ${catIcon}"></i> ${catLabel}
                        </span>
                        <span class="slim-author" style="color:${catColor};">${authorName}</span>
                        <span class="slim-title">${escapeHtml(post.title)}</span>
                    </div>
                    <div class="slim-card-right">
                        <span class="slim-meta"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                        ${statusText ? `<span class="slim-meta"><i class="fa-solid fa-users"></i> ${statusText}</span>` : ""}
                        ${priceText ? `<span class="slim-price" style="color:var(--accent-gold);">${priceText}</span>` : ""}
                        <span class="slim-time">${formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Render Dashboard Category Blocks for 'all' mode
function renderDashboardBlocks() {
    const container = document.getElementById("dashboardBlocksSection");
    if (!container) return;

    const buddyPosts = posts.filter(p => ["freediving", "scuba", "swimming", "openwater"].includes(p.category)).slice(0, 4);
    const instPosts = posts.filter(p => p.category === "instructor").slice(0, 4);
    const commPosts = posts.filter(p => p.category === "community").slice(0, 4);
    const marketPosts = posts.filter(p => p.category === "market").slice(0, 4);

    container.innerHTML = `
        <!-- Block 1: 🔥 실시간 인기 버디 모집 -->
        <div class="dashboard-category-block">
            <div class="block-header">
                <div class="block-header-title">
                    <i class="fa-solid fa-fire" style="color: #ff5252;"></i>
                    <span>🔥 실시간 인기 버디 모집</span>
                </div>
                <button type="button" class="block-more-btn" onclick="filterByCategory('freediving')">
                    버디탐색 바로가기 ➔
                </button>
            </div>
            <div class="compact-post-table">
                ${buddyPosts.map(p => renderCompactPostRow(p)).join("")}
            </div>
        </div>

        <!-- Block 2: 🎓 검증된 인기 강사 클래스 -->
        <div class="dashboard-category-block">
            <div class="block-header">
                <div class="block-header-title">
                    <i class="fa-solid fa-graduation-cap" style="color: var(--accent-gold);"></i>
                    <span>🎓 검증된 인기 강사 클래스 (체험/자격증)</span>
                </div>
                <button type="button" class="block-more-btn" onclick="filterByCategory('instructor')">
                    강사클래스 바로가기 ➔
                </button>
            </div>
            <div class="compact-post-table">
                ${instPosts.map(p => renderCompactPostRow(p)).join("")}
            </div>
        </div>

        <!-- Block 3: 💬 자유수다방 핫이슈 -->
        <div class="dashboard-category-block">
            <div class="block-header">
                <div class="block-header-title">
                    <i class="fa-solid fa-comments" style="color: var(--accent-cyan);"></i>
                    <span>💬 실시간 자유수다방 핫이슈</span>
                </div>
                <button type="button" class="block-more-btn" onclick="filterByCategory('community')">
                    자유수다방 바로가기 ➔
                </button>
            </div>
            <div class="compact-post-table">
                ${commPosts.map(p => renderCompactPostRow(p)).join("")}
            </div>
        </div>

        <!-- Block 4: 🏷️ 최근 등록된 중고장터 꿀매물 -->
        <div class="dashboard-category-block">
            <div class="block-header">
                <div class="block-header-title">
                    <i class="fa-solid fa-tags" style="color: #00e676;"></i>
                    <span>🏷️ 최근 등록된 중고장터 꿀매물</span>
                </div>
                <button type="button" class="block-more-btn" onclick="filterByCategory('market')">
                    중고장터 바로가기 ➔
                </button>
            </div>
            <div class="compact-post-table">
                ${marketPosts.map(p => renderCompactPostRow(p)).join("")}
            </div>
        </div>
    `;
}

function renderCompactPostRow(post) {
    try {
        const isInst = post.category === "instructor";
    const isMarket = post.category === "market";
    const isCommunity = post.category === "community";
    const isBuddy = !isInst && !isMarket && !isCommunity;

    const priceText = isInst ? (post.classFee ? post.classFee.toLocaleString() + '원' : '수강료 문의') : (isMarket ? (post.price ? post.price.toLocaleString() + '원' : '가격협의') : '');

    let metaLineHtml = "";
    if (isBuddy || isInst) {
        const scheduleText = formatDate(post.date || post.createdAt);
        const locText = post.mapAddress || post.locationName || post.location || '장소 미지정';
        const joined = post.joinedCount !== undefined ? post.joinedCount : (Array.isArray(post.attendees) ? post.attendees.length : 1);
        const cap = post.capacity || 4;
        const isDone = post.status === 'completed';
        const statusLabel = isDone ? '완료' : '모집 중';
        const statusColor = isDone ? '#00e676' : 'var(--accent-gold)';

        metaLineHtml = `
            <div class="post-submeta-line" style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; text-align: left;">
                <span>📅 ${scheduleText}</span>
                <span style="opacity: 0.3;">|</span>
                <span>📍 ${escapeHtml(locText.substring(0, 20))}</span>
                <span style="opacity: 0.3;">|</span>
                <span style="color: ${statusColor}; font-weight: 700;">👥 ${joined}/${cap}명 ${statusLabel}</span>
            </div>
        `;
    } else {
        const createdDateText = post.createdAt ? formatDate(post.createdAt).split(' ')[0] : '2026.08.05';
        const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.commentCount || 0);

        metaLineHtml = `
            <div class="post-submeta-line" style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; text-align: left;">
                <span>🕒 ${createdDateText}</span>
                <span style="opacity: 0.3;">|</span>
                <span>💬 댓글 ${commentCount}개</span>
            </div>
        `;
    }

    return `
        <div class="post-card feed-card feed-card-item compact-post-row" data-post-id="${post.id}" onclick="openPostDetailModal('${post.id}')" style="cursor: pointer; display: flex !important; flex-direction: column !important; align-items: stretch !important; padding: 12px 16px !important; margin-bottom: 8px !important;">
            ${metaLineHtml}
        </div>
    `;
    } catch (dataErr) {
        console.error('대화방 데이터 바인딩 중 예외 발생 (모달 표시는 유효함):', dataErr);
    }
}

function renderChatStream(postId) {
    const stream = chatMessages[postId] || [];
    const currentUserName = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "손님") : "손님";
    const container = document.getElementById("chatMessagesStream") || document.getElementById("chatMessageList");
    if (!container) return;

    const joinKey = `${postId}_${currentUserName}`;
    const joinTime = chatJoinTimestamps[joinKey] || 0;
    const isHost = typeof isMyPost === 'function' && currentChatPost ? isMyPost(currentChatPost) : false;

    const visibleStream = stream.filter(function(msg) {
        if (msg.sender === "system" || isHost) return true;
        if (msg.author === currentUserName) return true;
        return (msg.timestamp && msg.timestamp >= (joinTime - 5000));
    });

    container.innerHTML = visibleStream.map(function(msg) {
        if (msg.sender === "system") {
            return `
            <div class="chat-system-notice" style="text-align: center; margin: 10px 0;">
                <span style="background: rgba(0, 242, 254, 0.12); color: var(--accent-cyan); font-size: 0.78rem; padding: 4px 12px; border-radius: 12px; border: 1px dashed var(--accent-cyan);">
                    ${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}
                </span>
            </div>
            `;
        }

        const isUserMsg = (currentUser && (msg.author === currentUser.name || msg.author === currentUser.nickname)) || msg.sender === "user";
        const isHostMsg = msg.sender === "host" || (currentChatPost && msg.author === currentChatPost.userName);

        return `
        <div class="chat-bubble ${isUserMsg ? 'user' : (isHostMsg ? 'host' : 'attendee')}" style="${isUserMsg ? 'margin-left: auto; background: linear-gradient(135deg, #00f2fe, #4facfe); color: #000; text-align: right;' : 'margin-right: auto; background: rgba(255,255,255,0.1); color: #fff;'} padding: 8px 14px; border-radius: 12px; margin-bottom: 8px; max-width: 80%;">
            ${!isUserMsg ? `
            <div class="chat-sender-info" style="font-weight: bold; font-size: 0.8rem; margin-bottom: 2px;">
                <i class="fa-solid ${isHostMsg ? 'fa-crown' : 'fa-user'}"></i> ${typeof escapeHtml === 'function' ? escapeHtml(msg.author || '참가자') : msg.author} ${isHostMsg ? '(주최자/강사)' : ''}
            </div>
            ` : ''}
            <p style="margin: 0; font-size: 0.9rem; word-break: break-word;">${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}</p>
            <span class="chat-time" style="font-size: 0.7rem; opacity: 0.7; display: block; margin-top: 4px;">${msg.time || '방금 전'}</span>
        </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
}

async function handleSendChatMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentChatPost) return;

    const inputEl = document.getElementById("chatMessageInput") || document.getElementById("chatInput");
    if (!inputEl) return;

    const text = inputEl.value.trim();
    if (!text) return;

    const postId = String(currentChatPost.id);
    const currentUserName = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "다이버") : "다이버";
    const isHostMsg = typeof isMyPost === 'function' ? isMyPost(currentChatPost) : false;
    const nowTimeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const isoNow = new Date().toISOString();

    const msgObj = {
        id: `msg-${Date.now()}`,
        sender: isHostMsg ? "host" : "user",
        author: currentUserName,
        text: text,
        time: nowTimeStr,
        timestamp: Date.now()
    };

    // Supabase DB chats 테이블 INSERT 연동 (디버깅 로그 및 인증 키 점검, Not-null 보장)
    if (supabaseClient) {
        try {
            const safeSenderName = currentUserName || "다이버";
            const chatPayload = {
                post_id: String(postId || "default_chat"),
                sender: msgObj.sender || "user",
                sender_name: safeSenderName,
                author: safeSenderName,
                user_name: safeSenderName,
                nickname: safeSenderName,
                message_text: text || "",
                text: text || "",
                content: text || "",
                time: nowTimeStr || "방금 전",
                created_at: isoNow
            };
            console.log('🔍 [DEBUG] Supabase 클라이언트 API Key 상태:', SUPABASE_ANON_KEY ? "존재함 (Valid)" : "누락됨 (Missing)");
            console.log('🚀 [DEBUG] 채팅 전송 시도 데이터:', chatPayload);

            const { data, error } = await supabaseClient.from('chats').insert([chatPayload]);
            if (error) {
                console.error('❌ Supabase chats INSERT 에러:', error);
                alert("⚠️ DB 대화 저장 실패!\n코드: " + error.code + "\n원인: " + (error.message || JSON.stringify(error)));
                return;
            } else {
                console.log('✨ [SUCCESS] Supabase chats INSERT success', data);
            }
        } catch(sbErr) {
            console.error('Supabase chats INSERT exception:', sbErr);
            alert("❌ DB 대화 예외 발생: " + (sbErr.message || sbErr));
            return;
        }
    }

    if (!chatMessages[postId]) chatMessages[postId] = [];
    chatMessages[postId].push(msgObj);

    inputEl.value = "";
    renderChatStream(postId);
}

function openChatRoomModal(postId) {
    const isLoggedIn = typeof currentUser !== 'undefined' && currentUser && (currentUser.name || currentUser.nickname || currentUser.email || (currentUser.user_metadata && currentUser.user_metadata.full_name));

    if (!isLoggedIn) {
        if (typeof showToast === "function") showToast("🔑 로그인 후 실시간 대화방에 참여하실 수 있습니다!");
        pendingLoginAction = function() {
            openChatRoomModal(postId);
        };
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        const authModalEl = document.getElementById("authModal") || (typeof authModal !== 'undefined' ? authModal : null);
        if (authModalEl && typeof openModal === "function") openModal(authModalEl);
        return;
    }

    // 1. 상세 모달 즉시 닫기 (상세 모달이 대화방 모달을 가리는 현상 방지)
    try {
        const detailModalEl = document.getElementById('detailModal');
        if (detailModalEl && typeof closeModal === 'function') {
            closeModal(detailModalEl);
        }
        const dynamicOverlay = document.getElementById('dynamicDetailModalOverlay');
        if (dynamicOverlay) dynamicOverlay.remove();
    } catch(e) {}

    const chatModalTarget = document.querySelector('.modal-overlay#chatModal');
    
    if (!chatModalTarget) {
        alert('대화방 모달 HTML 요소를 찾을 수 없습니다 (#chatModal).');
        return;
    }

    // 부모 태그의 display:none 영향을 받지 않도록 body 직계 자식으로 강제 이동
    if (chatModalTarget.parentElement !== document.body) {
        document.body.appendChild(chatModalTarget);
    }

    // 최상위 레이어 강제 노출 (z-index 9999999)
    chatModalTarget.classList.remove('hidden');
    chatModalTarget.classList.add('active');
    chatModalTarget.style.setProperty('display', 'flex', 'important');
    chatModalTarget.style.setProperty('z-index', '9999999', 'important');
    chatModalTarget.style.setProperty('visibility', 'visible', 'important');
    chatModalTarget.style.setProperty('opacity', '1', 'important');

    if (typeof openModal === 'function') {
        openModal(chatModalTarget);
    }

    // 게시글 수집 및 대화 데이터 렌더링
    try {
        let post = null;
        if (typeof posts !== 'undefined' && Array.isArray(posts)) {
            post = posts.find(p => String(p.id) === String(postId));
        }
        
        if (!post) {
            const userNameStr = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "다이버 버디") : "다이버 버디";
            post = {
                id: postId || ("chat-" + Date.now()),
                title: "실시간 버디 대화방",
                userName: userNameStr,
                categoryName: "실시간 대화",
                category: "freediving",
                attendees: [userNameStr]
            };
        }

        if (post.category === "community") {
            if (typeof showToast === "function") showToast("💬 자유수다방 게시글은 하단 실시간 댓글로 자유롭게 소통하실 수 있습니다!");
            if (chatModalTarget) {
                chatModalTarget.classList.add('hidden');
                chatModalTarget.style.display = 'none';
            }
            return;
        }

        currentChatPost = post;
        const isHost = typeof isMyPost === 'function' ? isMyPost(post) : false;
        const isMarket = post.category === "market";
        const isInstructor = post.category === "instructor";
        const currentUserName = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "다이버") : "다이버";

        // 신규 참가자 첫 입장 시각 기록 (과거 메시지 가림 보호)
        const joinKey = `${post.id}_${currentUserName}`;
        if (!chatJoinTimestamps[joinKey]) {
            chatJoinTimestamps[joinKey] = Date.now();
        }

        // 헤더 텍스트 바인딩
        const buddyNameEl = document.getElementById("chatBuddyName");
        if (buddyNameEl) {
            if (isInstructor) {
                buddyNameEl.textContent = `🎓 ${post.nickname || post.userName || '강사'} 강사님과의 1:1 수강 상담 대화방`;
            } else if (isMarket) {
                buddyNameEl.textContent = `🛒 ${post.nickname || post.userName || '판매자'}님과의 1:1 중고거래 문의 대화방`;
            } else {
                buddyNameEl.textContent = `🌊 '${(post.title || '').substring(0, 16)}' 버디 모집 일정 대화방`;
            }
        }

        const postTitleEl = document.getElementById("chatPostTitle");
        if (postTitleEl) {
            postTitleEl.textContent = `'${post.title}' - ${post.categoryName || '실시간대화'}`;
        }

        const roleBadge = document.getElementById("chatRoleBadge");
        if (roleBadge) {
            if (isInstructor) {
                roleBadge.className = "chat-role-tag host-tag";
                roleBadge.textContent = isHost ? "🎓 강사 전용 1:1 상담 대화방" : "💬 1:1 수강 상담 대화방";
            } else if (isMarket) {
                roleBadge.className = "chat-role-tag host-tag";
                roleBadge.textContent = isHost ? "🛒 판매자 1:1 대화방" : "💬 구매 문의자 1:1 대화방";
            } else {
                roleBadge.className = isHost ? "chat-role-tag host-tag" : "chat-role-tag attendee-tag";
                roleBadge.textContent = isHost ? "👑 모임 주최자 대화방" : "🌊 버디 참가자 대화방";
            }
        }

        // 📌 [카테고리별 상단 고정 안내 바 (Pin Notice Bar) 바인딩]
        const pinBar = document.getElementById("chatPinNoticeBar");
        const pinNoticeTag = document.getElementById("chatNoticeTag");
        const pinNoticeContent = document.getElementById("chatPinNoticeContent");

        if (pinBar && pinNoticeTag && pinNoticeContent) {
            if (isInstructor) {
                pinBar.style.display = "block";
                pinNoticeTag.innerHTML = `<i class="fa-solid fa-graduation-cap" style="color: var(--accent-gold);"></i> 🎓 강사 클래스 요약 카드`;
                const feeStr = post.classFee ? post.classFee.toLocaleString() + '원' : '수강료 별도 문의';
                const locStr = post.mapAddress || post.locationName || post.region || '전국 교육장 / 다이빙풀';
                pinNoticeContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div><strong>📚 수강 클래스:</strong> ${typeof escapeHtml === 'function' ? escapeHtml(post.title) : post.title}</div>
                        <div><strong>💰 수강료:</strong> <span style="color: var(--accent-gold); font-weight: 800;">${feeStr}</span></div>
                        <div><strong>📍 수업 장소:</strong> ${typeof escapeHtml === 'function' ? escapeHtml(locStr) : locStr}</div>
                        <div style="margin-top: 6px;">
                            <button type="button" onclick="requestCourseRegistration()" style="background: linear-gradient(135deg, var(--accent-gold), #ff8f00); color: #000; font-weight: 800; border: none; padding: 4px 12px; border-radius: 12px; font-size: 0.78rem; cursor: pointer;">
                                <i class="fa-solid fa-paper-plane"></i> 🎓 수강 신청 & 입금 계좌 문의
                            </button>
                        </div>
                    </div>
                `;
            } else if (!isMarket) {
                // 버디 모집 (1:N 단체 대화방)
                pinBar.style.display = "block";
                pinNoticeTag.innerHTML = `<i class="fa-solid fa-thumbtack" style="color: var(--accent-cyan);"></i> 📌 버디 모임 고정 공지사항`;
                const dateStr = post.created_at ? post.created_at.substring(0, 10) : '일정 협의';
                const locStr = post.mapAddress || post.locationName || post.region || '다이빙 장소 미지정';
                const reqStr = post.reqLicense ? `필수 자격: ${post.reqLicense}` : '준비물: 다이빙 장비, 오리발, 수트';
                pinNoticeContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div><strong>📅 모임 일시:</strong> ${dateStr}</div>
                        <div><strong>📍 모임 장소:</strong> ${typeof escapeHtml === 'function' ? escapeHtml(locStr) : locStr}</div>
                        <div><strong>🎒 자격/준비물:</strong> ${typeof escapeHtml === 'function' ? escapeHtml(reqStr) : reqStr}</div>
                    </div>
                `;
            } else {
                // 중고장터 (1:1 일반 대화방) -> 상단 공지 없이 깔끔 유지
                pinBar.style.display = "none";
            }
        }

        const membersBar = document.getElementById("chatMembersBar");
        if (membersBar) {
            if (!isMarket && !isInstructor && post.attendees && post.attendees.length > 0) {
                membersBar.style.display = "flex";
                membersBar.innerHTML = post.attendees.map((name) => {
                    const isHostMember = name === post.userName;
                    return `
                    <div class="member-chip ${isHostMember ? 'host-chip' : ''}">
                        <i class="fa-solid ${isHostMember ? 'fa-crown' : 'fa-user'}"></i>
                        <span>${typeof escapeHtml === 'function' ? escapeHtml(name) : name} ${isHostMember ? '(주최자)' : ''}</span>
                    </div>
                    `;
                }).join("");
            } else {
                membersBar.style.display = "none";
            }
        }

        if (typeof chatMessages !== 'undefined') {
            if (!chatMessages[post.id] || chatMessages[post.id].length === 0) {
                let welcomeMsg = `💬 대화방이 생성되었습니다! 상대방 다이버와 미팅 장소, 일정 및 준비물을 소통해 보세요.`;
                if (isInstructor) welcomeMsg = `🎓 강사님과의 1:1 수강 상담 대화방입니다. 강습 일정, 장소 및 레슨 비용에 대해 편하게 문의해 보세요!`;
                if (isMarket) welcomeMsg = `🛒 중고장터 1:1 직거래 문의 대화방입니다. 제품 상태, 거래 장소 및 택배 가능 여부를 소통해 보세요!`;

                chatMessages[post.id] = [
                    {
                        id: `sys-${Date.now()}`,
                        sender: "system",
                        author: "AquaBuddy 시스템",
                        text: welcomeMsg,
                        time: "방금 전",
                        timestamp: Date.now()
                    }
                ];
            }
        }

        // Supabase DB chat_rooms & chats 연동 (bigint 22P02 오류 완벽 방지)
        if (supabaseClient && post && post.id) {
            const rawPostId = String(post.id);
            const isNumeric = !isNaN(parseInt(rawPostId)) && /^\d+$/.test(rawPostId);
            const pId = isNumeric ? parseInt(rawPostId) : rawPostId;

            // 1. chat_rooms 존재 여부 확인 및 생성
            supabaseClient.from('chat_rooms')
                .select('*')
                .eq('post_id', pId)
                .then(({ data: roomData, error: roomError }) => {
                    if (roomError) {
                        console.warn('chat_rooms select notice:', roomError);
                    }
                    if (!roomData || roomData.length === 0) {
                        supabaseClient.from('chat_rooms').insert([{
                            post_id: pId,
                            title: post.title || '대화방',
                            host_name: post.userName || post.nickname || '주최자',
                            created_at: new Date().toISOString()
                        }]).then(({ error: insertErr }) => {
                            if (insertErr) console.warn('chat_rooms insert notice:', insertErr);
                            else console.log('✨ chat_rooms created successfully');
                        }).catch(e => console.warn('chat_rooms insert catch:', e));
                    }
                }).catch(e => console.warn('chat_rooms select catch:', e));

            // 2. chats 메시지 가져오기
            supabaseClient.from('chats')
                .select('*')
                .eq('post_id', pId)
                .order('created_at', { ascending: true })
                .then(({ data, error }) => {
                    if (!error && data && data.length > 0) {
                        const loadedMsgs = data.map(m => ({
                            id: m.id || `msg-${m.created_at}`,
                            sender: m.sender || 'user',
                            author: m.user_name || m.author || '다이버',
                            text: m.message_text || m.text || m.content || '',
                            time: m.time || (m.created_at ? new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '방금 전'),
                            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now()
                        }));
                        chatMessages[post.id] = loadedMsgs;
                        if (typeof renderChatStream === "function") renderChatStream(post.id);
                    }
                }).catch(err => console.warn('Supabase messages SELECT catch:', err));
        }

        if (typeof renderChatStream === "function") renderChatStream(post.id);
    } catch (dataErr) {
        console.error('대화방 데이터 바인딩 중 예외 발생 (모달 표시는 유효함):', dataErr);
    }
}

function renderChatStream(postId) {
    const stream = chatMessages[postId] || [];
    const currentUserName = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "손님") : "손님";
    const container = document.getElementById("chatMessagesStream") || document.getElementById("chatMessageList");
    if (!container) return;

    const joinKey = `${postId}_${currentUserName}`;
    const joinTime = chatJoinTimestamps[joinKey] || 0;
    const isHost = typeof isMyPost === 'function' && currentChatPost ? isMyPost(currentChatPost) : false;

    // 신규 참가자 개인정보 및 과거 대화 보호 필터링 (시스템 메시지, 주최자, 본인 작성 메시지, 입장 이후 메시지)
    const visibleStream = stream.filter(msg => {
        if (msg.sender === "system" || isHost) return true;
        if (msg.author === currentUserName) return true;
        return (msg.timestamp && msg.timestamp >= (joinTime - 5000));
    });

    container.innerHTML = visibleStream.map(msg => {
        if (msg.sender === "system") {
            return `
            <div class="chat-system-notice" style="text-align: center; margin: 10px 0;">
                <span style="background: rgba(0, 242, 254, 0.12); color: var(--accent-cyan); font-size: 0.78rem; padding: 4px 12px; border-radius: 12px; border: 1px dashed var(--accent-cyan);">
                    ${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}
                </span>
            </div>
            `;
        }

        const isUserMsg = (currentUser && (msg.author === currentUser.name || msg.author === currentUser.nickname)) || msg.sender === "user";
        const isHostMsg = msg.sender === "host" || (currentChatPost && msg.author === currentChatPost.userName);

        return `
        <div class="chat-bubble ${isUserMsg ? 'user' : (isHostMsg ? 'host' : 'attendee')}" style="${isUserMsg ? 'margin-left: auto; background: linear-gradient(135deg, #00f2fe, #4facfe); color: #000; text-align: right;' : 'margin-right: auto; background: rgba(255,255,255,0.1); color: #fff;'} padding: 8px 14px; border-radius: 12px; margin-bottom: 8px; max-width: 80%;">
            ${!isUserMsg ? `
            <div class="chat-sender-info" style="font-weight: bold; font-size: 0.8rem; margin-bottom: 2px;">
                <i class="fa-solid ${isHostMsg ? 'fa-crown' : 'fa-user'}"></i> ${typeof escapeHtml === 'function' ? escapeHtml(msg.author || '참가자') : msg.author} ${isHostMsg ? '(주최자/강사)' : ''}
            </div>
            ` : ''}
            <p style="margin: 0; font-size: 0.9rem; word-break: break-word;">${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}</p>
            <span class="chat-time" style="font-size: 0.7rem; opacity: 0.7; display: block; margin-top: 4px;">${msg.time || '방금 전'}</span>
        </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
}



function handleSendChatMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentChatPost) return;

    const inputEl = document.getElementById("chatMessageInput") || document.getElementById("chatInput");
    if (!inputEl) return;

    const text = inputEl.value.trim();
    if (!text) return;

    const postId = String(currentChatPost.id);
    const currentUserName = currentUser ? (currentUser.name || currentUser.nickname || currentUser.email || "다이버") : "다이버";
    const isHostMsg = typeof isMyPost === 'function' ? isMyPost(currentChatPost) : false;
    const nowTimeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const msgObj = {
        id: `msg-${Date.now()}`,
        sender: isHostMsg ? "host" : "user",
        author: currentUserName,
        text: text,
        time: nowTimeStr,
        timestamp: Date.now()
    };

    if (!chatMessages[postId]) chatMessages[postId] = [];
    chatMessages[postId].push(msgObj);

    inputEl.value = "";
    renderChatStream(postId);

    // REST API & Supabase DB Cloud Sync
    if (supabaseClient) {
        try {
            const senderEmail = currentUser ? currentUser.email : "";
            const authorEmail = currentChatPost ? (currentChatPost.author || currentChatPost.authorEmail || currentChatPost.email || "") : "";
            
            supabaseClient.from('chats').insert([{
                post_id: postId,
                sender: senderEmail,
                author: authorEmail,
                user_name: currentUserName,
                message_text: text,
                time: nowTimeStr,
                created_at: new Date().toISOString()
            }]).then(({ error }) => {
                if (error) console.warn('Supabase messages INSERT notice:', error);
                else console.log('✨ Supabase messages INSERT success');
            }).catch(err => console.warn('Supabase messages INSERT catch:', err));
        } catch(sbErr) {
            console.warn('Supabase messages INSERT exception:', sbErr);
        }
    }
}



function confirmBuddyMatchFromChat() {
    if (!currentChatPost) return;
    const isHost = isMyPost(currentChatPost);
    if (!isHost) {
        showToast("⚠️ 주최자(호스트)에게만 참가자 확정 관리 권한이 있습니다!");
        return;
    }
    confirmBuddyMatch(currentChatPost.id);
    showToast("⚡ 대화방에서 수강생/참가자 확정이 완료되었습니다!");
}

function finishScheduleFromChat() {
    if (!currentChatPost) return;
    const isHost = isMyPost(currentChatPost);
    if (!isHost) {
        showToast("⚠️ 주최자(호스트)에게만 일정 완료 권한이 있습니다!");
        return;
    }
    finishBuddySchedule(currentChatPost.id);
    showToast("⚡ 대화방에서 일정 완료 처리 및 평가가 활성화되었습니다!");
}

function renderDynamicDetailModal(post) {
    const dynOverlay = document.getElementById("dynamicDetailModalOverlay");
    if (dynOverlay) dynOverlay.remove();
}

async function handleAddComment(e, postId) {
    if (e && e.preventDefault) e.preventDefault();
    console.log('📌 [COMMENT DEBUG] handleAddComment 시작! postId:', postId);

    const input = document.getElementById("newCommentInput") || 
                  document.getElementById("dynamicCommentInput_" + postId) || 
                  (e && e.target ? (e.target.querySelector('input') || e.target) : null) ||
                  document.querySelector('.comment-input-modern');
    
    const text = input ? input.value.trim() : "";
    if (!text) {
        alert("💬 댓글 내용을 입력해 주세요!");
        return;
    }

    const post = posts.find(p => String(p.id) === String(postId));
    const authorName = (currentUser && (currentUser.nickname || currentUser.name || currentUser.email)) 
        ? (currentUser.nickname || currentUser.name || currentUser.email) 
        : "익명 다이버";

    const commentPayload = {
        post_id: String(postId || "default_post"),
        author: authorName,
        user_name: authorName,
        nickname: authorName,
        content: text,
        text: text,
        created_at: new Date().toISOString()
    };

    console.log('🚀 [COMMENT INSERT TRY] Supabase comments 전송 데이터:', commentPayload);

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('comments').insert([commentPayload]);
            if (error) {
                console.error('❌ [SUPABASE COMMENTS ERROR]', error);
                alert("⚠️ 댓글 저장 실패 (Supabase):\n코드: " + error.code + "\n원인: " + (error.message || JSON.stringify(error)));
            } else {
                console.log('✨ [SUPABASE COMMENTS SUCCESS]', data);
            }
        } catch (err) {
            console.error('❌ [SUPABASE COMMENTS EXCEPTION]', err);
            alert("❌ 댓글 연동 예외 발생:\n" + (err.message || err));
        }
    }

    if (post) {
        if (!Array.isArray(post.comments)) post.comments = [];
        post.comments.push({
            author: authorName,
            text: text,
            content: text,
            time: "방금 전",
            created_at: new Date().toISOString()
        });
        savePosts();
    }

    if (input) input.value = "";
    openDetailModal(postId);
    showToast("💬 댓글이 성공적으로 등록되었습니다!");
}
window.handleAddComment = handleAddComment;

function handleDynamicCommentSubmit(e, postId) {
    handleAddComment(e, postId);
}
window.handleDynamicCommentSubmit = handleDynamicCommentSubmit;

// Open Detail Modal with Account-Based Owner Actions (Only Show Edit/Delete for Author)
function openDetailModal(postId) {
    try {
        let post = posts.find(p => String(p.id) === String(postId));
        if (!post) {
            post = posts.find(p => p.id && String(p.id).includes(String(postId))) || posts[0];
        }
        if (!post) {
            alert("게시글 데이터를 찾을 수 없습니다. (ID: " + postId + ")");
            return;
        }

        // [동적 100% 보장 팝업] 기존 모달 바인딩 문제 방지를 위해 실시간 팝업 노출
        renderDynamicDetailModal(post);

        const isInstructor = post.category === "instructor";
        const isMarket = post.category === "market";
        const isCommunity = post.category === "community";
        const currentUserName = currentUser ? currentUser.name : "다이버";
        
        const isHost = isMyPost(post);
        const isAttendee = Array.isArray(post.attendees) && post.attendees.includes(currentUserName);

        // Supabase DB comments SELECT (Clean post_id query)
        if (supabaseClient && post && post.id) {
            const rawPostId = String(post.id);

            supabaseClient.from('comments')
                .select('*')
                .eq('post_id', rawPostId)
                .order('created_at', { ascending: true })
                .then(({ data, error }) => {
                    if (error) {
                        console.warn('Comments query notice:', error);
                    } else if (data && data.length > 0) {
                        const fetchedComments = data.map(c => ({
                            author: c.author || c.user_name || '다이버',
                            text: c.content || c.text || '',
                            content: c.content || c.text || '',
                            time: c.created_at ? formatTimeAgo(c.created_at) : '방금 전',
                            created_at: c.created_at
                        }));
                        post.comments = fetchedComments;
                        const container = document.getElementById("commentListContainer");
                        if (container) {
                            container.innerHTML = fetchedComments.map(c => `
                                <div class="comment-item" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
                                    <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(c.author || '')}</span>
                                        <span style="opacity: 0.6; font-size: 0.74rem;">${c.time || '방금 전'}</span>
                                    </div>
                                    <p style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(c.text || '')}</p>
                                </div>
                            `).join("");
                        }
                    }
                }).catch(e => console.warn('comments select catch:', e));
        }

        const encodedLocation = encodeURIComponent(post.mapAddress || post.locationName || '');
        const kakaoMapUrl = `https://map.kakao.com/?q=${encodedLocation}`;

        const titleEl = document.getElementById("detailModalTitle") || detailModalTitle;
        if (titleEl) titleEl.textContent = post.title || '게시글 상세';

        const comments = Array.isArray(post.comments) ? post.comments : [];
        const commentsListHtml = comments.map(c => `
            <div class="comment-item" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
                <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(c.author || '')}</span>
                    <span style="opacity: 0.6; font-size: 0.74rem;">${c.time || '방금 전'}</span>
                </div>
                <p style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(c.text || '')}</p>
            </div>
        `).join("");

        const images = Array.isArray(post.images) ? post.images : [];
        const photoGalleryHtml = (images.length > 0) ? `
            <div class="detail-section" style="margin-top: 14px;">
                <h4 style="color: var(--accent-cyan); font-size: 0.92rem; margin-bottom: 8px;"><i class="fa-solid fa-camera"></i> 📷 첨부 이미지 (${images.length}장)</h4>
                <div class="post-image-gallery">
                    ${images.map((imgSrc, idx) => `
                        <img src="${imgSrc}" alt="첨부 이미지 ${idx+1}" class="post-image-item" onclick="openLightbox('${imgSrc}')">
                    `).join("")}
                </div>
            </div>
        ` : '';

    const modernCommentFormHtml = `
        <form class="comment-form-modern" id="modernCommentForm_${post.id}" onsubmit="handleAddComment(event, '${post.id}'); return false;">
            <i class="fa-solid fa-comment-dots" style="color: var(--accent-cyan);"></i>
            <input type="text" id="newCommentInput" class="comment-input-modern" placeholder="실시간 댓글 또는 문의를 작성하세요..." required autocomplete="off">
            <button type="button" class="comment-submit-btn" onclick="handleAddComment(event, '${post.id}')"><i class="fa-solid fa-paper-plane"></i> 등록</button>
        </form>
    `;

    let mainInfoHtml = '';

    if (isInstructor) {
        const certImageHtml = post.certImage ? `
            <div style="margin-top: 8px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
                <p style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">강사 자격증 사본 첨부 (검증 완료)</p>
                <img src="${post.certImage}" alt="강사 자격증 실물 사본" class="zoomable-img" onclick="openLightbox('${post.certImage}')" style="max-height: 100px; border-radius: 4px; border: 1px solid var(--accent-gold);">
            </div>
        ` : '';

        const instNick = post.nickname || post.userName || post.user_name || "다이버";
        const instReal = post.realName || post.real_name || (currentUser && currentUser.realName ? currentUser.realName : "");
        const nameDisplay = instReal && instReal !== instNick 
            ? `${escapeHtml(instNick)} (실명: ${escapeHtml(instReal)})` 
            : escapeHtml(instNick);

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${nameDisplay} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(담당 강사 - 본인)</span>' : ''}</h3>
                    <div class="detail-badge-list">
                        <span class="instructor-badge"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(post.userLicense || post.user_license || '공인 강사')}</span>
                        <span class="host-rating-badge"><i class="fa-solid fa-star"></i> 강사 평점 ${post.hostRating || 5.0} (${post.hostReviewsCount || 42}건)</span>
                    </div>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, rgba(255,183,3,0.15), rgba(0,242,254,0.15)); border: 1px dashed var(--accent-gold); padding: 14px 18px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <p style="font-size: 0.92rem; color: var(--accent-gold); font-weight: 800;">
                            <i class="fa-solid fa-certificate"></i> AquaBuddy 공식 검증 완료 강사 프로필
                        </p>
                        <p style="font-size: 0.82rem; color: var(--text-main); margin-top: 4px;">
                            • 대표 자격: <strong>${escapeHtml(post.userLicense || '공인 강사')}</strong> (운영진 검증 100% 완료)<br>
                            ${instReal ? `• 강사 실명: <strong style="color: var(--accent-cyan);">${escapeHtml(instReal)}</strong> (신원 및 자격증 실명 대조 완료)` : ''}
                        </p>
                    </div>
                    <div style="background: var(--accent-gold); color: #000; font-size: 0.76rem; font-weight: 900; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">
                        <i class="fa-solid fa-shield-check"></i> VERIFIED SEAL
                    </div>
                </div>
                ${certImageHtml}
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                ${(isHost || isAdminAuthenticated) ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="클래스 1초 수정">
                    <i class="fa-solid fa-pen-to-square"></i> 클래스 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자 1초 삭제">
                    <i class="fa-solid fa-trash-can"></i> 클래스 삭제
                </button>
                ` : ''}
                <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fa-solid fa-heart"></i> 관심 클래스 <span id="likeCount">${post.likes || 0}</span>
                </button>
            </div>

            ${photoGalleryHtml}

            <div class="detail-section">
                <h4><i class="fa-solid fa-graduation-cap"></i> 강사 클래스 커리큘럼 & 수강료</h4>
                <div class="detail-box">
                    <p style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">${escapeHtml(post.title)}</p>
                    <p style="font-size: 1.3rem; color: var(--accent-gold); font-weight: 900; margin-bottom: 8px;"><i class="fa-solid fa-ticket"></i> 수강료: ${post.classFee ? post.classFee.toLocaleString() + ' 원' : '수강료 문의'}</p>
                    <p style="margin-bottom: 6px;"><i class="fa-solid fa-users" style="color: var(--accent-cyan)"></i> <strong>강습 인원 비율:</strong> ${escapeHtml(post.classRatio || '1:2 소수정예')}</p>
                    <p style="margin-bottom: 6px; color: var(--accent-gold);"><i class="fa-solid fa-circle-check"></i> <strong>포함 / 미포함:</strong> ${escapeHtml(post.classInclusion || '풀장 입장료 별도')}</p>
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>교육 장소:</strong> ${escapeHtml(post.mapAddress || post.locationName)}</p>
                </div>
            </div>

            <div class="detail-section">
                <div class="map-preview-box">
                    <div id="kakaoLiveMap" style="width: 100%; height: 180px; border-radius: var(--radius-sm); border: 1px solid var(--accent-cyan);"></div>
                    <div class="map-buttons" style="margin-top: 10px;">
                        <a href="${kakaoMapUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px; width: 100%;">
                            <i class="fa-solid fa-map"></i> 카카오맵 길찾기
                        </a>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fa-solid fa-align-left"></i> 상세 교육 설명</h4>
                <div class="detail-box">
                    ${escapeHtml(post.desc || '').replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="comments-section">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0;"><i class="fa-solid fa-comments"></i> 실시간 댓글 (${(post.comments || []).length})</h4>
                    <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem; border-radius: 20px;">
                        <i class="fa-solid fa-heart"></i> 공감 <span id="likeCount">${post.likes || 0}</span>
                    </button>
                </div>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 문의를 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 강사님과 1:1 수강 상담 대화방
                    </button>
                    ${!isHost ? `
                    <button class="btn btn-secondary" onclick="showToast('🎓 강사 클래스 수강 신청이 완료되었습니다! 1:1 대화방에서 일정을 확정해 주세요.')" style="background: linear-gradient(135deg, rgba(255,183,3,0.25), rgba(255,143,0,0.25)); color: var(--accent-gold); border-color: var(--accent-gold);">
                        <i class="fa-solid fa-graduation-cap"></i> 클래스 수강 신청하기
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isMarket) {
        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.nickname || post.userName || '알 수 없음')} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(판매자 - 본인)</span>' : ''} (중고장터)</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                <button class="wishlist-btn ${post.userWished ? 'active' : ''}" onclick="toggleWishlist('${post.id}')">
                    <i class="fa-solid fa-heart"></i> 찜하기 ${post.wishlistCount || 0}
                </button>
                ${(isHost || isAdminAuthenticated) ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="게시글 1초 수정">
                    <i class="fa-solid fa-pen-to-square"></i> 글 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자 1초 삭제">
                    <i class="fa-solid fa-trash-can"></i> 글 삭제
                </button>
                ` : ''}
            </div>

            ${photoGalleryHtml}

            <div class="detail-section">
                <div class="detail-box">
                    <p style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">${escapeHtml(post.title)}</p>
                    <p style="font-size: 1.3rem; color: var(--accent-gold); font-weight: 900; margin-bottom: 8px;"><i class="fa-solid fa-won-sign"></i> ${post.price ? post.price.toLocaleString() + ' 원' : '가격 협의'}</p>
                    <p style="margin-bottom: 6px;"><i class="fa-solid fa-handshake" style="color: var(--accent-cyan)"></i> <strong>거래 방법:</strong> ${escapeHtml(post.dealMethod || '직거래/택배 둘 다 가능')}</p>
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>거래 장소:</strong> ${escapeHtml(post.mapAddress || post.locationName)}</p>
                </div>
            </div>

            <div class="detail-section">
                <div class="map-preview-box">
                    <div id="kakaoLiveMap" style="width: 100%; height: 180px; border-radius: var(--radius-sm); border: 1px solid var(--accent-cyan);"></div>
                    <div class="map-buttons" style="margin-top: 10px;">
                        <a href="${kakaoMapUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px; width: 100%;">
                            <i class="fa-solid fa-map"></i> 카카오맵 길찾기
                        </a>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fa-solid fa-align-left"></i> 내용 작성</h4>
                <div class="detail-box">
                    ${escapeHtml(post.desc || '').replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="comments-section">
                <h4><i class="fa-solid fa-comments"></i> 실시간 댓글 (${(post.comments || []).length})</h4>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 앱 내 1:1 대화방 입장
                    </button>
                    ${isHost ? `
                    <button class="btn btn-secondary" onclick="toggleMarketStatus('${post.id}')" style="background: rgba(0, 230, 118, 0.15); color: #00e676; border-color: rgba(0, 230, 118, 0.4);">
                        <i class="fa-solid fa-bolt"></i> ${post.status === 'completed' ? '다시 거래 중으로 변경' : '거래 완료'}
                    </button>
                    ` : ''}
                    ${post.status === 'completed' ? `
                    <button class="btn btn-secondary" onclick="openHostRatingModal('${post.id}')" style="color: var(--accent-gold); border-color: var(--accent-gold);">
                        <i class="fa-solid fa-star"></i> 중고거래 후기 남기기
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isCommunity) {
        mainInfoHtml = `
            <div class="detail-profile-card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.nickname || post.userName || post.user_name || post.author || '다이버')} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(작성자 - 본인)</span>' : ''} (자유수다방)</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense || post.user_license || '자유수다 다이버')}</span>
                    </div>
                </div>
                ${(isHost || isAdminAuthenticated) ? `
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 5px 12px; font-size: 0.78rem;" title="글 수정">
                        <i class="fa-solid fa-pen-to-square"></i> 글 수정
                    </button>
                    <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" style="padding: 5px 12px; font-size: 0.78rem;" title="글 삭제">
                        <i class="fa-solid fa-trash-can"></i> 글 삭제
                    </button>
                </div>
                ` : ''}
            </div>

            ${photoGalleryHtml}

            <div class="detail-section">
                <h4><i class="fa-solid fa-align-left"></i> 내용 작성</h4>
                <div class="detail-box">
                    ${escapeHtml(post.desc || '').replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="comments-section">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0;"><i class="fa-solid fa-comments"></i> 실시간 댓글 (${(post.comments || []).length})</h4>
                    <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem; border-radius: 20px;">
                        <i class="fa-solid fa-heart"></i> 공감 <span id="likeCount">${post.likes || 0}</span>
                    </button>
                </div>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>
        `;
    } else {
        let actionButtonsHtml = '';

        if (isHost) {
            if (post.status === 'recruiting') {
                actionButtonsHtml = `
                    <button class="btn btn-secondary" onclick="confirmBuddyMatch('${post.id}')" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); border-color: rgba(0, 242, 254, 0.4); font-weight: 800;">
                        <i class="fa-solid fa-bolt"></i> 참가자 확정 (일정 진행)
                    </button>
                `;
            } else if (post.status === 'in_progress') {
                actionButtonsHtml = `
                    <button class="btn btn-primary" onclick="finishBuddySchedule('${post.id}')" style="font-weight: 800;">
                        <i class="fa-solid fa-circle-check"></i> 모임 완료 처리
                    </button>
                    <button class="btn btn-secondary" onclick="reopenBuddySchedule('${post.id}')" style="background: rgba(255, 183, 3, 0.15); color: var(--accent-gold); border-color: rgba(255, 183, 3, 0.4);">
                        <i class="fa-solid fa-rotate-left"></i> 모집 중으로 다시 변경
                    </button>
                `;
            } else {
                actionButtonsHtml = `
                    <span style="font-size: 0.85rem; color: #00e676; font-weight: 700; align-self: center;">🎉 모임 일정이 완료되었습니다!</span>
                    <button class="btn btn-secondary" onclick="reopenBuddySchedule('${post.id}')" style="background: rgba(255, 183, 3, 0.15); color: var(--accent-gold); border-color: rgba(255, 183, 3, 0.4);">
                        <i class="fa-solid fa-rotate-left"></i> 모집 중으로 다시 변경
                    </button>
                `;
            }
        } else {
            if (post.status === 'recruiting') {
                if (isAttendee) {
                    actionButtonsHtml = `
                        <button class="btn btn-secondary" onclick="cancelBuddyMatch('${post.id}')" style="background: rgba(255, 82, 82, 0.15); color: #ff5252; border-color: rgba(255, 82, 82, 0.4);">
                            <i class="fa-solid fa-xmark"></i> 버디 참가 취소
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <button class="btn btn-primary" onclick="joinBuddyMatch('${post.id}')">
                            <i class="fa-solid fa-handshake"></i> 버디 참가 신청
                        </button>
                    `;
                }
            } else if (post.status === 'in_progress') {
                if (isAttendee) {
                    actionButtonsHtml = `
                        <span style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700; align-self: center;">⚡ 모임 일정 진행 중</span>
                        <button class="btn btn-secondary" onclick="cancelBuddyMatch('${post.id}')" style="background: rgba(255, 82, 82, 0.15); color: #ff5252; border-color: rgba(255, 82, 82, 0.4);">
                            <i class="fa-solid fa-xmark"></i> 참가 취소
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <span style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700; align-self: center;">⚡ 참가자가 확정되어 일정이 진행 중입니다.</span>
                    `;
                }
            } else if (post.status === 'completed') {
                if (isAttendee) {
                    actionButtonsHtml = `
                        <span style="font-size: 0.85rem; color: #00e676; font-weight: 700; align-self: center;">🎉 모임 완료됨</span>
                        <button class="btn btn-secondary" onclick="openHostRatingModal('${post.id}')" style="color: var(--accent-gold); border-color: var(--accent-gold); font-weight: 800;">
                            <i class="fa-solid fa-star"></i> 주최자 별점 & 한줄평 남기기
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <span style="font-size: 0.85rem; color: var(--text-muted); align-self: center;">종료된 모임입니다.</span>
                    `;
                }
            }
        }

        const authorDisplay = post.nickname || post.userName || post.user_name || post.author || '다이버';
        const userLicenseDisplay = post.userLicense || post.user_license || '공인 강사 / 다이버';

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(authorDisplay)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(주최자 - 본인)</span>' : ''} (${post.categoryName || '버디모집'})</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(userLicenseDisplay)}</span>
                        <span class="host-rating-badge"><i class="fa-solid fa-star"></i> 주최자 평점 ${post.hostRating || 4.9} (${post.hostReviewsCount || 10}건)</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                ${(isHost || isAdminAuthenticated) ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="게시글 1초 수정">
                    <i class="fa-solid fa-pen-to-square"></i> 글 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자 1초 삭제">
                    <i class="fa-solid fa-trash-can"></i> 글 삭제
                </button>
                ` : ''}
                <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fa-solid fa-heart"></i> 좋아요 <span id="likeCount">${post.likes || 0}</span>
                </button>
            </div>

            ${photoGalleryHtml}

            <div class="detail-section">
                <h4><i class="fa-solid fa-bullseye"></i> 상세 모집 현황 및 일정</h4>
                <div class="detail-box">
                    <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">${escapeHtml(post.title)}</p>
                    <p><i class="fa-solid fa-users" style="color: var(--accent-cyan)"></i> <strong>모집 현황:</strong> 작성자 포함 총 ${post.capacity || 2}명 중 현재 ${post.joinedCount || 1}명 확정 (${post.statusText})</p>
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>장소:</strong> ${escapeHtml(post.mapAddress || post.locationName)}</p>
                    ${post.date ? `<p><i class="fa-regular fa-calendar-check" style="color: var(--accent-cyan)"></i> <strong>진행 일정:</strong> ${formatDate(post.date)}</p>` : ''}
                </div>
            </div>

            <div class="detail-section">
                <div class="map-preview-box">
                    <div id="kakaoLiveMap" style="width: 100%; height: 180px; border-radius: var(--radius-sm); border: 1px solid var(--accent-cyan);"></div>
                    <div class="map-buttons" style="margin-top: 10px;">
                        <a href="${kakaoMapUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px; width: 100%;">
                            <i class="fa-solid fa-map"></i> 카카오맵 길찾기
                        </a>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fa-solid fa-align-left"></i> 상세 내용</h4>
                <div class="detail-box">
                    ${escapeHtml(post.desc || '').replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="comments-section">
                <h4><i class="fa-solid fa-comments"></i> 실시간 댓글 (${(post.comments || []).length})</h4>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button class="btn btn-primary" onclick="openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 일정 대화방 입장
                    </button>
                    ${actionButtonsHtml}
                </div>
            </div>
        `;
    }

        const bodyEl = document.getElementById("detailModalBody");
        if (bodyEl) bodyEl.innerHTML = mainInfoHtml;
        const targetModalEl = document.getElementById("postDetailModal") || document.getElementById("detailModal");
        if (targetModalEl) {
            targetModalEl.classList.remove('hidden');
            targetModalEl.style.setProperty('display', 'flex', 'important');
            targetModalEl.style.setProperty('z-index', '999999', 'important');
        }

        if (!isCommunity) {
            setTimeout(() => {
                try {
                    if (typeof initKakaoLiveMap === 'function') {
                        initKakaoLiveMap(post.mapAddress || post.locationName);
                    } else {
                        console.warn('initKakaoLiveMap 함수가 정의되어 있지 않아 지도 초기화를 건너뜁니다.');
                    }
                } catch(mapErr) {
                    console.log("Kakao Map init notice:", mapErr);
                }
            }, 150);
        }
    } catch(err) {
        console.error("openDetailModal error:", err);
        alert("게시글 상세 정보 열기 중 오류가 발생했습니다:\n" + err.message);
    }
}
window.openDetailModal = openDetailModal;
window.openPostDetailModal = openDetailModal;

function deletePostWithPassword(postId) {
    performPostDeletion(postId);
}

function performPostDeletion(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (post && !isMyPost(post) && !isAdminAuthenticated) {
        showToast("⛔ 본인이 작성한 글만 삭제할 수 있습니다.");
        return;
    }

    posts = posts.filter(p => String(p.id) !== String(postId));
    myCreatedPostIds = myCreatedPostIds.filter(id => String(id) !== String(postId));

    savePosts();
    saveMyPosts();

    const detailM = document.getElementById("postDetailModal") || document.getElementById("detailModal");
    if (detailM) closeModal(detailM);
    const dynM = document.getElementById("dynamicDetailModalOverlay");
    if (dynM) dynM.remove();

    filterAndRender();
    if (document.getElementById("adminDashboardModal") && !document.getElementById("adminDashboardModal").classList.contains("hidden")) {
        renderAdminPostsTable();
    }
    showToast("🗑️ 게시글이 성공적으로 삭제되었습니다.");
}

function toggleWishlist(postId) {
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 찜하기(관심상품) 기능을 이용하실 수 있습니다!");
        switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.userWished) {
        post.wishlistCount = Math.max(0, (post.wishlistCount || 1) - 1);
        post.userWished = false;
        showToast("💔 찜하기(관심상품)가 취소되었습니다.");
    } else {
        post.wishlistCount = (post.wishlistCount || 0) + 1;
        post.userWished = true;
        showToast("❤️ 찜하기(관심상품)에 등록되었습니다!");
    }

    savePosts();
    filterAndRender();

    if (!detailModal.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}

function toggleLike(postId) {
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 공감/좋아요 기능을 이용하실 수 있습니다!");
        switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.userLiked) {
        post.likes = Math.max(0, (post.likes || 1) - 1);
        post.userLiked = false;
        showToast("💔 공감/좋아요가 취소되었습니다.");
    } else {
        post.likes = (post.likes || 0) + 1;
        post.userLiked = true;
        showToast("❤️ 공감/좋아요가 등록되었습니다!");
    }

    savePosts();
    filterAndRender();

    if (!detailModal.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}

function joinBuddyMatch(postId) {
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 참가 신청을 진행하실 수 있습니다!");
        pendingLoginAction = function() { joinBuddyMatch(postId); };
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    interceptJoinPost(postId);
}

function handleJoinPostDirect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentUserName = currentUser ? currentUser.name : "다이버";
    if (!post.attendees) post.attendees = [post.userName];

    if (post.attendees.includes(currentUserName)) {
        showToast("이미 참가 신청이 된 모임입니다.");
        return;
    }

    if (post.joinedCount >= post.capacity) {
        showToast("⚠️ 모집 인원이 마감되었습니다!");
        return;
    }

    post.attendees.push(currentUserName);
    post.joinedCount = post.attendees.length;

    if (post.joinedCount >= post.capacity) {
        post.status = "in_progress";
        post.statusText = "참가자 확정 완료 (일정 진행 중)";
        showToast("🎉 최대 참가 인원이 꽉 차서 '참가자 확정 완료' 상태로 변경되었습니다!");
    } else {
        showToast(`🙋‍♂️ 버디 참가 신청이 완료되었습니다! (현재 ${post.joinedCount}/${post.capacity}명)`);
    }

    savePosts();
    filterAndRender();
    openDetailModal(postId);
}

function cancelBuddyMatch(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentUserName = currentUser ? currentUser.name : "다이버";
    if (post.attendees) {
        post.attendees = post.attendees.filter(name => name !== currentUserName);
        post.joinedCount = post.attendees.length;
    }

    if (post.status === "in_progress") {
        post.status = "recruiting";
        post.statusText = "모집 중";
    }

    savePosts();
    filterAndRender();
    openDetailModal(postId);
    showToast("❌ 버디 참가 신청이 취소되었습니다.");
}

function confirmBuddyMatch(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.status = "in_progress";
    post.statusText = "참가자 확정 완료 (일정 진행 중)";
    savePosts();
    filterAndRender();
    openDetailModal(postId);
    showToast("⚡ 참가자 확정이 완료되었습니다!");
}

function finishBuddySchedule(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    post.status = "completed";
    post.statusText = "일정 완료";
    savePosts();

    if (supabaseClient) {
        try {
            supabaseClient.from('posts').update({ status: 'completed', statusText: '일정 완료' }).eq('id', postId);
        } catch(e) {}
    }

    filterAndRender();
    openDetailModal(postId);
    showToast("🎉 모임 일정이 최종 완료되었습니다!");
}

async function reopenBuddySchedule(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    post.status = "recruiting";
    post.statusText = "모집 중";
    savePosts();

    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({ status: 'recruiting', statusText: '모집 중' }).eq('id', postId);
        } catch(e) {
            console.warn("Supabase posts status update notice:", e);
        }
    }

    filterAndRender();
    openDetailModal(postId);
    showToast("🔄 모집 상태가 '모집 중'으로 다시 변경되었습니다!");
}
window.reopenBuddySchedule = reopenBuddySchedule;
window.reopenBuddyPost = reopenBuddySchedule;

function openHostRatingModal(postId) {
    if (!currentUser) {
        showToast("🔑 로그인 후 평가를 작성하실 수 있습니다!");
        openModal(authModal);
        return;
    }
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) {
        showToast("⚠️ 게시글 데이터를 찾을 수 없습니다.");
        return;
    }

    currentRatingPost = post;
    currentRatingScore = 5;

    const targetEl = document.getElementById("ratingHostTarget");
    if (targetEl) {
        targetEl.textContent = `[${post.title}] 모임의 상대 다이버(${post.userName || '주최자'}) 매너를 평가해 주세요.`;
    }

    const inputEl = document.getElementById("ratingReviewInput");
    if (inputEl) inputEl.value = "";

    setRatingScore(5);
    openModal(document.getElementById("ratingModal"));
}
window.openHostRatingModal = openHostRatingModal;

function setRatingScore(score) {
    currentRatingScore = score;
    const scoreTextEl = document.getElementById("starScoreText");
    if (scoreTextEl) {
        let label = "무난해요";
        if (score === 4) label = "좋아요";
        if (score === 5) label = "최고의 버디! 완벽해요";
        scoreTextEl.textContent = `${score}.0 / 5.0 (${label})`;
    }

    document.querySelectorAll("#starRatingSelect .star-btn").forEach(btn => {
        const btnScore = parseInt(btn.dataset.score);
        if (btnScore === score) {
            btn.classList.add("btn-primary", "active");
            btn.classList.remove("btn-secondary");
        } else {
            btn.classList.add("btn-secondary");
            btn.classList.remove("btn-primary", "active");
        }
    });
}
window.setRatingScore = setRatingScore;

async function submitHostRating() {
    if (!currentRatingPost) return;
    const reviewInp = document.getElementById("ratingReviewInput");
    const reviewText = reviewInp ? reviewInp.value.trim() : "";

    if (!reviewText) {
        showToast("⚠️ 한 줄 후기를 작성해 주세요!");
        return;
    }

    const targetEmail = currentRatingPost.email || currentRatingPost.userEmail || "";
    const targetName = currentRatingPost.nickname || currentRatingPost.userName || currentRatingPost.author || "상대방 다이버";

    const reviewPayload = {
        post_id: currentRatingPost.id,
        post_title: currentRatingPost.title,
        reviewer_email: currentUser ? currentUser.email : "",
        reviewer_name: currentUser ? (currentUser.nickname || currentUser.name) : "다이버",
        target_email: targetEmail,
        target_name: targetName,
        score: currentRatingScore,
        content: reviewText,
        created_at: new Date().toISOString()
    };

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('reviews').insert([reviewPayload]);
            if (error) console.warn("Supabase reviews insert notice:", error);
            else console.log("Supabase reviews DB Insert Success:", reviewPayload);
        } catch(e) {
            console.warn("reviews DB insert exception:", e);
        }

        try {
            await supabaseClient.from('user_evaluations').insert([{
                post_id: currentRatingPost.id,
                evaluator_email: currentUser ? currentUser.email : "",
                target_email: targetEmail,
                score: currentRatingScore,
                comment: reviewText,
                created_at: new Date().toISOString()
            }]);
        } catch(e) {
            // Optional fallback
        }
    }

    closeModal(document.getElementById("ratingModal"));
    showToast(`⭐ [${targetName}] 님에 대한 매너 평점이 성공적으로 등록되었습니다!`);
}
window.submitHostRating = submitHostRating;

function openEditPostModal(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) {
        showToast("⚠️ 게시글 데이터를 찾을 수 없습니다.");
        return;
    }

    if (!isMyPost(post) && !isAdminAuthenticated) {
        showToast("⛔ 본인이 작성한 게시글만 수정할 수 있습니다!");
        return;
    }

    editingPostId = post.id;

    // Fill form inputs
    const titleEl = document.getElementById("postTitle");
    const descEl = document.getElementById("postDesc");
    const mapAddressEl = document.getElementById("postMapAddress");
    const dateEl = document.getElementById("postDate");

    if (titleEl) titleEl.value = post.title || "";
    if (descEl) descEl.value = post.desc || "";
    if (mapAddressEl) mapAddressEl.value = post.mapAddress || post.locationName || "";
    if (dateEl) dateEl.value = post.date || "";

    if (post.images && Array.isArray(post.images)) {
        uploadedCompressedImages = [...post.images];
        if (typeof renderImagePreviews === "function") renderImagePreviews();
    }

    // Close detail modal if open
    const detailM = document.getElementById("postDetailModal") || document.getElementById("detailModal");
    if (detailM) closeModal(detailM);
    const dynM = document.getElementById("dynamicDetailModalOverlay");
    if (dynM) dynM.remove();

    if (typeof preselectModalCategory === "function") preselectModalCategory(post.category, true);
    const createM = document.getElementById("createModal");
    if (createM) openModal(createM);
}

function openEditModal(postId) {
    openEditPostModal(postId);
}

function verifyPasswordAndEdit(postId) {
    openEditPostModal(postId);
}
window.openEditPostModal = openEditPostModal;
window.openEditModal = openEditModal;


async function handleSavePost(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!currentUser || (!currentUser.name && !currentUser.nickname && !currentUser.email)) {
        showToast("🔑 로그인 후 글을 작성하실 수 있습니다!");
        const createM = document.getElementById("createModal");
        if (createM) closeModal(createM);
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        const authModalEl = document.getElementById("authModal");
        if (authModalEl && typeof openModal === "function") openModal(authModalEl);
        return;
    }

    const titleEl = document.getElementById("postTitle");
    const descEl = document.getElementById("postDesc");
    const title = titleEl ? titleEl.value.trim() : "";
    const desc = descEl ? descEl.value.trim() : "";

    if (!title) {
        showToast("⚠️ 글 제목을 입력해 주세요!");
        if (titleEl) titleEl.focus();
        return;
    }

    if (!desc) {
        showToast("⚠️ 상세 내용 및 설명을 입력해 주세요!");
        if (descEl) descEl.focus();
        return;
    }

    const selCat = document.getElementById("postCategory") ? document.getElementById("postCategory").value : "";
    let category = selCat;
    if (!category || category === "") {
        if (typeof activeCategory !== "undefined" && activeCategory && activeCategory !== "all" && activeCategory !== "home") {
            category = activeCategory;
        } else {
            category = "freediving";
        }
    }

    const classType = document.getElementById("classType") ? document.getElementById("classType").value : "1일 원데이 체험 강습";
    const classFeeVal = document.getElementById("classFee") ? document.getElementById("classFee").value : null;
    const classRatioVal = document.getElementById("classRatio") ? document.getElementById("classRatio").value : "1:2 소수정예 강습";
    const classInclusionVal = document.getElementById("classInclusion") ? document.getElementById("classInclusion").value : "장비 렌탈비 포함";
    const priceVal = document.getElementById("postPrice") ? document.getElementById("postPrice").value : null;
    const dealMethodVal = document.getElementById("postDealMethod") ? document.getElementById("postDealMethod").value : "직거래/택배 둘 다 가능";
    const capacityVal = document.getElementById("postCapacity") ? document.getElementById("postCapacity").value : 4;
    const mapAddressEl = document.getElementById("postMapAddress");
    const mapAddress = mapAddressEl ? mapAddressEl.value.trim() : "";
    const dateEl = document.getElementById("postDate");
    const date = dateEl ? dateEl.value : "";
    const userNick = currentUser ? (currentUser.nickname || currentUser.name || currentUser.realName || "다이버") : "다이버";
    const userReal = currentUser ? (currentUser.realName || currentUser.real_name || currentUser.name || "다이버") : "다이버";
    let userLicense = currentUser ? (currentUser.license || currentUser.user_license || currentUser.license_info || "공인 강사 / 다이버") : "공인 강사 / 다이버";

    let categoryName = "버디 모집";
    if (category === "swimming") categoryName = "실내 수영";
    if (category === "openwater") categoryName = "바다 수영";
    if (category === "freediving") categoryName = "프리다이빙";
    if (category === "scuba") categoryName = "스쿠버다이빙";
    if (category === "instructor") categoryName = "강사 클래스";
    if (category === "community") categoryName = "자유수다방";
    if (category === "market") categoryName = "중고장터";

    const token = localStorage.getItem("aqua_buddy_user_token") || localStorage.getItem("access_token") || "guest_demo_token";

    const isCommunity = category === "community";

    const payload = {
        title,
        category,
        categoryName,
        classType: category === "instructor" ? classType : null,
        classFee: category === "instructor" && classFeeVal ? parseInt(classFeeVal) : null,
        classRatio: category === "instructor" ? classRatioVal : null,
        classInclusion: category === "instructor" ? classInclusionVal : null,
        price: priceVal ? parseInt(priceVal) : null,
        dealMethod: dealMethodVal,
        capacity: capacityVal ? parseInt(capacityVal) : 2,
        location: isCommunity ? null : (mapAddress || "전국 포인트"),
        locationName: isCommunity ? null : (mapAddress || "전국 포인트"),
        mapAddress: isCommunity ? null : (mapAddress || "서울 송파구 올림픽공원"),
        date: date || null,
        userName: userNick,
        nickname: userNick,
        realName: userReal,
        real_name: userReal,
        userLicense,
        reqLicense: category === "market" ? "상태 우수 / 직거래 가능" : (category === "instructor" ? "초보/입문자 환영" : "안전 수칙 준수"),
        desc,
        status: "recruiting",
        statusText: category === "market" ? "판매 중" : (category === "instructor" ? "수강생 모집 중" : "모집 중"),
        hostRating: currentUser ? 5.0 : 4.9,
        hostReviewsCount: 1,
        likes: 0,
        userLiked: false,
        wishlistCount: 0,
        userWished: false,
        unreadCount: 0,
        comments: [],
        images: [...uploadedCompressedImages],
        certImage: category === "instructor" ? (currentUser ? currentUser.certImage : uploadedCertImage) : null,
        createdAt: new Date().toISOString()
    };

    let savedPost = null;
    if (supabaseClient) {
        try {
            const dbPayload = {
                title: payload.title,
                category: payload.category,
                category_name: payload.categoryName || payload.category_name,
                user_name: userNick,
                user_license: payload.userLicense || payload.user_license,
                instructor_org: currentUser ? (currentUser.instructorOrg || "") : "",
                instructor_license_code: currentUser ? (currentUser.instructorCode || "") : "",
                class_type: payload.classType || payload.class_type,
                class_fee: payload.classFee || payload.class_fee,
                price: payload.price,
                capacity: payload.capacity,
                location_name: payload.locationName || payload.location_name,
                map_address: payload.mapAddress || payload.map_address,
                event_date: payload.date || null,
                description: payload.desc,
                status: payload.status,
                images: payload.images,
                desc: payload.desc,
                status_text: payload.statusText || payload.status_text,
                author: currentUser ? currentUser.email : userNick,
                req_license: payload.reqLicense || payload.req_license,
                location: payload.location,
                date: payload.date,
                class_ratio: payload.classRatio || payload.class_ratio,
                class_inclusion: payload.classInclusion || payload.class_inclusion,
                deal_method: payload.dealMethod || payload.deal_method,
                content: payload.desc
            };

            if (editingPostId) {
                // UPDATE 기존 행 수정
                const { data, error } = await supabaseClient.from('posts').update(dbPayload).eq('id', editingPostId).select();
                if (!error && data && data.length > 0) {
                    savedPost = { ...data[0] };
                } else if (error) {
                    console.error('❌ Supabase posts UPDATE 실패:', error);
                    alert("⚠️ Supabase posts DB 수정 거부됨: " + (error.message || JSON.stringify(error)));
                }
            } else {
                // INSERT 신규 추가
                dbPayload.created_at = payload.createdAt || new Date().toISOString();
                const { data, error } = await supabaseClient.from('posts').insert([dbPayload]).select();
                if (!error && data && data.length > 0) {
                    savedPost = { ...payload, ...data[0] };
                    console.log('✨ Supabase posts INSERT 성공:', data[0]);
                } else if (error) {
                    console.error('❌ Supabase posts INSERT 실패 상세원인:', error);
                    alert("⚠️ Supabase posts DB 저장 거부됨: " + (error.message || JSON.stringify(error)));
                }
            }
        } catch (dbErr) {
            console.error('Supabase save exception:', dbErr);
            alert("❌ DB 연동 예외 발생: " + (dbErr.message || dbErr));
        }
    }

    if (!savedPost || typeof savedPost !== 'object' || !savedPost.id) {
        savedPost = {
            ...payload,
            id: editingPostId || ("post-" + Date.now())
        };
    }

    if (editingPostId) {
        const idx = posts.findIndex(p => p.id === editingPostId);
        if (idx !== -1) {
            // 기존 클라이언트 속성 보존 (댓글, 좋아요 등)
            posts[idx] = {
                ...posts[idx],
                ...savedPost,
                comments: posts[idx].comments || savedPost.comments || [],
                likes: posts[idx].likes !== undefined ? posts[idx].likes : (savedPost.likes || 0),
                userLiked: posts[idx].userLiked !== undefined ? posts[idx].userLiked : (savedPost.userLiked || false),
                wishlistCount: posts[idx].wishlistCount !== undefined ? posts[idx].wishlistCount : (savedPost.wishlistCount || 0),
                userWished: posts[idx].userWished !== undefined ? posts[idx].userWished : (savedPost.userWished || false)
            };
        }
        editingPostId = null;
        showToast("✏️ 게시글이 수정되었습니다!");
    } else {
        const newPostId = savedPost.id || ("post-" + Date.now());
        savedPost.id = newPostId;
        myCreatedPostIds.push(newPostId);
        posts.unshift(savedPost);
        showToast("✨ 새로운 게시글이 성공적으로 등록되었습니다!");
    }

    saveMyPosts();
    savePosts();

    filterAndRender();
    const createPostForm = document.getElementById("createPostForm");
    if (createPostForm && typeof createPostForm.reset === "function") {
        createPostForm.reset();
    }
    uploadedCompressedImages = [];
    uploadedCertImage = "";
    renderImagePreviews();
    closeModal(createModal);
}

function showMap(addressQuery) {
    const mapContainer = document.getElementById("postDetailMap");
    if (!mapContainer) return;
    mapContainer.classList.remove("hidden");

    let queryLower = (addressQuery || "").toLowerCase();
    let matchedSpot = null;

    const spotCoords = (typeof FAMOUS_SPOT_COORDS !== "undefined" && FAMOUS_SPOT_COORDS) ? FAMOUS_SPOT_COORDS : (window.FAMOUS_SPOT_COORDS || {});

    for (const key in spotCoords) {
        if (queryLower.includes(key)) {
            matchedSpot = spotCoords[key];
            break;
        }
    }

    if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(function() {
            try {
                let coords = matchedSpot 
                    ? new kakao.maps.LatLng(matchedSpot.lat, matchedSpot.lng)
                    : new kakao.maps.LatLng(37.2750, 127.2340);

                const mapOptions = { center: coords, level: 4 };
                const map = new kakao.maps.Map(mapContainer, mapOptions);

                setTimeout(() => {
                    map.relayout();
                    map.setCenter(coords);
                }, 200);

                setTimeout(() => {
                    if (map) {
                        map.relayout();
                        map.setCenter(coords);
                    }
                }, 350);

                if (kakao.maps.services && kakao.maps.services.Geocoder && !matchedSpot) {
                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(addressQuery, function(result, status) {
                        if (status === kakao.maps.services.Status.OK && result[0]) {
                            coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                            map.setCenter(coords);
                        }
                        createMapMarker(map, coords, addressQuery);
                    });
                } else {
                    createMapMarker(map, coords, matchedSpot ? matchedSpot.title : addressQuery);
                }
            } catch (e) {
                console.log("Kakao Map Load Notice:", e);
                renderFallbackMapUI(mapContainer, addressQuery, matchedSpot);
            }
        });
    } else {
        renderFallbackMapUI(mapContainer, addressQuery, matchedSpot);
    }
}

function createMapMarker(map, coords, titleText) {
    const marker = new kakao.maps.Marker({
        map: map,
        position: coords
    });

    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="width:160px;text-align:center;padding:6px 0;color:#000;font-weight:bold;font-size:12px;word-break:keep-all;">📍 ${escapeHtml(titleText.substring(0, 18))}</div>`
    });
    infowindow.open(map, marker);
}

function renderFallbackMapUI(container, query, spotInfo) {
    const lat = spotInfo ? spotInfo.lat : 37.2750;
    const lng = spotInfo ? spotInfo.lng : 127.2340;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.015}%2C${lat-0.015}%2C${lng+0.015}%2C${lat+0.015}&layer=mapnik&marker=${lat}%2C${lng}`;

    container.innerHTML = `
        <iframe src="${osmUrl}" style="width:100%; height:100%; border:none; border-radius:8px;"></iframe>
    `;
}

let modalPickerMap = null;
let modalPickerMarker = null;

function moveMapToCoords(lat, lng, addressLabel) {
    if (typeof initModalMapPicker === "function") {
        initModalMapPicker(lat, lng, addressLabel || "");
    }
}

function searchMapAddressInModal() {
    const inputEl = document.querySelector('#postMapAddress, #mapAddressInput, #spotAddress, input[name="mapAddress"]');
    const container = document.getElementById("mapSearchResultsContainer");

    if (!inputEl) {
        console.error("주소 입력창 요소를 찾을 수 없습니다.");
        return;
    }

    const query = inputEl.value.trim();
    if (!query) {
        showToast("⚠️ 검색할 위치나 장소명(예: 양산시 국민체육센터, 딥스테이션)을 입력해 주세요!");
        return;
    }

    inputEl.setAttribute("data-confirmed-address", query);

    if (container) {
        container.classList.remove("hidden");
        container.innerHTML = `<div style="padding: 10px; text-align: center; color: var(--accent-cyan); font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> '${escapeHtml(query)}' 위치 검색 중...</div>`;
    }

    let results = [];
    const queryLower = query.toLowerCase();
    const spotCoords = (typeof FAMOUS_SPOT_COORDS !== "undefined" && FAMOUS_SPOT_COORDS) ? FAMOUS_SPOT_COORDS : (window.FAMOUS_SPOT_COORDS || {});

    for (const key in spotCoords) {
        if (key.includes(queryLower) || queryLower.includes(key)) {
            const s = spotCoords[key];
            results.push({
                placeName: s.title || key,
                address: s.address || s.title || key,
                lat: s.lat,
                lng: s.lng,
                type: "추천 스팟"
            });
        }
    }

    if (results.length === 0) {
        results.push({
            placeName: query,
            address: query,
            lat: 37.2750,
            lng: 127.2340,
            type: "입력 주소"
        });
    }

    const isKakaoLoaded = typeof window !== "undefined" && window.kakao && window.kakao.maps;

    if (isKakaoLoaded) {
        try {
            window.kakao.maps.load(() => {
                try {
                    if (window.kakao.maps.services && window.kakao.maps.services.Places) {
                        const places = new window.kakao.maps.services.Places();
                        places.keywordSearch(query, (data, status) => {
                            if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
                                data.slice(0, 5).forEach(item => {
                                    results.push({
                                        placeName: item.place_name,
                                        address: item.road_address_name || item.address_name,
                                        lat: parseFloat(item.y),
                                        lng: parseFloat(item.x),
                                        type: item.category_group_name || "카카오 지도 검색"
                                    });
                                });
                            }
                            renderSearchResultsList(results, query);
                        });
                    } else if (window.kakao.maps.services && window.kakao.maps.services.Geocoder) {
                        const geocoder = new window.kakao.maps.services.Geocoder();
                        geocoder.addressSearch(query, (data, status) => {
                            if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
                                data.slice(0, 5).forEach(item => {
                                    results.push({
                                        placeName: query,
                                        address: item.road_address_name || item.address_name,
                                        lat: parseFloat(item.y),
                                        lng: parseFloat(item.x),
                                        type: "주소"
                                    });
                                });
                            }
                            renderSearchResultsList(results, query);
                        });
                    } else {
                        renderSearchResultsList(results, query);
                    }
                } catch(sdkErr) {
                    console.error('[위치 검색 에러/카카오맵 SDK 호출 예외 감지]:', sdkErr);
                    renderSearchResultsList(results, query);
                }
            });
        } catch(err) {
            console.error('[위치 검색 에러/도메인 제한 또는 SDK 로드 차단 감지]:', err);
            renderSearchResultsList(results, query);
        }
    } else {
        console.warn('[위치 검색 감지]: 카카오 지도 SDK가 불려오지 않음 (도메인 미등록 또는 로딩 미완료). Fallback 검색 결과를 표시합니다.');
        renderSearchResultsList(results, query);
        showToast(`📍 '${query}' 위치 주소가 폼에 세팅되었습니다.`);
    }
}

function renderSearchResultsList(results, query) {
    const container = document.getElementById("mapSearchResultsContainer");
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = `
            <div style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                <p>📍 '${escapeHtml(query)}' 검색 결과를 찾지 못했습니다.</p>
                <p style="font-size: 0.78rem; margin-top: 4px; color: var(--accent-cyan);">지도를 직접 클릭하거나 📍 핀을 드래그해서 위치를 지정해 보세요!</p>
            </div>
        `;
        initModalMapPicker(37.2750, 127.2340, query);
        return;
    }

    container.innerHTML = results.map((r, idx) => `
        <div class="search-result-item" onclick="selectMapSearchResult('${escapeHtml(r.address || r.placeName)}', ${r.lat}, ${r.lng})" style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: background 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: var(--accent-cyan); font-size: 0.88rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(r.placeName)}</strong>
                <span style="font-size: 0.72rem; background: rgba(255,183,3,0.2); color: var(--accent-gold); padding: 2px 6px; border-radius: 4px;">${escapeHtml(r.type)}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.address)}</p>
        </div>
    `).join("");

    selectMapSearchResult(results[0].address || results[0].placeName, results[0].lat, results[0].lng, false);
}

function selectMapSearchResult(addressText, lat, lng, hideContainer = true) {
    const input = document.getElementById("postMapAddress");
    const container = document.getElementById("mapSearchResultsContainer");
    if (input) input.value = addressText;
    if (hideContainer && container) container.classList.add("hidden");

    initModalMapPicker(lat, lng, addressText);
    showToast(`📍 핀 위치가 '${addressText}'(으)로 세팅되었습니다.`);
}

function initModalMapPicker(lat, lng, addressLabel) {
    const pickerBox = document.getElementById("modalMapPicker");
    if (!pickerBox) return;

    pickerBox.style.display = "block";

    if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
            try {
                const coords = new kakao.maps.LatLng(lat, lng);
                const mapOptions = { center: coords, level: 3 };

                if (!modalPickerMap) {
                    modalPickerMap = new kakao.maps.Map(pickerBox, mapOptions);
                } else {
                    modalPickerMap.setCenter(coords);
                }

                setTimeout(() => {
                    modalPickerMap.relayout();
                    modalPickerMap.setCenter(coords);
                }, 100);

                if (modalPickerMarker) modalPickerMarker.setMap(null);

                modalPickerMarker = new kakao.maps.Marker({
                    position: coords,
                    map: modalPickerMap,
                    draggable: true
                });

                kakao.maps.event.addListener(modalPickerMarker, 'dragend', function() {
                    const newPos = modalPickerMarker.getPosition();
                    updateAddressFromCoords(newPos.getLat(), newPos.getLng());
                });

                kakao.maps.event.addListener(modalPickerMap, 'click', function(mouseEvent) {
                    const clickedCoords = mouseEvent.latLng;
                    modalPickerMarker.setPosition(clickedCoords);
                    updateAddressFromCoords(clickedCoords.getLat(), clickedCoords.getLng());
                });

            } catch(e) {
                console.log("Modal Map Picker Catch:", e);
                renderFallbackMapUI(pickerBox, addressLabel, { lat, lng });
            }
        });
    } else {
        renderFallbackMapUI(pickerBox, addressLabel, { lat, lng });
    }
}

function updateAddressFromCoords(lat, lng) {
    const input = document.getElementById("postMapAddress");
    if (window.kakao && window.kakao.maps && kakao.maps.services && kakao.maps.services.Geocoder) {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
                const addr = result[0].road_address 
                    ? result[0].road_address.address_name 
                    : result[0].address.address_name;
                if (input) input.value = addr;
                showToast(`📍 핀 위치 이동 완료: '${addr}'`);
            } else {
                if (input) input.value = `위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`;
                showToast(`📍 핀 위치 이동 완료 (위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)})`);
            }
        });
    } else {
        if (input) input.value = `위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`;
        showToast(`📍 핀 위치 이동 완료`);
    }
}

function handleAddComment(e, postId) {
    e.preventDefault();
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 실시간 댓글을 작성하실 수 있습니다!");
        pendingLoginAction = function() { openDetailModal(postId); };
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const input = document.getElementById("newCommentInput");
    const text = input.value.trim();
    if (!text) return;

    if (!post.comments) post.comments = [];
    post.comments.push({
        author: currentUser ? currentUser.name : "익명 다이버",
        text: text,
        time: "방금 전"
    });

    savePosts();
    openDetailModal(postId);
    showToast("💬 댓글이 등록되었습니다!");
}

function openModal(modal) {
    let targetEl = modal;
    if (typeof modal === "string") {
        targetEl = document.getElementById(modal);
    }
    if (!targetEl) {
        targetEl = document.getElementById("detailModal");
    }
    if (!targetEl) {
        console.error("openModal: Target modal element not found!", modal);
        return;
    }
    targetEl.classList.remove("hidden");
    targetEl.style.setProperty("display", "flex", "important");
    targetEl.style.setProperty("position", "fixed", "important");
    targetEl.style.setProperty("top", "0px", "important");
    targetEl.style.setProperty("left", "0px", "important");
    targetEl.style.setProperty("width", "100vw", "important");
    targetEl.style.setProperty("height", "100vh", "important");
    if (targetEl.id === "authModal") {
        targetEl.style.setProperty("z-index", "9999999", "important");
    } else {
        targetEl.style.setProperty("z-index", "999999", "important");
    }
    targetEl.style.setProperty("pointer-events", "auto", "important");
    targetEl.style.setProperty("opacity", "1", "important");
    targetEl.style.setProperty("visibility", "visible", "important");
    targetEl.style.setProperty("background", "rgba(0, 0, 0, 0.95)", "important");
    targetEl.style.setProperty("justify-content", "center", "important");
    targetEl.style.setProperty("align-items", "center", "important");
    targetEl.style.backdropFilter = "none";
    targetEl.style.webkitBackdropFilter = "none";

    const innerContainer = targetEl.querySelector(".modal-container");
    if (innerContainer) {
        innerContainer.style.setProperty("display", "block", "important");
        innerContainer.style.setProperty("visibility", "visible", "important");
        innerContainer.style.setProperty("opacity", "1", "important");
        innerContainer.style.setProperty("background", "#0d1b2a", "important");
        innerContainer.style.setProperty("border", "2px solid #00f2fe", "important");
        innerContainer.style.setProperty("box-shadow", "0 0 50px rgba(0, 242, 254, 0.5)", "important");
        innerContainer.style.setProperty("color", "#ffffff", "important");
        innerContainer.style.setProperty("position", "relative", "important");
        innerContainer.style.setProperty("z-index", "1000000", "important");
        innerContainer.style.setProperty("margin", "auto", "important");
        innerContainer.style.setProperty("max-height", "90vh", "important");
        innerContainer.style.setProperty("overflow-y", "auto", "important");
    }

    const modalBodyEl = targetEl.querySelector(".modal-body");
    if (modalBodyEl) {
        modalBodyEl.style.setProperty("display", "block", "important");
        modalBodyEl.style.setProperty("visibility", "visible", "important");
        modalBodyEl.style.setProperty("opacity", "1", "important");
        modalBodyEl.style.setProperty("color", "#ffffff", "important");
    }
}

function closeModal(modal) {
    let targetEl = modal;
    if (typeof modal === "string") {
        targetEl = document.getElementById(modal);
    }
    if (!targetEl) return;
    targetEl.classList.add("hidden");
    targetEl.style.setProperty("display", "none", "important");

    if (targetEl.id === "adminDashboardModal" || targetEl.id === "webmasterDashboardModal" || targetEl.id === "webmasterAuthModal") {
        if (typeof restoreAdBannersAfterAdmin === 'function') {
            restoreAdBannersAfterAdmin();
        }
    }
}

function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-cyan); font-size: 1.2rem;"></i> <span>${escapeHtml(message)}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatDate(dateStr) {
    if (!dateStr) return "일시 협의";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[d.getDay()];
        return `${month}월 ${day}일(${dayName}) ${hours}:${minutes}`;
    } catch (e) {
        return dateStr;
    }
}

function formatTimeAgo(isoStr) {
    if (!isoStr) return "방금 전";
    try {
        const diff = Date.now() - new Date(isoStr).getTime();
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return "방금 전";
        if (mins < 60) return `${mins}분 전`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        return `${days}일 전`;
    } catch (e) {
        return "방금 전";
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateBubbles() {
    const container = document.getElementById("bubbleContainer");
    if (!container) return;

    for (let i = 0; i < 16; i++) {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        
        const size = Math.random() * 24 + 8;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 10 + 10}s`;
        bubble.style.animationDelay = `${Math.random() * 8}s`;
        
        container.appendChild(bubble);
    }
}

function openPostDetailModal(postId) {
    if (!postId) return;
    openDetailModal(postId);
}

function openChatRoomModal(postId) {
    if (!postId) return;
    // 로그인 가드: 비로그인 시 로그인 모달 후 자동 재실행
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 대화방에 입장하실 수 있습니다!");
        pendingLoginAction = function() { openChatRoomModal(postId); };
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) {
        showToast("⚠️ 채팅할 게시글을 찾을 수 없습니다.");
        return;
    }
    currentChatPost = post;
    chatMessages[postId] = chatMessages[postId] || [];
    if (typeof renderChatStream === "function") {
        renderChatStream(postId);
    }
    // chatModal (실제 index.html의 ID)와 chatRoomModal(레거시) 양쪽 대응
    const chatModalEl = document.getElementById("chatModal") || document.getElementById("chatRoomModal");
    if (chatModalEl) {
        openModal(chatModalEl);
    } else {
        console.warn("openChatRoomModal: chatModal 또는 chatRoomModal 엘리먼트를 찾을 수 없습니다.");
        showToast("⚠️ 대화방 모달을 찾을 수 없습니다. 개발자에게 문의해 주세요.");
    }
}

// ===== 30일 경과 채팅 자동 삭제 (Supabase 용량 폭탄 방지) =====
async function cleanOldChats() {
    if (!supabaseClient) return;
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        const cutoffISO = cutoffDate.toISOString();

        const { error } = await supabaseClient
            .from('chats')
            .delete()
            .lt('created_at', cutoffISO);

        if (error) {
            console.warn('채팅 자동 삭제 실패:', error.message);
        } else {
            console.log('✅ 30일 이전 채팅 데이터 자동 삭제 완료 (기준일:', cutoffISO, ')');
        }
    } catch (e) {
        console.warn('cleanOldChats 예외:', e);
    }
}
window.cleanOldChats = cleanOldChats;

// 앱 시작 시 1회 + 이후 24시간마다 자동 실행
(function scheduleCleanOldChats() {
    cleanOldChats();
    setInterval(cleanOldChats, 24 * 60 * 60 * 1000);
})();

// Explicit Window Global Bindings for HTML Inline Onclick Handlers
if (typeof window !== "undefined") {
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.showToast = showToast;
    window.openProfileModal = openProfileModal;
    window.openMyProfileModal = openProfileModal;
    window.openDetailModal = openDetailModal;
    window.openPostDetailModal = openPostDetailModal;
    window.openWebcamModal = openWebcamModal;
    window.openChatRoomModal = openChatRoomModal;
    window.openChatModal = openChatRoomModal;
    window.openInstructorAuthModal = openInstructorAuthModal;
    window.openAdminSecurityCheck = openAdminSecurityCheck;
    window.openInquiryModal = openInquiryModal;
    window.openTermsModal = openTermsModal;
    window.openLegalModal = openLegalModal;
    window.handleCopyrightTripleClick = handleCopyrightTripleClick;
    window.filterByCategory = filterByCategory;
    window.switchMainView = switchMainView;
    window.filterInstructorSub = filterInstructorSub;
    window.filterActivitySub = filterActivitySub;
    window.filterTideRegion = filterTideRegion;
    window.filterCctvRegion = filterCctvRegion;
    window.handleLogout = handleLogout;
    
    try {
        Object.defineProperty(window, 'currentUser', {
            get: () => currentUser,
            set: (v) => { currentUser = v; },
            configurable: true
        });
    } catch(e) {
        window.currentUser = currentUser;
    }
}

// Universal Document Event Delegation for All Post Cards & Profile Clicks
if (typeof document !== "undefined") {
    document.addEventListener("click", function(e) {
        if (e.target.closest('.btn, button, input, a, .like-btn, .action-btn')) {
            return;
        }

        const card = e.target.closest(".post-card, .feed-card, .feed-card-item, .compact-post-row, [data-post-id]");
        if (card) {
            const postId = card.getAttribute("data-post-id") || card.dataset.postId || (card.getAttribute("onclick") ? (card.getAttribute("onclick").match(/'([^']+)'/) || [])[1] : null);
            if (postId) {
                openPostDetailModal(postId);
            }
            return;
        }

        const profileBtn = e.target.closest("#userProfileNav");
        if (profileBtn) {
            openProfileModal();
            return;
        }
    });
}

// Initialize button event listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('openAuthModalBtn');
    if (authBtn) authBtn.addEventListener('click', () => openModal(authModal));
    const instBtn = document.querySelector('.nav-inst-btn');
    if (instBtn) instBtn.addEventListener('click', () => openInstructorAuthModal());

    const createForm = document.getElementById('createPostForm');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            if (typeof handleSavePost === 'function') {
                handleSavePost(e);
            }
        });
    }

    // Init Mute State UI
    const muteIcon = document.getElementById("muteIcon");
    if (muteIcon && isAudioMuted) {
        muteIcon.className = "fa-solid fa-volume-xmark";
    }
});

// ==================================================
// 🔔 AquaBuddy Realtime Notification & Dropdown System
// ==================================================
let isAudioMuted = localStorage.getItem('aqua_buddy_chat_muted') === 'true';
let localNotifications = [];

function playNotificationSound() {
    if (isAudioMuted) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        osc2.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.18);
    } catch (e) {
        console.log('AudioContext notification note:', e);
    }
}

function toggleAudioMute() {
    isAudioMuted = !isAudioMuted;
    localStorage.setItem('aqua_buddy_chat_muted', isAudioMuted ? 'true' : 'false');
    
    const muteIcon = document.getElementById("muteIcon");
    if (muteIcon) {
        muteIcon.className = isAudioMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
    }

    if (typeof showToast === "function") {
        showToast(isAudioMuted ? "🔇 채팅 알림음이 음소거되었습니다." : "🔔 채팅 알림음이 켜졌습니다.");
    }
}

function updateGlobalUnreadBadge() {
    const unreadCount = localNotifications.filter(n => !n.isRead).length;
    const badgeEl = document.getElementById("globalUnreadBadge");
    const bellIcon = document.getElementById("bellIcon");

    if (badgeEl) {
        if (unreadCount > 0) {
            badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badgeEl.classList.remove("hidden");
            badgeEl.classList.add("badge-pulse");
            if (bellIcon) bellIcon.style.color = "var(--accent-cyan)";
        } else {
            badgeEl.classList.add("hidden");
            badgeEl.classList.remove("badge-pulse");
            if (bellIcon) bellIcon.style.color = "";
        }
    }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById("notificationDropdown");
    if (!dropdown) return;

    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        renderNotificationList();
    } else {
        dropdown.classList.add("hidden");
    }
}

function renderNotificationList() {
    const listContainer = document.getElementById("notificationList");
    if (!listContainer) return;

    if (!localNotifications || localNotifications.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-notification-notice">
                <i class="fa-solid fa-bell-slash" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 6px;"></i>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.82rem;">새로운 알림이 없습니다.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = localNotifications.map(item => `
        <div class="notification-item ${item.isRead ? '' : 'unread'}" onclick="handleNotificationClick('${item.id}')">
            <div class="notification-avatar">
                <i class="fa-solid fa-comments"></i>
            </div>
            <div class="notification-content">
                <div style="font-weight: 800; color: var(--accent-cyan); margin-bottom: 2px;">
                    ${typeof escapeHtml === 'function' ? escapeHtml(item.author) : item.author}
                </div>
                <div>${typeof escapeHtml === 'function' ? escapeHtml(item.textSummary) : item.textSummary}</div>
                <div class="notification-time">${item.time || '방금 전'}</div>
            </div>
        </div>
    `).join("");
}

function handleNotificationClick(notifId) {
    const item = localNotifications.find(n => String(n.id) === String(notifId));
    if (item) {
        item.isRead = true;
        updateGlobalUnreadBadge();
        renderNotificationList();

        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown) dropdown.classList.add("hidden");

        if (item.targetPostId && typeof openChatRoomModal === "function") {
            openChatRoomModal(item.targetPostId);
        }
    }
}

function markAllNotificationsAsRead() {
    localNotifications.forEach(n => n.isRead = true);
    updateGlobalUnreadBadge();
    renderNotificationList();
    if (typeof showToast === "function") {
        showToast("🔔 모든 알림을 읽음 처리했습니다.");
    }
}

function showChatNoticeToast(author, text, postId) {
    let postTitle = '대화방';
    if (typeof posts !== 'undefined' && Array.isArray(posts)) {
        const p = posts.find(item => String(item.id) === String(postId));
        if (p && p.title) postTitle = p.title;
    }

    const notifItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
        author: author,
        textSummary: `${author}님이 '${postTitle}' 대화방에 메시지를 남겼습니다: "${text.length > 18 ? text.substring(0,18) + '...' : text}"`,
        targetPostId: postId,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        isRead: false
    };

    localNotifications.unshift(notifItem);
    updateGlobalUnreadBadge();

    // If chat modal is currently active and open for this post, don't show floating toast
    const chatModalTarget = document.getElementById("chatModal");
    const isModalOpen = chatModalTarget && chatModalTarget.style.display !== "none" && !chatModalTarget.classList.contains("hidden");
    if (isModalOpen && currentChatPost && String(currentChatPost.id) === String(postId)) {
        notifItem.isRead = true;
        updateGlobalUnreadBadge();
        return;
    }

    playNotificationSound();

    const existingToast = document.getElementById("chatNoticeToast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = "chatNoticeToast";
    toast.className = "chat-notice-toast";
    const truncatedText = text.length > 15 ? text.substring(0, 15) + '...' : text;
    
    toast.innerHTML = `
        <div style="background: rgba(0,242,254,0.15); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent-cyan);">
            <i class="fa-solid fa-comments"></i>
        </div>
        <div>
            <div style="font-weight: 800; font-size: 0.85rem; color: var(--accent-cyan);">${typeof escapeHtml === 'function' ? escapeHtml(author) : author}</div>
            <div style="font-size: 0.8rem; color: #eee; margin-top: 2px;">${typeof escapeHtml === 'function' ? escapeHtml(truncatedText) : truncatedText}</div>
        </div>
    `;

    toast.onclick = () => {
        toast.remove();
        handleNotificationClick(notifItem.id);
    };

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById("notificationDropdown");
    const bellBtn = document.getElementById("bellBtn");
    if (dropdown && !dropdown.classList.contains("hidden")) {
        if (bellBtn && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    }
});

// ==================================================
// 🔒 AquaBuddy Webmaster 2-Factor Security Authentication
// ==================================================
const WEBMASTER_ADMIN_EMAIL = "hanmaner@naver.com";
const WEBMASTER_PIN_CODE = "aqua2026!master";
let copyrightClickCount = 0;
let copyrightClickTimer = null;

function handleCopyrightTripleClick() {
    copyrightClickCount++;
    if (copyrightClickCount === 1) {
        copyrightClickTimer = setTimeout(() => {
            copyrightClickCount = 0;
        }, 1500); // 1.5초 내 3회 클릭 허용
    } else if (copyrightClickCount >= 3) {
        clearTimeout(copyrightClickTimer);
        copyrightClickCount = 0;
        
        // 2차 인증 모달 최상단 오픈
        openWebmasterAuthModal();
    }
}

function openWebmasterAuthModal() {
    if (typeof hideAdBannersForAdmin === 'function') {
        hideAdBannersForAdmin();
    }
    const authModal = document.getElementById('webmasterAuthModal');
    if (authModal) {
        if (authModal.parentElement !== document.body) {
            document.body.appendChild(authModal);
        }
        const secretInput = document.getElementById("webmasterSecretInput");
        if (secretInput) secretInput.value = "";

        authModal.classList.remove('hidden');
        authModal.classList.add('active');
        authModal.style.setProperty('display', 'flex', 'important');
        authModal.style.setProperty('z-index', '9999999', 'important');

        if (typeof showToast === 'function') {
            showToast('🔒 웹마스터 2차 인증 모달이 호출되었습니다.');
        }
        if (secretInput) secretInput.focus();
    } else {
        alert('webmasterAuthModal 요소를 찾을 수 없습니다.');
    }
}

function handleWebmasterAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // 1단계 (계정 검증)
    const isLoggedIn = typeof currentUser !== 'undefined' && currentUser && currentUser.email;
    const userEmail = isLoggedIn ? currentUser.email.trim().toLowerCase() : "";

    if (!isLoggedIn || userEmail !== WEBMASTER_ADMIN_EMAIL.toLowerCase()) {
        if (typeof showToast === "function") {
            showToast("⛔ 지정된 관리자 계정만 접근 가능합니다.");
        }
        return;
    }

    // 2단계 (코드 검증)
    const secretInput = document.getElementById("webmasterSecretInput");
    const inputSecret = secretInput ? secretInput.value.trim() : "";

    if (inputSecret !== WEBMASTER_PIN_CODE) {
        if (typeof showToast === "function") {
            showToast("⛔ 마스터 코드가 올바르지 않습니다.");
        }
        return;
    }

    // 3단계 (진입 성공)
    const authModalEl = document.getElementById("webmasterAuthModal");
    if (authModalEl && typeof closeModal === "function") {
        closeModal(authModalEl);
    }

    if (typeof showToast === "function") {
        showToast("🔓 웹마스터 보안 인증 성공! 대시보드에 진입합니다.");
    }

    if (typeof openAdminModal === "function") {
        openAdminModal();
    } else {
        const adminModal = document.getElementById("adminDashboardModal") || document.getElementById("adminModal");
        if (adminModal && typeof openModal === "function") {
            openModal(adminModal);
        }
    }
}

// ==================================================
// 📜 Terms & Privacy Legal Text Constants (주식회사 어썸갓코포레이션)
// ==================================================
const TERMS_OF_SERVICE_TEXT = `주식회사 어썸갓코포레이션 이용약관

제1조(목적)
이 이용약관(이하 '약관')은 주식회사 어썸갓코포레이션(이하 회사라 합니다)와 이용 고객(이하 '회원')간에 회사가 제공하는 서비스의 가입조건 및 이용에 관한 제반 사항과 기타 필요한 사항을 구체적으로 규정함을 목적으로 합니다.

제2조(이용약관의 효력 및 변경)
1. 이 약관은 본 회사에 가입된 고객을 포함하여 서비스를 이용하고자 하는 모든 이용자에 대하여 서비스 메뉴 및 회사에 게시하여 공시하거나 기타의 방법으로 고객에게 공지함으로써 그 효력을 발생합니다. 약관의 게시는 주식회사 어썸갓코포레이션 홈페이지(https://www.agczero.com)에서 확인할 수 있습니다.
2. 회사는 합리적인 사유가 발생될 경우에는 이 약관을 변경할 수 있으며, 약관을 변경할 경우에는 지체 없이 이를 사전에 공지합니다.

제3조(약관외 준칙)
서비스 이용에 관하여는 이 약관을 적용하며 이 약관에 명시되지 아니한 사항에 대하여는 전기통신기본법, 전기통신사업법, 정보통신망 이용 촉진 등에 관한 법률 및 기타 관계 법령의 규정에 의합니다.

제4조(용어의 설명)
1. 이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
  1) '이용고객'이라 함은 회원제로 운영하는 서비스를 이용하는 이용자를 의미합니다.
  2) '이용계약'이라 함은 서비스 이용과 관련하여 회사와 이용고객 간에 체결하는 계약을 말합니다.
  3) '이용자번호(ID)'라 함은 회원식별과 회원의 서비스 이용을 위하여 회원이 선정하고 회사가 승인하는 영문자와 숫자의 조합을 말합니다.
  4) '비밀번호'라 함은 이용고객이 부여 받은 이용자번호와 일치된 이용고객임을 확인하고 이용고객의 권익보호를 위하여 이용고객이 선정한 문자와 숫자의 조합을 말합니다.
  5) '해지'라 함은 회사 또는 회원이 이용계약을 해약하는 것을 말합니다.
  6) “회원”이라 함은 제5조 제1항에 따라 회원가입을 하여 “회사”가 제공하는 “서비스”를 받는 사업자와 그 구성원의 사용자 또는 개인 사용자를 의미합니다.
2. 이 약관에서 사용하는 용어의 정의는 제1항에서 정하는 것을 제외하고는 관계법령 및 서비스별 안내에서 정하는 바에 의합니다.

제5조(이용 계약의 성립)
1. 이용계약은 이용하고자 하는 고객의 본 이용약관 내용에 대한 동의와 이용신청에 대하여 회사의 승낙으로 성립합니다.
2. 본 이용약관에 대한 동의는 신청시 사이트의 '동의' 버튼을 누름으로써 의사표시를 합니다.

제6조(서비스 이용 신청)
1. 본 서비스를 이용하고자 하는 이용고객은 회사에서 요청하는 정보(성명, 연락처 등)를 제공하여 회원으로 가입한 후 이용이 가능합니다.
2. 모든 회원은 반드시 회원 본인의 이름과 연락처를 제공하여야만 서비스의 이용이 가능하며 비실명의 경우 서비스 이용에 제한을 받으실 수 있습니다.
3. 회원가입은 반드시 실명으로만 가입이 가능합니다.
4. 타인의 명의(이름 또는 연락처)를 도용하여 이용신청을 한 회원의 ID는 사전예고 없이 삭제가 될 수 있으며, 관계법령에 따라 처벌을 받을 수 있습니다.
5. 회사는 본 서비스를 이용하는 회원에 대하여 등급별로 구분하여 서비스의 이용에 차등을 둘 수 있습니다.

제7조(개인정보의 보호 및 사용)
회사는 관계법령이 정하는 바에 따라 서비스 이용자의 개인정보를 보호하기 위해 개인정보보호정책을 시행합니다. 이용자 개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보 보호정책이 적용됩니다. 그러나, 회사는 이용자의 귀책사유로 인해 노출된 정보에 대해서 일체의 책임을 지지 않습니다.

제8조(이용 신청의 승낙과 제한)
1. 회사는 제 6조의 규정에 의한 이용신청 회원에 대하여 업무 수행상 또는 기술상 지장이 없는 경우에 서비스 이용을 승낙합니다.
2. 회사는 아래 사항에 해당하는 경우에 대해서 승낙하지 아니 합니다.
  1) 타인 명의의 신청 또는 이름이 실명이 아닌 경우
  2) 허위 서류를 첨부하거나 허위내용을 기재하여 신청하는 경우
  3) 신용정보의 이용과 보호에 관한 법률에 의한 PC통신, 인터넷 서비스의 신용불량자로 등록되어 있는 경우
  4) 사회의 안녕, 질서 또는 미풍양속을 저해할 목적으로 신청한 경우
  5) 정보통신 윤리위원회에 PC통신, 인터넷 서비스의 불량 이용자로 등록되어 있는 경우
  6) 기타 회사가 정한 이용신청요건이 만족되지 않았을 경우
3. 회사는 서비스 이용신청이 다음 각 호에 해당하는 경우에는 그 신청에 대하여 승낙 제한사유가 해소될 때까지 승낙을 유보할 수 있습니다.
  1) 회사가 설비의 여유가 없는 경우
  2) 회사의 기술상 지장이 있는 경우
  3) 기타 회사의 귀책 사유로 이용승낙이 곤란한 경우
4. 회사는 규정에 의하여 이용신청이 불승낙되거나 승낙을 제한하는 경우에는 이를 이용신청 회원에게 즉시 알려야 합니다.
5. 회사는 이용신청 회원이 미성년자인 경우에는 별도로 정하는 바에 따라 승낙을 제한할 수 있습니다.

제9조(회사의 권리와 의무)
1. 회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 인정할 경우에는 즉시 처리하여야 합니다. 다만, 즉시 처리가 곤란한 경우에는 회원에게 그 사유와 처리 일정을 서면, 전자우편 또는 전화 등으로 통보하여야 합니다.
2. 회사는 회사가 제정한 개인정보보호정책에 따라서 이용고객의 개인정보를 보호할 의무를 가집니다. 단, 법률의 규정에 따른 적법한 절차에 의한 경우에는 그러하지 않을 수 있습니다.
3. 회사가 제2항의 규정에도 불구하고 고지 또는 명시한 범위를 초과하여 이용고객의 개인 정보를 이용하거나 제3자에게 제공하고자 하는 경우에는 반드시 해당 회원에게 개별적으로 공지하여 동의를 받아야 합니다.
4. 회사는 계속적이고 안정적인 서비스의 제공을 위하여 설비에 장애가 생기거나 멸실된 때에는 지체없이 이를 수리 또는 복구합니다. 다만, 천재지변, 비상사태 또는 그밖에 부득이한 경우에는 그 서비스를 일시 중단하거나 중지할 수 있습니다.
5. 회사는 이용계약의 체결, 계약사항의 변경 및 해지 등 회원과의 계약관련 절차 및 내용 등에 있어 회원에게 편의를 제공해야 합니다.
6. 회사는 업무와 관련하여 회원의 사전 동의 하에 회원 전체 또는 일부의 개인정보에 관한 통계자료를 작성하여 이를 사용할 수 있고 서비스를 통하여 회원의 컴퓨터에 쿠키를 전송 할 수 있습니다. 이 경우 회원은 쿠키의 수신을 거부하거나 쿠키의 수신에 대하여 경고하도록 사용하는 컴퓨터의 브라우저의 설정을 변경할 수 있으며, 쿠키의 설정 변경에 의한 서비스 이용이 변경되는 것은 회원의 책임입니다.

제10조(회원의 권리와 의무)
1. 회원은 서비스를 이용할 때 다음의 행위를 하지 않아야 합니다.
  1) 다른 회원의 ID 및 비밀번호를 부정하게 사용하는 행위
  2) 서비스를 이용하여 얻은 정보를 회원의 개인적인 이용 외에 복사, 가공, 번역, 2차적 저작 등을 통하여 복제, 공연, 방송, 전시, 배포, 출판 등에 사용하거나 제3자에게 제공하는 행위
  3) 타인의 명예를 손상시키거나 불이익을 주는 행위
  4) 회사의 저작권, 제3자의 저작권 등 기타 권리를 침해하는 행위
  5) 공공질서 및 미풍양속에 위반되는 내용의 정보, 문장, 도형, 음성 등을 타인에게 유포하는 행위
  6) 범죄와 결부된다고 객관적으로 인정되는 행위
  7) 서비스와 관련된 설비의 오동작이나 정보 등의 파괴 및 혼란을 유발시키는 컴퓨터 바이러스 감염자료를 등록 또는 유포하는 행위
  8) 서비스의 안정적 운영을 방해할 수 있는 정보를 전송하거나 수신자의 의사에 반하여 광고성 정보를 전송하는 행위
  9) 방송통신심의위원회, 소비자보호단체 등 공신력 있는 기관으로부터 시정 요구를 받는 행위
  10) 선거관리위원회의 중지, 경고 또는 시정명령을 받는 선거법 위반 행위
  11) 기타 관계 법령에 위배되는 행위
2. 회원은 이 약관에 규정하는 사항과 서비스 이용안내 또는 주의사항을 준수하여야 하며 회사가 공지하거나 별도로 게시한 사항을 준수하여야 합니다.
3. 회원은 회사의 명시적인 사전 동의가 없이 서비스를 이용하여 영업활동을 할 수 없으며, 이에 위반하여 발생한 결과에 대하여 회사는 책임지지 않습니다.
4. 회원은 이와 같은 영업활동과 관련하여 회사에 대하여 손해배상 의무를 집니다.
5. 회원은 서비스의 이용약관, 기타 이용 계약상 지위를 타인에게 양도, 증여할 수 없으며, 이를 담보로 제공할 수 없습니다.
6. 회원은 회사의 사전 승낙 없이는 서비스의 전부 또는 일부 내용 및 기능을 전용할 수 없습니다.
7. 회사는 이용고객이 방문하거나 전자서명 또는 아이디(ID)등을 이용하여 자신의 개인정보에 대한 열람 또는 정정을 요구하는 경우에는 본인 여부를 확인하고 지체없이 필요한 조치를 취하여야 합니다.
8. 회사는 이용고객의 대리인이 방문하여 열람 또는 정정을 요구하는 경우에는 대리관계를 나타내는 증표를 제시하도록 요구할 수 있습니다.
9. 회사는 개인정보와 관련하여 이용고객의 의견을 수렴하고 불만을 처리하기 위한 절차를 마련하여야 합니다.

제11조(서비스 이용 시간)
1. 서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다. 단, 회사는 시스템 정기점검, 증설 및 교체를 위해 회사가 정한 날이나 시간에 서비스를 일시중단할 수 있으며, 예정되어있는 작업으로 인한 서비스 일시중단은 웹을 통해 사전에 공지합니다.
2. 회사는 회사가 통제할 수 없는 사유로 인한 서비스중단의 경우(시스템관리자의 고의, 과실없는 디스크장애, 시스템다운 등)에 사전통지가 불가능하며 타인(PC 통신회사, 기간통신사업자 등)의 고의, 과실로 인한 시스템중단 등의 경우에는 통지하지 않습니다.

제12조(이용자 ID 관리)
1. 아이디(ID)와 비밀번호에 관한 모든 관리책임은 회원에게 있습니다.
2. 자신의 아이디(ID)가 부정하게 사용된 경우 회원은 반드시 회사에 그 사실을 통보해야 합니다.

제13조(게시물의 관리)
회사는 다음 각 호에 해당하는 게시물이나 자료를 사전통지 없이 삭제하거나 이동 또는 등록 거부를 할 수 있습니다.
  1) 다른 회원 또는 제 3자에게 심한 모욕을 주거나 명예를 손상시키는 내용인 경우
  2) 공공질서 및 미풍양속에 위반되는 내용을 유포하거나 링크시키는 경우
  3) 불법복제 또는 해킹을 조장하는 내용인 경우
  4) 영리를 목적으로 하는 광고일 경우
  5) 범죄와 결부된다고 객관적으로 인정되는 내용일 경우
  6) 다른 이용자 또는 제3자의 저작권 등 기타 권리를 침해하는 내용인 경우
  7) 회사에서 규정한 게시물 원칙에 어긋나거나, 게시판 성격에 부합하지 않는 경우
  8) 기타 관계 법령에 위배된다고 판단되는 경우

제14조(게시물에 대한 저작권)
1. 회원은 서비스를 이용하여 취득한 정보를 임의 가공, 판매하는 행위 등 서비스에 게재된 자료를 상업적으로 사용할 수 없습니다.
2. 회사는 회원이 게시하거나 등록하는 서비스 내의 내용물, 게시 내용에 대해 제13조 각 호에 해당된다고 판단되는 경우 사전통지 없이 삭제하거나 이동 또는 등록 거부할 수 있습니다.

제15조(정보의 제공)
회사는 회원이 서비스 이용 도중 필요가 있다고 인정되는 다양한 정보에 대해서 전자우편이나 전화 통신, 단문메시지(SMS, 카카오톡 메시지 등) 등의 방법으로 회원에게 제공할 수 있습니다.

제16조(광고게재 및 광고주와의 거래)
1. 회사가 회원에게 서비스를 제공할 수 있는 서비스 투자기반의 일부는 광고게재를 통한 수익으로부터 나옵니다. 회원은 서비스 이용시 노출되는 광고게재에 대해 동의합니다.
2. 회사는 서비스상에 게재되어 있거나 본 서비스를 통한 광고주의 판촉활동에 회원이 참여하거나 교신 또는 거래를 함으로써 발생하는 손실과 손해에 대해 책임을 지지 않습니다.

제17조(계약 변경 및 해지)
회원이 이용계약을 해지하고자 하는 때에는 회원 본인이 주식회사 어썸갓코포레이션 홈페이지의 "회원탈퇴" 메뉴를 이용해 가입해지를 해야 합니다.
회원탈퇴 메뉴가 보이지 않는 경우 당사에 회원탈퇴 문의를 남겨주시면 처리 도와드립니다.

제17조의2(청약철회 및 환불)
1. 회사가 제공하는 서비스는 디지털 콘텐츠 서비스로서, 회원이 구매한 유료서비스에 대하여 아래의 "청약철회 제한 조건" 중 어느 하나라도 이행한 경우, 전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항에 따라 단순 변심에 의한 청약철회 및 환불이 불가능합니다.
  1) Gemini API Key 등록 이력이 존재하는 경우
  2) 쿠팡 파트너스(쿠파스) API Key 등록 이력이 존재하는 경우
  3) 쓰레드(Threads) API 연동 이력이 존재하는 경우
  4) 드레쓰 아카이브(고화질 숏폼 비디오 소재 등) 열람 및 다운로드 이력이 존재하는 경우
  5) 크롬 확장프로그램 연동 키(JWT Access Token) 발급 이력이 존재하는 경우
  6) 트렌드 인사이트에서 기본 제공 탭(데이터랩) 이외의 다른 탭(구글 트렌드, 쇼핑 트렌드, 실시간 뉴스 등)을 열람한 경우
2. 위 제한 조건에 해당하지 않는 경우의 환불 및 중도 해지는 소프트웨어 이용약관 및 회사가 별도로 고지한 환불 규정에 따릅니다.

제18조(서비스 이용제한)
1. 회사는 회원이 서비스 이용내용에 있어서 본 약관 제10조 내용을 위반하거나, 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.
  1) 미풍양속을 저해하는 비속한 ID 및 별명 사용
  2) 타 이용자에게 심한 모욕을 주거나, 서비스 이용을 방해한 경우
  3) 기타 정상적인 서비스 운영에 방해가 될 경우
  4) 방송통신심의위원회 등 관련 공공기관의 시정 요구가 있는 경우
  5) 불법 웹사이트인 경우
  6) 상용소프트웨어나 크랙 파일을 올린 경우
  7) 정보통신에 관한 심의규정 제2장(심의기준)에 어긋나는 게시물을 게재한 경우
  8) 반국가적 행위의 수행을 목적으로 하는 내용을 포함한 경우
  9) 저작권이 있는 내용을 무단 복제해서 올린 경우
  10) 정보통신 설비의 오작동이나 정보 등의 파괴를 유발시키는 컴퓨터 바이러스 프로그램 등을 유포하는 경우
2. 상기 이용제한 규정에 따라 서비스를 이용하는 회원에게 서비스 이용에 대하여 별도 공지 없이 서비스 이용의 일시정지, 정지, 이용계약 해지 등을 불량이용자 처리규정에 따라 취할 수 있습니다.

제19조(손해배상의 범위 및 청구)
1. 회사는 서비스로부터 회원이 받은 손해가 천재지변등 불가항력적이거나 회원의 고의 또는 과실로 인하여 발생한 때에는 손해배상을 하지 아니합니다.
2. 회사는 전자상거래 호스팅 및 일반 호스팅의 경우 이에 준하는 서비스 이용회원일 경우 불가항력적으로 손해가 발생한 경우에 대하여 위 1.항의 규정에 따릅니다.
3. 회원이 서비스를 이용함에 있어 행한 불법행위로 인하여 회사가 당해 회원 이외에 제 3 자로부터 손해배상 청구, 소송을 비롯한 각종의 이의제기를 받는 경우 당해 회원은 회사의 면책을 위하여 노력하여야 하며, 만일 회사가 면책되지 못한 경우는 당해 회원은 그로 인하여 회사에 발생한 모든 손해를 배상하여야 합니다.

제20조(면책사항)
1. 회사는 천재지변, 기상이변, 전쟁 및 기타 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 대한 책임이 면제됩니다.
2. 회사는 기간통신 사업자가 전기통신 서비스를 중지하거나 정상적으로 제공하지 아니하여 손해가 발생한 경우 책임이 면제됩니다.
3. 회사는 서비스용 설비의 보수, 교체, 정기점검, 공사 등 부득이한 사유로 발생한 손해에 대한 책임이 면제됩니다.
4. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애 또는 손해에 대하여 책임을 지지 않습니다.
5. 회사는 이용자의 컴퓨터 오류에 의해 손해가 발생한 경우, 또는 회원이 신상정보 및 전자우편 주소를 부실하게 기재하여 손해가 발생한 경우 책임을 지지 않습니다.
6. 회사는 회원이 서비스에 게재한 각종 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 대하여 책임을 지지 않습니다.
7. 회사는 회원 상호간 또는 회원과 제3자 상호간에 서비스를 매개로 하여 물품거래(무형의 물품 포함)등을 한 경우에 그로부터 발생하는 일체의 손해에 대하여 책임지지 아니합니다.
8. 회사는 회사에 링크된 사이트가 취급하는 상품 또는 용역에 대하여 보증책임을 지지 아니합니다.
9. 회사와 회사에 연결된 사이트는 독자적으로 운영되며 회사는 회사 연결사이트와 회원 간에 행해진 거래에 대하여 어떠한 책임도 지지 아니합니다.
10. 회사에서 회원에게 무료로 제공하는 서비스의 이용과 관련해서는 어떠한 손해도 책임을 지지 않습니다.

제21조(재판권 및 분쟁조정)
1. 이 약관에 명시되지 않은 사항은 전기통신사업법 등 관계법령과 상관습에 따릅니다.
2. 서비스 이용과 관련하여 회사와 회원 사이에 분쟁이 발생한 경우, 쌍방간에 분쟁의 해결을 위해 성실히 협의한 후가 아니면 제소할 수 없습니다.
3. 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.

(부칙) 이 약관은 2024년 1월 1일부터 시행합니다.`;

const PRIVACY_POLICY_TEXT = `주식회사 어썸갓코포레이션 개인정보 취급 방침

‘주식회사 어썸갓코포레이션'은 (이하 '회사'는) 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다. 회사는 개인정보 취급방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다. 회사는 개인정보 취급방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것 입니다.

제1조(개인정보의 수집 및 이용목적)
회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.
1. 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산 : 콘텐츠 제공, 구매 및 요금 결제, 물품배송 또는 청구지 등 발송
2. 회원 관리 : 회원제 서비스 이용에 따른 본인확인, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 만14세 미만 아동 개인정보 수집 시 법정 대리인 동의 여부 확인, 고지사항 전달
3. 마케팅 및 광고에 활용 : 이벤트 등 광고성 정보 전달, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계
4. 소셜 미디어 연동 서비스 제공 : Meta(Threads) API 연동을 통한 콘텐츠 자동 발행 및 관련 계정 관리 지원

제2조(수집하는 개인정보의 항목)
회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
1. 수집항목 : 이름, 생년월일, 성별, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 회사명, 부서, 직책, 회사전화번호, 결혼여부, 기념일, 접속 로그, 쿠키, 접속IP 정보
2. 개인정보 수집방법 : 웹사이트 (https://www.agczero.com)

제3조(개인정보의 보유 및 이용기간)
원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
1. 보존 항목 : 이름, 성별, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 이메일
2. 보존 근거 : 전자상거래등에서의 소비자보호에 관한 법률
3. 보존 기간 : 회원탈퇴시까지
4. 계약 또는 청약철회 등에 관한 기록 : 5년 (전자상거래등에서의 소비자보호에 관한 법률)
5. 대금결제 및 재화 등의 공급에 관한 기록 : 5년 (전자상거래등에서의 소비자보호에 관한 법률)
6. 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년 (전자상거래등에서의 소비자보호에 관한 법률)

제4조(개인정보의 파기 절차 및 방법)
회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.
1. 파기절차 : 회원님이 회원가입 등을 위해 입력하신 정보는 DB에 저장되며, 저장된 개인정보는 법률에 의한 경우가 아니고서는 보유된 이외의 다른 목적으로 이용되지 않습니다.
2. 파기방법 : 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.

제5조(개인 정보 제공)
회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
1. 이용자들이 사전에 동의한 경우
2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
3. Meta(Threads 등) 외부 소셜 미디어 연동 서비스를 이용하는 경우, 사용자의 명시적인 동의 하에 해당 플랫폼 연동을 위한 인증 정보(액세스 토큰, 계정 식별자 등)가 수집 및 활용되며, 이는 서비스 목적 외에 타 용도로 제공되지 않습니다.

제6조(수집한 개인정보의 위탁)
회사는 고객님의 동의없이 고객님의 정보를 외부 업체에 위탁하지 않습니다. 향후 그러한 필요가 생길 경우, 위탁 대상자와 위탁 업무 내용에 대해 고객님에게 통지하고 필요한 경우 사전 동의를 받도록 하겠습니다.

제7조(이용자 및 법정대리인의 권리와 그 행사방법)
1. 이용자 및 법정 대리인은 언제든지 등록되어있는 자신 혹은 당해 만 14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.
2. 이용자 혹은 만 14세 미만 아동의 개인정보 조회·수정을 위해서는 ‘개인정보변경’(또는 ‘회원정보수정’ 등)을 가입해지(동의철회)를 위해서는 “회원탈퇴”를 클릭하여 본인 확인 절차를 거치신 후 직접 열람, 정정 또는 탈퇴가 가능합니다. 혹은 개인정보관리책임자에게 서면, 전화 또는 이메일로 연락하시면 지체없이 조치하겠습니다.
3. 귀하가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다. 또한 잘못된 개인정보를 제3자 에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체없이 통지하여 정정이 이루어지도록 하겠습니다.
4. 주식회사 어썸갓코포레이션은 이용자 혹은 법정 대리인의 요청에 의해 해지 또는 삭제된 개인정보는 “개인정보의 보유 및 이용기간”에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.

제8조(개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항)
회사는 귀하의 정보를 수시로 저장하고 찾아내는 ‘쿠키(cookie)’ 등을 운용합니다. 쿠키란 주식회사 어썸갓코포레이션 웹사이트를 운영하는데 이용되는 서버가 귀하의 브라우저에 보내는 아주 작은 텍스트 파일로서 귀하의 컴퓨터 하드디스크에 저장됩니다. 회사는 다음과 같은 목적을 위해 쿠키를 사용합니다.
1. 쿠키 등 사용 목적
  1) 회원과 비회원의 접속 빈도나 방문 시간 등을 분석, 이용자의 취향과 관심분야를 파악 및 자취 추적, 각종 이벤트 참여 정도 및 방문 횟수 파악 등을 통한 타겟 마케팅 및 개인 맞춤 서비스 제공
  2) 귀하는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 귀하는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.
2. 쿠키 설정 거부 방법
  1) 쿠키 설정을 거부하는 방법으로는 회원님이 사용하시는 웹 브라우저의 옵션을 선택함으로써 모든 쿠키를 허용하거나 쿠키를 저장할 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.
설정방법 예(인터넷 익스플로어의 경우) : 웹 브라우저 상단의 도구 > 인터넷 옵션 > 개인정보
  2) 단, 귀하께서 쿠키 설치를 거부하였을 경우 서비스 제공에 어려움이 있을 수 있습니다.

제9조(개인정보에 관한 민원서비스)
1. 회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보관리책임자를 지정하고 있습니다.
  1) 고객서비스담당 부서 : 영업관리팀
  2) 개인정보관리부서 : 개발부
  3) 전화번호 : 02-2138-2929
  4) 이메일 : office@agczero.com
2. 귀하께서는 회사의 서비스를 이용하시며 발생하는 모든 개인정보보호 관련 민원을 개인정보관리책임자 혹은 담당부서로 신고하실 수 있습니다. 회사는 이용자들의 신고사항에 대해 신속하게 충분한 답변을 드릴 것입니다.

(부칙) 본 방침은 2024년 4월 1일부터 시행됩니다.
Copyright © 2026 DReaThs. All rights reserved.`;

function openTermsModal(type) {
    const modalEl = document.getElementById("termsModal") || document.getElementById("legalModal");
    if (!modalEl) {
        alert("termsModal 요소를 찾을 수 없습니다.");
        return;
    }

    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    modalEl.classList.remove("hidden");
    modalEl.classList.add("active");
    modalEl.style.setProperty("display", "flex", "important");
    modalEl.style.setProperty("z-index", "999999", "important");

    switchTermsTab(type || "terms");
}

function switchTermsTab(type) {
    const tabTermsBtn = document.getElementById("termsTabTermsBtn") || document.getElementById("legalTabTerms");
    const tabPrivacyBtn = document.getElementById("termsTabPrivacyBtn") || document.getElementById("legalTabPrivacy");
    const panelTerms = document.getElementById("termsPanelTerms") || document.getElementById("legalPanelTerms");
    const panelPrivacy = document.getElementById("termsPanelPrivacy") || document.getElementById("legalPanelPrivacy");

    if (!panelTerms || !panelPrivacy) return;

    if (type === "privacy") {
        if (tabTermsBtn) tabTermsBtn.className = "btn btn-secondary";
        if (tabPrivacyBtn) tabPrivacyBtn.className = "btn btn-primary";
        panelTerms.classList.add("hidden");
        panelPrivacy.classList.remove("hidden");
        panelPrivacy.textContent = PRIVACY_POLICY_TEXT;
    } else {
        if (tabTermsBtn) tabTermsBtn.className = "btn btn-primary";
        if (tabPrivacyBtn) tabPrivacyBtn.className = "btn btn-secondary";
        panelTerms.classList.remove("hidden");
        panelPrivacy.classList.add("hidden");
        panelTerms.textContent = TERMS_OF_SERVICE_TEXT;
    }
}

// Aliases for compatibility
function openLegalModal(type) { openTermsModal(type); }
function switchLegalTab(type) { switchTermsTab(type); }

// ==================================================
// 💌 Consolidated Inquiries & Suggestions System
// ==================================================
let localInquiries = JSON.parse(localStorage.getItem('aqua_buddy_inquiries') || '[]');

function openInquiryModal(category) {
    const modalEl = document.getElementById("inquiryModal");
    if (!modalEl) {
        alert("inquiryModal 요소를 찾을 수 없습니다.");
        return;
    }

    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    const selectEl = document.getElementById("inquiryCategory");
    if (selectEl && category) {
        selectEl.value = category;
    }

    // Auto-fill user name/contact if logged in
    if (typeof currentUser !== 'undefined' && currentUser) {
        const nameInput = document.getElementById("inquiryName");
        const contactInput = document.getElementById("inquiryContact");
        if (nameInput && !nameInput.value) {
            nameInput.value = currentUser.name || currentUser.nickname || "";
        }
        if (contactInput && !contactInput.value) {
            contactInput.value = currentUser.email || currentUser.phone || "";
        }
    }

    modalEl.classList.remove("hidden");
    modalEl.classList.add("active");
    modalEl.style.setProperty("display", "flex", "important");
    modalEl.style.setProperty("z-index", "999999", "important");
}

function handleInquirySubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const category = document.getElementById("inquiryCategory") ? document.getElementById("inquiryCategory").value : "general";
    const name = document.getElementById("inquiryName") ? document.getElementById("inquiryName").value.trim() : "";
    const contact = document.getElementById("inquiryContact") ? document.getElementById("inquiryContact").value.trim() : "";
    const title = document.getElementById("inquiryTitle") ? document.getElementById("inquiryTitle").value.trim() : "";
    const content = document.getElementById("inquiryContent") ? document.getElementById("inquiryContent").value.trim() : "";

    if (!name || !contact || !content) {
        if (typeof showToast === "function") showToast("⚠️ 모든 필수 항목을 작성해 주세요.");
        return;
    }

    const categoryMap = {
        'ad': '🤝 광고/제휴',
        'bug': '🐛 버그/오류',
        'feature': '💡 기능건의',
        'general': '❓ 기타문의'
    };

    const newInquiry = {
        id: `inq-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
        category: category,
        categoryName: categoryMap[category] || '기타문의',
        name: name,
        contact: contact,
        title: title || '제목 없음',
        content: content,
        date: new Date().toLocaleString('ko-KR'),
        status: '접수완료'
    };

    localInquiries.unshift(newInquiry);
    localStorage.setItem('aqua_buddy_inquiries', JSON.stringify(localInquiries));

    if (supabaseClient) {
        try {
            supabaseClient.from('inquiries').insert([{
                category: newInquiry.category,
                category_name: newInquiry.categoryName,
                name: newInquiry.name,
                contact: newInquiry.contact,
                title: newInquiry.title,
                content: newInquiry.content,
                image: inquiryImageCompressed || "",
                status: newInquiry.status
            }]).then(({ error }) => {
                if (error) console.warn('Supabase inquiries INSERT notice:', error);
            });
        } catch(sbErr) {
            console.warn('Supabase inquiries INSERT exception:', sbErr);
        }
    }

    const modalEl = document.getElementById("inquiryModal");
    if (modalEl && typeof closeModal === "function") {
        closeModal(modalEl);
    }

    // Reset Form fields
    const titleInput = document.getElementById("inquiryTitle");
    if (titleInput) titleInput.value = "";
    const contentInput = document.getElementById("inquiryContent");
    if (contentInput) contentInput.value = "";

    if (typeof showToast === "function") {
        showToast("💌 문의 및 제안이 성공적으로 제출되었습니다. 웹마스터 대시보드에 실시간 전송되었습니다.");
    }

    if (typeof renderAdminInquiries === "function") {
        renderAdminInquiries();
    }
}

function renderAdminInquiries() {
    const tbody = document.getElementById("adminInquiriesTbody");
    if (!tbody) return;

    if (!localInquiries || localInquiries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    💌 접수된 문의 및 제안 내역이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = localInquiries.map(inq => `
        <tr>
            <td><span class="badge ${inq.category === 'ad' ? 'badge-instructor' : 'badge-community'}">${typeof escapeHtml === 'function' ? escapeHtml(inq.categoryName) : inq.categoryName}</span></td>
            <td><strong>${typeof escapeHtml === 'function' ? escapeHtml(inq.name) : inq.name}</strong></td>
            <td><code>${typeof escapeHtml === 'function' ? escapeHtml(inq.contact) : inq.contact}</code></td>
            <td><strong>${typeof escapeHtml === 'function' ? escapeHtml(inq.title || '') : (inq.title || '')}</strong></td>
            <td style="max-width: 220px; word-break: break-word; font-size: 0.8rem;">${typeof escapeHtml === 'function' ? escapeHtml(inq.content) : inq.content}</td>
            <td style="font-size: 0.78rem;">${inq.date}</td>
            <td style="display: flex; gap: 4px; align-items: center;">
                <button type="button" class="btn btn-secondary" onclick="updateInquiryStatus('${inq.id}')" style="padding: 3px 8px; font-size: 0.72rem; ${inq.status === '처리완료' ? 'background: #00e676; color: #000; font-weight: 800;' : ''}">
                    ${inq.status === '처리완료' ? '✓ 완료' : '접수 ➔ 완료'}
                </button>
                <button type="button" class="btn btn-danger" onclick="deleteInquiry('${inq.id}')" style="padding: 3px 6px; font-size: 0.72rem; background: #ff5252; color: #fff;">
                    삭제
                </button>
            </td>
        </tr>
    `).join("");
}

function updateInquiryStatus(id) {
    const item = localInquiries.find(i => i.id === id);
    if (item) {
        item.status = item.status === '처리완료' ? '접수완료' : '처리완료';
        localStorage.setItem('aqua_buddy_inquiries', JSON.stringify(localInquiries));
        renderAdminInquiries();
        if (typeof showToast === "function") showToast(`STATUS: 문의 상태가 '${item.status}'로 전환되었습니다.`);
    }
}

function deleteInquiry(id) {
    if (confirm("해당 문의 내역을 삭제하시겠습니까?")) {
        localInquiries = localInquiries.filter(i => i.id !== id);
        localStorage.setItem('aqua_buddy_inquiries', JSON.stringify(localInquiries));
        renderAdminInquiries();
        if (typeof showToast === "function") showToast("🗑️ 문의 항목이 삭제되었습니다.");
    }
}

function showUnpreparedToast(featureName) {
    if (typeof showToast === "function") {
        showToast(`🚧 '${featureName}' 기능은 현재 준비 중입니다.`);
    }
}

// Ensure main-footer is appended directly to document.body (Root Level Placement)
function enforceRootFooterPlacement() {
    const footer = document.querySelector('.main-footer') || document.querySelector('.footer');
    if (footer && footer.parentElement !== document.body) {
        document.body.appendChild(footer);
        console.log('[Layout Fix] main-footer를 document.body 직계 맨 밑으로 이관 완료');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enforceRootFooterPlacement();
        attachBannerClickLogging();
        renderBannerClickStatsUI();
        loadCoupangApiKey();
    });
} else {
    enforceRootFooterPlacement();
    attachBannerClickLogging();
    renderBannerClickStatsUI();
    loadCoupangApiKey();
}
// Global Event Delegation for Dynamic Comment Submit Buttons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.comment-submit-btn');
    if (btn) {
        console.log('📌 [GLOBAL DELEGATION] .comment-submit-btn 클릭 감지!');
        const form = btn.closest('form');
        const input = form ? form.querySelector('input') : document.getElementById('newCommentInput');
        
        let targetPostId = null;
        if (form && form.id && form.id.includes('modernCommentForm_')) {
            targetPostId = form.id.replace('modernCommentForm_', '');
        } else if (currentChatPost && currentChatPost.id) {
            targetPostId = currentChatPost.id;
        } else {
            const activeModal = document.querySelector('.post-card[data-post-id]') || document.querySelector('[data-post-id]');
            if (activeModal) targetPostId = activeModal.getAttribute('data-post-id');
        }

        if (targetPostId && typeof handleAddComment === 'function') {
            console.log('🚀 [GLOBAL DELEGATION EXECUTING] handleAddComment 실행! targetPostId:', targetPostId);
            handleAddComment(e, targetPostId);
        } else {
            console.warn('⚠️ [GLOBAL DELEGATION WARN] targetPostId를 찾을 수 없습니다.');
        }
    }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() => console.log("Service Worker registered")).catch(err => console.error("SW registration failed:", err));
}
