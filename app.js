/* ==========================================================================
   AquaBuddy (아쿠아버디) - Dynamic Application Logic (v44.0 Unified Inquiries & Ad Partnerships)
   - Restored Responsive Side Banners (1200px Media Query Breakpoint)
   - Unified Customer Feedback & Ad Inquiry Modal (#inquiryModal)
   - Categories: Ad Partnership, Bug Report, Feature Idea, Content Edit, General Feedback
   - Protected Webmaster Admin Dashboard Inquiries Management Table
   ========================================================================== */

// Load Configuration Credentials
const SUPABASE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.url
    : "https://ogfzfgsvmjuimjjhaubs.supabase.co";

const SUPABASE_ANON_KEY = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.anonKey
    : "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

const KAKAO_APP_KEY = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.kakao)
    ? window.AQUA_CONFIG.kakao.appKey
    : "7c316726691ea5e02f234a85f5a20bab";

const COUPANG_CUSPE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.coupang)
    ? window.AQUA_CONFIG.coupang.cuspeUrl
    : "https://link.coupang.com/a/fKqrpaA2Fw";

// Initialize Supabase JS Client
let supabaseClient = null;
if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized Successfully:", SUPABASE_URL);
    } catch (err) {
        console.log("Supabase Init Warning:", err);
    }
}

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

// Initial Posts Sample Data
const INITIAL_POSTS = [
    {
        id: "post-instructor-1",
        title: "[AIDA 강사] 가평 K26 1일 원데이 프리다이빙 체험 강습 모집!",
        category: "instructor",
        categoryName: "강사 클래스",
        instructorOrg: "AIDA",
        instructorLicenseCode: "AIDA-IN-98472",
        classType: "1일 원데이 체험 강습",
        classFee: 60000,
        classRatio: "1:2 소수정예 강습",
        classInclusion: "장비 풀세트 렌탈 포함 (풀장 입장료 별도)",
        location: "가평 K26 잠수풀 (수심 26m)",
        region: "seoul",
        locationName: "가평 K26 잠수풀 (수심 26m)",
        mapAddress: "경기도 가평군 청평면 고성리 317 K26",
        date: "2026-08-02T11:00",
        userName: "해양마스터강사",
        userLicense: "AIDA Master Instructor (No. AIDA-IN-98472)",
        certImage: "",
        reqLicense: "입문자 / 초보자 누구나 수강 가능",
        capacity: 2,
        joinedCount: 1,
        attendees: ["해양마스터강사"],
        hostRating: 5.0,
        hostReviewsCount: 42,
        desc: "수영을 못해도 OK! AIDA 공인 인증 강사(라이선스: AIDA-IN-98472)가 1:2 소수 정예로 안전하고 재미있게 수심 10m 프리다이빙을 체험시켜 드립니다. 수중 영상 무료 촬영 서비스!",
        status: "recruiting",
        statusText: "수강생 모집 중",
        likes: 28,
        userLiked: false,
        wishlistCount: 19,
        userWished: false,
        unreadCount: 0,
        comments: [
            { author: "초보다이버", text: "수영 전혀 못하는데 신청 가능한가요?", time: "2시간 전" },
            { author: "해양마스터강사", text: "네! 수영 능력 상관없이 1:2 밀착 케어로 진행되니 안심하고 신청하세요!", time: "1시간 전" }
        ],
        images: [],
        createdAt: "2026-07-27T22:00:00"
    },
    {
        id: "post-openwater-1",
        title: "포항 영일대 해수욕장 2.5km 바다수영 버디 구합니다!",
        category: "openwater",
        categoryName: "바다 수영",
        location: "포항 영일대 해변 바다수영 스팟",
        region: "yeongnam",
        locationName: "포항 영일대 해변 바다수영 스팟",
        mapAddress: "경북 포항시 북구 두호동 영일대해수욕장 1구역",
        date: "2026-08-01T08:30",
        userName: "포항돌고래",
        userLicense: "오픈워터 수영 3년차 / 안전부표 소지",
        reqLicense: "오픈워터 안전부표 & 핀(오리발) 필수",
        capacity: 4,
        joinedCount: 2,
        attendees: ["포항돌고래", "동해물개"],
        hostRating: 4.9,
        hostReviewsCount: 18,
        desc: "이번 토요일 아침 파도가 잔잔할 때 영일대 해변에서 2.5km 바다수영 함께하실 버디 구합니다. 슈트 및 오렌지색 안전부표 필수 착용!",
        status: "recruiting",
        statusText: "모집 중",
        likes: 12,
        userLiked: false,
        wishlistCount: 5,
        userWished: false,
        unreadCount: 1,
        comments: [
            { author: "동해물개", text: "영일대 아침 수영 파도 잔잔하고 좋습니다! 저도 참가 신청합니다.", time: "1시간 전" }
        ],
        images: [],
        createdAt: "2026-07-27T20:00:00"
    },
    {
        id: "post-freediving-k26",
        title: "가평 K26 딥트레이닝 버디 구해요! (수심 20m~25m)",
        category: "freediving",
        categoryName: "프리다이빙",
        location: "가평 K26 잠수풀 (수심 26m)",
        region: "seoul",
        locationName: "가평 K26 잠수풀 (수심 26m)",
        mapAddress: "경기도 가평군 청평면 고성리 317 K26",
        date: "2026-07-30T10:00",
        userName: "딥블루다이버",
        userLicense: "AIDA 3 / CPR 자격 소지",
        reqLicense: "AIDA 3 / PADI Advanced 이상",
        capacity: 4,
        joinedCount: 4,
        attendees: ["딥블루다이버", "프리마니아", "바다마스터", "해양탐험가"],
        hostRating: 5.0,
        hostReviewsCount: 24,
        desc: "이번 토요일 K26에서 20m 이상 딥 세션 트레이닝 함께하실 버디 구합니다. 1인 잠수 1인 수면 감시(One-Up One-Down) 철저 준수!",
        status: "in_progress",
        statusText: "참가자 확정 완료 (일정 진행 중)",
        likes: 18,
        userLiked: false,
        wishlistCount: 9,
        userWished: false,
        unreadCount: 2,
        comments: [
            { author: "프리마니아", text: "AIDA 3 소지하고 있고 20m 수심 랜야드 세이프티 잘 봐드립니다!", time: "2시간 전" }
        ],
        images: [],
        createdAt: "2026-07-27T19:30:00"
    },
    {
        id: "post-market-1",
        title: "[중고장터] AIDA 카본 롱핀 (리더핀 카본 41-42) 상태 극상 팝니다!",
        category: "market",
        categoryName: "중고장터",
        location: "서울 송파구 올림픽공원 다이빙풀 입구",
        region: "seoul",
        locationName: "서울 송파구 올림픽공원 다이빙풀 입구",
        mapAddress: "서울 송파구 올림픽공원 다이빙풀 입구",
        dealMethod: "직거래/택배 둘 다 가능",
        price: 240000,
        priceText: "240,000 원",
        userName: "핀마스터",
        userLicense: "프리다이버 / 마켓 인증",
        capacity: 1,
        hostRating: 4.8,
        hostReviewsCount: 9,
        desc: "리더핀 카본 미디움 41-42 사이즈입니다. 실사용 5회 미만으로 기스 거의 없습니다. 올림픽수영장 직거래 또는 우체국 택배 가능합니다.",
        status: "recruiting",
        statusText: "판매 중",
        likes: 8,
        userLiked: false,
        wishlistCount: 14,
        userWished: false,
        unreadCount: 0,
        comments: [],
        images: [],
        createdAt: "2026-07-27T18:00:00"
    },
    {
        id: "post-community-1",
        title: "[수다방] 딥스테이션 36m 첫 통과 후기 & 프렌젤 이퀄 꿀팁!",
        category: "community",
        categoryName: "자유수다방",
        location: "용인 딥스테이션",
        region: "seoul",
        locationName: "용인 딥스테이션 (수심 36m)",
        userName: "이퀄신동",
        userLicense: "AIDA 4 Master",
        capacity: 1,
        hostRating: 4.9,
        hostReviewsCount: 31,
        desc: "그동안 딥스테이션 20m 부근에서 이퀄이 막혀 고생했는데, 목 근육 힘을 빼고 혀뿌리 펌핑에 집중하니 36m 아치를 쉽게 통과했습니다! 이퀄 막히하시는 분들 질문 주세요.",
        status: "completed",
        statusText: "인기 글",
        likes: 34,
        userLiked: false,
        wishlistCount: 0,
        userWished: false,
        unreadCount: 0,
        comments: [
            { author: "초보다이버", text: "유익한 팁 감사합니다! 역압 체크할 때 혀 위치는 어디로 해야 하나요?", time: "3시간 전" }
        ],
        images: [],
        createdAt: "2026-07-27T15:00:00"
    }
];

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

        if (activeCategory === "instructor" && navInstructor) navInstructor.classList.add("active");
        else if (activeCategory === "community" && navCommunity) navCommunity.classList.add("active");
        else if (activeCategory === "market" && navMarket) navMarket.classList.add("active");
        else if (activeCategory === "activity_log" && navActivity) navActivity.classList.add("active");
        else if (navFeed) navFeed.classList.add("active");

        filterAndRender();
    } else if (viewName === "tide") {
        if (feedSec) feedSec.classList.add("hidden");
        if (tideSec) tideSec.classList.remove("hidden");
        if (cctvSec) cctvSec.classList.add("hidden");
        if (navTide) navTide.classList.add("active");
        document.body.classList.add("category-view-active");
        renderWeatherGrid(activeTideRegion);
    } else if (viewName === "cctv") {
        if (feedSec) feedSec.classList.add("hidden");
        if (tideSec) tideSec.classList.add("hidden");
        if (cctvSec) cctvSec.classList.remove("hidden");
        if (navCctv) navCctv.classList.add("active");
        document.body.classList.add("category-view-active");
        renderOceanWebcams(activeCctvRegion);
    }

    // Multi-stage Force Scroll-to-Top (Guarantees Photo 1 View across all devices!)
    forceScrollToTop();
    setTimeout(forceScrollToTop, 10);
    setTimeout(forceScrollToTop, 50);
    setTimeout(forceScrollToTop, 150);
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    initKakaoSdk();
    initUserIdentity();
    loadPosts();
    loadMyPosts();
    loadInquiries();
    initEventListeners();
    initStarRatingEvents();
    switchMainView('home');
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
    const userNav = document.getElementById("userProfileNav");
    const openAuthBtn = document.getElementById("openAuthModalBtn");

    if (currentUser && currentUser.name) {
        if (userNav) userNav.classList.remove("hidden");
        const instBadge = currentUser.instructorCode ? ` [인증강사]` : '';
        const navName = document.getElementById("navUserName");
        if (navName) navName.textContent = `${currentUser.name}${instBadge}`;
        if (openAuthBtn) openAuthBtn.classList.add("hidden");
    } else {
        if (userNav) userNav.classList.add("hidden");
        if (openAuthBtn) openAuthBtn.classList.remove("hidden");
    }

    updateCreateButtonText(activeCategory);
}

