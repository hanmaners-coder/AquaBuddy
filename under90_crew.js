// ============================================================================
// 🏊‍♂️ UNDER 90 (언더나인티) 부울경 바다수영 크루 전용관 엔진
// ============================================================================
// - 오픈 쇼케이스: 크루 소개 + 부울경 5대 포인트(해운대·광안리·진하·임랑·일광) 실시간 날씨/CCTV + 레벨 안내
// - 회원 전용 구역: 입장코드(0090) 1회 입력 또는 아쿠아버디 회원 로그인 시 열람
// - 데이터 저장: Supabase `posts` 테이블(category: 'crew_under90') 실시간 클라우드 동기화
// ============================================================================

(function () {
    'use strict';

    const PASSCODE = '0090';
    const STORAGE_UNLOCK_KEY = 'aquabuddy_under90_unlocked_v1';
    const STORAGE_MEMBER_NAME_KEY = 'aquabuddy_under90_member_name_v1';
    const META_START = '[UNDER90_META]';
    const META_END = '[/UNDER90_META]';

    const SPOTS = [
        {
            key: 'haeundae',
            label: '부산 해운대',
            fullName: '부산 해운대 해수욕장',
            spotId: 'tide-haeundae',
            camId: 'cam-busan-haeundae-beach',
            lat: 35.1587,
            lng: 129.1604,
            meetingHint: '해운대 관광안내소 앞 백사장 / 공영주차장',
            courseNote: '백사장 ~ 동백섬 또는 미포 방면 왕복 (연안 부표 기준)',
            badge: '부울경 메인'
        },
        {
            key: 'gwangalli',
            label: '부산 광안리',
            fullName: '부산 광안리 해수욕장',
            spotId: 'tide-gwangalli',
            camId: 'cam-busan-gwangalli-beach',
            lat: 35.1537,
            lng: 129.1184,
            meetingHint: '광안리 SUP존 / 만남의광장 앞',
            courseNote: '광안대교 조망 백사장 횡단 왕복 (파도 잔잔, 초·중급 인기)',
            badge: '광안대교 뷰'
        },
        {
            key: 'jinha',
            label: '울산 진하',
            fullName: '울산 진하 해수욕장',
            spotId: 'kma-beach-311',
            camId: 'cam-coast-jinha',
            lat: 35.3854,
            lng: 129.3508,
            meetingHint: '명선교 옆 공영주차장 / 샤워장 앞',
            courseNote: '진하 ~ 명선도 주변 또는 이덕도 방면 장거리 코스',
            badge: '원정 인기'
        },
        {
            key: 'imlang',
            label: '기장 임랑',
            fullName: '기장 임랑 해수욕장',
            spotId: 'kma-beach-310',
            camId: 'cam-busan-imlang-beach',
            lat: 35.3188,
            lng: 129.2642,
            meetingHint: '임랑해수욕장 중앙 행정봉사실 앞 주차장',
            courseNote: '긴 백사장 직선 왕복 훈련 최적지 (너울 체크 필수)',
            badge: '훈련 스팟'
        },
        {
            key: 'ilgwang',
            label: '기장 일광',
            fullName: '기장 일광 해수욕장',
            spotId: 'kma-beach-309',
            camId: 'cam-busan-hakli',
            lat: 35.2608,
            lng: 129.2335,
            meetingHint: '일광해수욕장 강송정 공원 앞 무료주차장',
            courseNote: '학리 방파제~일광해수욕장 내만 포근한 수역 왕복',
            badge: '초급 친화'
        }
    ];

    const LEVELS = [
        { key: 'beginner', label: '초보자 코스', dist: '2~3km', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.45)', icon: '🟢', desc: '바다 적응 및 안전 버디 동행 왕복' },
        { key: 'intermediate', label: '중급자 코스', dist: '3~4km', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.16)', border: 'rgba(0, 242, 254, 0.45)', icon: '🔵', desc: '안정적인 호흡과 크루징 페이스 유지' },
        { key: 'advanced', label: '상급자 코스', dist: '4~6km', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.45)', icon: '🟠', desc: '오픈워터 100m 90초대 정예 페이스' },
        { key: 'master', label: '마스터 코스', dist: '6km 이상', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.45)', icon: '🔴', desc: '장거리 종단 및 대회 대비 하프/풀' }
    ];

    const AFTER_PARTY_OPTS = {
        both: { label: '입수 + 뒷풀이 참석', badge: '🏊‍♂️+🍺 입수·뒷풀이', short: '입수+뒷풀이', color: '#ffb703' },
        swim_only: { label: '입수만 참석', badge: '🏊‍♂️ 입수만', short: '입수만', color: '#00f2fe' },
        after_only: { label: '뒷풀이만 참석', badge: '🍺 뒷풀이만', short: '뒷풀이만', color: '#a78bfa' }
    };

    const state = {
        activeSpotKey: 'haeundae',
        activeBoardTab: 'meetup', // 'meetup' | 'notice' | 'board'
        editingPostId: null,
        rsvpPostId: null,
        showCctvInline: false,
        expandedAttendees: {}
    };

    function esc(str) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(String(str || ''));
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function notify(msg) {
        if (typeof window.showToast === 'function') window.showToast(msg);
        else alert(msg);
    }

    function getClient() {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
        if (window.supabaseClient) return window.supabaseClient;
        return null;
    }

    function isLoggedInUser() {
        const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : window.currentUser;
        return Boolean(u && (u.email || u.name || u.nickname || u.real_name || u.realName || u.id));
    }

    function getActiveUserName() {
        const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : window.currentUser;
        if (u) {
            return (u.nickname || u.name || u.real_name || u.realName || '언더나인티 회원').trim();
        }
        try {
            const savedName = localStorage.getItem(STORAGE_MEMBER_NAME_KEY);
            if (savedName && savedName.trim()) return savedName.trim();
        } catch (e) {}
        return '';
    }

    function isUnlocked() {
        if (isLoggedInUser()) return true;
        try {
            return localStorage.getItem(STORAGE_UNLOCK_KEY) === PASSCODE;
        } catch (e) {
            return false;
        }
    }

    function unlockWithCode(inputCode) {
        const code = String(inputCode || '').trim();
        if (code === PASSCODE) {
            try {
                localStorage.setItem(STORAGE_UNLOCK_KEY, PASSCODE);
            } catch (e) {}
            notify('🔓 언더나인티(UNDER 90) 크루 게시판이 열렸습니다!');
            renderGateAndBoard();
            return true;
        }
        notify('❌ 입장코드가 일치하지 않습니다. 단톡방 공지의 4자리 코드를 확인해 주세요.');
        return false;
    }

    function lockAgain() {
        try {
            localStorage.removeItem(STORAGE_UNLOCK_KEY);
        } catch (e) {}
        renderGateAndBoard();
        notify('🔒 입장코드 잠금 상태로 전환되었습니다.');
    }

    // ------------------------------------------------------------------------
    // Metadata Packing & Parsing inside Supabase `posts.description/desc`
    // ------------------------------------------------------------------------
    function buildUnder90Desc(bodyText, metaObj) {
        const cleanBody = String(bodyText || '').trim();
        const jsonStr = JSON.stringify(metaObj || {});
        return `${cleanBody}\n\n${META_START}${jsonStr}${META_END}`;
    }

    function parseUnder90Post(post) {
        const rawDesc = String(post.desc || post.description || post.content || '');
        let cleanDesc = rawDesc;
        let meta = {
            subType: 'meetup', // meetup | notice | board
            spotKey: 'haeundae',
            eventTime: '',
            levels: ['beginner', 'intermediate', 'advanced'],
            feeText: '',
            accountText: '',
            afterPartyText: '',
            hasAfterParty: true
        };

        const startIdx = rawDesc.indexOf(META_START);
        const endIdx = rawDesc.indexOf(META_END);
        if (startIdx !== -1 && endIdx > startIdx) {
            cleanDesc = (rawDesc.slice(0, startIdx) + rawDesc.slice(endIdx + META_END.length)).trim();
            const jsonChunk = rawDesc.slice(startIdx + META_START.length, endIdx).trim();
            try {
                const parsed = JSON.parse(jsonChunk);
                meta = Object.assign({}, meta, parsed);
            } catch (e) {
                console.warn('[Under90] meta parse fallback:', e);
            }
        }
        return { post, cleanDesc, meta };
    }

    // ------------------------------------------------------------------------
    // Spot Data & Weather Helpers
    // ------------------------------------------------------------------------
    function findOceanData(spotCfg) {
        if (typeof OCEAN_WEATHER_DATA === 'undefined' || !Array.isArray(OCEAN_WEATHER_DATA)) return null;
        return OCEAN_WEATHER_DATA.find(s =>
            s.id === spotCfg.spotId ||
            s.spot_id === spotCfg.spotId ||
            (s.name && s.name.includes(spotCfg.label.replace('부산 ', '').replace('울산 ', '').replace('기장 ', '')))
        ) || null;
    }

    function findWebcamData(spotCfg) {
        if (typeof OCEAN_WEBCAMS_DATA === 'undefined' || !Array.isArray(OCEAN_WEBCAMS_DATA)) return null;
        return OCEAN_WEBCAMS_DATA.find(c => c.id === spotCfg.camId) || null;
    }

    function getWetsuitAdvice(tempStr) {
        const val = parseFloat(String(tempStr || '').replace(/[^\d.-]/g, ''));
        if (isNaN(val)) return { text: '계절별 웻슈트/부이 필수', color: '#00f2fe' };
        if (val < 15) return { text: '🥶 5mm 슈트+네오프렌 후드/부츠 권장', color: '#ff6b81' };
        if (val < 19) return { text: '🧥 5mm 풀슈트 + 보온장갑 권장', color: '#ffb703' };
        if (val < 23) return { text: '🌊 3mm 웻슈트 (또는 숏존/상하의) 권장', color: '#00f2fe' };
        return { text: '☀️ 래시가드 / 2mm 숏슈트 쾌적', color: '#10b981' };
    }

    function formatSunInfo(spotCfg) {
        if (typeof window.getSunTimes === 'function') {
            try {
                const res = window.getSunTimes(spotCfg.lat, spotCfg.lng, new Date());
                if (res && res.sunrise && res.sunset) {
                    return `일출 ${res.sunrise} · 일몰 ${res.sunset}`;
                }
            } catch (e) {}
        }
        return '부울경 연안 표준';
    }

    function renderSpotSpotlight() {
        const tabsEl = document.getElementById('under90SpotTabs');
        const panelEl = document.getElementById('under90SpotLivePanel');
        if (!tabsEl || !panelEl) return;

        tabsEl.innerHTML = SPOTS.map(sp => {
            const active = sp.key === state.activeSpotKey;
            const live = findOceanData(sp);
            const wt = live && (live.water_temp || live.waterTemp) ? (live.water_temp || live.waterTemp) : '';
            return `
                <button type="button"
                    class="under90-spot-tab ${active ? 'active' : ''}"
                    onclick="Under90CrewEngine.selectSpot('${sp.key}')">
                    <span class="spot-tab-title">${esc(sp.label)}</span>
                    ${wt ? `<span class="spot-tab-temp">${esc(wt)}</span>` : `<span class="spot-tab-badge">${esc(sp.badge)}</span>`}
                </button>
            `;
        }).join('');

        const spotCfg = SPOTS.find(s => s.key === state.activeSpotKey) || SPOTS[0];
        const liveSpot = findOceanData(spotCfg);
        const cam = findWebcamData(spotCfg);

        const waterTemp = (liveSpot && (liveSpot.water_temp || liveSpot.waterTemp)) || (cam && cam.waterTemp) || '수집 중';
        const waveH = (liveSpot && (liveSpot.wave_height || liveSpot.waveHeight)) || '실시간 연동';
        const windSpd = (liveSpot && (liveSpot.wind_speed || liveSpot.windSpeed)) || (cam && cam.wind) || '실시간 연동';
        const airTemp = (liveSpot && (liveSpot.air_temp || liveSpot.airTemp)) || '-';
        const highTide = (liveSpot && liveSpot.high_tide) || '물때표 확인';
        const lowTide = (liveSpot && liveSpot.low_tide) || '-';
        const advice = getWetsuitAdvice(waterTemp);
        const sunStr = formatSunInfo(spotCfg);

        const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(spotCfg.fullName)}`;
        const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(spotCfg.fullName)},${spotCfg.lat},${spotCfg.lng}`;

        let cctvBlockHtml = '';
        if (state.showCctvInline && cam) {
            const innerCctv = (typeof window._makeCctvHtml === 'function')
                ? window._makeCctvHtml(cam)
                : `<div style="padding:18px;text-align:center;color:#94a3b8;">${esc(cam.name)}</div>`;
            cctvBlockHtml = `
                <div class="under90-inline-cctv" id="under90InlineCctvBox">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:0.84rem;font-weight:800;color:#00f2fe;">📷 ${esc(cam.name)} (${esc(cam.source || '공공데이터')})</span>
                        <button type="button" onclick="Under90CrewEngine.toggleInlineCctv(false)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;padding:4px 10px;border-radius:8px;font-size:0.76rem;cursor:pointer;">접기</button>
                    </div>
                    ${innerCctv}
                </div>
            `;
        }

        panelEl.innerHTML = `
            <div class="under90-spot-card">
                <div class="under90-spot-top">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                            <span class="under90-badge-cyan">📍 주력 입수 포인트</span>
                            <span style="font-size:0.78rem;color:#94a3b8;">${esc(sunStr)}</span>
                        </div>
                        <h3 style="margin:0;color:#fff;font-size:1.25rem;font-weight:900;">${esc(spotCfg.fullName)}</h3>
                        <p style="margin:5px 0 0 0;color:#cbd5e1;font-size:0.84rem;">
                            <strong style="color:#00f2fe;">코스 안내:</strong> ${esc(spotCfg.courseNote)}
                        </p>
                        <p style="margin:3px 0 0 0;color:#94a3b8;font-size:0.8rem;">
                            <strong style="color:#ffb703;">집결/주차:</strong> ${esc(spotCfg.meetingHint)}
                        </p>
                    </div>
                    <div class="under90-wetsuit-pill" style="border-color:${advice.color};color:${advice.color};">
                        ${esc(advice.text)}
                    </div>
                </div>

                <div class="under90-metrics-grid">
                    <div class="under90-metric-box">
                        <span class="m-label">🌊 수온</span>
                        <strong class="m-val" style="color:#00f2fe;">${esc(waterTemp)}</strong>
                    </div>
                    <div class="under90-metric-box">
                        <span class="m-label">🌬️ 파고 / 바람</span>
                        <strong class="m-val">${esc(waveH)} · ${esc(windSpd)}</strong>
                    </div>
                    <div class="under90-metric-box">
                        <span class="m-label">🌡️ 기온</span>
                        <strong class="m-val">${esc(airTemp)}</strong>
                    </div>
                    <div class="under90-metric-box">
                        <span class="m-label">🌗 만조 / 간조</span>
                        <strong class="m-val" style="font-size:0.86rem;">${esc(highTide)} / ${esc(lowTide)}</strong>
                    </div>
                </div>

                <div class="under90-spot-actions">
                    <button type="button" class="u90-btn u90-btn-cyan" onclick="Under90CrewEngine.toggleInlineCctv()">
                        <i class="fa-solid fa-video"></i> ${state.showCctvInline ? 'CCTV 닫기' : '실시간 CCTV 바로 보기'}
                    </button>
                    <button type="button" class="u90-btn u90-btn-ghost" onclick="Under90CrewEngine.openInFullOceanDashboard('${spotCfg.key}')">
                        <i class="fa-solid fa-map-location-dot"></i> 전국 스팟 상세예보 열기
                    </button>
                    <a href="${kakaoUrl}" target="_blank" rel="noopener noreferrer" class="u90-btn u90-btn-kakao">
                        <i class="fa-solid fa-location-arrow"></i> 카카오맵 길찾기
                    </a>
                    <a href="${naverUrl}" target="_blank" rel="noopener noreferrer" class="u90-btn u90-btn-ghost">
                        <i class="fa-solid fa-map"></i> 네이버지도
                    </a>
                </div>

                ${cctvBlockHtml}
            </div>
        `;

        if (state.showCctvInline && cam && typeof window._startHls === 'function') {
            const box = document.getElementById('under90InlineCctvBox');
            if (box) window._startHls(box, cam);
        }
    }

    function selectSpot(spotKey) {
        state.activeSpotKey = spotKey;
        state.showCctvInline = false;
        renderSpotSpotlight();
    }

    function toggleInlineCctv(forceVal) {
        state.showCctvInline = typeof forceVal === 'boolean' ? forceVal : !state.showCctvInline;
        renderSpotSpotlight();
    }

    function openInFullOceanDashboard(spotKey) {
        const spotCfg = SPOTS.find(s => s.key === spotKey) || SPOTS[0];
        const liveSpot = findOceanData(spotCfg);
        if (liveSpot) {
            window.currentDashboardSpot = liveSpot;
        }
        if (typeof window.switchMainView === 'function') {
            window.switchMainView('tide');
        }
        if (liveSpot && typeof window.renderUnifiedSpotDashboard === 'function') {
            setTimeout(() => window.renderUnifiedSpotDashboard(liveSpot), 150);
        }
    }

    // ------------------------------------------------------------------------
    // Crew Posts Loading & Filtering
    // ------------------------------------------------------------------------
    function getCrewPosts() {
        const all = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts : [];
        return all
            .filter(p => String(p.category || '').toLowerCase() === 'crew_under90')
            .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    }

    function getFallbackStarterExamples() {
        return [
            {
                id: 'u90_sample_meetup_1',
                isSample: true,
                category: 'crew_under90',
                title: '[예시 정모] 부산 해운대 주말 아침 바다수영 (초급~마스터 4코스)',
                location_name: '부산 해운대 해수욕장 (관광안내소 앞)',
                event_date: '이번 주 일요일 오전 07:00 입수',
                user_name: '언더나인티 운영진',
                created_at: new Date().toISOString(),
                participants: [
                    { name: '김수영', level: 'intermediate', afterParty: 'both', note: '양산 물금 카풀 가능' },
                    { name: '이바다', level: 'beginner', afterParty: 'swim_only', note: '부이 보유' },
                    { name: '박마스터', level: 'master', afterParty: 'both', note: '90초 페이스 리딩' }
                ],
                comments: [
                    { author: '김수영', text: '일출 맞춰서 6시 40분까지 모이면 딱 좋겠네요!', time: '방금 전' }
                ],
                desc: buildUnder90Desc(
                    '부울경 언더나인티 정기 바다수영입니다.\n입수 전 준비운동 및 레벨별 버디 조 편성 후 안전부이 필수 착용하고 입수합니다.\n수온 확인하시고 3mm~5mm 슈트 챙겨오세요!',
                    {
                        subType: 'meetup',
                        spotKey: 'haeundae',
                        eventTime: '이번 주 일요일 07:00 (06:40 집결)',
                        levels: ['beginner', 'intermediate', 'advanced', 'master'],
                        feeText: '입수 간식·음료 회비 5,000원 / 뒷풀이 식사비 1/N 별도',
                        accountText: '정모 확정 후 총무 계좌 안내 (여기에 계좌 입력)',
                        afterPartyText: '입수 후 인근 국밥/생선구이 뒷풀이 (자유 참석)',
                        hasAfterParty: true
                    }
                )
            },
            {
                id: 'u90_sample_notice_1',
                isSample: true,
                category: 'crew_under90',
                title: '[필독 공지] UNDER 90 바다수영 3대 안전 수칙 & 코스 기준표',
                location_name: '부울경 전 해역 공통',
                event_date: '상시 고정',
                user_name: '언더나인티 회장',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                participants: [],
                comments: [],
                desc: buildUnder90Desc(
                    '1. 개인 안전부이(오렌지백) 미착용 시 절대 입수 불가합니다.\n2. 시인성 좋은 형광 수모를 착용하고, 본인 페이스에 맞는 레벨 조의 리딩 버디 시야 안에서 수영합니다.\n3. 수온 20°C 이하에서는 체온 유지를 위해 3mm~5mm 웻슈트 착용을 강력 권장합니다.\n4. 몸 상태가 좋지 않거나 파도가 높을 때는 무리하지 않고 연안 백사장 코스로 전환합니다.',
                    {
                        subType: 'notice',
                        spotKey: 'haeundae',
                        levels: ['beginner', 'intermediate', 'advanced', 'master']
                    }
                )
            }
        ];
    }

    // ------------------------------------------------------------------------
    // Gate & Board Rendering
    // ------------------------------------------------------------------------
    function renderGateAndBoard() {
        const container = document.getElementById('under90MemberContainer');
        if (!container) return;

        if (!isUnlocked()) {
            container.innerHTML = `
                <div class="under90-lock-card">
                    <div class="lock-icon-circle">🔒</div>
                    <h3 style="margin:0 0 8px 0;color:#fff;font-size:1.25rem;font-weight:900;">
                        언더나인티 회원 전용 라운지
                    </h3>
                    <p style="margin:0 0 18px 0;color:#cbd5e1;font-size:0.9rem;line-height:1.6;max-width:520px;">
                        정모 일정과 <strong>코스별(초급~마스터) 신청 · 뒷풀이 투표 · 회비 계좌 · 크루 게시판</strong>은
                        회원 로그인 또는 동호회 <strong>입장코드(4자리)</strong> 입력 후 확인하실 수 있습니다.
                        <br><span style="color:#00f2fe;font-size:0.82rem;">(※ 입장코드는 한 번만 입력하면 브라우저에 자동 기억됩니다)</span>
                    </p>
                    <form onsubmit="event.preventDefault(); Under90CrewEngine.submitPasscode();" class="under90-passcode-form">
                        <input type="password" inputmode="numeric" maxlength="4" id="under90PasscodeInput"
                            placeholder="입장코드 4자리 입력"
                            autocomplete="off">
                        <button type="submit" class="u90-btn u90-btn-gold">
                            <i class="fa-solid fa-unlock-keyhole"></i> 코드로 바로 입장
                        </button>
                    </form>
                    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center;">
                        <button type="button" class="u90-btn u90-btn-ghost" onclick="const m=document.getElementById('authModal'); if(m&&typeof openModal==='function')openModal(m);">
                            <i class="fa-solid fa-right-to-bracket"></i> 아쿠아버디 회원 로그인
                        </button>
                        <button type="button" class="u90-btn u90-btn-kakao" onclick="if(typeof openKakaoChat==='function')openKakaoChat('under90_lock');">
                            <i class="fa-solid fa-comment-dots"></i> 신규 회원이신가요? 오픈채팅 문의
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const rawPosts = getCrewPosts();
        const isUsingSamples = rawPosts.length === 0;
        const sourceList = isUsingSamples ? getFallbackStarterExamples() : rawPosts;
        const parsedList = sourceList.map(parseUnder90Post);

        const meetups = parsedList.filter(item => item.meta.subType === 'meetup');
        const notices = parsedList.filter(item => item.meta.subType === 'notice');
        const boards = parsedList.filter(item => item.meta.subType === 'board');

        const activeList = state.activeBoardTab === 'meetup'
            ? meetups
            : (state.activeBoardTab === 'notice' ? notices : boards);

        const currentNameDisplay = getActiveUserName();

        container.innerHTML = `
            <div class="under90-board-header">
                <div class="under90-subtabs">
                    <button type="button" class="u90-subtab ${state.activeBoardTab === 'meetup' ? 'active' : ''}" onclick="Under90CrewEngine.switchBoardTab('meetup')">
                        📅 정모 일정 · 코스신청 <span class="u90-count">${meetups.length}</span>
                    </button>
                    <button type="button" class="u90-subtab ${state.activeBoardTab === 'notice' ? 'active' : ''}" onclick="Under90CrewEngine.switchBoardTab('notice')">
                        📌 고정공지 · 안전수칙 <span class="u90-count">${notices.length}</span>
                    </button>
                    <button type="button" class="u90-subtab ${state.activeBoardTab === 'board' ? 'active' : ''}" onclick="Under90CrewEngine.switchBoardTab('board')">
                        💬 크루 게시판 · 장비나눔 <span class="u90-count">${boards.length}</span>
                    </button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    ${currentNameDisplay ? `<span style="font-size:0.8rem;color:#94a3b8;background:rgba(255,255,255,0.06);padding:6px 10px;border-radius:10px;">👤 <strong>${esc(currentNameDisplay)}</strong>님</span>` : ''}
                    <button type="button" class="u90-btn u90-btn-gold" onclick="Under90CrewEngine.openComposer('${state.activeBoardTab}')">
                        <i class="fa-solid fa-pen-to-square"></i> 새 정모 / 공지 / 글 올리기
                    </button>
                    ${!isLoggedInUser() ? `<button type="button" class="u90-btn u90-btn-ghost" onclick="Under90CrewEngine.lockAgain()" title="잠금 상태로 전환" style="padding:8px 10px;"><i class="fa-solid fa-lock"></i></button>` : ''}
                </div>
            </div>

            ${isUsingSamples ? `
                <div style="background:rgba(255,183,3,0.1);border:1px dashed rgba(255,183,3,0.45);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <span style="font-size:0.84rem;color:#fde68a;">
                        💡 아직 등록된 실제 정모가 없어 <strong>미리보기 예시</strong>를 띄워두었습니다. 오른쪽 버튼으로 첫 정모를 바로 올려보세요!
                    </span>
                    <button type="button" class="u90-btn u90-btn-gold" style="padding:7px 14px;font-size:0.8rem;" onclick="Under90CrewEngine.openComposer('meetup')">
                        + 첫 실제 정모 등록하기
                    </button>
                </div>
            ` : ''}

            <div class="under90-cards-stack">
                ${activeList.length > 0 ? activeList.map(renderCrewCard).join('') : `
                    <div style="text-align:center;padding:42px 20px;background:rgba(15,23,42,0.7);border:1px dashed rgba(0,242,254,0.25);border-radius:16px;color:#94a3b8;">
                        <p style="margin:0 0 12px 0;font-size:0.95rem;">아직 이 탭에 올라온 글이 없습니다.</p>
                        <button type="button" class="u90-btn u90-btn-cyan" onclick="Under90CrewEngine.openComposer('${state.activeBoardTab}')">
                            첫 번째 글 등록하기
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    function renderCrewCard(item) {
        const { post, cleanDesc, meta } = item;
        const isMeetup = meta.subType === 'meetup';
        const isNotice = meta.subType === 'notice';
        const spotCfg = SPOTS.find(s => s.key === meta.spotKey);
        const participants = Array.isArray(post.participants) ? post.participants : [];
        const comments = Array.isArray(post.comments) ? post.comments : [];

        const typeBadge = isMeetup
            ? `<span class="u90-type-badge meetup">📅 정모 일정</span>`
            : (isNotice ? `<span class="u90-type-badge notice">📌 고정 공지</span>` : `<span class="u90-type-badge board">💬 크루 글</span>`);

        const sampleBadge = post.isSample ? `<span class="u90-type-badge sample">예시 미리보기</span>` : '';

        const levelBadgesHtml = (meta.levels || []).map(lvlKey => {
            const lv = LEVELS.find(l => l.key === lvlKey);
            if (!lv) return '';
            return `<span class="u90-level-chip" style="background:${lv.bg};border-color:${lv.border};color:${lv.color};">${lv.icon} ${esc(lv.label)} (${esc(lv.dist)})</span>`;
        }).join('');

        let rsvpBlockHtml = '';
        if (isMeetup) {
            const levelCounts = { beginner: 0, intermediate: 0, advanced: 0, master: 0 };
            let afterCount = 0;

            participants.forEach(p => {
                if (typeof p === 'object' && p !== null) {
                    if (p.level && levelCounts[p.level] !== undefined) levelCounts[p.level]++;
                    const ap = p.afterParty || 'swim_only';
                    if (ap === 'both' || ap === 'after_only') afterCount++;
                }
            });

            const myName = getActiveUserName().toLowerCase();
            const myRsvp = myName ? participants.find(p => typeof p === 'object' && p.name && p.name.trim().toLowerCase() === myName) : null;
            const isExpanded = Boolean(state.expandedAttendees[post.id]);

            rsvpBlockHtml = `
                <div class="u90-meetup-info-box">
                    ${meta.eventTime ? `<div class="u90-info-row"><span>🕒 <strong>일시:</strong></span><span>${esc(meta.eventTime)}</span></div>` : ''}
                    ${post.location_name ? `<div class="u90-info-row"><span>📍 <strong>집결:</strong></span><span>${esc(post.location_name)}</span></div>` : ''}
                    ${meta.feeText ? `<div class="u90-info-row"><span>💰 <strong>참가비:</strong></span><span style="color:#fde68a;font-weight:700;">${esc(meta.feeText)}</span></div>` : ''}
                    ${meta.accountText ? `
                        <div class="u90-info-row">
                            <span>💳 <strong>계좌:</strong></span>
                            <span style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <code style="background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:6px;color:#fff;">${esc(meta.accountText)}</code>
                                <button type="button" onclick="Under90CrewEngine.copyText('${esc(meta.accountText).replace(/'/g, "\\'")}', '계좌번호가 복사되었습니다!')" class="u90-mini-copy-btn">계좌복사</button>
                            </span>
                        </div>` : ''}
                    ${meta.afterPartyText ? `<div class="u90-info-row"><span>🍺 <strong>뒷풀이:</strong></span><span>${esc(meta.afterPartyText)}</span></div>` : ''}
                </div>

                ${levelBadgesHtml ? `<div class="u90-level-row">${levelBadgesHtml}</div>` : ''}

                <div class="u90-rsvp-summary-bar">
                    <div class="u90-rsvp-counts">
                        <strong style="color:#fff;font-size:0.95rem;">🏊‍♂️ 총 신청 ${participants.length}명</strong>
                        <span class="u90-rsvp-breakdown">
                            🟢초급 ${levelCounts.beginner} · 🔵중급 ${levelCounts.intermediate} · 🟠상급 ${levelCounts.advanced} · 🔴마스터 ${levelCounts.master}
                            <span style="color:#ffb703;font-weight:800;margin-left:6px;">| 🍺 뒷풀이 ${afterCount}명</span>
                        </span>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        ${!post.isSample ? `
                            <button type="button" class="u90-btn ${myRsvp ? 'u90-btn-cyan' : 'u90-btn-gold'}" onclick="Under90CrewEngine.openRsvpModal('${esc(post.id)}')">
                                <i class="fa-solid ${myRsvp ? 'fa-user-check' : 'fa-hand'}"></i>
                                ${myRsvp ? '신청 수정 / 취소' : '코스·뒷풀이 참석하기'}
                            </button>
                        ` : `
                            <button type="button" class="u90-btn u90-btn-gold" onclick="Under90CrewEngine.openComposer('meetup')">
                                <i class="fa-solid fa-plus"></i> 이 양식으로 실제 정모 올리기
                            </button>
                        `}
                        <button type="button" class="u90-btn u90-btn-ghost" onclick="Under90CrewEngine.toggleAttendees('${esc(post.id)}')">
                            ${isExpanded ? '명단 접기' : `명단 보기 (${participants.length})`}
                        </button>
                        ${participants.length > 0 ? `
                            <button type="button" class="u90-btn u90-btn-ghost" onclick="Under90CrewEngine.copyAttendeeSummary('${esc(post.id)}')" title="카톡방 공지용 명단 복사">
                                <i class="fa-regular fa-copy"></i> 명단 카톡복사
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${isExpanded ? `
                    <div class="u90-attendee-list">
                        ${participants.length === 0 ? `<div style="color:#94a3b8;font-size:0.84rem;">아직 신청자가 없습니다. 첫 번째로 신청해 보세요!</div>` : participants.map(p => {
                            const lv = LEVELS.find(l => l.key === p.level) || LEVELS[0];
                            const ap = AFTER_PARTY_OPTS[p.afterParty || 'swim_only'] || AFTER_PARTY_OPTS.swim_only;
                            return `
                                <div class="u90-attendee-chip">
                                    <strong>${esc(p.name || '회원')}</strong>
                                    <span style="color:${lv.color};font-size:0.76rem;font-weight:800;">${lv.icon} ${esc(lv.label)}(${esc(lv.dist)})</span>
                                    <span style="color:${ap.color};font-size:0.75rem;">${esc(ap.short)}</span>
                                    ${p.note ? `<span style="color:#94a3b8;font-size:0.75rem;">· ${esc(p.note)}</span>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            `;
        }

        const commentsHtml = !post.isSample ? `
            <div class="u90-comments-box">
                ${comments.length > 0 ? `
                    <div class="u90-comment-list">
                        ${comments.map(c => `
                            <div class="u90-comment-item">
                                <strong style="color:#00f2fe;font-size:0.82rem;">${esc(c.author || '회원')}</strong>
                                <span style="color:#e2e8f0;font-size:0.84rem;">${esc(c.text || '')}</span>
                                <span style="color:#64748b;font-size:0.72rem;margin-left:auto;">${esc(c.time || '')}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <form onsubmit="event.preventDefault(); Under90CrewEngine.submitComment('${esc(post.id)}');" class="u90-comment-form">
                    <input type="text" id="u90CommentInput_${esc(post.id)}" placeholder="댓글이나 카풀/질문을 남겨보세요..." maxlength="200">
                    <button type="submit" class="u90-btn u90-btn-cyan" style="padding:7px 14px;font-size:0.8rem;">등록</button>
                </form>
            </div>
        ` : '';

        return `
            <article class="u90-post-card ${isNotice ? 'is-notice' : ''}">
                <div class="u90-card-top">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        ${typeBadge}
                        ${sampleBadge}
                        ${spotCfg ? `<span class="u90-spot-pill" onclick="Under90CrewEngine.selectSpot('${spotCfg.key}'); document.getElementById('under90SpotLivePanel')?.scrollIntoView({behavior:'smooth'});">📍 ${esc(spotCfg.label)} 날씨보기</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:0.78rem;">
                        <span>작성: <strong style="color:#e2e8f0;">${esc(post.user_name || post.author || '회원')}</strong></span>
                        ${!post.isSample ? `
                            <button type="button" onclick="Under90CrewEngine.openComposer('${meta.subType}', '${esc(post.id)}')" class="u90-icon-btn" title="수정"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" onclick="Under90CrewEngine.deletePost('${esc(post.id)}')" class="u90-icon-btn danger" title="삭제"><i class="fa-solid fa-trash"></i></button>
                        ` : ''}
                    </div>
                </div>

                <h4 class="u90-card-title">${esc(post.title)}</h4>
                <div class="u90-card-desc">${esc(cleanDesc).replace(/\n/g, '<br>')}</div>

                ${rsvpBlockHtml}
                ${commentsHtml}
            </article>
        `;
    }

    function switchBoardTab(tabKey) {
        state.activeBoardTab = tabKey;
        renderGateAndBoard();
    }

    function toggleAttendees(postId) {
        state.expandedAttendees[postId] = !state.expandedAttendees[postId];
        renderGateAndBoard();
    }

    function submitPasscode() {
        const inp = document.getElementById('under90PasscodeInput');
        if (!inp) return;
        unlockWithCode(inp.value);
    }

    // ------------------------------------------------------------------------
    // Composer Modal (Create / Edit Crew Meetup, Notice, or Board Post)
    // ------------------------------------------------------------------------
    function openComposer(defaultSubType, editId) {
        if (!isUnlocked()) {
            notify('🔒 먼저 입장코드(0090)를 입력하거나 로그인해 주세요.');
            return;
        }
        const modal = document.getElementById('under90ComposerModal');
        if (!modal) return;

        state.editingPostId = editId || null;
        let existing = null;
        if (editId) {
            const raw = getCrewPosts().find(p => String(p.id) === String(editId));
            if (raw) existing = parseUnder90Post(raw);
        }

        const subType = existing ? existing.meta.subType : (defaultSubType || 'meetup');
        const spotKey = existing ? existing.meta.spotKey : state.activeSpotKey;

        document.getElementById('u90CompModalTitle').textContent = editId ? '✏️ 언더나인티 글 수정' : '🏊‍♂️ 언더나인티 새 글 / 정모 등록';
        document.getElementById('u90CompSubType').value = subType;
        document.getElementById('u90CompSpot').value = spotKey;
        document.getElementById('u90CompTitle').value = existing ? existing.post.title : '';
        document.getElementById('u90CompAuthor').value = existing ? (existing.post.user_name || '') : (getActiveUserName() || '');
        document.getElementById('u90CompEventTime').value = existing ? (existing.meta.eventTime || existing.post.event_date || '') : '';
        document.getElementById('u90CompLocation').value = existing ? (existing.post.location_name || '') : ((SPOTS.find(s => s.key === spotKey) || {}).meetingHint || '');
        document.getElementById('u90CompFee').value = existing ? (existing.meta.feeText || '') : '입수/간식 회비 10,000원 (뒷풀이 1/N 별도)';
        document.getElementById('u90CompAccount').value = existing ? (existing.meta.accountText || '') : '';
        document.getElementById('u90CompAfterParty').value = existing ? (existing.meta.afterPartyText || '') : '입수 후 인근 식당 뒷풀이 (참석 여부 선택)';
        document.getElementById('u90CompDesc').value = existing ? existing.cleanDesc : '';

        const activeLevels = existing && Array.isArray(existing.meta.levels) ? existing.meta.levels : ['beginner', 'intermediate', 'advanced', 'master'];
        document.querySelectorAll('input[name="u90CompLevel"]').forEach(cb => {
            cb.checked = activeLevels.includes(cb.value);
        });

        toggleComposerMeetupFields();
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closeComposer() {
        const modal = document.getElementById('under90ComposerModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        state.editingPostId = null;
    }

    function toggleComposerMeetupFields() {
        const subTypeEl = document.getElementById('u90CompSubType');
        const box = document.getElementById('u90CompMeetupFields');
        if (!subTypeEl || !box) return;
        box.style.display = subTypeEl.value === 'meetup' ? 'block' : 'none';
    }

    function onComposerSpotChange(spotKey) {
        const spotCfg = SPOTS.find(s => s.key === spotKey);
        const locInp = document.getElementById('u90CompLocation');
        if (spotCfg && locInp && !state.editingPostId) {
            locInp.value = `${spotCfg.fullName} (${spotCfg.meetingHint})`;
        }
    }

    async function saveComposerPost() {
        const subType = document.getElementById('u90CompSubType').value;
        const spotKey = document.getElementById('u90CompSpot').value;
        const title = document.getElementById('u90CompTitle').value.trim();
        let author = document.getElementById('u90CompAuthor').value.trim() || getActiveUserName();
        const eventTime = document.getElementById('u90CompEventTime').value.trim();
        const locationName = document.getElementById('u90CompLocation').value.trim();
        const feeText = document.getElementById('u90CompFee').value.trim();
        const accountText = document.getElementById('u90CompAccount').value.trim();
        const afterPartyText = document.getElementById('u90CompAfterParty').value.trim();
        const descText = document.getElementById('u90CompDesc').value.trim();

        if (!title) {
            notify('⚠️ 제목을 입력해 주세요.');
            return;
        }
        if (!author) {
            notify('⚠️ 작성자 성함(또는 닉네임)을 입력해 주세요.');
            return;
        }

        try { localStorage.setItem(STORAGE_MEMBER_NAME_KEY, author); } catch (e) {}

        const checkedLevels = [];
        document.querySelectorAll('input[name="u90CompLevel"]:checked').forEach(cb => checkedLevels.push(cb.value));

        const metaObj = {
            subType,
            spotKey,
            eventTime,
            levels: checkedLevels.length > 0 ? checkedLevels : ['beginner', 'intermediate'],
            feeText,
            accountText,
            afterPartyText,
            hasAfterParty: Boolean(afterPartyText && !afterPartyText.includes('없음'))
        };

        const packedDesc = buildUnder90Desc(descText || '함께 안전하고 즐거운 바다수영 되세요!', metaObj);
        const client = getClient();
        const spotCfg = SPOTS.find(s => s.key === spotKey);
        const nowIso = (typeof getKSTIsoString === 'function') ? getKSTIsoString() : new Date().toISOString();

        const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : window.currentUser;
        const dbPayload = {
            title,
            category: 'crew_under90',
            category_name: '언더나인티 크루',
            sports_type: '바다수영',
            user_name: author,
            real_name: author,
            author: (u && u.email) ? u.email : author,
            region: 'gyeongsang',
            location: 'gyeongsang',
            location_name: locationName || (spotCfg ? spotCfg.fullName : '부울경 바다'),
            event_date: eventTime || null,
            date: eventTime || null,
            description: packedDesc,
            desc: packedDesc,
            content: packedDesc,
            status: 'recruiting',
            status_text: subType === 'meetup' ? '모집 중' : '등록됨',
            created_at: nowIso
        };

        let savedRecord = null;
        if (client) {
            try {
                if (state.editingPostId) {
                    const existingObj = getCrewPosts().find(p => String(p.id) === String(state.editingPostId));
                    const updatePayload = Object.assign({}, dbPayload);
                    delete updatePayload.created_at;
                    if (existingObj && Array.isArray(existingObj.participants)) {
                        updatePayload.participants = existingObj.participants;
                    }
                    const { data, error } = await safePostMutate(client, 'update', updatePayload, state.editingPostId);
                    if (!error && data && data[0]) savedRecord = data[0];
                    else if (error) console.warn('[Under90 Supabase update warning]', error);
                } else {
                    dbPayload.participants = [];
                    dbPayload.comments = [];
                    const { data, error } = await safePostMutate(client, 'insert', dbPayload);
                    if (!error && data && data[0]) savedRecord = data[0];
                    else if (error) console.warn('[Under90 Supabase insert warning]', error);
                }
            } catch (err) {
                console.warn('[Under90 DB save exception]', err);
            }
        }

        if (!savedRecord) {
            savedRecord = Object.assign({
                id: state.editingPostId || ('u90_' + Date.now()),
                participants: [],
                comments: []
            }, dbPayload);
        }

        if (typeof posts !== 'undefined' && Array.isArray(posts)) {
            if (state.editingPostId) {
                const idx = posts.findIndex(p => String(p.id) === String(state.editingPostId));
                if (idx !== -1) posts[idx] = Object.assign({}, posts[idx], savedRecord);
                else posts.unshift(savedRecord);
            } else {
                posts.unshift(savedRecord);
            }
            try { localStorage.setItem('aqua_buddy_posts_v27', JSON.stringify(posts)); } catch (e) {}
        }

        state.activeBoardTab = subType;
        closeComposer();
        renderGateAndBoard();
        notify('✅ 언더나인티 크루 글이 등록되었습니다!');
    }

    async function safePostMutate(client, mode, payloadObj, id) {
        const working = Object.assign({}, payloadObj);
        for (let attempt = 0; attempt < 6; attempt++) {
            let res;
            if (mode === 'insert') {
                res = await client.from('posts').insert([working]).select();
            } else {
                res = await client.from('posts').update(working).eq('id', id).select();
            }
            if (!res.error) return res;
            if (res.error.message && res.error.message.includes('Could not find the') && res.error.message.includes("column of 'posts'")) {
                const m = res.error.message.match(/Could not find the '([^']+)' column/);
                if (m && m[1]) {
                    delete working[m[1]];
                    continue;
                }
            }
            return res;
        }
        return { data: null, error: new Error('Mutation retries exceeded') };
    }

    async function deletePost(postId) {
        if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
        const client = getClient();
        if (client) {
            try {
                await client.from('posts').delete().eq('id', postId);
            } catch (e) {
                console.warn('[Under90 delete warning]', e);
            }
        }
        if (typeof posts !== 'undefined' && Array.isArray(posts)) {
            const idx = posts.findIndex(p => String(p.id) === String(postId));
            if (idx !== -1) posts.splice(idx, 1);
            try { localStorage.setItem('aqua_buddy_posts_v27', JSON.stringify(posts)); } catch (e) {}
        }
        renderGateAndBoard();
        notify('🗑️ 게시글이 삭제되었습니다.');
    }

    // ------------------------------------------------------------------------
    // RSVP Modal (Course Level + After-Party Selection)
    // ------------------------------------------------------------------------
    function openRsvpModal(postId) {
        const post = getCrewPosts().find(p => String(p.id) === String(postId));
        if (!post) return;
        const parsed = parseUnder90Post(post);
        const modal = document.getElementById('under90RsvpModal');
        if (!modal) return;

        state.rsvpPostId = postId;
        const savedName = getActiveUserName();
        const participants = Array.isArray(post.participants) ? post.participants : [];
        const existing = savedName
            ? participants.find(p => typeof p === 'object' && p.name && p.name.trim().toLowerCase() === savedName.toLowerCase())
            : null;

        document.getElementById('u90RsvpPostTitle').textContent = post.title;
        document.getElementById('u90RsvpName').value = existing ? existing.name : savedName;
        document.getElementById('u90RsvpNote').value = existing ? (existing.note || '') : '';

        const allowedLevels = parsed.meta.levels && parsed.meta.levels.length > 0
            ? LEVELS.filter(l => parsed.meta.levels.includes(l.key))
            : LEVELS;
        const levelSel = document.getElementById('u90RsvpLevel');
        levelSel.innerHTML = allowedLevels.map(l =>
            `<option value="${l.key}" ${existing && existing.level === l.key ? 'selected' : ''}>${l.icon} ${esc(l.label)} (${esc(l.dist)})</option>`
        ).join('');

        const afterSel = document.getElementById('u90RsvpAfterParty');
        afterSel.value = existing ? (existing.afterParty || 'both') : 'both';

        const cancelBtn = document.getElementById('u90RsvpCancelBtn');
        if (cancelBtn) cancelBtn.style.display = existing ? 'inline-flex' : 'none';

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closeRsvpModal() {
        const modal = document.getElementById('under90RsvpModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        state.rsvpPostId = null;
    }

    async function saveRsvp() {
        const post = getCrewPosts().find(p => String(p.id) === String(state.rsvpPostId));
        if (!post) return;

        const name = document.getElementById('u90RsvpName').value.trim();
        const level = document.getElementById('u90RsvpLevel').value;
        const afterParty = document.getElementById('u90RsvpAfterParty').value;
        const note = document.getElementById('u90RsvpNote').value.trim();

        if (!name) {
            notify('⚠️ 성함 또는 닉네임을 입력해 주세요.');
            return;
        }
        try { localStorage.setItem(STORAGE_MEMBER_NAME_KEY, name); } catch (e) {}

        if (!Array.isArray(post.participants)) post.participants = [];
        const idx = post.participants.findIndex(p => typeof p === 'object' && p.name && p.name.trim().toLowerCase() === name.toLowerCase());
        const entry = { name, level, afterParty, note, updatedAt: new Date().toISOString() };

        if (idx !== -1) post.participants[idx] = entry;
        else post.participants.push(entry);

        await syncParticipantsToDb(post);
        state.expandedAttendees[post.id] = true;
        closeRsvpModal();
        renderGateAndBoard();
        notify(`✅ ${name}님 신청 완료! (${(LEVELS.find(l => l.key === level) || {}).label || ''})`);
    }

    async function cancelRsvp() {
        const post = getCrewPosts().find(p => String(p.id) === String(state.rsvpPostId));
        if (!post || !Array.isArray(post.participants)) return;

        const name = document.getElementById('u90RsvpName').value.trim() || getActiveUserName();
        if (!name) return;

        post.participants = post.participants.filter(p => !(typeof p === 'object' && p.name && p.name.trim().toLowerCase() === name.toLowerCase()));
        await syncParticipantsToDb(post);
        closeRsvpModal();
        renderGateAndBoard();
        notify('취소 처리되었습니다.');
    }

    async function syncParticipantsToDb(post) {
        try { localStorage.setItem('aqua_buddy_posts_v27', JSON.stringify(posts)); } catch (e) {}
        const client = getClient();
        if (client && !post.isSample) {
            try {
                await client.from('posts').update({ participants: post.participants }).eq('id', post.id);
            } catch (e) {
                console.warn('[Under90 RSVP DB sync]', e);
            }
        }
    }

    // ------------------------------------------------------------------------
    // Comments & Clipboard Utilities
    // ------------------------------------------------------------------------
    async function submitComment(postId) {
        const post = getCrewPosts().find(p => String(p.id) === String(postId));
        const inp = document.getElementById(`u90CommentInput_${postId}`);
        if (!post || !inp) return;

        const text = inp.value.trim();
        if (!text) return;

        let author = getActiveUserName();
        if (!author) {
            author = prompt('댓글에 표시될 성함(닉네임)을 입력해 주세요:', '') || '';
            author = author.trim();
            if (!author) return;
            try { localStorage.setItem(STORAGE_MEMBER_NAME_KEY, author); } catch (e) {}
        }

        if (!Array.isArray(post.comments)) post.comments = [];
        const now = new Date();
        const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        post.comments.push({ author, text, time: timeStr });
        inp.value = '';

        try { localStorage.setItem('aqua_buddy_posts_v27', JSON.stringify(posts)); } catch (e) {}
        const client = getClient();
        if (client && !post.isSample) {
            try {
                await client.from('posts').update({ comments: post.comments }).eq('id', post.id);
            } catch (e) {
                console.warn('[Under90 comment sync]', e);
            }
        }
        renderGateAndBoard();
    }

    function copyText(text, toastMsg) {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => notify(toastMsg || '📋 복사되었습니다!')).catch(() => fallbackCopy(text, toastMsg));
        } else {
            fallbackCopy(text, toastMsg);
        }
    }

    function fallbackCopy(text, toastMsg) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); notify(toastMsg || '📋 복사되었습니다!'); } catch (e) {}
        document.body.removeChild(ta);
    }

    function copyShareLink() {
        const base = window.location.href.split('#')[0];
        copyText(`${base}#under90`, '🔗 언더나인티 전용관 링크가 복사되었습니다! 카톡 공지에 붙여넣기 하세요.');
    }

    function copyAttendeeSummary(postId) {
        const raw = (getCrewPosts().find(p => String(p.id) === String(postId))) ||
                    (getFallbackStarterExamples().find(p => String(p.id) === String(postId)));
        if (!raw) return;
        const parsed = parseUnder90Post(raw);
        const list = Array.isArray(raw.participants) ? raw.participants : [];
        let lines = [`[UNDER 90 정모 명단] ${raw.title}`];
        if (parsed.meta.eventTime) lines.push(`🕒 일시: ${parsed.meta.eventTime}`);
        if (raw.location_name) lines.push(`📍 집결: ${raw.location_name}`);
        lines.push(`--- 총 ${list.length}명 ---`);

        LEVELS.forEach(lv => {
            const members = list.filter(m => m.level === lv.key);
            if (members.length > 0) {
                lines.push(`\n${lv.icon} ${lv.label}(${lv.dist}) [${members.length}명]`);
                members.forEach((m, i) => {
                    const ap = AFTER_PARTY_OPTS[m.afterParty || 'swim_only'];
                    lines.push(` ${i + 1}. ${m.name} (${ap ? ap.short : ''})${m.note ? ` - ${m.note}` : ''}`);
                });
            }
        });
        const afterTotal = list.filter(m => m.afterParty === 'both' || m.afterParty === 'after_only').length;
        lines.push(`\n🍺 뒷풀이 참석 예정: 총 ${afterTotal}명`);
        copyText(lines.join('\n'), '📋 카톡방 공유용 참석 명단이 복사되었습니다!');
    }

    // ------------------------------------------------------------------------
    // Main Initialization
    // ------------------------------------------------------------------------
    function init() {
        renderSpotSpotlight();
        renderGateAndBoard();
    }

    window.Under90CrewEngine = {
        init,
        renderAll: init,
        renderSpotSpotlight,
        renderBoard: renderGateAndBoard,
        selectSpot,
        toggleInlineCctv,
        openInFullOceanDashboard,
        switchBoardTab,
        submitPasscode,
        lockAgain,
        openComposer,
        closeComposer,
        toggleComposerMeetupFields,
        onComposerSpotChange,
        saveComposerPost,
        deletePost,
        openRsvpModal,
        closeRsvpModal,
        saveRsvp,
        cancelRsvp,
        toggleAttendees,
        submitComment,
        copyShareLink,
        copyAttendeeSummary,
        copyText
    };
})();