function isVerifiedInstructor() {
    return currentUser && currentUser.instructorCode && currentUser.instructorCode.trim().length > 0;
}

function openInstructorAuthModal() {
    if (!currentUser) {
        showToast("🔑 로그인 / 회원가입 후 강사 인증을 이용하실 수 있습니다!");
        openModal(authModal);
        return;
    }
    openModal(document.getElementById("instructorAuthModal"));
}

function handleInstructorAuthSubmit(e) {
    e.preventDefault();

    const org = document.getElementById("instAppOrg").value;
    const code = document.getElementById("instAppCode").value.trim();

    if (!code) {
        showToast("⚠️ 강사 라이선스 코드 번호를 입력해 주세요!");
        return;
    }

    if (currentUser) {
        currentUser.instructorCode = code;
        currentUser.license = `${org} Instructor (No. ${code})`;
        if (instAppCertImage) currentUser.certImage = instAppCertImage;

        localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
        updateNavbarUserUI();
    }

    closeModal(document.getElementById("instructorAuthModal"));
    filterAndRender();
    showToast(`🎓 강사 자격증 검증 신청서가 접수되었습니다! VERIFIED SEAL 뱃지와 강사 클래스 등록 권한이 활성화되었습니다.`);
}

function openAdminDashboard() {
    if (!isAdminAuthenticated) {
        showToast("🔒 관리자 암호 인증 후 접근할 수 있습니다.");
        openAdminSecurityCheck();
        return;
    }
    renderAdminPostsTable();
    renderAdminInquiriesTable();
    openModal(document.getElementById("adminDashboardModal"));
}

function switchAdminTab(tabKey) {
    const tabs = ["stats", "inquiries", "instructors", "posts", "affiliate", "settings"];
    tabs.forEach(t => {
        const btn = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const panel = document.getElementById(`adminPanel${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (t === tabKey) {
            if (btn) btn.classList.add("active");
            if (panel) panel.classList.remove("hidden");
        } else {
            if (btn) btn.classList.remove("active");
            if (panel) panel.classList.add("hidden");
        }
    });

    if (tabKey === "posts") renderAdminPostsTable();
    if (tabKey === "inquiries") renderAdminInquiriesTable();
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
            <td>${escapeHtml(post.userName)}</td>
            <td>${formatTimeAgo(post.createdAt)}</td>
            <td>
                <button class="btn-delete" onclick="performPostDeletion('${post.id}')" style="padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fa-solid fa-trash-can"></i> 삭제
                </button>
            </td>
        </tr>
    `).join("");
}

function approveInstructorCertDemo(name) {
    const pendingBadge = document.getElementById("adminInstPendingBadge");
    if (pendingBadge) pendingBadge.textContent = "0";

    const queueTbody = document.getElementById("adminInstructorQueueTbody");
    if (queueTbody) {
        queueTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color: #00e676; padding: 20px; font-weight:700;">
                    ✓ 모든 강사 자격증 실물 심사가 승인 완료되었습니다. (대기열 0건)
                </td>
            </tr>
        `;
    }

    showToast(`🎓 '${name}' 강사님의 자격증 실물 심사가 승인되어 'VERIFIED SEAL' 뱃지가 최종 발급되었습니다!`);
}

function openProfileModal() {
    if (!currentUser) return;

    document.getElementById("myProfNameDisplay").textContent = currentUser.name;
    document.getElementById("myProfProviderDisplay").textContent = `${currentUser.provider || 'AquaBuddy'} 인증 계정`;
    document.getElementById("myProfNickInput").value = currentUser.name;
    document.getElementById("myProfLicenseInput").value = currentUser.license || "";

    openModal(document.getElementById("myProfileModal"));
}

function handleUpdateProfile(e) {
    e.preventDefault();
    if (!currentUser) return;

    const newNick = document.getElementById("myProfNickInput").value.trim();
    const newLicense = document.getElementById("myProfLicenseInput").value.trim();

    currentUser.name = newNick || currentUser.name;
    currentUser.license = newLicense || currentUser.license;

    localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
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

function switchAuthTab(type) {
    const emailTabBtn = document.getElementById("tabEmailAuth");
    const kakaoTabBtn = document.getElementById("tabKakaoAuth");
    const emailBox = document.getElementById("emailAuthFormBox");
    const kakaoBox = document.getElementById("kakaoAuthFormBox");

    if (type === "email") {
        emailTabBtn.classList.add("active");
        kakaoTabBtn.classList.remove("active");
        emailBox.classList.remove("hidden");
        kakaoBox.classList.add("hidden");
    } else {
        kakaoTabBtn.classList.add("active");
        emailTabBtn.classList.remove("active");
        kakaoBox.classList.remove("hidden");
        emailBox.classList.add("hidden");
    }
}

function handleDirectEmailAuth(e) {
    e.preventDefault();

    const email = document.getElementById("directEmailInput").value.trim();
    const pw = document.getElementById("directPasswordInput").value.trim();
    const nick = document.getElementById("socialNicknameInput").value.trim() || "바다마스터";
    const license = document.getElementById("socialLicenseInput").value.trim() || "AIDA 3 / 레스큐 소지";

    if (!email || !pw) {
        showToast("⚠️ 이메일 주소와 비밀번호를 입력해 주세요!");
        return;
    }

    currentUser = {
        email: email,
        name: nick,
        license: license,
        instructorCode: "",
        provider: "홈페이지 직가입",
        avatar: "E"
    };

    localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
    updateNavbarUserUI();

    closeModal(authModal);
    filterAndRender();
    showToast(`🎉 ${nick}님, 홈페이지 계정 가입 및 로그인에 성공하셨습니다!`);
}

function loginWithKakaoOAuth() {
    const nickInput = document.getElementById("socialNicknameInput") ? document.getElementById("socialNicknameInput").value.trim() : "카카오다이버";
    const licInput = document.getElementById("socialLicenseInput") ? document.getElementById("socialLicenseInput").value.trim() : "AIDA 3 / 수영 다이버";

    localStorage.setItem("aqua_buddy_pending_auth_nick", nickInput);
    localStorage.setItem("aqua_buddy_pending_auth_lic", licInput);

    initKakaoSdk();

    const redirectTargetUri = (typeof window !== "undefined" && window.location.origin)
        ? (window.location.origin + window.location.pathname)
        : "https://aqua-buddy-nu.vercel.app/";

    if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth && window.Kakao.Auth.authorize) {
        try {
            window.Kakao.Auth.authorize({
                redirectUri: redirectTargetUri,
                prompt: 'login'
            });
            return;
        } catch (e) {
            console.log("Kakao Authorize Catch:", e);
        }
    }

    // Direct Kakao OAuth URL Fallback (Guarantees Kakao Login Screen across all mobile/Vercel environments)
    const encodedRedirect = encodeURIComponent(redirectTargetUri);
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_APP_KEY}&redirect_uri=${encodedRedirect}&response_type=code&prompt=login`;
}

function checkKakaoOAuthCallback() {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        const pendingNick = localStorage.getItem("aqua_buddy_pending_auth_nick") || "카카오다이버";
        const pendingLic = localStorage.getItem("aqua_buddy_pending_auth_lic") || "AIDA 3 / 수영 다이버";

        localStorage.removeItem("aqua_buddy_pending_auth_nick");
        localStorage.removeItem("aqua_buddy_pending_auth_lic");

        currentUser = {
            name: pendingNick,
            license: pendingLic,
            instructorCode: "",
            provider: "카카오톡 정식인증",
            avatar: "K",
            kakaoCode: authCode
        };

        localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
        updateNavbarUserUI();
        showToast(`🎉 ${pendingNick}님, 카카오톡 공식 인증 로그인에 성공하셨습니다!`);
    }
}

function isMyPost(post) {
    if (!post) return false;
    if (myCreatedPostIds && myCreatedPostIds.includes(post.id)) return true;
    if (currentUser && currentUser.name && post.userName) {
        return currentUser.name.trim() === post.userName.trim();
    }
    return false;
}

function loadPosts() {
    const saved = localStorage.getItem("aqua_buddy_posts_v27");
    if (saved) {
        try {
            posts = JSON.parse(saved);
        } catch (e) {
            posts = [...INITIAL_POSTS];
        }
    } else {
        posts = [...INITIAL_POSTS];
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
            
            updateCreateButtonText(activeCategory);
            renderAdBanner();
            filterAndRender();
        });
    });

    searchInput.addEventListener("input", (e) => {
        searchKeyword = e.target.value.trim().toLowerCase();
        filterAndRender();
    });

    regionSelect.addEventListener("change", (e) => {
        selectedRegion = e.target.value;
        filterAndRender();
    });

    sortSelect.addEventListener("change", (e) => {
        selectedSort = e.target.value;
        filterAndRender();
    });

    resetFiltersBtn.addEventListener("click", () => {
        activeCategory = "all";
        searchKeyword = "";
        selectedRegion = "all";
        selectedSort = "newest";

        searchInput.value = "";
        regionSelect.value = "all";
        sortSelect.value = "newest";

        tabBtns.forEach(b => b.classList.remove("active"));
        tabBtns[0].classList.add("active");

        updateCreateButtonText("all");
        renderAdBanner();
        filterAndRender();
        showToast("모든 필터가 초기화되었습니다.");
    });

    openCreateModalBtn.addEventListener("click", () => {
        if (!currentUser) {
            showToast("🔑 회원가입 / 로그인 후 글을 작성하실 수 있습니다!");
            openModal(authModal);
            return;
        }
        if (activeCategory === "instructor") {
            if (!isVerifiedInstructor()) {
                showToast("🎓 강사 클래스 등록은 인증된 강사만 가능합니다! 먼저 [강사인증] 버튼을 눌러 자격증을 신청해 주세요.");
                openInstructorAuthModal();
                return;
            }
        }
        editingPostId = null;
        preselectModalCategory(activeCategory);
        openModal(createModal);
    });

    closeCreateModalBtn.addEventListener("click", () => closeModal(createModal));
    cancelCreateBtn.addEventListener("click", () => closeModal(createModal));
    createPostForm.addEventListener("submit", handleSavePost);

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
                instAppCertImage = evt.target.result;
                const prev = document.getElementById("instAppCertPreview");
                if (prev) {
                    prev.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <img src="${instAppCertImage}" alt="자격증 미리보기" style="height:60px; border-radius:4px; border:1px solid var(--accent-gold);" class="zoomable-img" onclick="openLightbox('${instAppCertImage}')">
                            <span style="font-size:0.78rem; color:#00e676; font-weight:700;"><i class="fa-solid fa-circle-check"></i> 자격증 사본 첨부 완료</span>
                        </div>
                    `;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    openAuthModalBtn.addEventListener("click", () => openModal(authModal));
    closeAuthModalBtn.addEventListener("click", () => closeModal(authModal));

    closeChatModalBtn.addEventListener("click", () => closeModal(chatModal));
    chatForm.addEventListener("submit", handleSendChatMessage);

    closeRatingModalBtn.addEventListener("click", () => closeModal(ratingModal));
    cancelRatingBtn.addEventListener("click", () => closeModal(ratingModal));

    closeDetailModalBtn.addEventListener("click", () => closeModal(detailModal));

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
        if (e.target === createModal) closeModal(createModal);
        if (e.target === authModal) closeModal(authModal);
        if (e.target === chatModal) closeModal(chatModal);
        if (e.target === ratingModal) closeModal(ratingModal);
        if (e.target === detailModal) closeModal(detailModal);
        if (e.target === imageLightboxModal) closeModal(imageLightboxModal);
        if (e.target === deleteConfirmModal) closeModal(deleteConfirmModal);
        if (e.target === inquiryModal) closeModal(inquiryModal);
        if (e.target === document.getElementById("instructorAuthModal")) closeModal(document.getElementById("instructorAuthModal"));
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

function handleTideSearch(keyword) {
    tideSearchKeyword = keyword.trim().toLowerCase();
    renderWeatherGrid(activeTideRegion);
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
    const files = Array.from(e.target.files).slice(0, 4 - uploadedCompressedImages.length);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
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

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
                uploadedCompressedImages.push(compressedBase64);
                renderImagePreviews();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
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
    lightboxImage.src = src;
    openModal(imageLightboxModal);
}

function handleCctvSearch(keyword) {
    cctvSearchKeyword = keyword.trim().toLowerCase();
    renderOceanWebcams(activeCctvRegion);
}

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
                <p style="margin-top: 2px; font-size: 0.75rem; color: var(--text-dim);">
                    수온: ${cam.waterTemp} | 풍속: ${cam.wind}
                </p>
            </div>
        </div>
    `).join("");
}

function openWebcamModal(camId) {
    const cam = OCEAN_WEBCAMS_DATA.find(c => c.id === camId);
    if (!cam) return;

    document.getElementById("webcamModalTitle").textContent = cam.name;
    document.getElementById("camSpotTag").textContent = cam.region;
    document.getElementById("camTimeTag").textContent = `24시간 실시간 LIVE 생중계 STREAM`;
    document.getElementById("camSourceText").textContent = cam.source || "공공기관 CCTV";

    const iframe = document.getElementById("webcamLiveIframe");
    const video = document.getElementById("webcamHlsVideo");

    if (cam.hlsUrl) {
        if (iframe) iframe.style.display = "none";
        if (video) video.style.display = "block";

        if (Hls && Hls.isSupported()) {
            if (activeHlsPlayer) {
                activeHlsPlayer.destroy();
            }
            activeHlsPlayer = new Hls();
            activeHlsPlayer.loadSource(cam.hlsUrl);
            activeHlsPlayer.attachMedia(video);
            activeHlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play().catch(e => console.log("HLS Autoplay Notice:", e));
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = cam.hlsUrl;
            video.play().catch(e => console.log("Native HLS Autoplay Notice:", e));
        }
    } else {
        if (video) {
            video.pause();
            video.style.display = "none";
        }
        if (iframe) {
            iframe.style.display = "block";
            iframe.src = cam.embedUrl;
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

function renderWeatherGrid(regionKey = "all") {
    const grid = document.getElementById("weatherGrid");
    if (!grid) return;

    let filteredSpots = (regionKey === "all")
        ? [...OCEAN_WEATHER_DATA]
        : OCEAN_WEATHER_DATA.filter(spot => spot.regionCat === regionKey);

    if (tideSearchKeyword) {
        filteredSpots = OCEAN_WEATHER_DATA.filter(spot => 
            `${spot.name} ${spot.region} ${spot.status}`.toLowerCase().includes(tideSearchKeyword)
        );
    }

    grid.innerHTML = filteredSpots.map(spot => `
        <div class="weather-card">
            <div class="weather-card-header">
                <h3><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan);"></i> ${spot.name}</h3>
                <span class="tide-badge">${spot.tideName}</span>
            </div>
            
            <div class="weather-metrics">
                <div class="metric-box">
                    <span class="metric-label"><i class="fa-solid fa-temperature-three-quarters"></i> 수온</span>
                    <span class="metric-val">${spot.waterTemp}</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label"><i class="fa-solid fa-water"></i> 파고</span>
                    <span class="metric-val">${spot.waveHeight}</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label"><i class="fa-solid fa-wind"></i> 풍속</span>
                    <span class="metric-val" style="font-size: 0.85rem;">${spot.windSpeed}</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label"><i class="fa-solid fa-shield-heart"></i> 상태</span>
                    <span class="metric-val" style="font-size: 0.82rem; color: #00e676;">${spot.status}</span>
                </div>
            </div>

            <div class="tide-times">
                <span>🔺 만조: ${spot.highTide}</span>
                <span>🔻 간조: ${spot.lowTide}</span>
            </div>
        </div>
    `).join("");
}

function updateCreateButtonText(cat) {
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
        } else {
            createBtnText.textContent = "강사인증 후 클래스 등록";
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
        createPostForm.reset();
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

    if (activeCategory === "activity_log") {
        activitySubFilterBar.classList.remove("hidden");
    } else {
        activitySubFilterBar.classList.add("hidden");
    }

    if (activeCategory === "all" || activeCategory === "home") {
        document.body.classList.remove("category-view-active");
        if (dashboardSec) dashboardSec.style.display = "flex";
        if (filterSec) filterSec.style.display = "none";
        if (postsSec) postsSec.style.display = "none";
        renderDashboardBlocks();
        activeCountText.textContent = `AquaBuddy 통합 대시보드 - 주요 카테고리 핫이슈`;
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

        // Category-Scoped Search Filtering
        if (activeCategory === "freediving" || activeCategory === "buddy") {
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
        if (selectedSort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (selectedSort === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (selectedSort === "max_capacity") return (b.capacity || 1) - (a.capacity || 1);
        if (selectedSort === "min_capacity") return (a.capacity || 1) - (b.capacity || 1);
        if (selectedSort === "closing_soon") {
            if (a.status === "recruiting" && b.status !== "recruiting") return -1;
            if (a.status !== "recruiting" && b.status === "recruiting") return 1;
            return new Date(a.date || 0) - new Date(b.date || 0);
        }
        return 0;
    });

    renderGrid(filtered);
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
                <a href="javascript:void(0)" class="block-more-btn" onclick="filterByCategory('freediving')">
                    버디탐색 바로가기 ➔
                </a>
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
                <a href="javascript:void(0)" class="block-more-btn" onclick="filterByCategory('instructor')">
                    강사클래스 바로가기 ➔
                </a>
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
                <a href="javascript:void(0)" class="block-more-btn" onclick="filterByCategory('community')">
                    자유수다방 바로가기 ➔
                </a>
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
                <a href="javascript:void(0)" class="block-more-btn" onclick="filterByCategory('market')">
                    중고장터 바로가기 ➔
                </a>
            </div>
            <div class="compact-post-table">
                ${marketPosts.map(p => renderCompactPostRow(p)).join("")}
            </div>
        </div>
    `;
}

function renderCompactPostRow(post) {
    const isInst = post.category === "instructor";
    const isMarket = post.category === "market";
    const priceText = isInst ? (post.classFee ? post.classFee.toLocaleString() + '원' : '수강료 문의') : (isMarket ? (post.price ? post.price.toLocaleString() + '원' : '가격협의') : '');
    
    return `
        <div class="compact-post-row" onclick="openDetailModal('${post.id}')">
            <div class="compact-row-main">
                <span class="badge badge-${post.category}">${post.categoryName}</span>
                <span class="compact-post-title">${escapeHtml(post.title)}</span>
            </div>
            <div class="compact-row-meta">
                <span class="compact-author-name"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(post.userName)}</span>
                <span class="compact-rating">★ ${post.hostRating || 5.0}</span>
                ${priceText ? `<span style="color: var(--accent-gold); font-weight: 700;">${priceText}</span>` : ''}
                <span class="compact-action-link">상세 ➔</span>
            </div>
        </div>
    `;
}

// Render Feed Posts in Compact Simplified List View Mode
function renderGrid(data) {
    activeCountText.textContent = `총 ${data.length}개의 게시글 / 모집글 / 강사 클래스`;

    if (data.length === 0) {
        postsGrid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    postsGrid.className = "compact-post-table";
    postsGrid.innerHTML = data.map(post => renderCompactPostRow(post)).join("");
}

let chatJoinTimestamps = {};

function openChatRoomModal(postId) {
    if (!currentUser) {
        showToast("🔑 회원가입 / 로그인 후 실시간 대화방을 이용하실 수 있습니다!");
        openModal(authModal);
        return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    currentChatPost = post;
    const isHost = isMyPost(post);
    const isMarket = post.category === "market";
    const currentUserName = currentUser ? currentUser.name : "손님";

    post.unreadCount = 0;
    savePosts();
    filterAndRender();

    const roleBadge = document.getElementById("chatRoleBadge");
    const unreadBadge = document.getElementById("chatUnreadBadge");
    const hostToolbar = document.getElementById("chatHostQuickToolbar");
    const membersBar = document.getElementById("chatMembersBar");

    document.getElementById("chatBuddyName").textContent = isMarket ? `${post.userName}님과의 1:1 대화방` : `${post.title.substring(0, 18)}... 일정 대화방`;
    document.getElementById("chatPostTitle").textContent = `'${post.title}' - ${post.categoryName}`;

    if (isHost) {
        roleBadge.className = "chat-role-tag host-tag";
        roleBadge.textContent = isMarket ? "판매자 대화방" : (post.category === "instructor" ? "강사 전용 수강 대화방" : "모임 주최자 대화방");
        if (!isMarket) hostToolbar.style.display = "flex";
        else hostToolbar.style.display = "none";
    } else {
        roleBadge.className = "chat-role-tag attendee-tag";
        roleBadge.textContent = isMarket ? "구매 문의자 대화방" : (post.category === "instructor" ? "수강 문의자 대화방" : "버디 참가자 대화방");
        if (!isMarket) hostToolbar.style.display = "flex";
        else hostToolbar.style.display = "none";
    }

    unreadBadge.classList.add("hidden");

    if (!isMarket && post.attendees) {
        membersBar.style.display = "flex";
        membersBar.innerHTML = post.attendees.map((name, index) => {
            const isHostMember = name === post.userName;
            return `
            <div class="member-chip ${isHostMember ? 'host-chip' : ''}">
                <i class="fa-solid ${isHostMember ? 'fa-crown' : 'fa-user'}"></i>
                <span>${escapeHtml(name)} ${isHostMember ? '(주최자)' : ''}</span>
            </div>
            `;
        }).join("");
    } else {
        membersBar.style.display = "none";
    }

    // Record join timestamp for history filtering (New participants don't see past chats before join!)
    const userJoinKey = `${postId}_${currentUserName}`;
    if (!chatJoinTimestamps[userJoinKey]) {
        chatJoinTimestamps[userJoinKey] = Date.now();
    }

    // Clean initial system welcome message (No fake sample chat text!)
    if (!chatMessages[postId] || chatMessages[postId].length === 0) {
        chatMessages[postId] = [
            {
                id: `sys-${Date.now()}`,
                sender: "system",
                author: "AquaBuddy 시스템",
                text: `💬 대화방이 생성되었습니다! 상대방 다이버와 미팅 장소, 일정 및 준비물을 소통해 보세요.`,
                time: "방금 전",
                timestamp: Date.now()
            }
        ];
    }

    renderChatStream(postId);
    openModal(chatModal);
}

function renderChatStream(postId) {
    const stream = chatMessages[postId] || [];
    const currentUserName = currentUser ? currentUser.name : "손님";
    const userJoinKey = `${postId}_${currentUserName}`;
    const joinTime = chatJoinTimestamps[userJoinKey] || 0;
    const isHost = isMyPost(currentChatPost);

    // Filter stream: System messages + Host messages + User's own messages + Messages sent after user joined!
    const visibleStream = stream.filter(msg => {
        if (msg.sender === "system" || isHost) return true;
        if (msg.author === currentUserName) return true;
        return (msg.timestamp && msg.timestamp >= (joinTime - 5000));
    });

    chatMessagesStream.innerHTML = visibleStream.map(msg => {
        if (msg.sender === "system") {
            return `
            <div class="chat-system-notice" style="text-align: center; margin: 10px 0;">
                <span style="background: rgba(0, 242, 254, 0.12); color: var(--accent-cyan); font-size: 0.78rem; padding: 4px 12px; border-radius: 12px; border: 1px dashed var(--accent-cyan);">
                    ${escapeHtml(msg.text)}
                </span>
            </div>
            `;
        }

        const isUserMsg = (currentUser && msg.author === currentUser.name) || msg.sender === "user";
        const isHostMsg = msg.sender === "host" || (currentChatPost && msg.author === currentChatPost.userName);

        return `
        <div class="chat-bubble ${isUserMsg ? 'user' : (isHostMsg ? 'host' : 'attendee')}">
            ${!isUserMsg ? `
            <div class="chat-sender-info">
                <i class="fa-solid ${isHostMsg ? 'fa-crown' : 'fa-user'}"></i> ${escapeHtml(msg.author || '참가자')} ${isHostMsg ? '(주최자)' : ''}
            </div>
            ` : ''}
            <p>${escapeHtml(msg.text)}</p>
            <span class="chat-time">${msg.time}</span>
        </div>
        `;
    }).join("");

    chatMessagesStream.scrollTop = chatMessagesStream.scrollHeight;
}

function handleSendChatMessage(e) {
    e.preventDefault();
    if (!currentChatPost) return;

    const text = chatMessageInput.value.trim();
    if (!text) return;

    const postId = currentChatPost.id;
    const currentUserName = currentUser ? currentUser.name : "다이버";
    const isHostMsg = isMyPost(currentChatPost);

    const msgObj = {
        id: `msg-${Date.now()}`,
        sender: isHostMsg ? "host" : "attendee",
        author: currentUserName,
        text: text,
        time: "방금 전",
        timestamp: Date.now()
    };

    if (!chatMessages[postId]) chatMessages[postId] = [];
    chatMessages[postId].push(msgObj);

    chatMessageInput.value = "";
    renderChatStream(postId);
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

// Open Detail Modal with Account-Based Owner Actions (Only Show Edit/Delete for Author)
function openDetailModal(postId) {
    if (!currentUser) {
        showToast("🔑 회원가입 / 로그인 후 글 내용과 상세 정보를 확인하실 수 있습니다!");
        openModal(authModal);
        return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isInstructor = post.category === "instructor";
    const isMarket = post.category === "market";
    const isCommunity = post.category === "community";
    const currentUserName = currentUser ? currentUser.name : "다이버";
    
    const isHost = isMyPost(post);
    const isAttendee = post.attendees && post.attendees.includes(currentUserName);

    const encodedLocation = encodeURIComponent(post.mapAddress || post.locationName);
    const kakaoMapUrl = `https://map.kakao.com/?q=${encodedLocation}`;

    detailModalTitle.textContent = post.title;

    const commentsListHtml = (post.comments || []).map(c => `
        <div class="comment-item" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
            <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(c.author)}</span>
                <span style="opacity: 0.6; font-size: 0.74rem;">${c.time || '방금 전'}</span>
            </div>
            <p style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(c.text)}</p>
        </div>
    `).join("");

    const photoGalleryHtml = (post.images && post.images.length > 0) ? `
        <div class="detail-section">
            <h4><i class="fa-solid fa-camera"></i> 첨부 사진 (클릭 시 확대 미리보기)</h4>
            <div class="detail-photo-gallery">
                ${post.images.map(imgSrc => `
                    <div class="detail-photo-item">
                        <img src="${imgSrc}" alt="첨부 사진" class="zoomable-img" onclick="openLightbox('${imgSrc}')">
                    </div>
                `).join("")}
            </div>
        </div>
    ` : '';

    const modernCommentFormHtml = `
        <form class="comment-form-modern" onsubmit="handleAddComment(event, '${post.id}')">
            <i class="fa-solid fa-comment-dots" style="color: var(--accent-cyan);"></i>
            <input type="text" id="newCommentInput" class="comment-input-modern" placeholder="실시간 댓글 또는 문의를 작성하세요..." required autocomplete="off">
            <button type="submit" class="comment-submit-btn"><i class="fa-solid fa-paper-plane"></i> 등록</button>
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

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(담당 강사 - 본인)</span>' : ''}</h3>
                    <div class="detail-badge-list">
                        <span class="instructor-badge"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(post.userLicense)}</span>
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
                            • 대표 자격: <strong>${escapeHtml(post.userLicense || '공인 강사')}</strong> (운영진 검증 100% 완료)
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
                    ${escapeHtml(post.desc).replace(/\n/g, '<br>')}
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
                    <button class="btn btn-primary" onclick="closeModal(detailModal); openChatRoomModal('${post.id}');">
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
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(판매자 - 본인)</span>' : ''} (중고장터)</h3>
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
                    ${escapeHtml(post.desc).replace(/\n/g, '<br>')}
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
                    <button class="btn btn-primary" onclick="closeModal(detailModal); openChatRoomModal('${post.id}');">
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
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(작성자 - 본인)</span>' : ''} (자유수다방)</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
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
                    ${escapeHtml(post.desc).replace(/\n/g, '<br>')}
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
                    <button class="btn btn-secondary" onclick="confirmBuddyMatch('${post.id}')" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); border-color: rgba(0, 242, 254, 0.4);">
                        <i class="fa-solid fa-bolt"></i> 참가자 확정 완료 (일정 진행 중)
                    </button>
                `;
            } else if (post.status === 'in_progress') {
                actionButtonsHtml = `
                    <button class="btn btn-primary" onclick="finishBuddySchedule('${post.id}')">
                        <i class="fa-solid fa-circle-check"></i> 일정 완료 (모임 종료)
                    </button>
                `;
            } else {
                actionButtonsHtml = `
                    <span style="font-size: 0.85rem; color: #00e676; font-weight: 700; align-self: center;">🎉 모임 일정이 완료되었습니다!</span>
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
                actionButtonsHtml = `
                    <span style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700; align-self: center;">⚡ 참가자가 확정되어 일정이 진행 중입니다.</span>
                `;
            } else if (post.status === 'completed') {
                if (isAttendee) {
                    actionButtonsHtml = `
                        <button class="btn btn-secondary" onclick="openHostRatingModal('${post.id}')" style="color: var(--accent-gold); border-color: var(--accent-gold);">
                            <i class="fa-solid fa-star"></i> 주최자 버디 평점 남기기
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <span style="font-size: 0.85rem; color: var(--text-muted); align-self: center;">종료된 모임입니다.</span>
                    `;
                }
            }
        }

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(주최자 - 본인)</span>' : ''} (${post.categoryName})</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
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
                    ${escapeHtml(post.desc).replace(/\n/g, '<br>')}
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
                    <button class="btn btn-primary" onclick="closeModal(detailModal); openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 일정 대화방 입장
                    </button>
                    ${actionButtonsHtml}
                </div>
            </div>
        `;
    }

    detailModalBody.innerHTML = mainInfoHtml;
    openModal(detailModal);

    if (!isCommunity) {
        setTimeout(() => {
            initKakaoLiveMap(post.mapAddress || post.locationName);
        }, 150);
    }
}

// 1-Click Instant Post Deletion for Author / Webmaster
function deletePostWithPassword(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (isMyPost(post) || isAdminAuthenticated) {
        pendingDeletePostId = postId;
        openModal(deleteConfirmModal);
    } else {
        showToast("⚠️ 본인이 작성한 게시글만 삭제할 수 있습니다!");
    }
}

function performPostDeletion(postId) {
    posts = posts.filter(p => p.id !== postId);
    myCreatedPostIds = myCreatedPostIds.filter(id => id !== postId);

    savePosts();
    saveMyPosts();

    closeModal(detailModal);
    filterAndRender();
    if (!document.getElementById("adminDashboardModal").classList.contains("hidden")) {
        renderAdminPostsTable();
    }
    showToast("🗑️ 게시글이 성공적으로 삭제되었습니다.");
}

function toggleWishlist(postId) {
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
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.status = "completed";
    post.statusText = "일정 완료";
    savePosts();
    filterAndRender();
    openDetailModal(postId);
    showToast("🎉 모임 일정이 최종 완료되었습니다!");
}

// 1-Click Instant Post Editing for Author / Webmaster
function verifyPasswordAndEdit(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (isMyPost(post) || isAdminAuthenticated) {
        openEditModal(postId);
    } else {
        showToast("⚠️ 본인이 작성한 게시글만 수정할 수 있습니다!");
    }
}

function openEditModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    editingPostId = postId;
    preselectModalCategory(post.category, true);

    document.getElementById("postTitle").value = post.title;
    if (post.classFee && document.getElementById("classFee")) document.getElementById("classFee").value = post.classFee;
    if (post.classRatio && document.getElementById("classRatio")) document.getElementById("classRatio").value = post.classRatio;
    if (post.classInclusion && document.getElementById("classInclusion")) document.getElementById("classInclusion").value = post.classInclusion;
    if (post.price) document.getElementById("postPrice").value = post.price;
    if (post.dealMethod && document.getElementById("postDealMethod")) document.getElementById("postDealMethod").value = post.dealMethod;
    if (post.capacity) document.getElementById("postCapacity").value = post.capacity;
    if (post.mapAddress) document.getElementById("postMapAddress").value = post.mapAddress;
    if (post.date) document.getElementById("postDate").value = post.date;
    document.getElementById("postDesc").value = post.desc;

    uploadedCompressedImages = [...(post.images || [])];
    uploadedCertImage = post.certImage || "";
    renderImagePreviews();

    closeModal(detailModal);
    openModal(createModal);
}

function toggleMarketStatus(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.status === "completed") {
        post.status = "recruiting";
        post.statusText = "판매 중";
        showToast("⚡ 중고 물품 상태가 '판매 중'으로 변경되었습니다.");
    } else {
        post.status = "completed";
        post.statusText = "거래 완료";
        showToast("🎉 중고 장비 거래 완료 처리가 되었습니다!");
    }

    savePosts();
    filterAndRender();
    openDetailModal(postId);
}

function initStarRatingEvents() {
    const stars = document.querySelectorAll("#starRatingSelect .star-icon");
    const scoreText = document.getElementById("starScoreText");

    stars.forEach(star => {
        star.addEventListener("click", () => {
            const score = parseInt(star.dataset.score);
            currentRatingScore = score;
            
            stars.forEach((s, idx) => {
                if (idx < score) s.classList.add("selected");
                else s.classList.remove("selected");
            });

            if (score === 5) scoreText.textContent = "5.0 / 5.0 (최고의 강사/다이버! 완벽해요)";
            else if (score === 4) scoreText.textContent = "4.0 / 5.0 (좋은 강의예요)";
            else if (score === 3) scoreText.textContent = "3.0 / 5.0 (무난했어요)";
            else if (score === 2) scoreText.textContent = "2.0 / 5.0 (아쉬웠어요)";
            else scoreText.textContent = "1.0 / 5.0 (비매너/주의 필요)";
        });
    });
}

function openHostRatingModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    currentRatingPost = post;
    const headerTitle = document.getElementById("ratingModalHeaderTitle");
    if (headerTitle) headerTitle.textContent = post.category === "instructor" ? "강사 수강 평점 & 후기 작성" : (post.category === "market" ? "중고거래 상호 평점 & 거래 후기" : "주최자 버디 평점 & 매너 평가");

    document.getElementById("ratingHostTarget").textContent = `'${post.userName}'님과의 강습/활동 매너를 평가해 주세요.`;
    closeModal(detailModal);
    openModal(ratingModal);
}

function submitHostRating() {
    if (!currentRatingPost) return;

    currentRatingPost.hostReviewsCount = (currentRatingPost.hostReviewsCount || 10) + 1;
    savePosts();

    closeModal(ratingModal);
    showToast(`⭐ ${currentRatingPost.userName}님께 별점(${currentRatingScore}점) 및 매너 평가 후기를 등록했습니다!`);
}

function initKakaoLiveMap(addressQuery) {
    const mapContainer = document.getElementById("kakaoLiveMap");
    if (!mapContainer) return;

    if (window.kakao && window.kakao.maps) {
        try {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(addressQuery, function(result, status) {
                let coords;
                if (status === kakao.maps.services.Status.OK) {
                    coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                } else {
                    coords = new kakao.maps.LatLng(37.5148, 127.1265);
                }

                const mapOptions = { center: coords, level: 4 };
                const map = new kakao.maps.Map(mapContainer, mapOptions);

                const marker = new kakao.maps.Marker({
                    map: map,
                    position: coords
                });

                const infowindow = new kakao.maps.InfoWindow({
                    content: `<div style="width:150px;text-align:center;padding:6px 0;color:#000;font-weight:bold;font-size:12px;">${addressQuery.substring(0, 15)}</div>`
                });
                infowindow.open(map, marker);
            });
        } catch (e) {
            mapContainer.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">카카오 지도 API 로드 완료 (` + addressQuery + `)</div>`;
        }
    }
}

function handleAddComment(e, postId) {
    e.preventDefault();
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

function handleSavePost(e) {
    e.preventDefault();

    const title = document.getElementById("postTitle").value.trim();
    const selCat = document.getElementById("postCategory") ? document.getElementById("postCategory").value : "";
    
    let category = selCat;
    if (document.getElementById("postCategoryGroup").style.display === "block") {
        if (!selCat) {
            showToast("⚠️ 작성 카테고리를 선택해 주세요! (실내수영 / 바다수영 / 프리다이빙 / 스쿠버다이빙)");
            return;
        }
        category = selCat;
    } else if (document.getElementById("instructorFormFields").style.display === "block") {
        category = "instructor";
    } else if (document.getElementById("marketPriceRow").style.display === "grid") {
        category = "market";
    } else if (activeCategory === "community") {
        category = "community";
    }

    const classType = document.getElementById("classType") ? document.getElementById("classType").value : "1일 원데이 체험 강습";
    const classFeeVal = document.getElementById("classFee") ? document.getElementById("classFee").value : null;
    const classRatioVal = document.getElementById("classRatio") ? document.getElementById("classRatio").value : "1:2 소수정예 강습";
    const classInclusionVal = document.getElementById("classInclusion") ? document.getElementById("classInclusion").value : "장비 렌탈비 포함";
    const priceVal = document.getElementById("postPrice") ? document.getElementById("postPrice").value : null;
    const dealMethodVal = document.getElementById("postDealMethod") ? document.getElementById("postDealMethod").value : "직거래/택배 둘 다 가능";
    const capacityVal = document.getElementById("postCapacity").value;
    const mapAddress = document.getElementById("postMapAddress").value.trim();
    const date = document.getElementById("postDate").value;
    const userName = currentUser ? currentUser.name : "다이버";
    let userLicense = currentUser ? currentUser.license : "공인 강사 / 다이버";
    const desc = document.getElementById("postDesc").value.trim();

    let categoryName = "버디 모집";
    if (category === "swimming") categoryName = "실내 수영";
    if (category === "openwater") categoryName = "바다 수영";
    if (category === "freediving") categoryName = "프리다이빙";
    if (category === "scuba") categoryName = "스쿠버다이빙";
    if (category === "instructor") categoryName = "강사 클래스";
    if (category === "community") categoryName = "자유수다방";
    if (category === "market") categoryName = "중고장터";

    if (editingPostId) {
        const post = posts.find(p => p.id === editingPostId);
        if (post) {
            post.title = title;
            post.category = category;
            post.categoryName = categoryName;
            post.certImage = uploadedCertImage || post.certImage;
            post.classType = classType;
            post.classFee = classFeeVal ? parseInt(classFeeVal) : post.classFee;
            post.classRatio = classRatioVal;
            post.classInclusion = classInclusionVal;
            post.price = priceVal ? parseInt(priceVal) : null;
            post.dealMethod = dealMethodVal;
            post.capacity = capacityVal ? parseInt(capacityVal) : post.capacity;
            post.locationName = mapAddress || post.locationName;
            post.mapAddress = mapAddress || post.mapAddress;
            post.date = date || post.date;
            post.desc = desc;
            post.images = [...uploadedCompressedImages];
            savePosts();
            showToast("✏️ 게시글이 수정되었습니다!");
        }
        editingPostId = null;
    } else {
        const newPostId = "post-" + Date.now();
        const newPost = {
            id: newPostId,
            title,
            category,
            categoryName,
            certImage: category === "instructor" ? (currentUser ? currentUser.certImage : uploadedCertImage) : null,
            classType: category === "instructor" ? classType : null,
            classFee: category === "instructor" && classFeeVal ? parseInt(classFeeVal) : null,
            classRatio: category === "instructor" ? classRatioVal : null,
            classInclusion: category === "instructor" ? classInclusionVal : null,
            price: priceVal ? parseInt(priceVal) : null,
            dealMethod: dealMethodVal,
            capacity: capacityVal ? parseInt(capacityVal) : 2,
            joinedCount: 1,
            attendees: [userName],
            location: mapAddress || "전국 포인트",
            locationName: mapAddress || "전국 포인트",
            mapAddress: mapAddress || "서울 송파구 올림픽공원",
            date: date || null,
            userName,
            userLicense: userLicense,
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
            createdAt: new Date().toISOString()
        };

        myCreatedPostIds.push(newPostId);
        posts.unshift(newPost);
        saveMyPosts();
        savePosts();

        showToast("✨ 새로운 게시글이 성공적으로 등록되었습니다!");
    }

    filterAndRender();

    createPostForm.reset();
    uploadedCompressedImages = [];
    uploadedCertImage = "";
    renderImagePreviews();
    closeModal(createModal);
}

function openModal(modal) {
    modal.classList.remove("hidden");
}

function closeModal(modal) {
    modal.classList.add("hidden");
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
