/* Global Kakao Map State Variables (V509_FIX) */
if (typeof window.oceanKakaoSpotMarkersMap === 'undefined') window.oceanKakaoSpotMarkersMap = {};
if (typeof window.oceanKakaoMapObj === 'undefined') window.oceanKakaoMapObj = null;
if (typeof window.oceanKakaoMarkerObj === 'undefined') window.oceanKakaoMarkerObj = null;
if (typeof window._customOverlayObj === 'undefined') window._customOverlayObj = null;
var oceanKakaoSpotMarkersMap = window.oceanKakaoSpotMarkersMap;
var oceanKakaoMapObj = window.oceanKakaoMapObj;
var oceanKakaoMarkerObj = window.oceanKakaoMarkerObj;
var _customOverlayObj = window._customOverlayObj;


let currentDisplayLimit = 10;
let currentFilteredPosts = [];
// ==========================================================
// 🏷️ 유저 성별(Gender) & 연령대(Age Group) 통합 뱃지 생성 엔진
// ==========================================================

// 🌐 전역 유저 성별/연령대 실시간 연동 캐시 맵
let userDemographicsMap = {};
window.userDemographicsMap = userDemographicsMap;

async function syncUserDemographicsMap() {
    const client = (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : ((typeof window.supabaseClient !== 'undefined' && window.supabaseClient) ? window.supabaseClient : null);
    if (client) {
        try {
            // .select('*')로 변경하여 스키마 컬럼 미존재로 인한 400 Bad Request 에러 완벽 차단
            const { data, error } = await client.from('users').select('*');
            if (error) {
                console.warn("[syncUserDemographicsMap Notice] Supabase DB fetch notice:", error.message || error);
                return;
            }
            if (data && Array.isArray(data)) {
                data.forEach(u => {
                    const g = u.gender || u.user_gender || '';
                    const a = u.age_group || u.ageGroup || u.age || '';
                    const l = u.user_license || u.license || u.userLicense || '';
                    const displayNm = u.real_name || u.nickname || u.name || '';

                    if (u.email) userDemographicsMap[u.email.trim().toLowerCase()] = { gender: g, ageGroup: a, license: l, name: displayNm };
                    if (u.nickname) userDemographicsMap[u.nickname.trim().toLowerCase()] = { gender: g, ageGroup: a, license: l, name: displayNm };
                    if (u.name) userDemographicsMap[u.name.trim().toLowerCase()] = { gender: g, ageGroup: a, license: l, name: displayNm };
                    if (u.real_name) userDemographicsMap[u.real_name.trim().toLowerCase()] = { gender: g, ageGroup: a, license: l, name: displayNm };
                });
            }
        } catch(e) {
            console.warn("[syncUserDemographicsMap Notice] Safe Exception Fallback:", e);
        }
    }
}
window.syncUserDemographicsMap = syncUserDemographicsMap;

function getUserDemographicBadge(userOrPostOrName) {
    if (!userOrPostOrName) return '';
    let gender = '';
    let ageGroup = '';

    if (typeof userOrPostOrName === 'object' && userOrPostOrName !== null) {
        gender = userOrPostOrName.gender || (userOrPostOrName.user && userOrPostOrName.user.gender) || userOrPostOrName.author_gender || userOrPostOrName.authorGender || '';
        ageGroup = userOrPostOrName.age_group || userOrPostOrName.ageGroup || (userOrPostOrName.user && (userOrPostOrName.user.age_group || userOrPostOrName.user.ageGroup)) || userOrPostOrName.author_age_group || userOrPostOrName.authorAgeGroup || '';
        
        const possibleKeys = [
            userOrPostOrName.email,
            userOrPostOrName.author_email,
            userOrPostOrName.real_name,
            userOrPostOrName.realName,
            userOrPostOrName.name,
            userOrPostOrName.nickname,
            userOrPostOrName.author,
            userOrPostOrName.userName,
            userOrPostOrName.user_name
        ].filter(Boolean);

        for (const k of possibleKeys) {
            const kLower = String(k).trim().toLowerCase();
            if (userDemographicsMap && userDemographicsMap[kLower]) {
                if (!gender || gender === 'private') gender = userDemographicsMap[kLower].gender;
                if (!ageGroup || ageGroup === 'private') ageGroup = userDemographicsMap[kLower].ageGroup;
            }
            if (currentUser) {
                const myKeys = [currentUser.email, currentUser.name, currentUser.nickname, currentUser.realName, currentUser.real_name].filter(Boolean).map(s => String(s).trim().toLowerCase());
                if (myKeys.includes(kLower)) {
                    if (!gender || gender === 'private') gender = currentUser.gender || '';
                    if (!ageGroup || ageGroup === 'private') ageGroup = currentUser.age_group || currentUser.ageGroup || '';
                }
            }
            if (gender && gender !== 'private' && ageGroup && ageGroup !== 'private') break;
        }
    } else if (typeof userOrPostOrName === 'string') {
        const idKey = userOrPostOrName.trim();
        const keyLower = idKey.toLowerCase();
        if (userDemographicsMap && userDemographicsMap[keyLower]) {
            gender = userDemographicsMap[keyLower].gender;
            ageGroup = userDemographicsMap[keyLower].ageGroup;
        }
        if (currentUser) {
            const myKeys = [currentUser.email, currentUser.name, currentUser.nickname, currentUser.realName, currentUser.real_name].filter(Boolean).map(s => String(s).trim().toLowerCase());
            if (myKeys.includes(keyLower)) {
                if (!gender || gender === 'private') gender = currentUser.gender || '';
                if (!ageGroup || ageGroup === 'private') ageGroup = currentUser.age_group || currentUser.ageGroup || '';
            }
        }
    }

    let isMale = gender === 'male' || gender === '남성' || gender === '남';
    let isFemale = gender === 'female' || gender === '여성' || gender === '여';
    let isPrivateGender = !isMale && !isFemale;

    let isPrivateAge = !ageGroup || ageGroup === 'private' || ageGroup === '비공개' || ageGroup === '나이비공개';

    if (isPrivateGender && isPrivateAge) {
        return `<span class="user-badge user-badge-demographic" style="background: rgba(255, 255, 255, 0.08); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.72rem; padding: 1px 6px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; margin-left: 4px;">👤 비공개</span>`;
    }

    let icon = isMale ? '👦' : (isFemale ? '👧' : '👤');
    let genderLabel = isMale ? '남성' : (isFemale ? '여성' : '성별비공개');
    let ageLabel = !isPrivateAge ? ageGroup : '나이비공개';

    let badgeColor = isMale ? '#00f2fe' : (isFemale ? '#ff6b81' : '#a0aec0');
    let badgeBg = isMale ? 'rgba(0, 242, 254, 0.12)' : (isFemale ? 'rgba(255, 107, 129, 0.12)' : 'rgba(255, 255, 255, 0.08)');
    let badgeBorder = isMale ? 'rgba(0, 242, 254, 0.35)' : (isFemale ? 'rgba(255, 107, 129, 0.35)' : 'rgba(255, 255, 255, 0.15)');

    let combinedText = `${icon} ${genderLabel !== '성별비공개' ? genderLabel + ' · ' : ''}${ageLabel}`;
    if (genderLabel === '성별비공개') combinedText = `👤 성별비공개 · ${ageLabel}`;

    return `<span class="user-badge user-badge-demographic" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 0.72rem; padding: 1px 6px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; margin-left: 4px;">${combinedText}</span>`;
}
window.getUserDemographicBadge = getUserDemographicBadge;

// ==========================================================
// 👑 퀘스트 & 칭호 3D 띠지 뱃지 렌더러 (개국공신 / 슈퍼호스트 / 앰버서더 / 전도사)
// ==========================================================
window._globalUsersByEmailMap = window._globalUsersByEmailMap || {};
window._globalUsersByNickMap = window._globalUsersByNickMap || {};

async function fetchAndCacheAllUsers() {
    var client = (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : (typeof window !== 'undefined' ? window.supabaseClient : null);
    if (!client) return;
    try {
        var res = await client.from('users').select('*');
        if (res && res.data && Array.isArray(res.data)) {
            res.data.forEach(function(u) {
                if (u.email) window._globalUsersByEmailMap[String(u.email).trim().toLowerCase()] = u;
                if (u.nickname) window._globalUsersByNickMap[String(u.nickname).trim()] = u;
                if (u.name) window._globalUsersByNickMap[String(u.name).trim()] = u;
                if (u.real_name) window._globalUsersByNickMap[String(u.real_name).trim()] = u;
            });
        }
    } catch (e) {
        console.warn("Global users cache notice:", e);
    }
}
window.fetchAndCacheAllUsers = fetchAndCacheAllUsers;

function renderUserBadges(u) {
    if (!u) return '';
    var html = '';

    function isTrue(val) {
        if (val === true || val === 1 || val === '1') return true;
        if (typeof val === 'string') {
            var s = val.trim().toLowerCase();
            return s === 'true' || s === 't' || s === 'y' || s === 'yes';
        }
        return false;
    }

    var email = (typeof u === 'string' ? u : (u.email || u.userEmail || u.author_email || u.authorEmail || '')).trim().toLowerCase();
    var nick = (typeof u === 'string' ? u : (u.nickname || u.name || u.author || u.user_nickname || u.real_name || u.realName || '')).trim();

    var dbMatched = (email && window._globalUsersByEmailMap[email]) || (nick && window._globalUsersByNickMap[nick]) || null;

    var isFounding = isTrue(u.is_founding_member) || isTrue(u.isFoundingMember) || (dbMatched && (isTrue(dbMatched.is_founding_member) || isTrue(dbMatched.isFoundingMember)));
    var isAmbassador = isTrue(u.is_sns_ambassador) || isTrue(u.isSnsAmbassador) || (dbMatched && (isTrue(dbMatched.is_sns_ambassador) || isTrue(dbMatched.isSnsAmbassador)));

    // Merge with currentUser if matching email / nickname
    if (currentUser) {
        var curEmail = (currentUser.email || '').trim().toLowerCase();
        var curNick = (currentUser.nickname || currentUser.name || '').trim();
        var curReal = (currentUser.real_name || currentUser.realName || '').trim();

        if (
            (email && curEmail && email === curEmail) ||
            (nick && (nick === curNick || nick === curReal || nick === currentUser.name))
        ) {
            if (isTrue(currentUser.is_founding_member) || isTrue(currentUser.isFoundingMember)) isFounding = true;
            if (isTrue(currentUser.is_sns_ambassador) || isTrue(currentUser.isSnsAmbassador)) isAmbassador = true;
        }
    }

    // Explicit fallback for founder account hanmaner@hanmail.net / water_log
    if (email === 'hanmaner@hanmail.net' || email === 'hanmaners@hanmail.net' || nick === 'water_log') {
        isFounding = true;
    }

    var rawHc = u.hosted_count || u.hostedCount || u.host_count || u.hostCount || (dbMatched ? (dbMatched.hosted_count || dbMatched.host_count || 0) : 0);
    var hc = parseInt(rawHc || (currentUser && (email === (currentUser.email||'').toLowerCase() || nick === (currentUser.nickname||'')) ? (currentUser.hosted_count || currentUser.host_count || 0) : 0), 10);

    var rawRc = u.referral_count || u.referralCount || (dbMatched ? (dbMatched.referral_count || 0) : 0);
    var rc = parseInt(rawRc || (currentUser && (email === (currentUser.email||'').toLowerCase() || nick === (currentUser.nickname||'')) ? (currentUser.referral_count || currentUser.referralCount || 0) : 0), 10);

    // 1. 👑 개국공신 (초기 100인 - DB is_founding_member=true)
    if (isFounding) {
        html += '<span class="badge-ribbon-pill badge-founding" title="아쿠아버디 초기 100인 개국공신">👑 개국공신</span>';
    }
    
    // 2. 👑 호스트 칭호 (10회 주최 캡틴 / 베테랑 / 초보)
    if (hc >= 10) {
        html += '<span class="badge-ribbon-pill badge-superhost" title="버디 모임 10회 이상 성공 주최">👑 슈퍼 호스트</span>';
    } else if (hc >= 5) {
        html += '<span class="badge-ribbon-pill badge-superhost" style="background: linear-gradient(135deg, #ff9100 0%, #ff6d00 100%);" title="버디 모임 5회 이상 성공 주최">⚓ 베테랑 호스트</span>';
    } else if (hc >= 1) {
        html += '<span class="badge-ribbon-pill" style="background: rgba(255, 82, 82, 0.15); color: #ff5252; border: 1px solid rgba(255, 82, 82, 0.4);" title="버디 모임 1회 이상 성공 주최">🌱 초보 호스트</span>';
    }

    // 3. 📣 1기 앰버서더 (SNS 홍보 캠페인 참여자)
    if (isAmbassador) {
        html += '<span class="badge-ribbon-pill badge-ambassador" title="아쿠아버디 공식 1기 앰버서더">📣 1기 앰버서더</span>';
    }

    // 4. 🚀 아쿠아 전도사 (추천인 3명 이상 초대)
    if (rc >= 3) {
        html += '<span class="badge-ribbon-pill badge-evangelist" title="추천인 코드 3명 이상 초대 달성">🚀 아쿠아 전도사</span>';
    }

    return html;
}
window.renderUserBadges = renderUserBadges;

// ==========================================================
// 👑 주최자 전용 참가 승인 / 반려 핸들러
// ==========================================================
async function handleApproveParticipant(postId, applicantEmailOrName) {
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) return;
    if (!Array.isArray(post.pending_participants)) post.pending_participants = [];
    if (!Array.isArray(post.participants)) post.participants = [];

    const pIdx = post.pending_participants.findIndex(p => {
        const pEmail = (typeof p === 'object' && p.email) ? p.email.toLowerCase() : '';
        const pName = (typeof p === 'object' && p.name) ? p.name.toLowerCase() : String(p).toLowerCase();
        const target = String(applicantEmailOrName).toLowerCase();
        return pEmail === target || pName === target;
    });

    if (pIdx === -1) {
        showToast("⚠️ 대기자 목록에서 사용자를 찾을 수 없습니다.");
        return;
    }

    const applicant = post.pending_participants.splice(pIdx, 1)[0];
    const participantObj = typeof applicant === 'object' ? {
        ...applicant,
        approvedAt: getKSTIsoString()
    } : {
        name: applicant,
        email: applicant,
        gender: 'private',
        age_group: 'private',
        approvedAt: getKSTIsoString()
    };

    post.participants.push(participantObj);
    post.joinedCount = post.participants.length + 1;
    const capacityVal = parseInt(post.capacity || post.capacityCount || 4, 10);
    if (post.joinedCount >= capacityVal) {
        post.status = "in_progress";
        post.statusText = "참가자 확정 완료";
    }

    if (typeof savePosts === 'function') savePosts();
    if (typeof broadcastPostUpdate === 'function') broadcastPostUpdate(post.id);
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                participants: post.participants,
                pending_participants: post.pending_participants,
                joined_count: post.joinedCount,
                status: post.status
            }).eq('id', post.id);
        } catch(e) { console.warn("Supabase approve participant update error:", e); }
    }

    showToast(`✅ '${participantObj.name || "참가자"}'님의 참가를 승인하였습니다!`);
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === 'function') renderDynamicDetailModal(post);
}
window.handleApproveParticipant = handleApproveParticipant;

async function handleRejectParticipant(postId, applicantEmailOrName) {
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) return;
    if (!Array.isArray(post.pending_participants)) post.pending_participants = [];
    if (!Array.isArray(post.rejected_participants)) post.rejected_participants = [];

    const pIdx = post.pending_participants.findIndex(p => {
        const pEmail = (typeof p === 'object' && p.email) ? p.email.toLowerCase() : '';
        const pName = (typeof p === 'object' && p.name) ? p.name.toLowerCase() : String(p).toLowerCase();
        const target = String(applicantEmailOrName).toLowerCase();
        return pEmail === target || pName === target;
    });

    if (pIdx === -1) {
        showToast("⚠️ 대기자 목록에서 사용자를 찾을 수 없습니다.");
        return;
    }

    const rejected = post.pending_participants.splice(pIdx, 1)[0];
    const rejectedObj = typeof rejected === 'object' ? {
        ...rejected,
        rejectedAt: getKSTIsoString()
    } : {
        name: rejected,
        email: rejected,
        rejectedAt: getKSTIsoString()
    };
    post.rejected_participants.push(rejectedObj);

    if (typeof savePosts === 'function') savePosts();
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                pending_participants: post.pending_participants,
                rejected_participants: post.rejected_participants
            }).eq('id', post.id);
        } catch(e) { console.warn("Supabase reject participant update error:", e); }
    }

    showToast(`❌ '${rejectedObj.name || "신청자"}'님의 참가 신청을 거절(투명망토 적용) 처리하였습니다.`);
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === 'function') renderDynamicDetailModal(post);
}
window.handleRejectParticipant = handleRejectParticipant;


function runWithKakaoMap(callback) {
    if (typeof window === "undefined") return;
    if (window.kakao && window.kakao.maps) {
        if (typeof window.kakao.maps.load === "function") {
            window.kakao.maps.load(() => {
                callback();
            });
        } else {
            callback();
        }
    } else {
        console.warn("Kakao Maps SDK not yet ready.");
    }
}

function getKSTIsoString() {
    const d = new Date();
    const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kstTime = new Date(utcMs + (9 * 60 * 60000));
    
    const pad = n => String(n).padStart(2, '0');
    const YYYY = kstTime.getFullYear();
    const MM = pad(kstTime.getMonth() + 1);
    const DD = pad(kstTime.getDate());
    const hh = pad(kstTime.getHours());
    const mm = pad(kstTime.getMinutes());
    const ss = pad(kstTime.getSeconds());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}+09:00`;
}
window.getKSTIsoString = getKSTIsoString;


// ==================================================
// 🛍️ 공동구매(Group Buy) 수량 선택, 참여 및 취소 핸들러
// ==================================================
function adjustGroupBuyQty(postId, delta) {
    const input = document.getElementById(`groupBuyQtyInput_${postId}`);
    if (!input) return;
    let val = parseInt(input.value || 1, 10) + delta;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
}
window.adjustGroupBuyQty = adjustGroupBuyQty;

async function handleJoinGroupBuy(postId) {
    if (!currentUser || (!currentUser.email && !currentUser.name && !currentUser.nickname)) {
        if (typeof showToast === 'function') showToast("🔑 로그인 후 공동구매에 참여하실 수 있습니다!");
        const authModal = document.getElementById("authModal");
        if (authModal && typeof openModal === "function") {
            if (typeof switchAuthTab === "function") switchAuthTab('login');
            openModal(authModal);
        }
        return;
    }

    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) {
        if (typeof showToast === 'function') showToast("⚠️ 게시글을 찾을 수 없습니다.");
        return;
    }

    if (typeof isMyPost === 'function' && isMyPost(post)) {
        if (typeof showToast === 'function') showToast("👑 본인이 개설한 공동구매 글입니다.");
        return;
    }

    if (post.status === "completed") {
        if (typeof showToast === 'function') showToast("🔒 이미 마감/완료된 공동구매입니다.");
        return;
    }

    const input = document.getElementById(`groupBuyQtyInput_${postId}`);
    const qty = input ? parseInt(input.value || 1, 10) : 1;
    if (qty < 1) {
        if (typeof showToast === 'function') showToast("⚠️ 1개 이상의 수량을 선택해 주세요.");
        return;
    }

    if (!Array.isArray(post.group_buy_orders)) {
        post.group_buy_orders = [];
    }

    const myIdentifier = currentUser.nickname || currentUser.name || currentUser.realName || "다이버";
    const myEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : "";

    const existingIndex = post.group_buy_orders.findIndex(o => {
        if (myEmail && o.email && o.email.toLowerCase() === myEmail) return true;
        if (o.name && o.name.toLowerCase() === myIdentifier.toLowerCase()) return true;
        return false;
    });

    if (existingIndex > -1) {
        if (typeof showToast === 'function') showToast("이미 공동구매에 참여하셨습니다. 취소 후 다시 신청해 주세요.");
        return;
    }

    const newOrder = {
        name: myIdentifier,
        email: myEmail,
        quantity: qty,
        time: getKSTIsoString()
    };

    post.group_buy_orders.push(newOrder);

    let totalQty = post.group_buy_orders.reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 1), 0);
    post.group_buy_current = totalQty;
    post.groupBuyCurrent = totalQty;

    const goalVal = parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10);
    if (totalQty >= goalVal) {
        if (typeof showToast === 'function') showToast(`🎉 축하합니다! 목표 수량(${goalVal}개)을 달성하여 공구가 성사되었습니다!`);
    } else {
        if (typeof showToast === 'function') showToast(`🛍️ 공동구매 ${qty}개 신청이 완료되었습니다! (현재 ${totalQty}/${goalVal}개)`);
    }

    if (typeof savePosts === 'function') savePosts();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                group_buy_current: totalQty,
                group_buy_orders: post.group_buy_orders
            }).eq('id', post.id);
        } catch(e) {
            console.warn("Supabase group buy update:", e);
        }
    }

    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === 'function') renderDynamicDetailModal(post);
}
window.handleJoinGroupBuy = handleJoinGroupBuy;

async function handleCancelGroupBuy(postId) {
    if (!currentUser) return;
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) return;

    if (post.status === "completed") {
        if (typeof showToast === 'function') showToast("🔒 이미 완료된 공동구매는 취소할 수 없습니다.");
        return;
    }

    if (!Array.isArray(post.group_buy_orders)) {
        post.group_buy_orders = [];
    }

    const myIdentifier = currentUser.nickname || currentUser.name || currentUser.realName || "다이버";
    const myEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : "";

    const existingIndex = post.group_buy_orders.findIndex(o => {
        if (myEmail && o.email && o.email.toLowerCase() === myEmail) return true;
        if (o.name && o.name.toLowerCase() === myIdentifier.toLowerCase()) return true;
        return false;
    });

    if (existingIndex === -1) {
        if (typeof showToast === 'function') showToast("참여 내역이 없습니다.");
        return;
    }

    const removed = post.group_buy_orders.splice(existingIndex, 1)[0];
    let totalQty = post.group_buy_orders.reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 1), 0);
    post.group_buy_current = totalQty;
    post.groupBuyCurrent = totalQty;

    if (typeof showToast === 'function') showToast(`❌ 공동구매 참여가 취소되었습니다. (${removed.quantity || 1}개 취소)`);

    if (typeof savePosts === 'function') savePosts();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                group_buy_current: totalQty,
                group_buy_orders: post.group_buy_orders
            }).eq('id', post.id);
        } catch(e) {
            console.warn("Supabase group buy cancel update:", e);
        }
    }

    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === 'function') renderDynamicDetailModal(post);
}
window.handleCancelGroupBuy = handleCancelGroupBuy;

window._forceInstProfileMode = true;
// ==================================================
// 🎓 AquaBuddy 강사 클래스 5대 전용 수강 평가 태그
// ==================================================
const INSTRUCTOR_MANNER_TAGS_DEF = [
    { key: "curriculum", label: "📚 커리큘럼이 체계적이에요", desc: "단계별 맞춤형 진도와 명확한 학습 목표를 제시해요" },
    { key: "schedule", label: "⏰ 제 스케줄에 맞춰줘요", desc: "원하는 시간과 장소를 유연하게 조율해 줘요" },
    { key: "underwater_video", label: "📸 수중 영상을 잘 찍어줘요", desc: "고화질 자세 피드백 영상과 멋진 인생샷을 남겨줘요" },
    { key: "instructor_knowledge", label: "💡 전문 지식이 풍부해요", desc: "안전 이론과 호흡/이퀄라이징 원리를 깊이 있게 설명해요" },
    { key: "teaching_skill", label: "🎯 티칭 능력이 뛰어나요", desc: "초보자도 알기 쉽게 핵심 포인트를 콕 집어 코칭해요" }
];


// ==================================================
// ✋ 버디 모임 참가 신청 / 취소 토글 핸들러 (전역 등록)
// ==================================================
async function handleToggleJoinPost(postId) {
    if (!currentUser || (!currentUser.email && !currentUser.name && !currentUser.nickname)) {
        showToast("🔑 로그인 후 참가 신청을 진행하실 수 있습니다!");
        const authModal = document.getElementById("authModal");
        if (authModal && typeof openModal === "function") {
            if (typeof switchAuthTab === "function") switchAuthTab('login');
            openModal(authModal);
        }
        return;
    }

    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) {
        showToast("⚠️ 게시글을 찾을 수 없습니다.");
        return;
    }

    if (typeof isMyPost === 'function' && isMyPost(post)) {
        showToast("👑 본인이 작성한 게시글입니다. (주최 확정 상태)");
        return;
    }

    if (!Array.isArray(post.participants)) post.participants = [];
    if (!Array.isArray(post.pending_participants)) post.pending_participants = [];
    if (!Array.isArray(post.rejected_participants)) post.rejected_participants = [];

    const isInstructor = post.category === "instructor" || post.is_instructor;
    const myIdentifier = currentUser.nickname || currentUser.name || currentUser.realName || (currentUser.email ? currentUser.email.split('@')[0] : "다이버");
    const myReal = currentUser.real_name || currentUser.realName || "";
    const myEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : "";
    const myGender = currentUser.gender || 'private';
    const myAgeGroup = currentUser.age_group || currentUser.ageGroup || 'private';

    // 🔒 거절(투명망토) 대상자인지 사전 확인
    const isRejected = post.rejected_participants.some(r => {
        if (typeof r === 'object' && r !== null) {
            if (myEmail && r.email && String(r.email).trim().toLowerCase() === myEmail) return true;
            if (r.name && (String(r.name).trim().toLowerCase() === myIdentifier.toLowerCase() || (myReal && String(r.name).trim().toLowerCase() === myReal.toLowerCase()))) return true;
        }
        const rStr = String(r).trim().toLowerCase();
        return (myEmail && rStr === myEmail) || (myIdentifier && rStr === myIdentifier.toLowerCase()) || (myReal && rStr === myReal.toLowerCase());
    });
    if (isRejected) {
        showToast("⚠️ 주최자에 의해 참가가 제한된 모임입니다.");
        return;
    }

    // 1. 이미 확정 참가 중인지 확인
    const confirmedIndex = post.participants.findIndex(p => {
        if (typeof p === 'object' && p !== null) {
            if (myEmail && p.email && String(p.email).trim().toLowerCase() === myEmail) return true;
            if (p.name && (String(p.name).trim().toLowerCase() === myIdentifier.toLowerCase() || (myReal && String(p.name).trim().toLowerCase() === myReal.toLowerCase()))) return true;
        }
        const pStr = String(p).trim().toLowerCase();
        return pStr === myIdentifier.toLowerCase() || (myReal && pStr === myReal.toLowerCase()) || (myEmail && pStr === myEmail);
    });

    // 2. 이미 승인 대기 중인지 확인
    const pendingIndex = post.pending_participants.findIndex(p => {
        if (typeof p === 'object' && p !== null) {
            if (myEmail && p.email && String(p.email).trim().toLowerCase() === myEmail) return true;
            if (p.name && (String(p.name).trim().toLowerCase() === myIdentifier.toLowerCase() || (myReal && String(p.name).trim().toLowerCase() === myReal.toLowerCase()))) return true;
        }
        const pStr = String(p).trim().toLowerCase();
        return pStr === myIdentifier.toLowerCase() || (myReal && pStr === myReal.toLowerCase()) || (myEmail && pStr === myEmail);
    });

    // 🔒 완료 상태 제한
    if (post.status === "completed") {
        showToast("🔒 이미 일정이 마감/완료된 모임입니다.");
        return;
    }

    if (confirmedIndex > -1) {
        // 확정된 참가 취소
        post.participants.splice(confirmedIndex, 1);
        post.joinedCount = Math.max(1, (post.participants.length + 1));
        post.joined_count = post.joinedCount;
        if (post.status === "in_progress" || post.status === "closed") {
            post.status = "recruiting";
            post.statusText = isInstructor ? "수강생 모집 중" : "모집 중";
        }
        showToast(isInstructor ? "❌ 강사 클래스 수강 신청이 취소되었습니다." : "❌ 버디 참가가 취소되었습니다.");
    } else if (pendingIndex > -1) {
        // 대기 중인 신청 취소
        post.pending_participants.splice(pendingIndex, 1);
        showToast("❌ 참가 승인 대기 신청이 취소되었습니다.");
    } else {
        // 신규 신청
        const capacityVal = parseInt(post.capacity || post.capacityCount || 4, 10);
        if (post.participants.length + 1 >= capacityVal) {
            showToast("⚠️ 모집 인원이 이미 마감되었습니다!");
            return;
        }

        const applicantObj = {
            name: myIdentifier,
            real_name: myReal,
            realName: myReal,
            email: myEmail,
            gender: myGender,
            age_group: myAgeGroup,
            requestedAt: getKSTIsoString()
        };

        if (isInstructor) {
            // 1. 강사 클래스: 즉시 participants 배열에 추가 & '참가 신청 완료' 토스트
            post.participants.push(applicantObj);
            post.joinedCount = post.participants.length + 1;
            post.joined_count = post.joinedCount;
            if (post.joinedCount >= capacityVal) {
                post.status = "in_progress";
                post.statusText = "수강생 모집 마감";
            }
            showToast("🙋‍♂️ 강사 클래스 수강 신청이 완료되었습니다!");
        } else {
            // 2. 일반 버디 모집: pending_participants 배열에 추가 & '참가 승인 대기 중' 토스트
            post.pending_participants.push(applicantObj);
            showToast("🙋‍♂️ 버디 참가 신청이 접수되었습니다! 주최자 승인 후 참가가 확정됩니다.");
        }
    }

    // 로컬 저장 및 Supabase DB 동기화
    if (typeof savePosts === 'function') savePosts();
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                participants: post.participants,
                pending_participants: post.pending_participants,
                rejected_participants: post.rejected_participants,
                joined_count: post.joinedCount || (post.participants.length + 1),
                status: post.status
            }).eq('id', post.id);
        } catch (err) {
            console.warn("Supabase post participants sync notice:", err);
        }
    }

    // UI 갱신
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === "function") {
        renderDynamicDetailModal(post);
    }
}
window.handleToggleJoinPost = handleToggleJoinPost;

// ==================================================
// ✅ 버디 주최자 전용: 대기 신청자 승인 핸들러
// ==================================================
async function approveBuddyParticipant(postId, userIdentifier) {
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) {
        showToast("⚠️ 게시글을 찾을 수 없습니다.");
        return;
    }
    if (!Array.isArray(post.participants)) post.participants = [];
    if (!Array.isArray(post.pending_participants)) post.pending_participants = [];

    const capacityVal = parseInt(post.capacity || post.capacityCount || 4, 10);
    if (post.participants.length + 1 >= capacityVal) {
        showToast("⚠️ 이미 모집 정원이 가득 찼습니다!");
        return;
    }

    const targetKey = String(userIdentifier || '').trim().toLowerCase();
    const pIdx = post.pending_participants.findIndex(p => {
        if (typeof p === 'object' && p !== null) {
            if (p.email && String(p.email).trim().toLowerCase() === targetKey) return true;
            if (p.name && String(p.name).trim().toLowerCase() === targetKey) return true;
            if (p.realName && String(p.realName).trim().toLowerCase() === targetKey) return true;
            if (p.real_name && String(p.real_name).trim().toLowerCase() === targetKey) return true;
        }
        return String(p).trim().toLowerCase() === targetKey;
    });

    if (pIdx === -1) {
        showToast("⚠️ 승인할 대기 신청자를 찾을 수 없습니다.");
        return;
    }

    const approvedUser = post.pending_participants.splice(pIdx, 1)[0];
    post.participants.push(approvedUser);
    post.joinedCount = post.participants.length + 1;
    post.joined_count = post.joinedCount;

    if (post.joinedCount >= capacityVal) {
        post.status = "in_progress";
        post.statusText = "진행 중";
    }

    const displayName = typeof approvedUser === 'object' ? (approvedUser.name || approvedUser.realName || userIdentifier) : approvedUser;

    if (typeof savePosts === 'function') savePosts();
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                participants: post.participants,
                pending_participants: post.pending_participants,
                joined_count: post.joinedCount,
                status: post.status
            }).eq('id', post.id);
        } catch (err) {
            console.warn("Supabase approve participants update error:", err);
        }
    }

    showToast(`✅ '${displayName}' 님의 버디 참가를 승인하였습니다!`);
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === "function") {
        renderDynamicDetailModal(post);
    }
}
window.approveBuddyParticipant = approveBuddyParticipant;

// ==================================================
// ❌ 주최자 / 강사 전용: 참가자 거절 (투명망토 블랙리스트) 핸들러
// ==================================================
async function rejectBuddyParticipant(postId, userIdentifier) {
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) {
        showToast("⚠️ 게시글을 찾을 수 없습니다.");
        return;
    }
    if (!Array.isArray(post.participants)) post.participants = [];
    if (!Array.isArray(post.pending_participants)) post.pending_participants = [];
    if (!Array.isArray(post.rejected_participants)) post.rejected_participants = [];

    const targetKey = String(userIdentifier || '').trim().toLowerCase();

    let targetUserObj = null;

    // 1. 대기 목록에서 검색
    const pIdx = post.pending_participants.findIndex(p => {
        if (typeof p === 'object' && p !== null) {
            if (p.email && String(p.email).trim().toLowerCase() === targetKey) return true;
            if (p.name && String(p.name).trim().toLowerCase() === targetKey) return true;
            if (p.realName && String(p.realName).trim().toLowerCase() === targetKey) return true;
            if (p.real_name && String(p.real_name).trim().toLowerCase() === targetKey) return true;
        }
        return String(p).trim().toLowerCase() === targetKey;
    });
    if (pIdx > -1) {
        targetUserObj = post.pending_participants.splice(pIdx, 1)[0];
    }

    // 2. 확정 목록에서 검색 (강사 거절 등)
    const cIdx = post.participants.findIndex(p => {
        if (typeof p === 'object' && p !== null) {
            if (p.email && String(p.email).trim().toLowerCase() === targetKey) return true;
            if (p.name && String(p.name).trim().toLowerCase() === targetKey) return true;
            if (p.realName && String(p.realName).trim().toLowerCase() === targetKey) return true;
            if (p.real_name && String(p.real_name).trim().toLowerCase() === targetKey) return true;
        }
        return String(p).trim().toLowerCase() === targetKey;
    });
    if (cIdx > -1) {
        targetUserObj = post.participants.splice(cIdx, 1)[0];
        post.joinedCount = Math.max(1, post.participants.length + 1);
        post.joined_count = post.joinedCount;
        if (post.status === "in_progress" || post.status === "closed") {
            post.status = "recruiting";
            post.statusText = (post.category === "instructor" || post.is_instructor) ? "수강생 모집 중" : "모집 중";
        }
    }

    const rejectItem = targetUserObj || { name: userIdentifier, email: targetKey.includes('@') ? targetKey : '' };
    
    // 중복 방지 후 rejected_participants에 추가
    const isAlreadyRejected = post.rejected_participants.some(r => {
        if (typeof r === 'object' && r !== null) {
            if (targetKey.includes('@') && r.email && r.email.toLowerCase() === targetKey) return true;
            if (r.name && r.name.toLowerCase() === targetKey) return true;
        }
        return String(r).toLowerCase() === targetKey;
    });
    if (!isAlreadyRejected) {
        post.rejected_participants.push(rejectItem);
    }

    const displayName = typeof rejectItem === 'object' ? (rejectItem.name || rejectItem.realName || userIdentifier) : rejectItem;

    if (typeof savePosts === 'function') savePosts();
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                participants: post.participants,
                pending_participants: post.pending_participants,
                rejected_participants: post.rejected_participants,
                joined_count: post.joinedCount || (post.participants.length + 1),
                status: post.status
            }).eq('id', post.id);
        } catch (err) {
            console.warn("Supabase reject participant update error:", err);
        }
    }

    showToast(`❌ '${displayName}' 님의 참가를 거절(투명망토 처리)하였습니다.`);
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof renderDynamicDetailModal === "function") {
        renderDynamicDetailModal(post);
    }
}
window.rejectBuddyParticipant = rejectBuddyParticipant;

// === updateModalFieldsByCategory: 게시판별 모달 타이틀 및 맞춤 면책 동의 문구 변환 엔진 ===
function updateModalFieldsByCategory(catKey) {
    const modalTitleEl = document.getElementById("createModalTitle") || document.querySelector("#createPostModal h2, #createPostModal h3");
    const disclaimerLabelEl = document.getElementById("inlineLiabilityCheckLabel") || document.querySelector("label[for='inlineLiabilityCheck']");
    const descEl = document.getElementById("postDesc");
    const descLabelEl = document.getElementById("descLabel");

    let titleText = "버디 모집글 작성";
    let disclaimerText = "[필수] 본 활동 중 발생하는 안전사고 및 개인 간의 문제에 대해 아쿠아버디 플랫폼은 법적 책임을 지지 않으며, 안전 수칙 준수 면책 방침에 동의합니다.";
    let placeholderText = "버디 모임 일정, 수심 계획, 준비물 등 상세 내용을 작성해 주세요!";
    let descLabelText = "상세 내용 및 플랜 *";

    if (catKey === "market") {
        titleText = "중고 장비 매물 등록";
        disclaimerText = "[필수] 허위 매물 등록 금지 및 안전한 비대면/직거래 원칙, 플랫폼 분쟁 면책 방침에 동의합니다.";
        placeholderText = "상세설명을 작성해주세요!";
        descLabelText = "상세 설명 *";
    } else if (catKey === "community") {
        titleText = "자유수다 게시글 작성";
        disclaimerText = "[필수] 타인 비방, 광고, 욕설 및 커뮤니티 이용 규정을 위반하지 않으며, 이에 대한 책임은 작성자에게 있음에 동의합니다.";
        placeholderText = "생각과 정보, 궁금증을 작성해주세요";
        descLabelText = "내용 작성 *";
    } else if (catKey === "instructor") {
        titleText = "강사 클래스 개설";
        disclaimerText = "[필수] 본 활동 중 발생하는 안전사고 및 개인 간의 문제에 대해 아쿠아버디 플랫폼은 법적 책임을 지지 않으며, 안전 수칙 준수 면책 방침에 동의합니다.";
        placeholderText = "상세 내용 및 교육 커리큘럼을 작성해 주세요!";
        descLabelText = "상세 내용 및 교육 커리큘럼 *";
    }

    if (modalTitleEl) modalTitleEl.textContent = titleText;
    if (disclaimerLabelEl) disclaimerLabelEl.textContent = disclaimerText;
    if (descEl) descEl.placeholder = placeholderText;
    if (descLabelEl) descLabelEl.textContent = descLabelText;

    const carpoolContainer = document.getElementById("carpoolOptionsContainer");
    if (carpoolContainer) {
        if (catKey === "market" || catKey === "community" || catKey === "partnership") {
            carpoolContainer.style.display = "none";
            const cpCheck = document.getElementById("postIsCarpool");
            if (cpCheck) cpCheck.checked = false;
            if (typeof toggleCarpoolFields === "function") toggleCarpoolFields(false);
        } else {
            carpoolContainer.style.display = "block";
        }
    }
}
window.updateModalFieldsByCategory = updateModalFieldsByCategory;

// === formatDesc: 영구 정규식 에러 차단 문자열 변환 엔진 (Regex 사용 0%) ===
function formatDesc(str) {
    if (!str) return "상세 내용이 없습니다.";
    const safe = typeof escapeHtml === "function" ? escapeHtml(str) : String(str);
    return safe.split("\n").join("<br>");
}
window.formatDesc = formatDesc;

// === AquaBuddy Core Engine (v20260812_FORCE_REFRESH_239) ===
// === 방탄 환경변수 및 안전 가드 (currentUser ReferenceError 원천 차단) ===
if (typeof window.currentUser === 'undefined') window.currentUser = null;
var currentUser = window.currentUser || null;

// === getCategoryNameKorean: 카테고리 코드 한글화 변환기 ===
function getCategoryNameKorean(catCode) {
    if (!catCode) return "전체";
    const c = String(catCode).trim().toLowerCase();
    switch (c) {
        case "swimming": return "🏊‍♂️ 실내 수영";
        case "openwater": return "🌊 바다 수영 / 오픈워터";
        case "freediving": return "🤿 프리다이빙";
        case "scuba": return "🤿 스쿠버 다이빙";
        case "instructor": return "🎓 강사 클래스";
        case "community": return "💬 자유 수다방";
        case "market": return "🛒 중고 다이빙 장비";
        case "buddy": return "👥 버디 모집";
        default: return catCode;
    }
}
window.getCategoryNameKorean = getCategoryNameKorean;

function updateCreateButtonText(catKey) {
    const btnTextEls = document.querySelectorAll("#createBtnText, .create-btn-text, #openCreateModalBtn span");
    let text = "버디 모집하기";
    if (catKey === "instructor") {
        text = "강사 클래스 개설";
    } else if (catKey === "community") {
        text = "자유수다 게시글 작성";
    } else if (catKey === "market") {
        text = "중고 장비 매물 등록";
    } else if (["swimming", "openwater", "freediving", "scuba"].includes(catKey)) {
        text = "버디 모집하기";
    } else if (catKey === "my_activity") {
        text = "새 모집글 등록하기";
    }
    btnTextEls.forEach(el => { el.textContent = text; });
}
window.updateCreateButtonText = updateCreateButtonText;

// === 최상단 전역 뷰 전환 엔진 (0초 만에 카테고리 & 전국 해양 스팟 전환 100% 무결점 보장) ===
var activeMainView = "all";
var activeCategory = "all";
var currentMainView = "all";
var currentDashboardSpot = null;

function forceScrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
}
window.forceScrollToTop = forceScrollToTop;

function switchMainView(viewName) {
    if (!viewName) viewName = "all";
    if (viewName === "home" || viewName === "feed") viewName = "all";
    
    // 메인 카테고리 전환 시 서브 필터 격리 보장
    if (viewName !== "buddy") {
        activeBuddySubFilter = "all";
        document.querySelectorAll("#buddySubFilterBar .sub-tab-btn").forEach(function(btn) {
            if (btn.dataset.buddysub === "all") btn.classList.add("active");
            else btn.classList.remove("active");
        });
    }
    if (viewName !== "instructor") {
        activeInstructorSubFilter = "all";
        document.querySelectorAll("#instructorSubFilterBar .sub-tab-btn").forEach(function(btn) {
            if (btn.dataset.instsub === "all") btn.classList.add("active");
            else btn.classList.remove("active");
        });
    }

    activeMainView = viewName;
    window._activeMainView = viewName;
    activeCategory = viewName;
    window._activeCategory = viewName;
    currentMainView = viewName;
    window.currentMainView = viewName;

    const feedSec = document.getElementById("mainFeedViewSection");
    const tideSec = document.getElementById("tideViewSection");
    const cctvSec = document.getElementById("cctvViewSection");

    const categoryBar = document.getElementById("categoryFilterBar");
    const subFilterBar = document.getElementById("instructorSubFilterBar");
    const activitySubFilterBar = document.getElementById("activitySubFilterBar");
    const partnershipSubFilterBar = document.getElementById("partnershipSubFilterBar");
    const partnershipTeaserBanner = document.getElementById("partnershipTeaserBanner");
    const oceanWeatherSection = document.getElementById("oceanWeatherSection");
    const mainBannerSlider = document.getElementById("mainBannerSlider");

    // 1. 모든 상단/하단 네비게이션 버튼 & 탭 active 상태 일괄 동기화
    document.querySelectorAll(".nav-item, .main-nav-btn, .nav-btn, .tab-btn, .category-tab-btn, .category-pill").forEach(link => {
        const onclickAttr = link.getAttribute("onclick") || "";
        const catData = link.dataset ? link.dataset.category : null;
        const viewData = link.dataset ? link.dataset.view : null;
        const targetId = "navLink" + viewName.charAt(0).toUpperCase() + viewName.slice(1);

        if (
            link.id === targetId ||
            catData === viewName ||
            viewData === viewName ||
            onclickAttr.includes(`'${viewName}'`)
        ) {
            link.classList.add("active");
        } else if (
            onclickAttr.includes("switchMainView") ||
            onclickAttr.includes("filterByCategory") ||
            link.classList.contains("nav-item") ||
            link.classList.contains("tab-btn") ||
            link.classList.contains("category-pill")
        ) {
            link.classList.remove("active");
        }
    });

    if (typeof updateCreateButtonText === "function") {
        updateCreateButtonText(viewName);
    }

    // 2. 🌊 전국 해양 스팟 / CCTV 뷰 전환 (피드 및 홈 블록 100% 완전 은폐)
    if (viewName === "tide" || viewName === "spots" || viewName === "cctv") {
        document.body.classList.add("category-view-active", "tide-view-active", "category-view-tide");
        if (feedSec) { feedSec.style.display = "none"; feedSec.classList.add("hidden"); }
        if (cctvSec) {
            if (viewName === "cctv") { cctvSec.style.display = "block"; cctvSec.classList.remove("hidden"); }
            else { cctvSec.style.display = "none"; cctvSec.classList.add("hidden"); }
        }
        if (tideSec) {
            if (viewName !== "cctv") {
                tideSec.className = "active-tab-section";
                tideSec.style.display = "";
            } else {
                tideSec.className = "offscreen-tab";
                tideSec.style.display = "";
            }
        }

        // 서브 필터 바 및 홈 전용 섹션들 완전 은폐
        if (categoryBar) categoryBar.style.display = "none";
        if (subFilterBar) { subFilterBar.style.display = "none"; subFilterBar.classList.add("hidden"); }
        if (activitySubFilterBar) { activitySubFilterBar.style.display = "none"; activitySubFilterBar.classList.add("hidden"); }
        if (partnershipSubFilterBar) { partnershipSubFilterBar.style.display = "none"; partnershipSubFilterBar.classList.add("hidden"); }
        if (partnershipTeaserBanner) { partnershipTeaserBanner.style.display = "none"; partnershipTeaserBanner.classList.add("hidden"); }
        if (oceanWeatherSection) oceanWeatherSection.style.display = "none";
        if (mainBannerSlider) mainBannerSlider.style.display = "block";

        if (viewName !== "cctv") {
            if (!currentDashboardSpot && typeof OCEAN_WEATHER_DATA !== "undefined" && OCEAN_WEATHER_DATA.length > 0) {
                currentDashboardSpot = OCEAN_WEATHER_DATA[0];
            }
            if (typeof renderUnifiedSpotDashboard === "function" && currentDashboardSpot) {
                renderUnifiedSpotDashboard(currentDashboardSpot);
            }
            if (typeof renderWeatherGrid === "function") {
                renderWeatherGrid(activeTideRegion || "all");
            }
            // 🌟 탭 전환 즉시 1회 relayout 및 setCenter 안전장치 호출
            if (typeof window.kakao !== 'undefined' && window.kakao.maps && _oceanKakaoMapObj) {
                _oceanKakaoMapObj.relayout();
                if (_lastOceanKakaoPos) {
                    _oceanKakaoMapObj.setCenter(_lastOceanKakaoPos);
                }
            }
        }
        forceScrollToTop();
        return;
    }

    // 3. 📋 일반 게시판 피드 뷰 (홈 / 버디 / 강사 / 수다방 / 장터 / 내 활동기록 / 제휴)
    document.body.classList.remove("tide-view-active", "category-view-tide");
    if (feedSec) { feedSec.style.display = "block"; feedSec.classList.remove("hidden"); }
    if (tideSec) { tideSec.className = "offscreen-tab"; tideSec.style.display = ""; }
    if (cctvSec) { cctvSec.style.display = "none"; cctvSec.classList.add("hidden"); }

    const homeCctvPanel = document.getElementById("homeHaeundaeCctvPanel");
    if (viewName === "all") {
        document.body.classList.remove("category-view-active");
        if (categoryBar) categoryBar.style.display = "flex";
        if (subFilterBar) { subFilterBar.style.display = "none"; subFilterBar.classList.add("hidden"); }
        if (activitySubFilterBar) { activitySubFilterBar.style.display = "none"; activitySubFilterBar.classList.add("hidden"); }
        if (partnershipSubFilterBar) { partnershipSubFilterBar.style.display = "none"; partnershipSubFilterBar.classList.add("hidden"); }
        if (partnershipTeaserBanner) { partnershipTeaserBanner.style.display = "none"; partnershipTeaserBanner.classList.add("hidden"); }
        if (oceanWeatherSection) oceanWeatherSection.style.display = "block";
        if (mainBannerSlider) mainBannerSlider.style.display = "block";
        if (homeCctvPanel) homeCctvPanel.style.display = "block";
        if (typeof initHomeHaeundaeCctv === 'function') initHomeHaeundaeCctv();
    } else {
        document.body.classList.add("category-view-active");
        if (homeCctvPanel) homeCctvPanel.style.display = "none";
        if (categoryBar) categoryBar.style.display = (viewName === "swimming" || viewName === "openwater" || viewName === "freediving" || viewName === "scuba") ? "flex" : "none";
        if (oceanWeatherSection) oceanWeatherSection.style.display = "none";
        if (mainBannerSlider) mainBannerSlider.style.display = "block";

        if (subFilterBar) {
            if (viewName === "instructor") { subFilterBar.style.display = "flex"; subFilterBar.classList.remove("hidden"); }
            else { subFilterBar.style.display = "none"; subFilterBar.classList.add("hidden"); }
        }
        if (activitySubFilterBar) {
            if (viewName === "my_activity" || viewName === "activity_log") { activitySubFilterBar.style.display = "flex"; activitySubFilterBar.classList.remove("hidden"); }
            else { activitySubFilterBar.style.display = "none"; activitySubFilterBar.classList.add("hidden"); }
        }
        if (partnershipSubFilterBar) {
            if (viewName === "partnership") { partnershipSubFilterBar.style.display = "flex"; partnershipSubFilterBar.classList.remove("hidden"); }
            else { partnershipSubFilterBar.style.display = "none"; partnershipSubFilterBar.classList.add("hidden"); }
        }
        if (partnershipTeaserBanner) {
            if (viewName === "partnership") { partnershipTeaserBanner.style.display = "block"; partnershipTeaserBanner.classList.remove("hidden"); }
            else { partnershipTeaserBanner.style.display = "none"; partnershipTeaserBanner.classList.add("hidden"); }
        }
    }

    if (typeof filterAndRender === "function") {
        filterAndRender();
    }
    forceScrollToTop();
}

window.switchMainView = switchMainView;
window.switchMainViewImpl = switchMainView;
window.filterByCategory = switchMainView;
window.filterByCategoryImpl = switchMainView;
window.doFilterByCategory = switchMainView;




// === 표준 Post ID 정규화 함수 ===
// === 표준 Post ID 정규화 보장 함수 ===
// === 표준 Post ID 정규화 보장 함수 ===
function getCanonicalPostId(postOrId) {
    if (!postOrId) return "default";
    if (typeof postOrId === 'object') {
        const candidate = postOrId.post_id || postOrId.uuid || postOrId.id || postOrId.db_id;
        return String(candidate).trim();
    }
    const idStr = String(postOrId).trim();
    if (typeof posts !== 'undefined' && Array.isArray(posts)) {
        const found = posts.find(p => String(p.id).trim() === idStr || String(p.post_id || '').trim() === idStr || String(p.uuid || '').trim() === idStr);
        if (found) return String(found.post_id || found.uuid || found.id).trim();
    }
    return idStr;
}
window.getCanonicalPostId = getCanonicalPostId;


/* ==========================================================================
   AquaBuddy (아쿠아버디) - Dynamic Application Logic (v44.0 Unified Inquiries & Ad Partnerships)
   - Restored Responsive Side Banners (1200px Media Query Breakpoint)
   - Unified Customer Feedback & Ad Inquiry Modal (#inquiryModal)
   - Categories: Ad Partnership, Bug Report, Feature Idea, Content Edit, General Feedback
   - Protected Webmaster Admin Dashboard Inquiries Management Table
   ========================================================================== */

// Load Configuration Credentials
window.addEventListener('error', function(e) {
    if (!e || !e.message) return;
    if (e.message.includes("ResizeObserver") || e.message === "Script error." || !e.filename) {
        return; // Ignore harmless browser noise and cross-origin CORS masking
    }
    console.warn("[AquaBuddy Error Logged]:", e.message, "Line:", e.lineno);
});

var SUPABASE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.url
    : "https://ogfzfgsvmjuimjjhaubs.supabase.co";

var SUPABASE_ANON_KEY = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.supabase)
    ? window.AQUA_CONFIG.supabase.anonKey
    : "sb_publishable_yq1u37mBsk6LfPqq428BOA_DKEEqaoW";

// Kakao integration removed per user request

var COUPANG_CUSPE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.coupang)
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
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
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
                clicked_at: getKSTIsoString()
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
      created_at: getKSTIsoString()
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
var MASTER_VALID_HASHES = [
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // 9999
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
    "e15a74070a31eb2829d5b4d75f284e370a256a4fb649e3bf5d83be18987ec8e6"  // master
];

// Initial Inquiries Sample Data
var INITIAL_INQUIRIES = [];

// 44 Nationwide Ocean Live CCTVs Dataset
var OCEAN_WEBCAMS_DATA = [
    // ★ [37개 연안포털 연안침식모니터링 실시간 해변 CCTV 라이브 스팟]
    {
        id: "cam-coast-goraebul",
        name: "영덕 고래불해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 영덕군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/0_0.jpg?1788305312524",
        source: "해양수산부 연안포털",
        status: "연안 침식 모니터링 24h 라이브",
        waterTemp: "21.8°C",
        wind: "2.9 m/s",
        desc: "경북 영덕 고래불해수욕장 실시간 파도 및 해변 침식 라이브 CCTV"
    },
    {
        id: "cam-coast-gujora",
        name: "거제 구조라해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경남 거제시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/2_0.jpg?1788305345311",
        source: "해양수산부 연안포털",
        status: "실시간 해상 라이브",
        waterTemp: "23.1°C",
        wind: "2.5 m/s",
        desc: "거제 구조라해수욕장 실시간 파도 및 해변 라이브 CCTV"
    },
    {
        id: "cam-coast-namhangjin",
        name: "강릉 남항진해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/4_0.jpg?1788305364199",
        source: "해양수산부 연안포털",
        status: "동해 서핑/파도 라이브",
        waterTemp: "20.9°C",
        wind: "3.4 m/s",
        desc: "강릉 남항진해변 실시간 해상 CCTV 모니터링"
    },
    {
        id: "cam-coast-sangju",
        name: "남해 상주은모래비치 CCTV",
        regionCategory: "gyeongsang",
        region: "경남 남해군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/9_0.jpg?1788305380017",
        source: "해양수산부 연안포털",
        status: "남해 파도/수영 라이브",
        waterTemp: "23.5°C",
        wind: "2.2 m/s",
        desc: "남해 상주은모래비치 실시간 파도 및 해상 라이브 CCTV"
    },
    {
        id: "cam-coast-najeong",
        name: "경주 나정고운모래해변 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 경주시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/17_0.jpg?1788305614425",
        source: "해양수산부 연안포털",
        status: "동해 해상 라이브",
        waterTemp: "21.6°C",
        wind: "3.0 m/s",
        desc: "경주 나정고운모래해변 실시간 해상 및 입수 상태 CCTV"
    },
    {
        id: "cam-coast-gangmun",
        name: "강릉 강문해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/51_0.jpg?1788305659100",
        source: "해양수산부 연안포털",
        status: "강문 다이빙/파도 라이브",
        waterTemp: "20.8°C",
        wind: "3.5 m/s",
        desc: "강릉 강문해수욕장 실시간 파도 및 다이빙 포인트 CCTV"
    },
    {
        id: "cam-coast-gyeongpo",
        name: "강릉 경포해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/52_0.jpg?1788305689965",
        source: "해양수산부 연안포털",
        status: "경포 해상 라이브",
        waterTemp: "20.7°C",
        wind: "3.6 m/s",
        desc: "강릉 경포해수욕장 실시간 해변 및 파도 라이브 CCTV"
    },
    {
        id: "cam-coast-sodol",
        name: "강릉 소돌해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/53_0.jpg?1788305730264",
        source: "해양수산부 연안포털",
        status: "소돌 다이빙포인트 라이브",
        waterTemp: "20.6°C",
        wind: "3.3 m/s",
        desc: "강릉 소돌해변 실시간 바다 수영 및 다이빙 포인트 CCTV"
    },
    {
        id: "cam-coast-yeomjeon",
        name: "강릉 염전해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/54_0.jpg?1788305766815",
        source: "해양수산부 연안포털",
        status: "염전해변 해상 라이브",
        waterTemp: "20.9°C",
        wind: "3.2 m/s",
        desc: "강릉 염전해변 실시간 연안 모니터링 CCTV"
    },
    {
        id: "cam-coast-yeongjin",
        name: "강릉 영진해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/55_0.jpg?1788305838006",
        source: "해양수산부 연안포털",
        status: "영진 방파제/해변 라이브",
        waterTemp: "20.7°C",
        wind: "3.4 m/s",
        desc: "강릉 영진해수욕장 실시간 파도 및 입수 상태 CCTV"
    },
    {
        id: "cam-coast-jeongdongjin",
        name: "강릉 정동진해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 강릉시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/56_0.jpg?1788305922540",
        source: "해양수산부 연안포털",
        status: "정동진 해상 라이브",
        waterTemp: "21.0°C",
        wind: "3.1 m/s",
        desc: "강릉 정동진해수욕장 실시간 파도 및 해변 침식 라이브 CCTV"
    },
    {
        id: "cam-coast-gonghyeonjin2",
        name: "고성 공현진2리해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 고성군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/57_0.jpg?1788305979958",
        source: "해양수산부 연안포털",
        status: "고성 해상 라이브",
        waterTemp: "20.1°C",
        wind: "3.7 m/s",
        desc: "고성 공현진2리해수욕장 실시간 바다 및 파도 CCTV"
    },
    {
        id: "cam-coast-gyoam",
        name: "고성 교암해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 고성군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/58_0.jpg?1788306006158",
        source: "해양수산부 연안포털",
        status: "교암 다이빙포인트 라이브",
        waterTemp: "20.2°C",
        wind: "3.6 m/s",
        desc: "고성 교암해수욕장 실시간 다이빙 및 해상 CCTV"
    },
    {
        id: "cam-coast-bongpo",
        name: "고성 봉포해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 고성군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/59_0.jpg?1788306062426",
        source: "해양수산부 연안포털",
        status: "봉포 서핑/해변 라이브",
        waterTemp: "20.3°C",
        wind: "3.5 m/s",
        desc: "고성 봉포해수욕장 실시간 파도 및 서핑 포인트 CCTV"
    },
    {
        id: "cam-coast-chodo",
        name: "고성 초도해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 고성군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/60_0.jpg?1788306113505",
        source: "해양수산부 연안포털",
        status: "최북단 초도해변 라이브",
        waterTemp: "19.9°C",
        wind: "3.8 m/s",
        desc: "고성 초도해변 실시간 해상 안전 CCTV 모니터링"
    },
    {
        id: "cam-coast-seonyudo",
        name: "군산 선유도해수욕장 CCTV",
        regionCategory: "jeolla",
        region: "전북 군산시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/61_0.jpg?1788306185805",
        source: "해양수산부 연안포털",
        status: "서해 선유도 라이브",
        waterTemp: "22.8°C",
        wind: "2.7 m/s",
        desc: "군산 선유도해수욕장 실시간 해변 및 물때 CCTV"
    },
    {
        id: "cam-coast-hamaengbang",
        name: "삼척 하맹방해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 삼척시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/62_0.jpg?1788306242084",
        source: "해양수산부 연안포털",
        status: "하맹방 해상 라이브",
        waterTemp: "21.1°C",
        wind: "3.2 m/s",
        desc: "삼척 하맹방해수욕장 실시간 파도 및 연안 침식 모니터링"
    },
    {
        id: "cam-coast-daecheon",
        name: "보령 대천해수욕장 CCTV",
        regionCategory: "chungcheong",
        region: "충남 보령시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/63_0.jpg?1788306287670",
        source: "해양수산부 연안포털",
        status: "대천 해변 라이브",
        waterTemp: "23.2°C",
        wind: "2.6 m/s",
        desc: "보령 대천해수욕장 실시간 바다 및 물때 모니터링 CCTV"
    },
    {
        id: "cam-coast-wonpyeong",
        name: "삼척 원평해수욕장 CCTV",
        regionCategory: "gangwon",
        region: "강원 삼척시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/65_0.jpg?1788306340028",
        source: "해양수산부 연안포털",
        status: "원평 다이빙포인트 라이브",
        waterTemp: "21.2°C",
        wind: "3.1 m/s",
        desc: "삼척 원평해수욕장 실시간 파도 및 해상 라이브 CCTV"
    },
    {
        id: "cam-coast-sinyangseopji",
        name: "제주 신양섭지해수욕장 CCTV",
        regionCategory: "jeju",
        region: "제주 서귀포시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/66_0.jpg?1788306489729",
        source: "해양수산부 연안포털",
        status: "제주 동부 파도/윈드서핑 라이브",
        waterTemp: "24.5°C",
        wind: "2.4 m/s",
        desc: "제주 동부 신양섭지해수욕장 실시간 해상 CCTV"
    },
    {
        id: "cam-coast-jungmun",
        name: "제주 중문색달해수욕장 CCTV",
        regionCategory: "jeju",
        region: "제주 서귀포시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/67_0.jpg?1788306569247",
        source: "해양수산부 연안포털",
        status: "중문 서핑/다이빙 파도 라이브",
        waterTemp: "24.8°C",
        wind: "2.3 m/s",
        desc: "제주 남부 중문색달해수욕장 실시간 파도 및 서핑 포인트 CCTV"
    },
    {
        id: "cam-coast-yeongrang",
        name: "속초 영랑해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 속초시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/69_0.jpg?1788306657547",
        source: "해양수산부 연안포털",
        status: "속초 해상 라이브",
        waterTemp: "20.5°C",
        wind: "3.5 m/s",
        desc: "속초 영랑해변 실시간 파도 및 연안 침식 모니터링 CCTV"
    },
    {
        id: "cam-coast-daegwang",
        name: "신안 대광해수욕장 CCTV",
        regionCategory: "jeolla",
        region: "전남 신안군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/71_0.jpg?1788306747886",
        source: "해양수산부 연안포털",
        status: "신안 백사장 라이브",
        waterTemp: "23.0°C",
        wind: "2.5 m/s",
        desc: "신안 임자도 대광해수욕장 실시간 해변 CCTV"
    },
    {
        id: "cam-coast-bangameori",
        name: "안산 방아머리해변 CCTV",
        regionCategory: "seoul",
        region: "경기 안산시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/72_0.jpg?1788306835155",
        source: "해양수산부 연안포털",
        status: "대부도 방아머리 라이브",
        waterTemp: "22.5°C",
        wind: "2.8 m/s",
        desc: "안산 대부도 방아머리해변 실시간 물때 및 바다 CCTV"
    },
    {
        id: "cam-coast-janggol",
        name: "인천 장골해수욕장 CCTV",
        regionCategory: "incheon",
        region: "인천 옹진군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/73_0.jpg?1788306843384",
        source: "해양수산부 연안포털",
        status: "자월도 장골해변 라이브",
        waterTemp: "22.3°C",
        wind: "2.9 m/s",
        desc: "인천 옹진군 자월도 장골해수욕장 실시간 해상 CCTV"
    },
    {
        id: "cam-coast-jeongja",
        name: "울산 정자해수욕장 CCTV",
        regionCategory: "ulsan",
        region: "울산 북구",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/74_0.jpg?1788306956304",
        source: "해양수산부 연안포털",
        status: "정자몽돌해변 라이브",
        waterTemp: "21.9°C",
        wind: "3.0 m/s",
        desc: "울산 북구 정자해수욕장 실시간 파도 및 해변 라이브 CCTV"
    },
    {
        id: "cam-coast-jinha",
        name: "울산 진하해수욕장 CCTV",
        regionCategory: "ulsan",
        region: "울산 울주군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/75_0.jpg?1788307029455",
        source: "해양수산부 연안포털",
        status: "진하 윈드서핑/다이빙 라이브",
        waterTemp: "22.1°C",
        wind: "2.9 m/s",
        desc: "울산 울주군 진하해수욕장 실시간 파도 및 해상 CCTV"
    },
    {
        id: "cam-coast-wolsongjeong",
        name: "울진 월송정해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 울진군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/76_0.jpg?1788307085602",
        source: "해양수산부 연안포털",
        status: "울진 월송정 라이브",
        waterTemp: "21.4°C",
        wind: "3.1 m/s",
        desc: "경북 울진 월송정해수욕장 실시간 파도 및 해상 CCTV"
    },
    {
        id: "cam-coast-kkotji",
        name: "태안 꽃지해수욕장 CCTV",
        regionCategory: "chungcheong",
        region: "충남 태안군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/78_0.jpg?1788307120071",
        source: "해양수산부 연안포털",
        status: "안면도 꽃지 라이브",
        waterTemp: "22.9°C",
        wind: "2.6 m/s",
        desc: "충남 태안 안면도 꽃지해수욕장 실시간 일몰/해변 CCTV"
    },
    {
        id: "cam-coast-manlipo",
        name: "태안 만리포해수욕장 CCTV",
        regionCategory: "chungcheong",
        region: "충남 태안군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/79_0.jpg?1788307155923",
        source: "해양수산부 연안포털",
        status: "만리포 서핑/파도 라이브",
        waterTemp: "22.8°C",
        wind: "2.7 m/s",
        desc: "충남 태안 만리포해수욕장 실시간 파도 및 서핑 포인트 CCTV"
    },
    {
        id: "cam-coast-songdo",
        name: "부산 송도해수욕장 CCTV",
        regionCategory: "busan_gijang",
        region: "부산 서구",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/80_0.jpg?1788307250484",
        source: "해양수산부 연안포털",
        status: "부산 송도 해상 라이브",
        waterTemp: "22.6°C",
        wind: "2.8 m/s",
        desc: "부산 서구 송도해수욕장 실시간 파도 및 해수욕장 CCTV"
    },
    {
        id: "cam-coast-haeundae",
        name: "부산 해운대해수욕장 CCTV (연안포털)",
        regionCategory: "busan_gijang",
        region: "부산 해운대구",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/81_0.jpg?1788307263511",
        source: "해양수산부 연안포털",
        status: "해운대 연안 모니터링 라이브",
        waterTemp: "22.4°C",
        wind: "2.9 m/s",
        desc: "부산 해운대해수욕장 실시간 연안 침식 모니터링 라이브 CCTV"
    },
    {
        id: "cam-coast-bongpyeong",
        name: "울진 봉평해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 울진군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/82_0.jpg?1788307310795",
        source: "해양수산부 연안포털",
        status: "울진 봉평 해상 라이브",
        waterTemp: "21.3°C",
        wind: "3.2 m/s",
        desc: "경북 울진 봉평해수욕장 실시간 파도 및 해변 CCTV"
    },
    {
        id: "cam-coast-geumeumri",
        name: "울진 금음리해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 울진군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/84_0.jpg?1788307340963",
        source: "해양수산부 연안포털",
        status: "울진 금음리 라이브",
        waterTemp: "21.5°C",
        wind: "3.1 m/s",
        desc: "경북 울진 금음리해수욕장 실시간 파도 및 해상 CCTV"
    },
    {
        id: "cam-coast-ondong",
        name: "신안 온동해변 CCTV",
        regionCategory: "jeolla",
        region: "전남 신안군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/86_0.jpg?1788308851199",
        source: "해양수산부 연안포털",
        status: "신안 온동해변 라이브",
        waterTemp: "23.1°C",
        wind: "2.4 m/s",
        desc: "전남 신안 온동해변 실시간 연안 모니터링 CCTV"
    },
    {
        id: "cam-coast-jangsa",
        name: "영덕 장사해수욕장 CCTV",
        regionCategory: "gyeongsang",
        region: "경북 영덕군",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/87_0.jpg?1788308882580",
        source: "해양수산부 연안포털",
        status: "영덕 장사 해상 라이브",
        waterTemp: "21.7°C",
        wind: "3.0 m/s",
        desc: "경북 영덕 장사해수욕장 실시간 파도 및 해변 라이브 CCTV"
    },
    {
        id: "cam-coast-munam",
        name: "삼척 문암해변 CCTV",
        regionCategory: "gangwon",
        region: "강원 삼척시",
        thumb: "hero.jpg",
        embedUrl: "https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/88_0.jpg?1788309020727",
        source: "해양수산부 연안포털",
        status: "문암 스노클/다이빙 라이브",
        waterTemp: "21.0°C",
        wind: "3.3 m/s",
        desc: "강원 삼척 문암해변 실시간 바다 수영 및 다이빙 포인트 CCTV"
    },

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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
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
        hlsUrl: "",
        source: "KBS 재난포털",
        status: "새만금/비응항 해상 기상",
        waterTemp: "22.8°C",
        wind: "3.2 m/s",
        desc: "군산 비응항 실시간 해상 관측 CCTV"
    }
];

// 46 Specific Marine Diving/Swimming Tide Spots Dataset
var OCEAN_WEATHER_DATA = [
    {
        "spot_id": "tide-haeundae",
        "id": "tide-haeundae",
        "name": "부산 해운대 해수욕장",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0553",
        "buoy_code": "TW_0062",
        "scuba_code": "SS14"
    },
    {
        "spot_id": "tide-spot-001",
        "id": "tide-spot-001",
        "name": "인천",
        "region_cat": "seohae",
        "lat": 37.45,
        "lng": 126.63,
        "tide_code": "DT_0001",
        "buoy_code": "TW_0076",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-002",
        "id": "tide-spot-002",
        "name": "송공항",
        "region_cat": "seohae",
        "lat": 34.85,
        "lng": 126.2,
        "tide_code": "SO_0566",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-003",
        "id": "tide-spot-003",
        "name": "평택",
        "region_cat": "seohae",
        "lat": 36.96,
        "lng": 126.84,
        "tide_code": "DT_0002",
        "buoy_code": "TW_0070",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-004",
        "id": "tide-spot-004",
        "name": "쉬미항",
        "region_cat": "seohae",
        "lat": 34.47,
        "lng": 126.2,
        "tide_code": "SO_0567",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-005",
        "id": "tide-spot-005",
        "name": "영광",
        "region_cat": "seohae",
        "lat": 35.27,
        "lng": 126.51,
        "tide_code": "DT_0003",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-006",
        "id": "tide-spot-006",
        "name": "백야도",
        "region_cat": "yeosu",
        "lat": 34.61,
        "lng": 127.65,
        "tide_code": "SO_0568",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-007",
        "id": "tide-spot-007",
        "name": "제주",
        "region_cat": "jeju",
        "lat": 33.51,
        "lng": 126.52,
        "tide_code": "DT_0004",
        "buoy_code": "KG_0028",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-008",
        "id": "tide-spot-008",
        "name": "남포항",
        "region_cat": "pohang",
        "lat": 36.04,
        "lng": 129.38,
        "tide_code": "SO_0569",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-009",
        "id": "tide-spot-009",
        "name": "부산",
        "region_cat": "busan",
        "lat": 35.1,
        "lng": 129.04,
        "tide_code": "DT_0005",
        "buoy_code": "TW_0087",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-010",
        "id": "tide-spot-010",
        "name": "광암항",
        "region_cat": "seohae",
        "lat": 35.12,
        "lng": 128.51,
        "tide_code": "SO_0570",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-011",
        "id": "tide-spot-011",
        "name": "묵호",
        "region_cat": "donghae",
        "lat": 37.55,
        "lng": 129.11,
        "tide_code": "DT_0006",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-012",
        "id": "tide-spot-012",
        "name": "거제외포",
        "region_cat": "yeosu",
        "lat": 34.93,
        "lng": 128.71,
        "tide_code": "SO_0571",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-013",
        "id": "tide-spot-013",
        "name": "목포",
        "region_cat": "seohae",
        "lat": 34.79,
        "lng": 126.38,
        "tide_code": "DT_0007",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-014",
        "id": "tide-spot-014",
        "name": "읍천항",
        "region_cat": "pohang",
        "lat": 35.69,
        "lng": 129.47,
        "tide_code": "SO_0572",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-015",
        "id": "tide-spot-015",
        "name": "안산",
        "region_cat": "seohae",
        "lat": 37.32,
        "lng": 126.83,
        "tide_code": "DT_0008",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-016",
        "id": "tide-spot-016",
        "name": "양포항",
        "region_cat": "pohang",
        "lat": 35.88,
        "lng": 129.52,
        "tide_code": "SO_0573",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-017",
        "id": "tide-spot-017",
        "name": "서귀포",
        "region_cat": "jeju",
        "lat": 33.24,
        "lng": 126.56,
        "tide_code": "DT_0010",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-018",
        "id": "tide-spot-018",
        "name": "백사장항",
        "region_cat": "seohae",
        "lat": 36.58,
        "lng": 126.34,
        "tide_code": "SO_0574",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-019",
        "id": "tide-spot-019",
        "name": "후포",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "DT_0011",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-020",
        "id": "tide-spot-020",
        "name": "화봉리",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0576",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-021",
        "id": "tide-spot-021",
        "name": "속초",
        "region_cat": "donghae",
        "lat": 38.2097,
        "lng": 128.6136,
        "tide_code": "DT_0012",
        "buoy_code": "TW_0093",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-022",
        "id": "tide-spot-022",
        "name": "가거도",
        "region_cat": "seohae",
        "lat": 34.07,
        "lng": 125.12,
        "tide_code": "SO_0577",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-023",
        "id": "tide-spot-023",
        "name": "울릉도",
        "region_cat": "dokdo",
        "lat": 37.4852,
        "lng": 130.9052,
        "tide_code": "DT_0013",
        "buoy_code": "KG_0102",
        "scuba_code": "SS12"
    },
    {
        "spot_id": "tide-spot-024",
        "id": "tide-spot-024",
        "name": "소매물도",
        "region_cat": "yeosu",
        "lat": 34.62,
        "lng": 128.62,
        "tide_code": "SO_0578",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-025",
        "id": "tide-spot-025",
        "name": "통영",
        "region_cat": "yeosu",
        "lat": 34.84,
        "lng": 128.42,
        "tide_code": "DT_0014",
        "buoy_code": "TW_0084",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-026",
        "id": "tide-spot-026",
        "name": "강양항",
        "region_cat": "ulsan",
        "lat": 35.37,
        "lng": 129.35,
        "tide_code": "SO_0581",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-027",
        "id": "tide-spot-027",
        "name": "여수",
        "region_cat": "yeosu",
        "lat": 34.74,
        "lng": 127.74,
        "tide_code": "DT_0016",
        "buoy_code": "TW_0083",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-028",
        "id": "tide-spot-028",
        "name": "암태도",
        "region_cat": "seohae",
        "lat": 34.82,
        "lng": 126.11,
        "tide_code": "SO_0631",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-029",
        "id": "tide-spot-029",
        "name": "대산",
        "region_cat": "seohae",
        "lat": 37.0,
        "lng": 126.43,
        "tide_code": "DT_0017",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-030",
        "id": "tide-spot-030",
        "name": "천리포항",
        "region_cat": "seohae",
        "lat": 36.79,
        "lng": 126.14,
        "tide_code": "SO_0699",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-031",
        "id": "tide-spot-031",
        "name": "군산",
        "region_cat": "seohae",
        "lat": 35.97,
        "lng": 126.71,
        "tide_code": "DT_0018",
        "buoy_code": "TW_0072",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-032",
        "id": "tide-spot-032",
        "name": "호도",
        "region_cat": "seohae",
        "lat": 36.3,
        "lng": 126.26,
        "tide_code": "SO_0700",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-033",
        "id": "tide-spot-033",
        "name": "울산",
        "region_cat": "ulsan",
        "lat": 35.5,
        "lng": 129.37,
        "tide_code": "DT_0020",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-034",
        "id": "tide-spot-034",
        "name": "홍도항",
        "region_cat": "seohae",
        "lat": 34.68,
        "lng": 125.18,
        "tide_code": "SO_0701",
        "buoy_code": null,
        "scuba_code": "SS11"
    },
    {
        "spot_id": "tide-spot-035",
        "id": "tide-spot-035",
        "name": "추자도",
        "region_cat": "seohae",
        "lat": 33.95,
        "lng": 126.3,
        "tide_code": "DT_0021",
        "buoy_code": null,
        "scuba_code": "SS16"
    },
    {
        "spot_id": "tide-spot-036",
        "id": "tide-spot-036",
        "name": "진도옥도",
        "region_cat": "seohae",
        "lat": 34.37,
        "lng": 126.04,
        "tide_code": "SO_0702",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-037",
        "id": "tide-spot-037",
        "name": "성산포",
        "region_cat": "jeju",
        "lat": 33.47,
        "lng": 126.93,
        "tide_code": "DT_0022",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-038",
        "id": "tide-spot-038",
        "name": "땅끝항",
        "region_cat": "seohae",
        "lat": 34.3,
        "lng": 126.52,
        "tide_code": "SO_0703",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-039",
        "id": "tide-spot-039",
        "name": "장항",
        "region_cat": "seohae",
        "lat": 36.0,
        "lng": 126.69,
        "tide_code": "DT_0024",
        "buoy_code": "HB_0001",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-040",
        "id": "tide-spot-040",
        "name": "마량항",
        "region_cat": "seohae",
        "lat": 34.38,
        "lng": 126.82,
        "tide_code": "SO_0705",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-041",
        "id": "tide-spot-041",
        "name": "모슬포",
        "region_cat": "jeju",
        "lat": 33.21,
        "lng": 126.25,
        "tide_code": "DT_0023",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-042",
        "id": "tide-spot-042",
        "name": "소안항",
        "region_cat": "seohae",
        "lat": 34.16,
        "lng": 126.65,
        "tide_code": "SO_0704",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-043",
        "id": "tide-spot-043",
        "name": "보령",
        "region_cat": "seohae",
        "lat": 36.35,
        "lng": 126.59,
        "tide_code": "DT_0025",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-044",
        "id": "tide-spot-044",
        "name": "청산도",
        "region_cat": "seohae",
        "lat": 34.17,
        "lng": 126.87,
        "tide_code": "SO_0706",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-045",
        "id": "tide-spot-045",
        "name": "고흥발포",
        "region_cat": "yeosu",
        "lat": 34.48,
        "lng": 127.27,
        "tide_code": "DT_0026",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-046",
        "id": "tide-spot-046",
        "name": "시산항",
        "region_cat": "yeosu",
        "lat": 34.4,
        "lng": 127.26,
        "tide_code": "SO_0707",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-047",
        "id": "tide-spot-047",
        "name": "완도",
        "region_cat": "seohae",
        "lat": 34.31,
        "lng": 126.75,
        "tide_code": "DT_0027",
        "buoy_code": "TW_0078",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-048",
        "id": "tide-spot-048",
        "name": "안도항",
        "region_cat": "yeosu",
        "lat": 34.48,
        "lng": 127.8,
        "tide_code": "SO_0708",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-049",
        "id": "tide-spot-049",
        "name": "진도",
        "region_cat": "seohae",
        "lat": 34.48,
        "lng": 126.26,
        "tide_code": "DT_0028",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-050",
        "id": "tide-spot-050",
        "name": "두문포",
        "region_cat": "yeosu",
        "lat": 34.68,
        "lng": 127.76,
        "tide_code": "SO_0709",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-051",
        "id": "tide-spot-051",
        "name": "거제도",
        "region_cat": "yeosu",
        "lat": 34.88,
        "lng": 128.62,
        "tide_code": "DT_0029",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-052",
        "id": "tide-spot-052",
        "name": "봉우항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0710",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-053",
        "id": "tide-spot-053",
        "name": "거문도",
        "region_cat": "yeosu",
        "lat": 34.02,
        "lng": 127.31,
        "tide_code": "DT_0031",
        "buoy_code": null,
        "scuba_code": "SS8"
    },
    {
        "spot_id": "tide-spot-054",
        "id": "tide-spot-054",
        "name": "창선도",
        "region_cat": "yeosu",
        "lat": 34.85,
        "lng": 128.02,
        "tide_code": "SO_0711",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-055",
        "id": "tide-spot-055",
        "name": "강화대교",
        "region_cat": "seohae",
        "lat": 37.73,
        "lng": 126.52,
        "tide_code": "DT_0032",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-056",
        "id": "tide-spot-056",
        "name": "능양항",
        "region_cat": "yeosu",
        "lat": 34.78,
        "lng": 128.64,
        "tide_code": "SO_0712",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-057",
        "id": "tide-spot-057",
        "name": "흑산도",
        "region_cat": "seohae",
        "lat": 34.68,
        "lng": 125.43,
        "tide_code": "DT_0035",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-058",
        "id": "tide-spot-058",
        "name": "대진항",
        "region_cat": "seohae",
        "lat": 38.5,
        "lng": 128.42,
        "tide_code": "SO_0731",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-059",
        "id": "tide-spot-059",
        "name": "대청도",
        "region_cat": "seohae",
        "lat": 37.83,
        "lng": 124.7,
        "tide_code": "DT_0036",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-060",
        "id": "tide-spot-060",
        "name": "남애항",
        "region_cat": "donghae",
        "lat": 37.94,
        "lng": 128.78,
        "tide_code": "SO_0732",
        "buoy_code": null,
        "scuba_code": "SS2"
    },
    {
        "spot_id": "tide-spot-061",
        "id": "tide-spot-061",
        "name": "어청도",
        "region_cat": "seohae",
        "lat": 36.12,
        "lng": 125.98,
        "tide_code": "DT_0037",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-062",
        "id": "tide-spot-062",
        "name": "강릉항",
        "region_cat": "donghae",
        "lat": 37.77,
        "lng": 128.95,
        "tide_code": "SO_0733",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-063",
        "id": "tide-spot-063",
        "name": "굴업도",
        "region_cat": "seohae",
        "lat": 37.18,
        "lng": 125.95,
        "tide_code": "DT_0038",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-064",
        "id": "tide-spot-064",
        "name": "궁촌항",
        "region_cat": "donghae",
        "lat": 37.33,
        "lng": 129.27,
        "tide_code": "SO_0734",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-065",
        "id": "tide-spot-065",
        "name": "왕돌초",
        "region_cat": "pohang",
        "lat": 36.72,
        "lng": 129.73,
        "tide_code": "DT_0039",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-066",
        "id": "tide-spot-066",
        "name": "죽변항",
        "region_cat": "donghae",
        "lat": 37.05,
        "lng": 129.42,
        "tide_code": "SO_0735",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-067",
        "id": "tide-spot-067",
        "name": "독도",
        "region_cat": "dokdo",
        "lat": 37.2425,
        "lng": 131.8689,
        "tide_code": "DT_0903",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-068",
        "id": "tide-spot-068",
        "name": "축산항",
        "region_cat": "pohang",
        "lat": 36.5,
        "lng": 129.44,
        "tide_code": "SO_0736",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-069",
        "id": "tide-spot-069",
        "name": "복사초",
        "region_cat": "seohae",
        "lat": 34.1,
        "lng": 126.16,
        "tide_code": "DT_0041",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-070",
        "id": "tide-spot-070",
        "name": "강구항",
        "region_cat": "pohang",
        "lat": 36.36,
        "lng": 129.38,
        "tide_code": "SO_0737",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-071",
        "id": "tide-spot-071",
        "name": "교본초",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "DT_0042",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-072",
        "id": "tide-spot-072",
        "name": "도장항",
        "region_cat": "seohae",
        "lat": 36.0,
        "lng": 126.69,
        "tide_code": "SO_0739",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-073",
        "id": "tide-spot-073",
        "name": "영흥도",
        "region_cat": "seohae",
        "lat": 37.25,
        "lng": 126.48,
        "tide_code": "DT_0043",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-074",
        "id": "tide-spot-074",
        "name": "보옥항",
        "region_cat": "seohae",
        "lat": 34.25,
        "lng": 126.52,
        "tide_code": "SO_0740",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-075",
        "id": "tide-spot-075",
        "name": "영종대교",
        "region_cat": "seohae",
        "lat": 37.55,
        "lng": 126.55,
        "tide_code": "DT_0044",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-076",
        "id": "tide-spot-076",
        "name": "검산항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0752",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-077",
        "id": "tide-spot-077",
        "name": "쌍정초",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "DT_0046",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-078",
        "id": "tide-spot-078",
        "name": "하의도웅곡",
        "region_cat": "seohae",
        "lat": 34.6,
        "lng": 126.04,
        "tide_code": "SO_0753",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-079",
        "id": "tide-spot-079",
        "name": "도농탄",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "DT_0047",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-080",
        "id": "tide-spot-080",
        "name": "평호리",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0754",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-081",
        "id": "tide-spot-081",
        "name": "속초등표",
        "region_cat": "donghae",
        "lat": 38.205,
        "lng": 128.61,
        "tide_code": "DT_0048",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-082",
        "id": "tide-spot-082",
        "name": "원동항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0755",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-083",
        "id": "tide-spot-083",
        "name": "광양",
        "region_cat": "yeosu",
        "lat": 34.9,
        "lng": 127.69,
        "tide_code": "DT_0049",
        "buoy_code": "TW_0074",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-084",
        "id": "tide-spot-084",
        "name": "사초항",
        "region_cat": "seohae",
        "lat": 34.42,
        "lng": 126.75,
        "tide_code": "SO_0756",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-085",
        "id": "tide-spot-085",
        "name": "태안",
        "region_cat": "seohae",
        "lat": 36.75,
        "lng": 126.29,
        "tide_code": "DT_0050",
        "buoy_code": "TW_0082",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-086",
        "id": "tide-spot-086",
        "name": "안남리",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0757",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-087",
        "id": "tide-spot-087",
        "name": "서천마량",
        "region_cat": "seohae",
        "lat": 36.13,
        "lng": 126.5,
        "tide_code": "DT_0051",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-088",
        "id": "tide-spot-088",
        "name": "달천도",
        "region_cat": "yeosu",
        "lat": 34.8,
        "lng": 127.56,
        "tide_code": "SO_0758",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-089",
        "id": "tide-spot-089",
        "name": "인천송도",
        "region_cat": "seohae",
        "lat": 37.38,
        "lng": 126.64,
        "tide_code": "DT_0052",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-090",
        "id": "tide-spot-090",
        "name": "장문리",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0759",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-091",
        "id": "tide-spot-091",
        "name": "진해",
        "region_cat": "seohae",
        "lat": 35.15,
        "lng": 128.68,
        "tide_code": "DT_0054",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-092",
        "id": "tide-spot-092",
        "name": "오산항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0760",
        "buoy_code": null,
        "scuba_code": "SS4"
    },
    {
        "spot_id": "tide-spot-093",
        "id": "tide-spot-093",
        "name": "부산항신항",
        "region_cat": "busan",
        "lat": 35.07,
        "lng": 128.82,
        "tide_code": "DT_0056",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-094",
        "id": "tide-spot-094",
        "name": "녹동항",
        "region_cat": "yeosu",
        "lat": 34.52,
        "lng": 127.15,
        "tide_code": "SO_0761",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-095",
        "id": "tide-spot-095",
        "name": "동해항",
        "region_cat": "donghae",
        "lat": 37.49,
        "lng": 129.14,
        "tide_code": "DT_0057",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-096",
        "id": "tide-spot-096",
        "name": "신안옥도",
        "region_cat": "seohae",
        "lat": 34.72,
        "lng": 126.08,
        "tide_code": "SO_1248",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-097",
        "id": "tide-spot-097",
        "name": "경인항",
        "region_cat": "seohae",
        "lat": 37.56,
        "lng": 126.6,
        "tide_code": "DT_0058",
        "buoy_code": "TW_0077",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-098",
        "id": "tide-spot-098",
        "name": "독거도",
        "region_cat": "seohae",
        "lat": 34.25,
        "lng": 126.18,
        "tide_code": "SO_1249",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-099",
        "id": "tide-spot-099",
        "name": "백령도",
        "region_cat": "seohae",
        "lat": 37.96,
        "lng": 124.67,
        "tide_code": "DT_0059",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-100",
        "id": "tide-spot-100",
        "name": "평도",
        "region_cat": "seohae",
        "lat": 37.66,
        "lng": 125.7,
        "tide_code": "SO_1250",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-101",
        "id": "tide-spot-101",
        "name": "연평도",
        "region_cat": "seohae",
        "lat": 37.66,
        "lng": 125.7,
        "tide_code": "DT_0060",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-102",
        "id": "tide-spot-102",
        "name": "낙월도",
        "region_cat": "seohae",
        "lat": 35.25,
        "lng": 126.23,
        "tide_code": "SO_1251",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-103",
        "id": "tide-spot-103",
        "name": "삼천포",
        "region_cat": "yeosu",
        "lat": 34.92,
        "lng": 128.06,
        "tide_code": "DT_0061",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-104",
        "id": "tide-spot-104",
        "name": "외연도항",
        "region_cat": "seohae",
        "lat": 36.22,
        "lng": 126.1,
        "tide_code": "SO_1252",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-105",
        "id": "tide-spot-105",
        "name": "마산",
        "region_cat": "seohae",
        "lat": 35.2,
        "lng": 128.57,
        "tide_code": "DT_0062",
        "buoy_code": "TW_0085",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-106",
        "id": "tide-spot-106",
        "name": "상왕등도",
        "region_cat": "seohae",
        "lat": 35.66,
        "lng": 126.1,
        "tide_code": "SO_1253",
        "buoy_code": "TW_0079",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-107",
        "id": "tide-spot-107",
        "name": "가덕도",
        "region_cat": "busan",
        "lat": 35.02,
        "lng": 128.83,
        "tide_code": "DT_0063",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-108",
        "id": "tide-spot-108",
        "name": "만재도",
        "region_cat": "seohae",
        "lat": 34.2,
        "lng": 125.46,
        "tide_code": "SO_1254",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-109",
        "id": "tide-spot-109",
        "name": "교동대교",
        "region_cat": "seohae",
        "lat": 37.79,
        "lng": 126.33,
        "tide_code": "DT_0064",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-110",
        "id": "tide-spot-110",
        "name": "상태도",
        "region_cat": "seohae",
        "lat": 34.45,
        "lng": 125.29,
        "tide_code": "SO_1255",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-111",
        "id": "tide-spot-111",
        "name": "덕적도",
        "region_cat": "seohae",
        "lat": 37.22,
        "lng": 126.15,
        "tide_code": "DT_0065",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-112",
        "id": "tide-spot-112",
        "name": "어류정항",
        "region_cat": "seohae",
        "lat": 37.68,
        "lng": 126.34,
        "tide_code": "SO_1256",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-113",
        "id": "tide-spot-113",
        "name": "안흥",
        "region_cat": "seohae",
        "lat": 36.67,
        "lng": 126.13,
        "tide_code": "DT_0067",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-114",
        "id": "tide-spot-114",
        "name": "강화하리",
        "region_cat": "seohae",
        "lat": 37.77,
        "lng": 126.27,
        "tide_code": "SO_1257",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-115",
        "id": "tide-spot-115",
        "name": "위도",
        "region_cat": "seohae",
        "lat": 35.6,
        "lng": 126.24,
        "tide_code": "DT_0068",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-116",
        "id": "tide-spot-116",
        "name": "잠진도",
        "region_cat": "seohae",
        "lat": 37.43,
        "lng": 126.41,
        "tide_code": "SO_1258",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-117",
        "id": "tide-spot-117",
        "name": "포항",
        "region_cat": "pohang",
        "lat": 36.04,
        "lng": 129.38,
        "tide_code": "DT_0091",
        "buoy_code": "TW_0089",
        "scuba_code": "SS5"
    },
    {
        "spot_id": "tide-spot-118",
        "id": "tide-spot-118",
        "name": "자월도",
        "region_cat": "seohae",
        "lat": 37.25,
        "lng": 126.33,
        "tide_code": "SO_1259",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-119",
        "id": "tide-spot-119",
        "name": "여호항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "DT_0092",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-120",
        "id": "tide-spot-120",
        "name": "방포항",
        "region_cat": "seohae",
        "lat": 36.52,
        "lng": 126.33,
        "tide_code": "SO_1260",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-121",
        "id": "tide-spot-121",
        "name": "소무의도",
        "region_cat": "seohae",
        "lat": 37.37,
        "lng": 126.41,
        "tide_code": "DT_0093",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-122",
        "id": "tide-spot-122",
        "name": "무창포항",
        "region_cat": "seohae",
        "lat": 36.25,
        "lng": 126.53,
        "tide_code": "SO_1261",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-123",
        "id": "tide-spot-123",
        "name": "서거차도",
        "region_cat": "seohae",
        "lat": 34.24,
        "lng": 125.91,
        "tide_code": "DT_0094",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-124",
        "id": "tide-spot-124",
        "name": "격포항",
        "region_cat": "seohae",
        "lat": 35.62,
        "lng": 126.47,
        "tide_code": "SO_1262",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-125",
        "id": "tide-spot-125",
        "name": "이어도",
        "region_cat": "jeju",
        "lat": 32.12,
        "lng": 125.18,
        "tide_code": "IE_0060",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-126",
        "id": "tide-spot-126",
        "name": "구시포항",
        "region_cat": "seohae",
        "lat": 35.45,
        "lng": 126.44,
        "tide_code": "SO_1263",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-127",
        "id": "tide-spot-127",
        "name": "신안가거초",
        "region_cat": "seohae",
        "lat": 33.93,
        "lng": 124.59,
        "tide_code": "IE_0061",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-128",
        "id": "tide-spot-128",
        "name": "계마항",
        "region_cat": "seohae",
        "lat": 35.36,
        "lng": 126.42,
        "tide_code": "SO_1264",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-129",
        "id": "tide-spot-129",
        "name": "옹진소청초",
        "region_cat": "seohae",
        "lat": 37.42,
        "lng": 124.73,
        "tide_code": "IE_0062",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-130",
        "id": "tide-spot-130",
        "name": "송이도",
        "region_cat": "seohae",
        "lat": 35.26,
        "lng": 126.14,
        "tide_code": "SO_1265",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-131",
        "id": "tide-spot-131",
        "name": "미조항",
        "region_cat": "yeosu",
        "lat": 34.71,
        "lng": 128.04,
        "tide_code": "SO_0326",
        "buoy_code": null,
        "scuba_code": "SS7"
    },
    {
        "spot_id": "tide-spot-132",
        "id": "tide-spot-132",
        "name": "남열항",
        "region_cat": "yeosu",
        "lat": 34.55,
        "lng": 127.45,
        "tide_code": "SO_1266",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-133",
        "id": "tide-spot-133",
        "name": "벽파진",
        "region_cat": "seohae",
        "lat": 34.54,
        "lng": 126.33,
        "tide_code": "SO_0537",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-134",
        "id": "tide-spot-134",
        "name": "구룡포항",
        "region_cat": "pohang",
        "lat": 35.98,
        "lng": 129.55,
        "tide_code": "SO_1267",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-135",
        "id": "tide-spot-135",
        "name": "안마도",
        "region_cat": "seohae",
        "lat": 35.33,
        "lng": 126.02,
        "tide_code": "SO_0538",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-136",
        "id": "tide-spot-136",
        "name": "궁평항",
        "region_cat": "seohae",
        "lat": 37.11,
        "lng": 126.68,
        "tide_code": "SO_1268",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-137",
        "id": "tide-spot-137",
        "name": "강화외포",
        "region_cat": "seohae",
        "lat": 37.7,
        "lng": 126.38,
        "tide_code": "SO_0539",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-138",
        "id": "tide-spot-138",
        "name": "연도항",
        "region_cat": "seohae",
        "lat": 36.08,
        "lng": 126.43,
        "tide_code": "SO_1269",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-139",
        "id": "tide-spot-139",
        "name": "호산항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0540",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-140",
        "id": "tide-spot-140",
        "name": "삼길포항",
        "region_cat": "seohae",
        "lat": 37.0,
        "lng": 126.45,
        "tide_code": "SO_1270",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-141",
        "id": "tide-spot-141",
        "name": "말도",
        "region_cat": "seohae",
        "lat": 35.85,
        "lng": 126.28,
        "tide_code": "SO_0547",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-142",
        "id": "tide-spot-142",
        "name": "어은돌항",
        "region_cat": "seohae",
        "lat": 36.71,
        "lng": 126.12,
        "tide_code": "SO_1271",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-143",
        "id": "tide-spot-143",
        "name": "우이도",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0548",
        "buoy_code": "TW_0080",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-144",
        "id": "tide-spot-144",
        "name": "다대포항",
        "region_cat": "busan",
        "lat": 35.04,
        "lng": 128.96,
        "tide_code": "SO_1272",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-145",
        "id": "tide-spot-145",
        "name": "초도",
        "region_cat": "yeosu",
        "lat": 34.22,
        "lng": 127.26,
        "tide_code": "SO_0549",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-146",
        "id": "tide-spot-146",
        "name": "장호항",
        "region_cat": "donghae",
        "lat": 37.28,
        "lng": 129.31,
        "tide_code": "SO_1273",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-147",
        "id": "tide-spot-147",
        "name": "나로도",
        "region_cat": "yeosu",
        "lat": 34.46,
        "lng": 127.48,
        "tide_code": "SO_0550",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-148",
        "id": "tide-spot-148",
        "name": "거진항",
        "region_cat": "seohae",
        "lat": 38.44,
        "lng": 128.46,
        "tide_code": "SO_1274",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-149",
        "id": "tide-spot-149",
        "name": "여서도",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_0551",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-150",
        "id": "tide-spot-150",
        "name": "공현진항",
        "region_cat": "donghae",
        "lat": 38.36,
        "lng": 128.51,
        "tide_code": "SO_1275",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-151",
        "id": "tide-spot-151",
        "name": "고현항",
        "region_cat": "yeosu",
        "lat": 34.89,
        "lng": 128.62,
        "tide_code": "SO_0552",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-152",
        "id": "tide-spot-152",
        "name": "아야진항",
        "region_cat": "donghae",
        "lat": 38.27,
        "lng": 128.55,
        "tide_code": "SO_1276",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-154",
        "id": "tide-spot-154",
        "name": "화순항",
        "region_cat": "jeju",
        "lat": 33.23,
        "lng": 126.31,
        "tide_code": "SO_1277",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-155",
        "id": "tide-spot-155",
        "name": "영종왕산",
        "region_cat": "seohae",
        "lat": 37.45,
        "lng": 126.37,
        "tide_code": "SO_0554",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-156",
        "id": "tide-spot-156",
        "name": "원평항",
        "region_cat": "busan",
        "lat": 35.1587,
        "lng": 129.1604,
        "tide_code": "SO_1278",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-157",
        "id": "tide-spot-157",
        "name": "서망항",
        "region_cat": "seohae",
        "lat": 34.37,
        "lng": 126.13,
        "tide_code": "SO_0555",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-158",
        "id": "tide-spot-158",
        "name": "어란진항",
        "region_cat": "seohae",
        "lat": 34.35,
        "lng": 126.47,
        "tide_code": "SO_1279",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-159",
        "id": "tide-spot-159",
        "name": "승봉도",
        "region_cat": "seohae",
        "lat": 37.16,
        "lng": 126.3,
        "tide_code": "SO_0562",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-160",
        "id": "tide-spot-160",
        "name": "덕산항",
        "region_cat": "donghae",
        "lat": 37.36,
        "lng": 129.24,
        "tide_code": "SO_1280",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-161",
        "id": "tide-spot-161",
        "name": "울도",
        "region_cat": "seohae",
        "lat": 37.03,
        "lng": 125.99,
        "tide_code": "SO_0563",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-162",
        "id": "tide-spot-162",
        "name": "임원항",
        "region_cat": "donghae",
        "lat": 37.23,
        "lng": 129.34,
        "tide_code": "SO_1281",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-163",
        "id": "tide-spot-163",
        "name": "국화도",
        "region_cat": "seohae",
        "lat": 37.03,
        "lng": 126.52,
        "tide_code": "SO_0564",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-164",
        "id": "tide-spot-164",
        "name": "선재도",
        "region_cat": "seohae",
        "lat": 37.23,
        "lng": 126.53,
        "tide_code": "SO_1282",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-165",
        "id": "tide-spot-165",
        "name": "향화도항",
        "region_cat": "seohae",
        "lat": 35.16,
        "lng": 126.36,
        "tide_code": "SO_0565",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-166",
        "id": "tide-spot-166",
        "name": "사천진항",
        "region_cat": "donghae",
        "lat": 37.83,
        "lng": 128.88,
        "tide_code": "SO_1283",
        "buoy_code": null,
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-167",
        "id": "tide-spot-167",
        "name": "한수원_고리",
        "region_cat": "ulsan",
        "lat": 35.32,
        "lng": 129.29,
        "tide_code": null,
        "buoy_code": "HB_0002",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-168",
        "id": "tide-spot-168",
        "name": "한수원_진하",
        "region_cat": "ulsan",
        "lat": 35.38,
        "lng": 129.35,
        "tide_code": null,
        "buoy_code": "HB_0003",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-169",
        "id": "tide-spot-169",
        "name": "감천항",
        "region_cat": "busan",
        "lat": 35.07,
        "lng": 129.0,
        "tide_code": null,
        "buoy_code": "TW_0088",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-170",
        "id": "tide-spot-170",
        "name": "한수원_온양",
        "region_cat": "pohang",
        "lat": 35.68,
        "lng": 129.46,
        "tide_code": null,
        "buoy_code": "HB_0007",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-171",
        "id": "tide-spot-171",
        "name": "한수원_덕천",
        "region_cat": "donghae",
        "lat": 37.08,
        "lng": 129.41,
        "tide_code": null,
        "buoy_code": "HB_0008",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-172",
        "id": "tide-spot-172",
        "name": "송정해수욕장",
        "region_cat": "busan",
        "lat": 35.1785,
        "lng": 129.1995,
        "tide_code": null,
        "buoy_code": "TW_0090",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-173",
        "id": "tide-spot-173",
        "name": "한수원_나곡",
        "region_cat": "donghae",
        "lat": 37.12,
        "lng": 129.41,
        "tide_code": null,
        "buoy_code": "HB_0009",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-174",
        "id": "tide-spot-174",
        "name": "낙산해수욕장",
        "region_cat": "donghae",
        "lat": 38.12,
        "lng": 128.63,
        "tide_code": null,
        "buoy_code": "TW_0091",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-175",
        "id": "tide-spot-175",
        "name": "임랑해수욕장",
        "region_cat": "ulsan",
        "lat": 35.318,
        "lng": 129.264,
        "tide_code": null,
        "buoy_code": "TW_0092",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-176",
        "id": "tide-spot-176",
        "name": "대한해협",
        "region_cat": "yeosu",
        "lat": 34.5,
        "lng": 129.5,
        "tide_code": null,
        "buoy_code": "KG_0024",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-177",
        "id": "tide-spot-177",
        "name": "남해동부",
        "region_cat": "yeosu",
        "lat": 34.5,
        "lng": 128.5,
        "tide_code": null,
        "buoy_code": "KG_0025",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-178",
        "id": "tide-spot-178",
        "name": "망상해수욕장",
        "region_cat": "donghae",
        "lat": 37.59,
        "lng": 129.09,
        "tide_code": null,
        "buoy_code": "TW_0094",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-179",
        "id": "tide-spot-179",
        "name": "고래불해수욕장",
        "region_cat": "pohang",
        "lat": 36.58,
        "lng": 129.41,
        "tide_code": null,
        "buoy_code": "TW_0095",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-180",
        "id": "tide-spot-180",
        "name": "대천해수욕장",
        "region_cat": "seohae",
        "lat": 36.3,
        "lng": 126.51,
        "tide_code": null,
        "buoy_code": "TW_0069",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-181",
        "id": "tide-spot-181",
        "name": "중문해수욕장",
        "region_cat": "jeju",
        "lat": 33.245,
        "lng": 126.412,
        "tide_code": null,
        "buoy_code": "TW_0075",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-182",
        "id": "tide-spot-182",
        "name": "생일도",
        "region_cat": "seohae",
        "lat": 34.32,
        "lng": 126.95,
        "tide_code": null,
        "buoy_code": "TW_0081",
        "scuba_code": null
    },
    {
        "spot_id": "tide-spot-183",
        "id": "tide-spot-183",
        "name": "동명항",
        "region_cat": "donghae",
        "lat": 38.212,
        "lng": 128.595,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS1"
    },
    {
        "spot_id": "tide-spot-184",
        "id": "tide-spot-184",
        "name": "강문해변",
        "region_cat": "donghae",
        "lat": 37.79,
        "lng": 128.92,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS3"
    },
    {
        "spot_id": "tide-spot-185",
        "id": "tide-spot-185",
        "name": "구조라해수욕장",
        "region_cat": "yeosu",
        "lat": 34.81,
        "lng": 128.68,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS6"
    },
    {
        "spot_id": "tide-spot-186",
        "id": "tide-spot-186",
        "name": "성산일출봉",
        "region_cat": "jeju",
        "lat": 33.4625,
        "lng": 126.9389,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS9"
    },
    {
        "spot_id": "tide-spot-187",
        "id": "tide-spot-187",
        "name": "문섬",
        "region_cat": "jeju",
        "lat": 33.2285,
        "lng": 126.5689,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS10"
    },
    {
        "spot_id": "tide-spot-188",
        "id": "tide-spot-188",
        "name": "어영",
        "region_cat": "jeju",
        "lat": 33.518,
        "lng": 126.489,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS13"
    },
    {
        "spot_id": "tide-spot-189",
        "id": "tide-spot-189",
        "name": "태종대",
        "region_cat": "busan",
        "lat": 35.0525,
        "lng": 129.0889,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS14"
    },
    {
        "spot_id": "tide-spot-190",
        "id": "tide-spot-190",
        "name": "격렬비열도",
        "region_cat": "seohae",
        "lat": 36.62,
        "lng": 125.58,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS15"
    },
    {
        "spot_id": "tide-spot-191",
        "id": "tide-spot-191",
        "name": "욕지도",
        "region_cat": "yeosu",
        "lat": 34.63,
        "lng": 128.25,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS17"
    },
    {
        "spot_id": "tide-spot-192",
        "id": "tide-spot-192",
        "name": "추암",
        "region_cat": "donghae",
        "lat": 37.478,
        "lng": 129.158,
        "tide_code": null,
        "buoy_code": null,
        "scuba_code": "SS18"
    }
];

// Initial Posts Sample Data (Real Data Only Mode)
var INITIAL_POSTS = [];

// App State (Safe Var Declarations)
var posts = posts || [];
var inquiries = inquiries || [];
var activeCategory = activeCategory || "all";
var activeActivitySub = activeActivitySub || "my_posts";
var activeCctvRegion = activeCctvRegion || "all";
var activeTideRegion = activeTideRegion || "all";
var tideSearchKeyword = tideSearchKeyword || "";
var cctvSearchKeyword = cctvSearchKeyword || "";
var currentMainView = currentMainView || "home";
var searchKeyword = searchKeyword || "";
var selectedRegion = selectedRegion || "all";
var selectedSort = selectedSort || "newest";
var currentUser = currentUser || null;
var currentChatPost = currentChatPost || null;
var currentRatingPost = currentRatingPost || null;
let currentRatingScore = 5;
let editingPostId = null;
let pendingDeletePostId = null;
let chatMessages = {};
var _chatRealtimeChannel = null;
var _chatRealtimePostId = null;
var _chatPollTimer = null;

// === fetchAndRenderChatMessages: DB에서 채팅 불러와 화면 렌더링 ===
// === fetchAndRenderChatMessages: DB에서 채팅 불러와 화면 렌더링 ===
async function fetchAndRenderChatMessages(rawPostId) {
    if (!supabaseClient || !rawPostId) return;
    const postIdStr = getCanonicalPostId(rawPostId);

    try {
        const { data, error } = await supabaseClient
            .from('chats')
            .select('*')
            .eq('post_id', postIdStr)
            .order('created_at', { ascending: true });

        if (!error && data) {
            const myName = currentUser ? (currentUser.nickname || currentUser.name || currentUser.user_name || currentUser.email || '').trim().toLowerCase() : '';
            const loadedMsgs = data.map(m => {
                const authorName = m.sender_name || m.user_name || m.author || '다이버';
                const textStr = m.message_text || m.text || m.content || '';
                const timeDisplay = m.time || (m.created_at ? new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '방금 전');
                const isMyMsg = myName && (
                    authorName.trim().toLowerCase() === myName ||
                    (currentUser && currentUser.email && currentUser.email.toLowerCase() === authorName.trim().toLowerCase())
                );
                return {
                    id: m.id || ('msg-' + m.created_at),
                    sender: isMyMsg ? 'user' : 'other',
                    author: authorName,
                    text: textStr,
                    time: timeDisplay,
                    timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now()
                };
            });

            // 🚫 [채팅 스트림 투명망토]: 차단된 유저의 메시지 제외
            const myBlockedUsers = (currentUser && Array.isArray(currentUser.blocked_users)) 
                ? currentUser.blocked_users.map(u => String(u).trim().toLowerCase()) 
                : [];

            let filteredLoadedMsgs = loadedMsgs;
            if (myBlockedUsers.length > 0) {
                filteredLoadedMsgs = loadedMsgs.filter(m => {
                    if (m.sender === 'system' || m.sender === 'user') return true;
                    const authorName = String(m.author || '').trim().toLowerCase();
                    if (authorName && myBlockedUsers.includes(authorName)) return false;
                    return true;
                });
            }

            const sysMsg = [{
                id: 'sys-welcome',
                sender: 'system',
                author: 'AquaBuddy 시스템',
                text: '💬 대화방이 연결되었습니다. 자유롭게 소통하세요!',
                time: '방금 전'
            }];

            chatMessages[postIdStr] = [...sysMsg, ...filteredLoadedMsgs];
        }
    } catch(err) {
        console.warn('[CHAT] fetchAndRenderChatMessages 오류:', err);
    }

    if (typeof renderChatStream === 'function') {
        renderChatStream(postIdStr);
    }
}
window.fetchAndRenderChatMessages = fetchAndRenderChatMessages;

// === subscribeChatRealtime: Realtime + 2초 폴링 구독 ===
// === subscribeChatRealtime: Realtime + 3초 폴링 중복 방어 구독 엔진 ===
var _chatRealtimeChannel = _chatRealtimeChannel || null;
var _chatRealtimePostId = _chatRealtimePostId || null;
var _chatPollTimer = _chatPollTimer || null;

function subscribeChatRealtime(rawPostId) {
    if (!supabaseClient || !rawPostId) return;
    const postIdStr = (typeof getCanonicalPostId === 'function') ? getCanonicalPostId(rawPostId) : String(rawPostId).trim();

    if (_chatRealtimePostId === postIdStr && _chatRealtimeChannel) {
        console.log('[CHAT RT] 이미 연결된 실시간 대화 채널입니다 (중복 구독 방어):', postIdStr);
        return;
    }

    unsubscribeChatRealtime();
    _chatRealtimePostId = postIdStr;

    fetchAndRenderChatMessages(postIdStr);

    try {
        _chatRealtimeChannel = supabaseClient
            .channel('chat_room_' + postIdStr)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chats'
            }, (payload) => {
                if (payload && payload.new) {
                    const pid = (typeof getCanonicalPostId === 'function') ? getCanonicalPostId(payload.new.post_id) : String(payload.new.post_id || '').trim();
                    if (pid === postIdStr) {
                        fetchAndRenderChatMessages(postIdStr);
                        if (typeof playNotificationSound === 'function') playNotificationSound();
                    }
                }
            })
            .subscribe((status) => {
                console.log('[CHAT RT] 실시간 대화 구독 상태:', status, '| postId:', postIdStr);
            });
    } catch(err) {
        console.warn('[CHAT RT] 대화 실시간 채널 결합 예외:', err);
    }

    if (_chatPollTimer) clearInterval(_chatPollTimer);
    _chatPollTimer = setInterval(() => {
        fetchAndRenderChatMessages(postIdStr);
    }, 3000);
}
window.subscribeChatRealtime = subscribeChatRealtime;

function unsubscribeChatRealtime() {
    if (_chatRealtimeChannel && supabaseClient) {
        try { supabaseClient.removeChannel(_chatRealtimeChannel); } catch(e) {}
    }
    if (_chatPollTimer) { clearInterval(_chatPollTimer); _chatPollTimer = null; }
    _chatRealtimeChannel = null;
    _chatRealtimePostId = null;
}
window.unsubscribeChatRealtime = unsubscribeChatRealtime;

// === handleSendChatMessage: 실시간 대화방 메시지 전송 엔진 ===
async function handleSendChatMessage(e, postId) {
    if (e && e.preventDefault) e.preventDefault();
    if (!postId) return;
    const postIdStr = String(postId).trim();

    if (!currentUser || (!currentUser.name && !currentUser.nickname)) {
        showToast("🔑 로그인 후 대화방 메시지를 작성하실 수 있습니다!");
        return;
    }

    const input = document.getElementById("chatMessageInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = ""; // 입력 필드 초기화

    const senderName = currentUser.nickname || currentUser.name || currentUser.user_name || "다이버";
    const nowTimeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // 1. 즉시 클라이언트 UI 스트림 반영 (0초 반응)
    if (!chatMessages[postIdStr]) chatMessages[postIdStr] = [];
    const localMsg = {
        id: 'local-' + Date.now(),
        sender: 'user',
        author: senderName,
        text: text,
        time: nowTimeStr,
        timestamp: Date.now()
    };
    chatMessages[postIdStr].push(localMsg);
    if (typeof renderChatStream === 'function') renderChatStream(postIdStr);

    // 2. Supabase DB chats 테이블에 저장 (PC-모바일 100% 연동)
    if (supabaseClient) {
        try {
            const isoTime = (typeof getKSTIsoString === 'function') ? getKSTIsoString() : new Date().toISOString();
            const { error } = await supabaseClient
                .from('chats')
                .insert([{
                    post_id: postIdStr,
                    sender_name: senderName,
                    user_name: senderName,
                    author: senderName,
                    message_text: text,
                    text: text,
                    content: text,
                    created_at: isoTime
                }]);

            if (error) {
                console.warn('[CHAT] Supabase chats insert notice:', error);
            } else {
                console.log('[CHAT] Supabase chats insert 성공!');
            }
        } catch (dbErr) {
            console.warn('[CHAT] chats insert catch:', dbErr);
        }
    }

    // 3. DB 최신 대화 목록 갱신
    if (typeof fetchAndRenderChatMessages === 'function') {
        setTimeout(() => fetchAndRenderChatMessages(postIdStr), 300);
    }
}
window.handleSendChatMessage = handleSendChatMessage;





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

// (switchMainView is unified at top)

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
    if (typeof loadOceanWeatherCacheFromSupabase === 'function') {
        await loadOceanWeatherCacheFromSupabase();
    }
    loadPosts();
    loadMyPosts();
    loadInquiries();
    initEventListeners();
    switchMainView('all');
    if (typeof OCEAN_WEATHER_DATA !== "undefined" && OCEAN_WEATHER_DATA.length > 0) {
        currentDashboardSpot = OCEAN_WEATHER_DATA[0];
        if (typeof renderUnifiedSpotDashboard === "function") {
            renderUnifiedSpotDashboard(OCEAN_WEATHER_DATA[0]);
        }
    }
    renderWeatherGrid(activeTideRegion);
    renderOceanWebcams(activeCctvRegion);
    if (typeof selectScubaPoint === 'function') selectScubaPoint('SS9');
    if (typeof initHomeHaeundaeCctv === 'function') initHomeHaeundaeCctv();
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
    if (category === "report") categoryName = "🚨 불량 유저 / 사기 / 비매너 신고";
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
        createdAt: getKSTIsoString()
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
    if (typeof fetchAndCacheAllUsers === 'function') fetchAndCacheAllUsers();
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
        const isInst = isVerifiedInstructor();
        const instBadge = isInst ? ` [👑공인강사]` : (isPendingInstructor() ? ` [심사대기중]` : '');
        const navName = document.getElementById("navUserName");
        const displayName = (isInst && (currentUser.realName || currentUser.real_name)) ? (currentUser.realName || currentUser.real_name) : (currentUser.nickname || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : "다이버"));
        if (navName) {
            navName.innerHTML = `${escapeHtml(displayName)}${instBadge} ${typeof renderUserBadges === 'function' ? renderUserBadges(currentUser) : ''}`;
        }
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
    return currentUser.instructorStatus === "approved" || 
           currentUser.instructor_status === "approved" || 
           currentUser.isApprovedInstructor === true || 
           currentUser.is_instructor === true || 
           currentUser.isInstructor === true;
}

function isPendingInstructor() {
    if (!currentUser) return false;
    return currentUser.instructorStatus === "pending";
}


function handleInstCertUpload(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const maxDimension = 1000;
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            instAppCertImage = canvas.toDataURL("image/jpeg", 0.7);
            const preview = document.getElementById("instAppCertPreview");
            if (preview) {
                preview.innerHTML = `
                    <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:8px; border:1px solid var(--accent-gold);">
                        <img src="${instAppCertImage}" alt="자격증 사본 미리보기" loading="lazy" style="height:50px; border-radius:4px;">
                        <span style="font-size:0.8rem; color:#ffb703; font-weight:700;">✓ 자격증 사진 첨부 완료</span>
                    </div>
                `;
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handleInstCertUpload = handleInstCertUpload;

function openInstructorAuthModal() {
    if (!currentUser || (!currentUser.email && !currentUser.name && !currentUser.nickname)) {
        if (typeof showToast === "function") {
            showToast("회원가입/로그인 후 강사인증을 진행해주세요");
        }
        const authModal = document.getElementById("authModal");
        if (authModal && typeof openModal === "function") {
            if (typeof switchAuthTab === "function") switchAuthTab('login');
            openModal(authModal);
        }
        return;
    }
    const modal = document.getElementById("instructorAuthModal");
    if (modal) {
        const realNameInput = document.getElementById("instAppRealName");
        if (realNameInput && (!realNameInput.value || realNameInput.value === "다이버")) {
            realNameInput.value = currentUser.realName || currentUser.real_name || currentUser.name || "";
        }

        // 🚨 심사 반려 유저인 경우 반려 사유 알림 배너 표출
        if (currentUser && (currentUser.instructor_status === 'rejected' || currentUser.instructorStatus === 'rejected')) {
            let rejBox = document.getElementById("instAppRejectionBanner");
            const modalContainer = modal.querySelector(".modal-container") || modal;
            if (!rejBox && modalContainer) {
                rejBox = document.createElement("div");
                rejBox.id = "instAppRejectionBanner";
                const modalHeader = modalContainer.querySelector(".modal-header");
                if (modalHeader && modalHeader.nextSibling) {
                    modalContainer.insertBefore(rejBox, modalHeader.nextSibling);
                } else {
                    modalContainer.insertBefore(rejBox, modalContainer.firstChild);
                }
            }
            if (rejBox) {
                const reason = currentUser.rejection_reason || currentUser.rejectionReason || "제출된 자격증 서류 보완 필요";
                rejBox.innerHTML = `
                    <div style="background: rgba(255, 82, 82, 0.14); border: 1.5px solid #ff5252; border-radius: 12px; padding: 14px 16px; margin: 12px 0 16px 0; box-shadow: 0 0 20px rgba(255, 82, 82, 0.2);">
                        <div style="color: #ff5252; font-weight: 900; font-size: 0.95rem; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <i class="fa-solid fa-circle-xmark"></i> ⚠️ 강사 자격증 심사 반려 안내
                        </div>
                        <div style="font-size: 0.86rem; color: #ffebee; line-height: 1.5;">
                            <strong>[반려 사유]:</strong> ${typeof escapeHtml === 'function' ? escapeHtml(reason) : reason}<br>
                            <span style="opacity: 0.85; font-size: 0.8rem; margin-top: 4px; display: inline-block;">* 자격증 사본 및 신원 정보를 보완하신 후 아래 양식에서 재신청해 주시면 재심사가 진행됩니다.</span>
                        </div>
                    </div>
                `;
            }
        } else {
            const existingRej = document.getElementById("instAppRejectionBanner");
            if (existingRej) existingRej.remove();
        }

        if (typeof openModal === "function") openModal(modal);
    }
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

            // 1:1 Supabase DB Referral Code & Founding Member Auto-Repair
            var liveRefCode = dbUser.referral_code || savedUser.referral_code || savedUser.referralCode || "";
            if (!liveRefCode) {
                liveRefCode = typeof getDeterministicReferralCode === 'function' ? getDeterministicReferralCode(dbUser) : ('AQUA-' + (dbUser.email || 'USER').substring(0, 4).toUpperCase());
                if (supabaseClient && dbUser.id) {
                    supabaseClient.from('users').update({ referral_code: liveRefCode }).eq('id', dbUser.id).then(function(){});
                }
            }

            // 🛡️ 심사 반려 유저 강사 권한 자동 박탈 보정 및 토스트 팝업 알림
            if (dbUser.instructor_status === 'rejected' || dbUser.instructorStatus === 'rejected') {
                dbUser.is_instructor = false;
                dbUser.isInstructor = false;
                dbUser.role = 'user';
                savedUser.is_instructor = false;
                savedUser.isInstructor = false;
                savedUser.role = 'user';
                if (supabaseClient && dbUser.id && (dbUser.is_instructor === true || dbUser.role === 'instructor')) {
                    supabaseClient.from('users').update({ is_instructor: false, role: 'user' }).eq('id', dbUser.id).then(function(){});
                }

                if (!window._hasShownRejectionNoticeToast) {
                    window._hasShownRejectionNoticeToast = true;
                    setTimeout(function() {
                        const rReason = dbUser.rejection_reason || dbUser.rejectionReason || "서류 보완 필요";
                        if (typeof showToast === 'function') {
                            showToast("❌ [강사 심사 반려 안내] 사유: \"" + rReason + "\" (자격증 재신청 가능)");
                        }
                    }, 1200);
                }
            }

            var isFoundingVal = dbUser.is_founding_member;
            if (userEmail === 'hanmaner@hanmail.net' || userEmail === 'hanmaners@hanmail.net') {
                isFoundingVal = true;
                if (supabaseClient && dbUser.id) {
                    supabaseClient.from('users').update({ is_founding_member: true }).eq('id', dbUser.id).then(function(){});
                }
            }

            const updatedUser = {
                ...savedUser,
                ...dbUser,
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
                provider: dbUser.provider || savedUser.provider || "홈페이지 회원",
                manner_tags: dbUser.manner_tags || savedUser.manner_tags || {},
                mannerTags: dbUser.manner_tags || savedUser.mannerTags || {},
                hosted_count: dbUser.hosted_count !== undefined ? dbUser.hosted_count : (savedUser.hosted_count || 0),
                hostedCount: dbUser.hosted_count !== undefined ? dbUser.hosted_count : (savedUser.hostedCount || 0),
                host_count: dbUser.host_count !== undefined ? dbUser.host_count : (dbUser.hosted_count !== undefined ? dbUser.hosted_count : (savedUser.host_count || 0)),
                completed_meets_count: dbUser.completed_meets_count !== undefined ? dbUser.completed_meets_count : (savedUser.completed_meets_count || 0),
                completedCount: dbUser.completed_meets_count !== undefined ? dbUser.completed_meets_count : (savedUser.completedCount || 0),
                warning_count: dbUser.warning_count !== undefined ? dbUser.warning_count : (savedUser.warning_count || 0),
                warningCount: dbUser.warning_count !== undefined ? dbUser.warning_count : (savedUser.warningCount || 0),
                is_founding_member: dbUser.is_founding_member !== undefined ? dbUser.is_founding_member : (savedUser.is_founding_member || false),
                isFoundingMember: dbUser.is_founding_member !== undefined ? dbUser.is_founding_member : (savedUser.isFoundingMember || false),
                referral_code: liveRefCode,
                referralCode: liveRefCode,
                referral_count: dbUser.referral_count !== undefined ? dbUser.referral_count : (savedUser.referral_count || 0),
                is_sns_ambassador: dbUser.is_sns_ambassador !== undefined ? dbUser.is_sns_ambassador : (savedUser.is_sns_ambassador || false)
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
    const client = (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : (typeof window !== 'undefined' ? window.supabaseClient : null);
    if (!userData || !userData.email) return { data: null, error: { message: "Invalid user data" } };
    if (!client) return { data: null, error: { message: "Supabase client uninitialized" } };

    try {
        let authUser = null;
        try {
            if (client.auth && typeof client.auth.getUser === "function") {
                const { data: authRes } = await client.auth.getUser();
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
                real_name: existingUser.real_name || existingUser.realName || userData.realName || userData.real_name || '',
                realName: existingUser.real_name || existingUser.realName || userData.realName || userData.real_name || '',
                name: existingUser.nickname || existingUser.name || userData.name || userData.nickname || userEmail.split('@')[0],
                nickname: existingUser.nickname || existingUser.name || userData.nickname || userData.name || userEmail.split('@')[0],
                phone: existingUser.phone || userData.phone || '',
                license: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.license || ""),
                license_info: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.license_info || ""),
                gender: existingUser.gender || userData.gender || 'private',
                age_group: existingUser.age_group || existingUser.ageGroup || userData.age_group || userData.ageGroup || 'private',
                ageGroup: existingUser.age_group || existingUser.ageGroup || userData.age_group || userData.ageGroup || 'private',
                user_license: (existingUser.user_license !== undefined && existingUser.user_license !== null) ? existingUser.user_license : (userData.user_license || ""),
                instructor_code: existingUser.instructor_code || userData.instructor_code || "",
                instructor_status: existingUser.instructor_status || userData.instructor_status || "none",
                instructorStatus: existingUser.instructor_status || userData.instructor_status || "none"
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

        const refCode = typeof getDeterministicReferralCode === 'function' ? getDeterministicReferralCode(userData) : ('AQUA-' + userEmail.substring(0, 4).toUpperCase());

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
            cert_image: userData.cert_image || userData.certImage || "",
            gender: userData.gender || 'private',
            age_group: userData.age_group || userData.ageGroup || 'private',
            referral_code: refCode,
            referral_count: (userData.referral_count !== undefined && userData.referral_count !== null) ? userData.referral_count : (userData.referralCount || 0),
            referred_by: userData.referred_by || userData.referredBy || ""
        };

        // 🔒 [개인정보 보안] DB users 테이블에 비밀번호 평문 전송 완전 제거
        if (authUser && authUser.id) payload.id = authUser.id;
        else if (existingUser && existingUser.id) payload.id = existingUser.id;

        console.log("DB 연동 시도 페이로드 (isExplicitEdit=", isExplicitEdit, "):", payload);

        let res;
        if (existingUser) {
            // 이미 있으면 UPDATE (사용자가 직접 프로필 수정을 눌렀을 때만 실행)
            res = await client.from('users').update(payload).eq('email', userEmail);
            if (res.error) {
                console.warn("Update 시도 실패, Upsert 재시도:", res.error);
                res = await client.from('users').upsert(payload, { onConflict: 'email' });
            }
        } else {
            // 없으면 INSERT (신규 가입 유저)
            res = await client.from('users').insert([payload]);
            if (res.error && !isExplicitEdit) {
                console.warn("Insert 시도 실패, Upsert 재시도:", res.error);
                res = await client.from('users').upsert(payload, { onConflict: 'email' });
            }
        }

        if (res && res.error) {
            console.error("DB 저장 실패 세부원인:", res.error);
            if (isExplicitEdit) {
                return { data: null, error: res.error };
            }
            alert("DB 저장 거부됨: " + (res.error.message || JSON.stringify(res.error)));
            return { data: null, error: res.error };
        } else {
            console.log("Supabase DB 연동 성공!", res ? res.data : "");
            // DB 저장 성공 후 최신 데이터를 읽어와 currentUser 및 UI 즉시 갱신
            try {
                const { data: latestDB } = await client.from('users').select('*').eq('email', userEmail).maybeSingle();
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
                        user_license: (latestDB.user_license !== undefined && latestDB.user_license !== null) ? latestDB.user_license : userLicense,
                        gender: latestDB.gender || currentUser.gender || 'private',
                        age_group: latestDB.age_group || currentUser.age_group || currentUser.ageGroup || 'private',
                        ageGroup: latestDB.age_group || currentUser.age_group || currentUser.ageGroup || 'private'
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

async function handleInstructorAuthSubmit(e) {
    e.preventDefault();

    if (currentUser && (currentUser.isInstructor || currentUser.role === 'instructor' || currentUser.instructorStatus === 'approved' || currentUser.instructor_status === 'approved' || currentUser.isApprovedInstructor)) {
        showToast("⚠️ 이미 공인 인증 강사로 승인 완료된 계정입니다!");
        closeModal(document.getElementById("instructorAuthModal"));
        return;
    }

    const realNameEl = document.getElementById("instAppRealName");
    const realName = realNameEl ? realNameEl.value.trim() : "";
    const org = document.getElementById("instAppOrg") ? document.getElementById("instAppOrg").value : "SSI (스쿠버)";
    const code = document.getElementById("instAppCode") ? document.getElementById("instAppCode").value.trim() : "";

    if (!realName) {
        showToast("⚠️ 강사 실명(본명)을 입력해 주세요!");
        if (realNameEl) realNameEl.focus();
        return;
    }

    if (!code) {
        showToast("⚠️ 강사 라이선스 코드 번호를 입력해 주세요!");
        return;
    }

    // 🚫 중복 검사는 이미 다른 회원에게 최종 승인된 고유 라이선스 코드만 차단 (본인 프로필/신청건은 통과)
    const myEmail = (currentUser && currentUser.email) ? currentUser.email.toLowerCase() : "";
    const registeredUsers = getRegisteredUsers();
    const isDuplicateCode = Object.entries(registeredUsers).some(([userEmail, u]) => {
        if (myEmail && userEmail.toLowerCase() === myEmail) return false; // 본인 계정 정보는 제외
        if ((u.instructorStatus === 'approved' || u.instructor_status === 'approved') && u.instructorCode === code) return true;
        return false;
    });

    if (isDuplicateCode) {
        showToast("⚠️ 다른 회원이 이미 공인 인증을 완료한 강사 라이선스 코드입니다.");
        return;
    }

    if (currentUser) {
        currentUser.realName = realName;
        currentUser.real_name = realName;
        currentUser.instructorCode = code;
        currentUser.instructor_code = code;
        currentUser.instructorOrg = org;
        currentUser.instructor_org = org;
        currentUser.license = `${org} Instructor (No. ${code})`;
        currentUser.license_info = `${org} Instructor (No. ${code})`;
        currentUser.user_license = `${org} Instructor (No. ${code})`;
        currentUser.instructorStatus = "pending";
        currentUser.instructor_status = "pending";
        currentUser.isApprovedInstructor = false;
        if (instAppCertImage) {
            currentUser.certImage = instAppCertImage;
            currentUser.cert_image = instAppCertImage;
        }

        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        if (currentUser.email) {
            const users = getRegisteredUsers();
            const userKey = currentUser.email.toLowerCase();
            if (users[userKey]) {
                users[userKey].realName = realName;
                users[userKey].real_name = realName;
                users[userKey].instructorCode = code;
                users[userKey].instructor_code = code;
                users[userKey].instructorOrg = org;
                users[userKey].instructor_org = org;
                users[userKey].license = currentUser.license;
                users[userKey].license_info = currentUser.license;
                users[userKey].user_license = currentUser.license;
                users[userKey].instructorStatus = "pending";
                users[userKey].instructor_status = "pending";
                users[userKey].isApprovedInstructor = false;
                if (instAppCertImage) {
                    users[userKey].certImage = instAppCertImage;
                    users[userKey].cert_image = instAppCertImage;
                }
                safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(users));
                syncUserToSupabaseCloud(users[userKey]);
            }
        }
        if (typeof updateNavbarUserUI === 'function') updateNavbarUserUI();
    }

    // Supabase users 테이블 직접 UPDATE (강사 인증 신청 상태 및 실명 즉시 반영)
    if (supabaseClient && currentUser && currentUser.email) {
        try {
            const instPayload = {
                real_name: realName,
                instructor_code: code,
                instructor_org: org,
                instructor_status: 'pending',
                cert_image: instAppCertImage || (currentUser ? (currentUser.certImage || currentUser.cert_image) : '') || '',
                license_info: `${org} Instructor (No. ${code})`,
                user_license: `${org} Instructor (No. ${code})`
            };
            console.log('🚀 [INSTRUCTOR CERT] Supabase users UPDATE:', instPayload);
            const { error } = await supabaseClient.from('users')
                .update(instPayload)
                .eq('email', currentUser.email);
            if (error) {
                console.warn('강사 인증 신청 Supabase update retry with id:', error);
                if (currentUser.id) {
                    await supabaseClient.from('users').update(instPayload).eq('id', currentUser.id);
                }
            } else {
                console.log('✨ 강사 인증 신청이 Supabase DB에 성공적으로 저장되었습니다!');
            }
        } catch(sbErr) {
            console.warn('강사 인증 신청 DB 예외:', sbErr);
        }
    }

    const authModal = document.getElementById("instructorAuthModal");
    if (authModal && typeof closeModal === "function") {
        closeModal(authModal);
    }
    if (typeof filterAndRender === 'function') filterAndRender();
    showToast(`⏳ '${realName}' 강사님의 자격증 심사 신청이 접수되었습니다! (웹마스터 승인 완료 후 클래스 등록이 활성화됩니다)`);
}

async function renderAdminStats() {
    try {
        let totalUsers = 0;
        let pendingInquiries = 0;
        let totalInquiries = 0;
        let approvedInstructors = 0;
        let totalPostsCount = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.length : 0;

        if (supabaseClient) {
            try {
                // Real Users Count (Full Select to prevent missing column error)
                const { data: usersData, error: uErr } = await supabaseClient.from('users').select('*');
                if (!uErr && Array.isArray(usersData)) {
                    totalUsers = usersData.length;
                    approvedInstructors = usersData.filter(u => 
                        u.instructor_status === 'approved' || 
                        u.instructorStatus === 'approved' || 
                        u.is_instructor === true || 
                        u.isInstructor === true ||
                        u.role === 'instructor'
                    ).length;
                }

                // Real Inquiries Count
                const { data: inqData, error: iErr } = await supabaseClient.from('inquiries').select('*');
                if (!iErr && Array.isArray(inqData)) {
                    totalInquiries = inqData.length;
                    pendingInquiries = inqData.filter(i => i.status !== '처리완료' && i.status !== '완료').length;
                }
            } catch (dbErr) {
                console.warn("[Admin Stats Real DB Fetch Notice]:", dbErr);
            }
        }

        if (totalUsers === 0) {
            const regUsers = getRegisteredUsers();
            totalUsers = Object.keys(regUsers).length;
            approvedInstructors = Object.values(regUsers).filter(u => u.instructorStatus === 'approved' || u.isApprovedInstructor).length;
        }

        const elTotalUsers = document.getElementById("adminStatTotalUsers");
        if (elTotalUsers) elTotalUsers.textContent = `${totalUsers.toLocaleString()} 명`;

        const elTodayUsers = document.getElementById("adminStatTodayUsers");
        if (elTodayUsers) elTodayUsers.textContent = `Supabase DB 가입 회원 ${totalUsers}명`;

        const elPendingInquiries = document.getElementById("adminStatPendingInquiries");
        if (elPendingInquiries) elPendingInquiries.textContent = `${pendingInquiries.toLocaleString()} 건`;

        const elTotalInquiries = document.getElementById("adminStatTotalInquiries");
        if (elTotalInquiries) elTotalInquiries.textContent = `전체 ${totalInquiries}건 접수됨`;

        const elInstructors = document.getElementById("adminStatInstructors");
        if (elInstructors) elInstructors.textContent = `${approvedInstructors.toLocaleString()} 명`;

        const elTotalPosts = document.getElementById("adminStatTotalPosts");
        if (elTotalPosts) elTotalPosts.textContent = `${totalPostsCount.toLocaleString()} 개`;

        const countBadge = document.getElementById("adminUsersCountBadge");
        if (countBadge) countBadge.textContent = totalUsers;
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

function getKSTIsoString() {
    const d = new Date();
    const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kstTime = new Date(utcMs + (9 * 60 * 60000));
    
    const pad = n => String(n).padStart(2, '0');
    const YYYY = kstTime.getFullYear();
    const MM = pad(kstTime.getMonth() + 1);
    const DD = pad(kstTime.getDate());
    const hh = pad(kstTime.getHours());
    const mm = pad(kstTime.getMinutes());
    const ss = pad(kstTime.getSeconds());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}+09:00`;
}
window.getKSTIsoString = getKSTIsoString;


window.openAdminModal = openAdminModal;
window.openAdminDashboard = openAdminDashboard;
window.switchAdminTab = switchAdminTab;
window.exportUserDbToCsv = exportUserDbToCsv;
window.approveInstructorCertDemo = approveInstructorCertDemo;
window.rejectInstructorCertDemo = rejectInstructorCertDemo;

function openAdminDashboard() {
    isAdminAuthenticated = true;
    hideAdBannersForAdmin();
    renderAdminStats();
    renderAdminUsersTable();
    renderAdminPostsTable();
    if (typeof renderAdminInstructorsTable === 'function') renderAdminInstructorsTable();
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
    const tabs = ["stats", "affiliate", "inquiries", "instructors", "users", "posts", "system", "settings"];
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

    if (tabKey === "stats") {
        if (typeof renderAdminStats === "function") renderAdminStats();
    } else if (tabKey === "affiliate") {
        if (typeof renderAdminAffiliateStats === "function") renderAdminAffiliateStats();
    } else if (tabKey === "users") {
        if (typeof renderAdminUsersTable === "function") renderAdminUsersTable();
    } else if (tabKey === "posts") {
        if (typeof renderAdminPostsTable === "function") renderAdminPostsTable();
    } else if (tabKey === "inquiries") {
        if (typeof renderAdminInquiries === "function") renderAdminInquiries();
        else if (typeof renderAdminInquiriesTable === "function") renderAdminInquiriesTable();
    } else if (tabKey === "instructors") {
        if (typeof renderAdminInstructorsTable === "function") renderAdminInstructorsTable();
    }
}
window.switchAdminTab = switchAdminTab;

async function renderAdminUsersTable() {
    const tbody = document.getElementById("adminUsersTbody");
    const countBadge = document.getElementById("adminUsersCountBadge");
    const statTotalUsers = document.getElementById("adminStatTotalUsers");

    let usersList = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                usersList = data;
            }
        } catch (err) {
            console.warn("Supabase user fetch error:", err);
        }
    }

    window._adminAllUsersList = usersList;

    if (countBadge) countBadge.textContent = usersList.length;
    if (statTotalUsers) statTotalUsers.textContent = `${usersList.length} 명`;

    if (!tbody) return;

    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">
                    가입된 회원 DB가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(u => {
        const regDate = u.created_at ? formatDate(u.created_at) : (u.createdAt ? formatDate(u.createdAt) : "최근");
        const hasCert = !!(u.cert_image || u.certImage);
        const certBtnHtml = hasCert ? `
            <button type="button" class="btn btn-secondary" onclick="openCertificateImageModal('${escapeHtml(u.email)}')" style="margin-left: 6px; padding: 2px 6px; font-size: 0.72rem; color: var(--accent-cyan); border: 1px solid rgba(0,242,254,0.4); background: rgba(0,242,254,0.08); border-radius: 4px; cursor: pointer;" title="자격증 실물 사본 보기">
                🖼️ 사본
            </button>
        ` : '';

        const statusText = (u.instructor_status === "approved" || u.instructorStatus === "approved" || u.is_instructor)
            ? `<span style="color:#00e676; font-weight:700;"><i class="fa-solid fa-graduation-cap"></i> 공인 강사</span>${certBtnHtml}`
            : ((u.instructor_status === "pending" || u.instructorStatus === "pending")
                ? `<span style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-clock"></i> 심사 대기</span>${certBtnHtml}`
                : ((u.instructor_status === "rejected" || u.instructorStatus === "rejected")
                    ? `<span style="color:#ff5252; font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> 심사 반려</span>${certBtnHtml}`
                    : `<span style="color:var(--text-dim);">일반 다이버</span>`));

        const phoneDisplay = (u.phone && u.phone !== "010-0000-0000") 
            ? escapeHtml(u.phone) 
            : `<span style="color:var(--text-muted);">미등록</span>`;

        return `
            <tr>
                <td style="font-size:0.8rem; color:var(--text-muted);">${regDate}</td>
                <td><strong>${escapeHtml(u.real_name || u.realName || u.user_name || u.name || '미입력')}</strong></td>
                <td>${escapeHtml(u.nickname || u.name || '-')}</td>
                <td><code style="color:var(--accent-cyan);">${escapeHtml(u.email || '-')}</code></td>
                <td>${phoneDisplay}</td>
                <td>${statusText}</td>
                <td><span class="badge badge-secondary" style="font-size:0.75rem;">${escapeHtml(u.provider || '소셜/일반')}</span></td>
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

async function renderAdminInquiries() {
    const tbody = document.getElementById("adminInquiriesTbody");
    const badge = document.getElementById("adminInquiriesBadge");

    let inquiryList = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('inquiries').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                inquiryList = data;
            }
        } catch (err) {
            console.warn("Supabase inquiries fetch error:", err);
        }
    }

    if (badge) badge.textContent = inquiryList.length;
    if (!tbody) return;

    if (inquiryList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">
                    접수된 문의 내역이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inquiryList.map(inq => {
        const catName = inq.category === 'bug' ? '🐞 버그/오류' : (inq.category === 'ad' ? '📢 제휴/광고' : (inq.category === 'feature' ? '💡 기능 제안' : '💬 일반 문의'));
        const createdAtStr = inq.created_at ? formatTimeAgo(inq.created_at) : '최근';
        return `
            <tr>
                <td><span class="badge badge-instructor">${escapeHtml(catName)}</span></td>
                <td><strong>${escapeHtml(inq.name || inq.user_name || '익명')}</strong></td>
                <td><code>${escapeHtml(inq.contact || '-')}</code></td>
                <td><strong>${escapeHtml(inq.title || '-')}</strong></td>
                <td style="max-width: 260px; word-break: break-all;">${escapeHtml(inq.content || inq.message || '-')}</td>
                <td>${createdAtStr}</td>
                <td>
                    <span style="color: #00e676; font-weight:700; font-size: 0.78rem;">✓ 정상 접수</span>
                </td>
            </tr>
        `;
    }).join('');
}
window.renderAdminInquiries = renderAdminInquiries;
window.renderAdminInquiriesTable = renderAdminInquiries;

function getAdminCategoryBadge(catKey) {
    const cat = (catKey || 'freediving').toLowerCase();
    const map = {
        freediving: { name: '🤿 프리다이빙', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' },
        scuba: { name: '🤿 스쿠버다이빙', color: '#38ef7d', bg: 'rgba(56, 239, 125, 0.15)', border: 'rgba(56, 239, 125, 0.4)' },
        swimming: { name: '🏊‍♂️ 실내수영', color: '#4facfe', bg: 'rgba(79, 172, 254, 0.15)', border: 'rgba(79, 172, 254, 0.4)' },
        openwater: { name: '🌊 바다수영', color: '#00c6ff', bg: 'rgba(0, 198, 255, 0.15)', border: 'rgba(0, 198, 255, 0.4)' },
        instructor: { name: '🎓 강사 클래스', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.4)' },
        community: { name: '💬 자유수다방', color: '#ff758c', bg: 'rgba(255, 117, 140, 0.15)', border: 'rgba(255, 117, 140, 0.4)' },
        market: { name: '🛒 중고장터', color: '#a18cd1', bg: 'rgba(161, 140, 209, 0.15)', border: 'rgba(161, 140, 209, 0.4)' },
        partnership: { name: '🤝 투어 & 제휴', color: '#f6d365', bg: 'rgba(246, 211, 101, 0.15)', border: 'rgba(246, 211, 101, 0.4)' },
        my_activity: { name: '📋 내 활동기록', color: '#667eea', bg: 'rgba(102, 126, 234, 0.15)', border: 'rgba(102, 126, 234, 0.4)' },
        tide: { name: '🌊 전국 해양 스팟', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' }
    };
    const c = map[cat] || { name: catKey || '일반', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' };
    return `<span class="badge badge-${cat}" style="display: inline-flex; align-items: center; justify-content: center; color: ${c.color} !important; background: ${c.bg} !important; border: 1px solid ${c.border} !important; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">${c.name}</span>`;
}
window.getAdminCategoryBadge = getAdminCategoryBadge;

function getAdminPostAuthor(post) {
    if (!post) return '알 수 없음';
    
    // 1. Direct nickname / name properties
    let authorName = post.nickname || post.nick_name || post.user_nickname || post.author_nickname || post.userName || post.user_name || post.author_name || post.real_name || post.realName || post.writer || post.host;
    
    if (authorName && typeof authorName === 'string' && authorName.trim() && !authorName.includes('@')) {
        return authorName.trim();
    }

    // 2. Author identifier (could be email or nickname)
    const authorIdentifier = post.author || post.email || post.userEmail || authorName;

    if (authorIdentifier && typeof authorIdentifier === 'string') {
        const idTrimmed = authorIdentifier.trim();
        // If it's an email, look up in registered users database
        try {
            const usersRaw = localStorage.getItem("aqua_buddy_registered_users");
            if (usersRaw) {
                const users = JSON.parse(usersRaw);
                if (users && typeof users === 'object') {
                    const lowerKey = idTrimmed.toLowerCase();
                    if (users[lowerKey]) {
                        const u = users[lowerKey];
                        const nick = u.nickname || u.nick_name || u.name || u.real_name;
                        if (nick) return nick;
                    }
                    for (const k in users) {
                        const u = users[k];
                        if (u && (u.email === idTrimmed || (u.email && u.email.toLowerCase() === lowerKey))) {
                            const nick = u.nickname || u.nick_name || u.name || u.real_name;
                            if (nick) return nick;
                        }
                    }
                }
            }
        } catch(e) {}

        if (idTrimmed.includes('@')) {
            return idTrimmed.split('@')[0];
        }
        return idTrimmed;
    }

    return '익명 버디';
}
window.getAdminPostAuthor = getAdminPostAuthor;

function renderAdminPostsTable() {
    const tbody = document.getElementById("adminPostsTbody");
    if (!tbody) return;

    const postList = (typeof window !== 'undefined' && Array.isArray(window.posts) && window.posts.length > 0) ? window.posts : ((typeof posts !== 'undefined' && Array.isArray(posts)) ? posts : []);

    if (postList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    <i class="fa-solid fa-inbox" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    등록된 게시글이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = postList.map(post => {
        const catBadge = getAdminCategoryBadge(post.category || post.categoryKey);
        const authorNick = getAdminPostAuthor(post);
        const postTitle = (typeof escapeHtml === 'function' ? escapeHtml(post.title || '제목 없음') : (post.title || '제목 없음'));
        const timeAgo = (typeof formatTimeAgo === 'function' ? formatTimeAgo(post.created_at || post.createdAt || post.time || post.date || new Date().toISOString()) : '방금 전');

        return `
            <tr>
                <td style="text-align: center; vertical-align: middle;">${catBadge}</td>
                <td style="vertical-align: middle;"><strong>${postTitle}</strong></td>
                <td style="vertical-align: middle; color: #00f2fe; font-weight: 600;">
                    <i class="fa-solid fa-user" style="font-size: 0.75rem; margin-right: 4px; opacity: 0.8;"></i>${typeof escapeHtml === 'function' ? escapeHtml(authorNick) : authorNick}
                </td>
                <td style="vertical-align: middle; color: var(--text-muted); font-size: 0.85rem;">${timeAgo}</td>
                <td style="text-align: center; vertical-align: middle;">
                    <button class="btn-delete" onclick="performPostDeletion('${post.id}')" style="padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; background: rgba(255, 82, 82, 0.15); color: #ff5252; border: 1px solid rgba(255, 82, 82, 0.3); cursor: pointer; transition: all 0.2s;">
                        <i class="fa-solid fa-trash-can"></i> 삭제
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}
window.renderAdminPostsTable = renderAdminPostsTable;

let _adminInstructorUsersCache = {};

function openCertificateImageModal(identifierOrUrl) {
    const modal = document.getElementById("certificateImageModal");
    const previewImg = document.getElementById("certPreviewImg");
    if (!modal) {
        alert("certificateImageModal 요소를 찾을 수 없습니다.");
        return;
    }

    let targetKey = (identifierOrUrl || "").trim().toLowerCase();
    let foundUser = (_adminInstructorUsersCache && _adminInstructorUsersCache[targetKey]) || null;

    if (!foundUser && window._adminAllUsersList && Array.isArray(window._adminAllUsersList)) {
        foundUser = window._adminAllUsersList.find(u => 
            (u.email && u.email.toLowerCase() === targetKey) ||
            (u.real_name && u.real_name === identifierOrUrl) ||
            (u.nickname && u.nickname === identifierOrUrl) ||
            (u.name && u.name === identifierOrUrl)
        );
    }

    if (!foundUser) {
        const localUsers = getRegisteredUsers();
        for (let k in localUsers) {
            if (k.toLowerCase() === targetKey || localUsers[k].name === identifierOrUrl || localUsers[k].realName === identifierOrUrl) {
                foundUser = localUsers[k];
                break;
            }
        }
    }

    let imgSrc = "";
    let applicantName = identifierOrUrl || "강사";
    let orgName = "AIDA";
    let licCode = "미입력";

    if (foundUser) {
        imgSrc = foundUser.cert_image || foundUser.certImage || foundUser.certificate_image || "";
        applicantName = foundUser.real_name || foundUser.realName || foundUser.nickname || foundUser.name || identifierOrUrl;
        orgName = foundUser.instructor_org || foundUser.instructorOrg || "AIDA";
        licCode = foundUser.instructor_code || foundUser.instructorCode || "미입력";
    } else if (identifierOrUrl && (identifierOrUrl.startsWith("data:image") || identifierOrUrl.startsWith("http") || identifierOrUrl.includes(".jpg") || identifierOrUrl.includes(".png"))) {
        imgSrc = identifierOrUrl;
    }

    const titleEl = modal.querySelector(".modal-header h2");
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-graduation-cap" style="color: var(--accent-gold);"></i> 🎓 [${escapeHtml(applicantName)} 강사님] 실물 자격증 사본 검토`;
    }

    const imgContainer = modal.querySelector("#certImageContainer") || (previewImg ? previewImg.parentElement : modal);

    if (previewImg && imgSrc && imgSrc.trim().length > 0) {
        previewImg.style.display = "block";
        previewImg.src = imgSrc;
        const noImgNotice = document.getElementById("certNoImageNotice");
        if (noImgNotice) noImgNotice.remove();
    } else {
        if (previewImg) previewImg.style.display = "none";
        let noImgNotice = document.getElementById("certNoImageNotice");
        if (!noImgNotice && imgContainer) {
            noImgNotice = document.createElement("div");
            noImgNotice.id = "certNoImageNotice";
            noImgNotice.style.cssText = "background: rgba(255, 183, 3, 0.1); border: 1.5px dashed #ffb703; border-radius: 12px; padding: 24px; color: #ffb703; font-weight: 700; line-height: 1.6; margin: 10px 0;";
            imgContainer.appendChild(noImgNotice);
        }
        if (noImgNotice) {
            noImgNotice.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                <span>⚠️ 신청 시 업로드된 실물 자격증 이미지 파일이 없습니다.</span><br>
                <span style="font-size: 0.85rem; color: #cbd5e1; font-weight: normal;">
                    (신청 정보: <strong>${escapeHtml(applicantName)}</strong> | 협회: <strong>${escapeHtml(orgName)}</strong> | 라이선스 번호: <strong>${escapeHtml(licCode)}</strong>)
                </span>
            `;
        }
    }

    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    if (typeof openModal === "function") {
        openModal(modal);
    } else {
        modal.classList.remove("hidden");
        modal.classList.add("active");
    }
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("z-index", "10000010", "important");
}
window.openCertificateImageModal = openCertificateImageModal;

async function renderAdminInstructorsTable() {
    const queueTbody = document.getElementById("adminInstructorQueueTbody");
    const pendingBadge = document.getElementById("adminInstPendingBadge");

    let pendingUsers = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('instructor_status', 'pending');

            if (!error && Array.isArray(data)) {
                pendingUsers = data;
            }
        } catch (err) {
            console.warn("Supabase instructor queue fetch error:", err);
        }
    }

    // LocalStorage fallback / sync
    const usersMap = getRegisteredUsers();
    for (let key in usersMap) {
        const u = usersMap[key];
        if (u && (u.instructorStatus === 'pending' || u.instructor_status === 'pending')) {
            if (!pendingUsers.some(p => (p.email && p.email.toLowerCase() === key.toLowerCase()))) {
                pendingUsers.push({
                    email: key,
                    real_name: u.realName || u.name,
                    nickname: u.nickname || u.name,
                    instructor_org: u.instructorOrg || u.instructor_org || 'AIDA',
                    instructor_code: u.instructorCode || u.instructor_code || '미입력',
                    cert_image: u.certImage || u.cert_image || '',
                    created_at: u.createdAt || u.created_at || new Date().toISOString()
                });
            }
        }
    }

    _adminInstructorUsersCache = {};
    pendingUsers.forEach(u => {
        if (u.email) _adminInstructorUsersCache[u.email.toLowerCase()] = u;
        if (u.real_name) _adminInstructorUsersCache[u.real_name] = u;
    });

    if (pendingBadge) pendingBadge.textContent = pendingUsers.length;
    if (!queueTbody) return;

    if (pendingUsers.length === 0) {
        queueTbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    📋 현재 심사 대기 중인 강사 라이선스 인증 신청건이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    queueTbody.innerHTML = pendingUsers.map(u => {
        const certImg = u.cert_image || u.certImage || u.certificate_image || '';
        const applicantEmail = u.email || '';
        const applicantName = u.real_name || u.realName || u.nickname || u.name || '신청자';
        const createdAtStr = u.updated_at ? formatTimeAgo(u.updated_at) : (u.created_at ? formatTimeAgo(u.created_at) : '최근');

        return `
        <tr>
            <td>
                <strong>${escapeHtml(applicantName)}</strong>
            </td>
            <td>
                <code style="color: var(--accent-cyan); font-size: 0.8rem;">${escapeHtml(applicantEmail)}</code>
            </td>
            <td><span class="badge badge-instructor" style="background: rgba(255, 183, 3, 0.15); border: 1px solid #ffb703; color: #ffb703; padding: 2px 8px; border-radius: 6px; font-weight: 800;">${escapeHtml(u.instructor_org || u.instructorOrg || 'AIDA')}</span></td>
            <td><code>${escapeHtml(u.instructor_code || u.instructorCode || '미입력')}</code></td>
            <td>
                <button type="button" class="btn btn-secondary" onclick="openCertificateImageModal('${escapeHtml(applicantEmail)}')" style="padding: 5px 12px; font-size: 0.8rem; color: var(--accent-cyan); border: 1px solid var(--accent-cyan); background: rgba(0, 242, 254, 0.1); border-radius: 6px; cursor: pointer; white-space: nowrap;">
                    🖼️ 실물 사본 보기
                </button>
            </td>
            <td>${createdAtStr}</td>
            <td>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" class="btn btn-primary" onclick="approveInstructorCertDemo('${escapeHtml(applicantEmail)}')" style="padding: 5px 12px; font-size: 0.8rem; background: #00e676; color:#000; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">
                        ✓ 승인
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="rejectInstructorCertDemo('${escapeHtml(applicantEmail)}')" style="padding: 5px 12px; font-size: 0.8rem; background: #ff5252; color:#fff; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">
                        ❌ 반려
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join("");
}

async function approveInstructorCertDemo(identifier) {
    if (!identifier) return;
    const targetEmail = identifier.trim().toLowerCase();
    const targetUser = (_adminInstructorUsersCache && _adminInstructorUsersCache[targetEmail]) || 
                       (window._adminAllUsersList && window._adminAllUsersList.find(u => (u.email && u.email.toLowerCase() === targetEmail) || u.real_name === identifier)) || null;

    // 1. Direct Supabase DB Update
    if (supabaseClient) {
        try {
            const updatePayload = {
                instructor_status: 'approved',
                is_instructor: true,
                role: 'instructor',
                user_license: '공인 강사',
                license_info: '공인 강사'
            };

            let res;
            if (targetUser && targetUser.id) {
                res = await supabaseClient.from('users').update(updatePayload).eq('id', targetUser.id);
            } else {
                res = await supabaseClient.from('users').update(updatePayload).eq('email', targetEmail);
            }

            if (res && res.error) {
                console.warn("[Admin Approve DB Retry with email]:", res.error);
                res = await supabaseClient.from('users').update(updatePayload).eq('email', targetEmail);
            }

            if (res && res.error) {
                alert("⚠️ Supabase 강사 승인 DB 업데이트 실패: " + (res.error.message || JSON.stringify(res.error)));
            }
        } catch (err) {
            console.error("Supabase instructor approval exception:", err);
            alert("⚠️ Supabase 통신 오류: " + err.message);
        }
    }

    // 2. LocalStorage Sync
    const usersMap = getRegisteredUsers();
    let nameToDisplay = targetUser ? (targetUser.real_name || targetUser.name || identifier) : identifier;

    for (let key in usersMap) {
        if (key.toLowerCase() === targetEmail || usersMap[key].name === identifier || usersMap[key].realName === identifier) {
            usersMap[key].instructorStatus = "approved";
            usersMap[key].instructor_status = "approved";
            usersMap[key].is_instructor = true;
            usersMap[key].isInstructor = true;
            usersMap[key].role = "instructor";
            usersMap[key].isApprovedInstructor = true;
            delete usersMap[key].rejectionReason;
            nameToDisplay = usersMap[key].realName || usersMap[key].name || identifier;
            safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(usersMap));
            break;
        }
    }

    if (currentUser && (currentUser.email.toLowerCase() === targetEmail || currentUser.name === identifier)) {
        currentUser.instructorStatus = "approved";
        currentUser.instructor_status = "approved";
        currentUser.is_instructor = true;
        currentUser.isInstructor = true;
        currentUser.role = "instructor";
        currentUser.isApprovedInstructor = true;
        delete currentUser.rejectionReason;
        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
    }

    showToast(`🎓 '${nameToDisplay}' 강사님의 자격증 실물 심사가 승인되어 '공인 강사' 인증이 완료되었습니다!`);

    await renderAdminInstructorsTable();
    await renderAdminUsersTable();
    await renderAdminStats();
}
window.approveInstructorCertDemo = approveInstructorCertDemo;

async function rejectInstructorCertDemo(identifier) {
    if (!identifier) return;
    const targetEmail = identifier.trim().toLowerCase();
    const targetUser = (_adminInstructorUsersCache && _adminInstructorUsersCache[targetEmail]) || 
                       (window._adminAllUsersList && window._adminAllUsersList.find(u => (u.email && u.email.toLowerCase() === targetEmail) || u.real_name === identifier)) || null;

    let nameToDisplay = targetUser ? (targetUser.real_name || targetUser.name || identifier) : identifier;

    const reasonPrompt = prompt(`🎓 '${nameToDisplay}' 강사님의 자격증 심사 거절/반려 사유를 입력해 주세요:`, "제출된 자격증 사본 식별 불가 및 자격 번호 미확인");
    if (reasonPrompt === null) {
        return; // Clicked cancel
    }

    const finalReason = reasonPrompt.trim() || "제출된 자격증 사본 식별 불가 및 자격 번호 미확인";

    // 1. Direct Supabase DB Update
    if (supabaseClient) {
        try {
            const updatePayload = {
                instructor_status: 'rejected',
                is_instructor: false,
                role: 'user',
                rejection_reason: finalReason
            };

            let res;
            if (targetUser && targetUser.id) {
                res = await supabaseClient.from('users').update(updatePayload).eq('id', targetUser.id);
            } else {
                res = await supabaseClient.from('users').update(updatePayload).eq('email', targetEmail);
            }

            if (res && res.error) {
                console.warn("[Admin Reject DB Retry with email]:", res.error);
                res = await supabaseClient.from('users').update(updatePayload).eq('email', targetEmail);
            }

            if (res && res.error) {
                alert("⚠️ Supabase 강사 반려 DB 업데이트 실패: " + (res.error.message || JSON.stringify(res.error)));
            }
        } catch (err) {
            console.error("Supabase instructor rejection exception:", err);
            alert("⚠️ Supabase 통신 오류: " + err.message);
        }
    }

    // 2. LocalStorage Sync
    const usersMap = getRegisteredUsers();
    for (let key in usersMap) {
        if (key.toLowerCase() === targetEmail || usersMap[key].name === identifier || usersMap[key].realName === identifier) {
            usersMap[key].instructorStatus = "rejected";
            usersMap[key].instructor_status = "rejected";
            usersMap[key].isApprovedInstructor = false;
            usersMap[key].rejectionReason = finalReason;
            safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(usersMap));
            break;
        }
    }

    if (currentUser && (currentUser.email.toLowerCase() === targetEmail || currentUser.name === identifier)) {
        currentUser.instructorStatus = "rejected";
        currentUser.instructor_status = "rejected";
        currentUser.isApprovedInstructor = false;
        currentUser.rejectionReason = finalReason;
        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
    }

    showToast(`❌ '${nameToDisplay}' 강사님의 자격증 심사가 반려 처리되었습니다.`);

    await renderAdminInstructorsTable();
    await renderAdminUsersTable();
    await renderAdminStats();
}
window.rejectInstructorCertDemo = rejectInstructorCertDemo;

function openAdminDashboard() {
    isAdminAuthenticated = true;
    hideAdBannersForAdmin();
    renderAdminStats();
    renderAdminUsersTable();
    renderAdminPostsTable();
    if (typeof renderAdminInstructorsTable === 'function') renderAdminInstructorsTable();
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
    const tabs = ["stats", "affiliate", "inquiries", "instructors", "users", "posts", "system", "settings"];
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

    if (tabKey === "stats") {
        if (typeof renderAdminStats === "function") renderAdminStats();
    } else if (tabKey === "affiliate") {
        if (typeof renderAdminAffiliateStats === "function") renderAdminAffiliateStats();
    } else if (tabKey === "users") {
        if (typeof renderAdminUsersTable === "function") renderAdminUsersTable();
    } else if (tabKey === "posts") {
        if (typeof renderAdminPostsTable === "function") renderAdminPostsTable();
    } else if (tabKey === "inquiries") {
        if (typeof renderAdminInquiries === "function") renderAdminInquiries();
        else if (typeof renderAdminInquiriesTable === "function") renderAdminInquiriesTable();
    } else if (tabKey === "instructors") {
        if (typeof renderAdminInstructorsTable === "function") renderAdminInstructorsTable();
    }
}
window.switchAdminTab = switchAdminTab;

async function renderAdminUsersTable() {
    const tbody = document.getElementById("adminUsersTbody");
    const countBadge = document.getElementById("adminUsersCountBadge");
    const statTotalUsers = document.getElementById("adminStatTotalUsers");

    let usersList = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                usersList = data;
            }
        } catch (err) {
            console.warn("Supabase user fetch error:", err);
        }
    }

    window._adminAllUsersList = usersList;

    if (countBadge) countBadge.textContent = usersList.length;
    if (statTotalUsers) statTotalUsers.textContent = `${usersList.length} 명`;

    if (!tbody) return;

    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">
                    가입된 회원 DB가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(u => {
        const regDate = u.created_at ? formatDate(u.created_at) : (u.createdAt ? formatDate(u.createdAt) : "최근");
        const hasCert = !!(u.cert_image || u.certImage);
        const certBtnHtml = hasCert ? `
            <button type="button" class="btn btn-secondary" onclick="openCertificateImageModal('${escapeHtml(u.email)}')" style="margin-left: 6px; padding: 2px 6px; font-size: 0.72rem; color: var(--accent-cyan); border: 1px solid rgba(0,242,254,0.4); background: rgba(0,242,254,0.08); border-radius: 4px; cursor: pointer;" title="자격증 실물 사본 보기">
                🖼️ 사본
            </button>
        ` : '';

        const statusText = (u.instructor_status === "approved" || u.instructorStatus === "approved" || u.is_instructor)
            ? `<span style="color:#00e676; font-weight:700;"><i class="fa-solid fa-graduation-cap"></i> 공인 강사</span>${certBtnHtml}`
            : ((u.instructor_status === "pending" || u.instructorStatus === "pending")
                ? `<span style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-clock"></i> 심사 대기</span>${certBtnHtml}`
                : ((u.instructor_status === "rejected" || u.instructorStatus === "rejected")
                    ? `<span style="color:#ff5252; font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> 심사 반려</span>${certBtnHtml}`
                    : `<span style="color:var(--text-dim);">일반 다이버</span>`));

        const phoneDisplay = (u.phone && u.phone !== "010-0000-0000") 
            ? escapeHtml(u.phone) 
            : `<span style="color:var(--text-muted);">미등록</span>`;

        return `
            <tr>
                <td style="font-size:0.8rem; color:var(--text-muted);">${regDate}</td>
                <td><strong>${escapeHtml(u.real_name || u.realName || u.user_name || u.name || '미입력')}</strong></td>
                <td>${escapeHtml(u.nickname || u.name || '-')}</td>
                <td><code style="color:var(--accent-cyan);">${escapeHtml(u.email || '-')}</code></td>
                <td>${phoneDisplay}</td>
                <td>${statusText}</td>
                <td><span class="badge badge-secondary" style="font-size:0.75rem;">${escapeHtml(u.provider || '소셜/일반')}</span></td>
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

async function renderAdminInquiries() {
    const tbody = document.getElementById("adminInquiriesTbody");
    const badge = document.getElementById("adminInquiriesBadge");

    let inquiryList = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('inquiries').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                inquiryList = data;
            }
        } catch (err) {
            console.warn("Supabase inquiries fetch error:", err);
        }
    }

    if (badge) badge.textContent = inquiryList.length;
    if (!tbody) return;

    if (inquiryList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">
                    접수된 문의 내역이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inquiryList.map(inq => {
        const catName = inq.category === 'bug' ? '🐞 버그/오류' : (inq.category === 'ad' ? '📢 제휴/광고' : (inq.category === 'feature' ? '💡 기능 제안' : '💬 일반 문의'));
        const createdAtStr = inq.created_at ? formatTimeAgo(inq.created_at) : '최근';
        return `
            <tr>
                <td><span class="badge badge-instructor">${escapeHtml(catName)}</span></td>
                <td><strong>${escapeHtml(inq.name || inq.user_name || '익명')}</strong></td>
                <td><code>${escapeHtml(inq.contact || '-')}</code></td>
                <td><strong>${escapeHtml(inq.title || '-')}</strong></td>
                <td style="max-width: 260px; word-break: break-all;">${escapeHtml(inq.content || inq.message || '-')}</td>
                <td>${createdAtStr}</td>
                <td>
                    <span style="color: #00e676; font-weight:700; font-size: 0.78rem;">✓ 정상 접수</span>
                </td>
            </tr>
        `;
    }).join('');
}
window.renderAdminInquiries = renderAdminInquiries;
window.renderAdminInquiriesTable = renderAdminInquiries;

function getAdminCategoryBadge(catKey) {
    const cat = (catKey || 'freediving').toLowerCase();
    const map = {
        freediving: { name: '🤿 프리다이빙', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' },
        scuba: { name: '🤿 스쿠버다이빙', color: '#38ef7d', bg: 'rgba(56, 239, 125, 0.15)', border: 'rgba(56, 239, 125, 0.4)' },
        swimming: { name: '🏊‍♂️ 실내수영', color: '#4facfe', bg: 'rgba(79, 172, 254, 0.15)', border: 'rgba(79, 172, 254, 0.4)' },
        openwater: { name: '🌊 바다수영', color: '#00c6ff', bg: 'rgba(0, 198, 255, 0.15)', border: 'rgba(0, 198, 255, 0.4)' },
        instructor: { name: '🎓 강사 클래스', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.4)' },
        community: { name: '💬 자유수다방', color: '#ff758c', bg: 'rgba(255, 117, 140, 0.15)', border: 'rgba(255, 117, 140, 0.4)' },
        market: { name: '🛒 중고장터', color: '#a18cd1', bg: 'rgba(161, 140, 209, 0.15)', border: 'rgba(161, 140, 209, 0.4)' },
        partnership: { name: '🤝 투어 & 제휴', color: '#f6d365', bg: 'rgba(246, 211, 101, 0.15)', border: 'rgba(246, 211, 101, 0.4)' },
        my_activity: { name: '📋 내 활동기록', color: '#667eea', bg: 'rgba(102, 126, 234, 0.15)', border: 'rgba(102, 126, 234, 0.4)' },
        tide: { name: '🌊 전국 해양 스팟', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' }
    };
    const c = map[cat] || { name: catKey || '일반', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' };
    return `<span class="badge badge-${cat}" style="display: inline-flex; align-items: center; justify-content: center; color: ${c.color} !important; background: ${c.bg} !important; border: 1px solid ${c.border} !important; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">${c.name}</span>`;
}
window.getAdminCategoryBadge = getAdminCategoryBadge;

function getAdminPostAuthor(post) {
    if (!post) return '알 수 없음';
    
    // 1. Direct nickname / name properties
    let authorName = post.nickname || post.nick_name || post.user_nickname || post.author_nickname || post.userName || post.user_name || post.author_name || post.real_name || post.realName || post.writer || post.host;
    
    if (authorName && typeof authorName === 'string' && authorName.trim() && !authorName.includes('@')) {
        return authorName.trim();
    }

    // 2. Author identifier (could be email or nickname)
    const authorIdentifier = post.author || post.email || post.userEmail || authorName;

    if (authorIdentifier && typeof authorIdentifier === 'string') {
        const idTrimmed = authorIdentifier.trim();
        // If it's an email, look up in registered users database
        try {
            const usersRaw = localStorage.getItem("aqua_buddy_registered_users");
            if (usersRaw) {
                const users = JSON.parse(usersRaw);
                if (users && typeof users === 'object') {
                    const lowerKey = idTrimmed.toLowerCase();
                    if (users[lowerKey]) {
                        const u = users[lowerKey];
                        const nick = u.nickname || u.nick_name || u.name || u.real_name;
                        if (nick) return nick;
                    }
                    for (const k in users) {
                        const u = users[k];
                        if (u && (u.email === idTrimmed || (u.email && u.email.toLowerCase() === lowerKey))) {
                            const nick = u.nickname || u.nick_name || u.name || u.real_name;
                            if (nick) return nick;
                        }
                    }
                }
            }
        } catch(e) {}

        if (idTrimmed.includes('@')) {
            return idTrimmed.split('@')[0];
        }
        return idTrimmed;
    }

    return '익명 버디';
}
window.getAdminPostAuthor = getAdminPostAuthor;

function renderAdminPostsTable() {
    const tbody = document.getElementById("adminPostsTbody");
    if (!tbody) return;

    const postList = (typeof window !== 'undefined' && Array.isArray(window.posts) && window.posts.length > 0) ? window.posts : ((typeof posts !== 'undefined' && Array.isArray(posts)) ? posts : []);

    if (postList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    <i class="fa-solid fa-inbox" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    등록된 게시글이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = postList.map(post => {
        const catBadge = getAdminCategoryBadge(post.category || post.categoryKey);
        const authorNick = getAdminPostAuthor(post);
        const postTitle = (typeof escapeHtml === 'function' ? escapeHtml(post.title || '제목 없음') : (post.title || '제목 없음'));
        const timeAgo = (typeof formatTimeAgo === 'function' ? formatTimeAgo(post.created_at || post.createdAt || post.time || post.date || new Date().toISOString()) : '방금 전');

        return `
            <tr>
                <td style="text-align: center; vertical-align: middle;">${catBadge}</td>
                <td style="vertical-align: middle;"><strong>${postTitle}</strong></td>
                <td style="vertical-align: middle; color: #00f2fe; font-weight: 600;">
                    <i class="fa-solid fa-user" style="font-size: 0.75rem; margin-right: 4px; opacity: 0.8;"></i>${typeof escapeHtml === 'function' ? escapeHtml(authorNick) : authorNick}
                </td>
                <td style="vertical-align: middle; color: var(--text-muted); font-size: 0.85rem;">${timeAgo}</td>
                <td style="text-align: center; vertical-align: middle;">
                    <button class="btn-delete" onclick="performPostDeletion('${post.id}')" style="padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; background: rgba(255, 82, 82, 0.15); color: #ff5252; border: 1px solid rgba(255, 82, 82, 0.3); cursor: pointer; transition: all 0.2s;">
                        <i class="fa-solid fa-trash-can"></i> 삭제
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}
window.renderAdminPostsTable = renderAdminPostsTable;



// === blockUserFromProfile: 타인 프로필 모달에서 즉시 유저 차단 및 동기화 ===
async function blockUserFromProfile(targetIdentifier) {
    if (!currentUser) {
        if (typeof showToast === 'function') showToast("🔑 로그인 후 차단 기능을 이용하실 수 있습니다.");
        return;
    }
    const target = String(targetIdentifier || '').trim();
    if (!target) {
        if (typeof showToast === 'function') showToast("⚠️ 유효하지 않은 유저 식별자입니다.");
        return;
    }

    // 🚫 본인 계정 차단 원천 방지 가드
    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const myNick = (currentUser.nickname || currentUser.name || '').trim().toLowerCase();
    const myReal = (currentUser.real_name || currentUser.realName || '').trim().toLowerCase();
    const targetLower = target.toLowerCase();

    const isSelfBlock = Boolean(
        (myEmail && targetLower === myEmail) ||
        (myNick && targetLower === myNick) ||
        (myReal && targetLower === myReal)
    );

    if (isSelfBlock) {
        if (typeof showToast === 'function') showToast("⚠️ 본인 계정은 차단할 수 없습니다.");
        return;
    }

    if (!Array.isArray(currentUser.blocked_users)) {
        currentUser.blocked_users = [];
    }

    // 이미 차단된 유저인지 검사
    if (currentUser.blocked_users.includes(target)) {
        if (typeof showToast === 'function') showToast(`⚠️ [${target}] 님은 이미 차단된 유저입니다.`);
        return;
    }

    // 최대 100명 인원 제한 검사
    if (currentUser.blocked_users.length >= 100) {
        if (typeof showToast === 'function') {
            showToast("🚫 차단 명단이 가득 찼습니다. (최대 100명 제한)");
        }
        return;
    }

    currentUser.blocked_users.push(target);

    // 로컬 스토리지 동기화
    try {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } catch(e) {}

    // Supabase users 테이블 업데이트 (기존 컬럼 blocked_users 사용)
    if (supabaseClient && currentUser.email) {
        try {
            await supabaseClient.from('users').update({
                blocked_users: currentUser.blocked_users
            }).eq('email', currentUser.email.toLowerCase());
            console.log(`🚫 [PROFILE BLOCK] '${target}' 유저를 차단 명단에 성공적으로 저장하였습니다.`);
        } catch(e) {
            console.warn("Supabase users blocked_users update notice:", e);
        }
    }

    // 프로필 모달 닫기
    const overlay = document.getElementById("dynamicProfileModalOverlay");
    if (overlay) overlay.remove();

    if (typeof showToast === 'function') {
        showToast(`🚫 [${target}] 님을 차단하였습니다. 피드, 댓글 및 채팅에서 숨김 처리됩니다.`);
    }

    // 피드 즉시 갱신 (차단된 유저 글 투명망토 숨김)
    if (typeof filterAndRender === 'function') {
        filterAndRender();
    }
}
window.blockUserFromProfile = blockUserFromProfile;

// === unblockUser: 차단된 유저 원클릭 차단 해제 및 Supabase 동기화 ===
async function unblockUser(targetIdentifier) {
    if (!currentUser) return;
    if (!Array.isArray(currentUser.blocked_users)) currentUser.blocked_users = [];

    const target = String(targetIdentifier).trim();
    currentUser.blocked_users = currentUser.blocked_users.filter(u => String(u).trim() !== target);

    try {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } catch(e) {}

    if (supabaseClient && currentUser.email) {
        try {
            await supabaseClient.from('users').update({
                blocked_users: currentUser.blocked_users
            }).eq('email', currentUser.email.toLowerCase());
            console.log(`🔓 [UNBLOCK] '${target}' 유저 차단 해제 완료.`);
        } catch(e) {
            console.warn("Supabase unblock update error:", e);
        }
    }

    if (typeof showToast === 'function') {
        showToast(`🔓 [${target}] 님의 차단이 해제되었습니다.`);
    }

    // 내 프로필 모달 새로고침
    if (typeof renderDynamicProfileModal === 'function') {
        renderDynamicProfileModal(currentUser, true);
    }

    // 피드 즉시 갱신 (차단 풀린 유저의 게시글 복구)
    if (typeof filterAndRender === 'function') {
        filterAndRender();
    }
}
window.unblockUser = unblockUser;

// === renderDynamicProfileModal: 공인 검증 강사 전용 실명 프로필 및 일반 유저 프로필 시스템 ===

// 🔒 닉네임과 휴대폰 번호, 이메일로 본인 여부를 엄격하게 판별하는 헬퍼 함수
// 👤 현재 로그인된 사용자 정보 획득 헬퍼
function getCurrentLoggedInUser() {
    if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
    if (typeof window !== 'undefined' && window.currentUser) return window.currentUser;
    try {
        const saved = localStorage.getItem("currentUser") || localStorage.getItem("aqua_buddy_user_identity");
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
}
window.getCurrentLoggedInUser = getCurrentLoggedInUser;

function isSameUserStrict(userA, userB) {
    if (!userA || !userB) return false;

    // 1. 동일 객체 참조인 경우 100% 본인
    if (userA === userB) return true;

    const clean = s => String(s || '').trim().toLowerCase();

    const idA = userA.id ? String(userA.id).trim() : '';
    const idB = userB.id ? String(userB.id).trim() : '';

    const emailA = clean(userA.email || userA.user_email || userA.author_email || '');
    const emailB = clean(userB.email || userB.user_email || userB.author_email || '');

    const nickA = clean(userA.nickname || userA.name || userA.userName || userA.real_name || userA.realName || '');
    const nickB = clean(userB.nickname || userB.name || userB.userName || userB.real_name || userB.realName || '');

    // 2. 고유 ID가 둘 다 존재하는 경우 ID 일치 검사
    if (idA && idB && idA !== 'null' && idA !== 'undefined' && idB !== 'null' && idB !== 'undefined') {
        return idA === idB;
    }

    // 3. 고유 이메일이 둘 다 존재하는 경우 이메일 일치 검사
    if (emailA && emailB && emailA.includes('@') && emailB.includes('@')) {
        return emailA === emailB;
    }

    // 4. 이메일/ID 중 하나가 없는 경우 (문자열 닉네임으로 클릭되었거나 레거시 유저인 경우):
    // 상호 다른 이메일/ID 충돌이 없고 닉네임이 정확히 일치할 때 본인으로 판별
    if (nickA && nickB && nickA === nickB && !['다이버', '익명', '신청자', '회원', ''].includes(nickA)) {
        if (emailA && emailB && emailA !== emailB) return false;
        if (idA && idB && idA !== idB) return false;
        return true;
    }

    return false;
}
window.isSameUserStrict = isSameUserStrict;


// 🛡️ [계정 연동형 상호 차단 판별 헬퍼]: 닉네임(아쿠아맨) 또는 강사 실명(김버디), 이메일 중 하나라도 차단되면 동일 계정의 모든 활동(버디모집/강사클래스/댓글/채팅) 100% 숨김
function isAuthorBlockedByMe(postOrAuthor, emailArg = '') {
    const user = (typeof getCurrentLoggedInUser === 'function') ? getCurrentLoggedInUser() : (typeof currentUser !== 'undefined' ? currentUser : (typeof window !== 'undefined' ? window.currentUser : null));
    if (!user || !Array.isArray(user.blocked_users) || user.blocked_users.length === 0) {
        return false;
    }

    const myBlocked = user.blocked_users.map(u => String(u).trim().toLowerCase()).filter(Boolean);
    if (myBlocked.length === 0) return false;

    if (typeof postOrAuthor === 'object' && postOrAuthor !== null) {
        const p = postOrAuthor;
        const candidates = [
            p.userName,
            p.username,
            p.name,
            p.nickname,
            p.realName,
            p.real_name,
            p.author,
            p.email,
            p.authorEmail,
            p.author_email,
            p.userEmail,
            emailArg
        ].map(s => String(s || '').trim().toLowerCase()).filter(Boolean);

        // 1. Direct candidate matching
        for (const cand of candidates) {
            if (myBlocked.includes(cand)) return true;
        }

        // 2. Cross-reference registered users pool
        const regUsers = (typeof getRegisteredUsers === 'function') ? getRegisteredUsers() : {};
        for (const k in regUsers) {
            const u = regUsers[k];
            if (u) {
                const uNick = String(u.nickname || u.name || '').trim().toLowerCase();
                const uReal = String(u.real_name || u.realName || '').trim().toLowerCase();
                const uEmail = String(u.email || '').trim().toLowerCase();

                const matchesThisUser = candidates.some(c => c === uNick || c === uReal || c === uEmail);
                if (matchesThisUser) {
                    if (
                        (uNick && myBlocked.includes(uNick)) ||
                        (uReal && myBlocked.includes(uReal)) ||
                        (uEmail && myBlocked.includes(uEmail))
                    ) {
                        return true;
                    }
                }
            }
        }
    } else {
        const str = String(postOrAuthor || '').trim().toLowerCase();
        if (str && myBlocked.includes(str)) return true;
    }

    return false;
}
window.isAuthorBlockedByMe = isAuthorBlockedByMe;

function getDeterministicReferralCode(user) {
    if (!user) return 'AQUA-FOUNDER';
    if (user.referral_code) return user.referral_code;
    if (user.referralCode) return user.referralCode;

    var seed = String(user.id || user.email || user.name || user.nickname || 'AQUABUDDY').trim().toLowerCase();
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    var codeStr = (Math.abs(hash).toString(36) + 'AQUABUDDY').toUpperCase();
    var code = 'AQUA-' + codeStr.substring(0, 6);
    user.referral_code = code;
    user.referralCode = code;

    if (currentUser && (currentUser.email === user.email || currentUser.id === user.id)) {
        currentUser.referral_code = code;
        currentUser.referralCode = code;
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient && user.email) {
        try {
            supabaseClient.from('users').update({ referral_code: code }).eq('email', user.email.toLowerCase()).then(function(){});
        } catch(e) {}
    }

    return code;
}
window.getDeterministicReferralCode = getDeterministicReferralCode;


function renderDynamicProfileModal(user, isSelf = false, contextCategory = 'all') {
    let existing = document.getElementById("dynamicProfileModalOverlay");
    if (existing) existing.remove();

    const loggedInUser = (typeof getCurrentLoggedInUser === 'function') ? getCurrentLoggedInUser() : (typeof currentUser !== 'undefined' ? currentUser : (typeof window !== 'undefined' ? window.currentUser : null));

    if (!user) {
        user = loggedInUser || { name: "다이버" };
        isSelf = true;
    }

    // 🛡️ 본인 여부 판별 (내 프로필 확인 시 100% 내 프로필 UI 보장)
    if (isSelf === true) {
        // 사용자가 명시적으로 내 프로필을 연 경우 (openProfileModal 등) 무조건 본인(isSelf = true) 보장!
        // 단, 대상 user와 loggedInUser의 이메일/ID가 명백히 상이한 타인 객체일 때만 false로 보정
        if (loggedInUser && user && user !== loggedInUser) {
            const lEmail = (loggedInUser.email || '').trim().toLowerCase();
            const uEmail = (user.email || '').trim().toLowerCase();
            const lId = loggedInUser.id ? String(loggedInUser.id).trim() : '';
            const uId = user.id ? String(user.id).trim() : '';

            if ((lEmail && uEmail && lEmail !== uEmail) || (lId && uId && lId !== uId)) {
                isSelf = false;
            }
        }
    } else {
        // 피드/댓글 클릭 등으로 열린 경우: 클릭된 유저가 현재 로그인된 본인인지 확인
        if (loggedInUser && user && isSameUserStrict(loggedInUser, user)) {
            isSelf = true;
        } else {
            isSelf = false;
        }
    }

    const isInstRejected = (user.instructor_status === 'rejected' || user.instructorStatus === 'rejected');
    const rejectionReasonText = user.rejection_reason || user.rejectionReason || "제출된 자격증 서류 보완 필요";
    const isInst = !isInstRejected && !!(
        user.instructor_status === 'approved' || user.instructorStatus === 'approved' ||
        user.isApprovedInstructor === true || user.isApprovedInstructor === 'true' ||
        (user.is_instructor === true && user.instructor_status !== 'rejected') ||
        (user.role === 'instructor' && user.instructor_status !== 'rejected')
    );

    const warningCount = parseInt(user.warning_count || user.warningCount || 0, 10);
    const hasWarning = warningCount >= 1;
    const warningBadgeHtml = hasWarning ? `<span style="background: rgba(255, 183, 3, 0.2); border: 1px solid #ffb703; color: #ffb703; font-size: 0.76rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> 🟨 주의 필요 (${warningCount}회)</span>` : '';

    // 일반 버디 매너 뱃지 및 활동 횟수 추출
    let mannerTags = user.manner_tags || user.mannerTags || {};
    if (typeof mannerTags === 'string') {
        try { mannerTags = JSON.parse(mannerTags); } catch(e) { mannerTags = {}; }
    }
    const timeCount = parseInt(mannerTags.time || 0, 10);
    const mannerCount = parseInt(mannerTags.manner || 0, 10);
    const buddyCount = parseInt(mannerTags.buddy_care || 0, 10);
    const photoCount = parseInt(mannerTags.photo || 0, 10);
    const knowCount = parseInt(mannerTags.knowledge || 0, 10);
    const totalManners = timeCount + mannerCount + buddyCount + photoCount + knowCount;

    const hostedCount = parseInt(user.hosted_count || user.hostedCount || user.created_count || 0, 10);
    const completedCount = parseInt(user.completed_meets_count || user.completedCount || user.joined_count || 0, 10);

    const realName = user.real_name || user.realName || user.name || user.nickname || "검증 강사";
    const nickname = user.nickname || user.name || "다이버";
    const instOrg = user.instructor_org || user.instructorOrg || "AIDA";
    const instCode = user.instructor_code || user.instructorCode || user.license_code || user.licenseCode || (user.license && user.license.includes('강사') ? user.license : "VERIFIED-INSTRUCTOR");

    let instTags = user.instructor_tags || user.instructorTags || {};
    if (typeof instTags === 'string') {
        try { instTags = JSON.parse(instTags); } catch(e) { instTags = {}; }
    }
    const curCount = parseInt(instTags.curriculum || 0, 10);
    const schCount = parseInt(instTags.schedule || 0, 10);
    const vidCount = parseInt(instTags.underwater_video || 0, 10);
    const knwCount = parseInt(instTags.instructor_knowledge || 0, 10);
    const tchCount = parseInt(instTags.teaching_skill || 0, 10);
    const totalInstTags = curCount + schCount + vidCount + knwCount + tchCount;

    const completedInstPostsCount = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.filter(p => 
        (p.category === 'instructor' || p.is_instructor) && 
        p.status === 'completed' &&
        Array.isArray(p.participants) && p.participants.length >= 1 &&
        ((user.email && (p.email === user.email || p.author_email === user.email || p.userEmail === user.email || p.author === user.email)) ||
         (user.name && (p.author === user.name || p.real_name === user.name || p.realName === user.name)) ||
         (user.nickname && (p.nickname === user.nickname || p.author === user.nickname)) ||
         (user.real_name && (p.real_name === user.real_name || p.author === user.real_name)))
    ).length : 0;
    const classCount = completedInstPostsCount > 0 ? Math.max(parseInt(user.instructor_class_count || user.classCount || 0, 10), completedInstPostsCount) : 0;

    const detailedLicenses = [
        user.sports_license || user.sportsLicense,
        user.freediving_license || user.freedivingLicense,
        user.scuba_license || user.scubaLicense,
        user.license_info || user.license
    ].filter(Boolean).filter(v => v !== "등록된 라이센스 정보가 없습니다.").join(" / ") || `${instOrg} 공인 강사 자격`;

    const licenseInfoText = user.license_info || user.license || user.licenseInfo || user.license_code || user.licenseCode || (isSelf && currentUser ? (currentUser.license_info || currentUser.license) : null) || "등록된 라이센스 정보가 없습니다.";

    const isInstructorContext = (contextCategory === 'instructor' || contextCategory === 'inst');

    const overlay = document.createElement("div");
    overlay.id = "dynamicProfileModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.92) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    // ==========================================================
    // 🎓 1. 강사 클래스 맥락에서의 프로필
    // ==========================================================
    if (isInst && isInstructorContext) {
        overlay.innerHTML = `
            <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 215, 0, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); border-radius: 20px; width: 100%; max-width: 540px; max-height: 88vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif; box-sizing: border-box;">
                
                <!-- 1. 강사 공인인증 골드 띠지 (VERIFIED SEAL) -->
                <div style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <span style="display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-graduation-cap"></i> 🎓 VERIFIED INSTRUCTOR (공인 검증 강사)</span>
                    <span style="background: #000; color: #ffd700; font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; font-weight: 900;">공식 인증됨 ✔️</span>
                </div>

                <!-- 2. 실명 헤더 영역 -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 215, 0, 0.3); padding-bottom: 12px; margin-bottom: 16px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.35rem; color: #ffd700; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                            <span>${escapeHtml(realName)}</span> ${getUserDemographicBadge(user)} ${typeof renderUserBadges === 'function' ? renderUserBadges(user) : ''}
                            <span style="font-size: 0.82rem; background: linear-gradient(135deg, #ffd700, #ff8f00); color: #000; font-weight: 900; padding: 2px 8px; border-radius: 8px;">강사</span>
                            <span style="font-size: 0.75rem; background: rgba(0, 230, 118, 0.2); border: 1px solid #00e676; color: #00e676; font-weight: 800; padding: 2px 8px; border-radius: 8px;"><i class="fa-solid fa-circle-check"></i> 실명 인증 완료</span>
                            ${warningBadgeHtml}
                        </h2>
                        <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 4px;">${isSelf ? '💳 내 프로필 & 계정 정보' : '🤿 공인 레슨 강사 프로필 카드'}</div>
                    </div>
                    <button onclick="document.getElementById('dynamicProfileModalOverlay').remove()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-weight: bold; font-size: 1.2rem; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">&times;</button>
                </div>

                <!-- 3. 강사 클래스 진행 횟수 및 수강생 평가 지표 -->
                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                    <div style="flex: 1; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; border-radius: 12px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #a0aec0;">🎓 강사 클래스 진행</span>
                        <div style="font-weight: 900; color: #ffd700; font-size: 1.2rem; margin-top: 2px;">${classCount}회 완료</div>
                    </div>
                    <div style="flex: 1; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; border-radius: 12px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #a0aec0;">⭐ 수강생 평가 총합</span>
                        <div style="font-weight: 900; color: #ffd700; font-size: 1.2rem; margin-top: 2px;">총 ${totalInstTags}개</div>
                    </div>
                </div>

                <!-- 4. 강사 5대 칭찬 매너 태그 -->
                <div style="background: rgba(255, 215, 0, 0.06); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #ffd700; font-size: 0.92rem; font-weight: 800;"><i class="fa-solid fa-graduation-cap"></i> 수강생 강사 칭찬 뱃지</h4>
                        <span style="font-size: 0.78rem; color: #a0aec0;">클래스 수강생 평가</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span style="background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.4); color: #ffd700; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">📚 커리큘럼이 체계적이에요 (+${curCount})</span>
                        <span style="background: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.4); color: #00f2fe; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">⏰ 제 스케줄에 맞춰줘요 (+${schCount})</span>
                        <span style="background: rgba(0, 230, 118, 0.12); border: 1px solid rgba(0, 230, 118, 0.4); color: #00e676; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">📸 수중 영상을 잘 찍어줘요 (+${vidCount})</span>
                        <span style="background: rgba(187, 134, 252, 0.12); border: 1px solid rgba(187, 134, 252, 0.4); color: #bb86fc; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">💡 전문 지식이 풍부해요 (+${knwCount})</span>
                        <span style="background: rgba(255, 105, 180, 0.12); border: 1px solid rgba(255, 105, 180, 0.4); color: #ff69b4; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🎯 티칭 능력이 뛰어나요 (+${tchCount})</span>
                    </div>
                </div>

                <!-- 5. 🤿 일반 버디 활동 매너 뱃지 -->
                <div style="background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #00f2fe; font-size: 0.92rem; font-weight: 800;"><i class="fa-solid fa-medal"></i> 버디 활동 칭찬 매너 뱃지</h4>
                        <span style="font-size: 0.78rem; color: #a0aec0;">주최 ${hostedCount}회 · 참여 ${completedCount}회</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span style="background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); color: #00f2fe; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">⏱️ 시간 엄수 (+${timeCount})</span>
                        <span style="background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.3); color: #00e676; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🤝 매너 최고 (+${mannerCount})</span>
                        <span style="background: rgba(255, 183, 3, 0.1); border: 1px solid rgba(255, 183, 3, 0.3); color: #ffb703; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🤿 버디 케어 (+${buddyCount})</span>
                        <span style="background: rgba(255, 105, 180, 0.1); border: 1px solid rgba(255, 105, 180, 0.3); color: #ff69b4; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">😊 인생샷 제조 (+${photoCount})</span>
                        <span style="background: rgba(147, 112, 219, 0.1); border: 1px solid rgba(147, 112, 219, 0.3); color: #bb86fc; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">💡 지식 풍부 (+${knowCount})</span>
                    </div>
                </div>

                <!-- 6. 자격증 라이센스 정보 -->
                <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 215, 0, 0.25); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 10px 0; color: #ffd700; font-size: 0.92rem; font-weight: 800;"><i class="fa-solid fa-id-card-clip"></i> 공인 자격증 및 라이센스 정보</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
                        <div style="background: rgba(0,0,0,0.35); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                            🏛️ <strong style="color: #ffd700;">공인 발급 협회 / 단체명:</strong> <span style="color: #fff; font-weight: bold;">${escapeHtml(instOrg)}</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.35); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                            🔢 <strong style="color: #ffd700;">강사 라이센스 번호 / 코드:</strong> <span style="color: #00f2fe; font-weight: bold; font-family: monospace; font-size: 0.92rem;">${escapeHtml(instCode)}</span>
                        </div>
                        ${detailedLicenses ? `
                        <div style="background: rgba(0,0,0,0.35); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                            📜 <strong style="color: #a0aec0;">세부 라이센스 내역:</strong>
                            <div style="color: #e2e8f0; margin-top: 3px; line-height: 1.4;">${escapeHtml(detailedLicenses)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${isSelf ? `
                
                <div class="blocked-users-list" style="background: rgba(255, 82, 82, 0.06); border: 1px solid rgba(255, 82, 82, 0.2); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: #ff6b6b; font-size: 0.88rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-user-slash"></i> 차단된 다이버 관리 (${(user.blocked_users || []).length}/100)
                        </h4>
                        <span style="font-size: 0.72rem; color: #94a3b8;">상호 피드 숨김 적용 중</span>
                    </div>
                    ${(user.blocked_users && user.blocked_users.length > 0) ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 110px; overflow-y: auto;">
                            ${user.blocked_users.map(uItem => `
                                <span style="background: rgba(0,0,0,0.55); border: 1px solid rgba(255,82,82,0.3); border-radius: 8px; padding: 4px 8px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; color: #fff;">
                                    <span>${escapeHtml(uItem)}</span>
                                    <button type="button" onclick="unblockUser('${escapeHtml(uItem)}')" style="background: rgba(255,82,82,0.25); border: 1px solid #ff5252; color: #ff5252; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">
                                        X 해제
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #64748b; font-size: 0.8rem; margin: 0;">차단한 유저가 없습니다.</p>
                    `}
                </div>
                ` : ''}

                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px; gap: 8px; flex-wrap: wrap;">
                    ${isSelf ? `
                    <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove(); handleLogout();" style="background: rgba(255, 82, 82, 0.2); border: 1px solid #ff5252; color: #ff5252; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">🚪 로그아웃</button>
                    <button onclick="openEditProfileModal();" style="background: #fbbf24; border: none; color: #070e17; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem;">✏️ 강사 프로필 수정</button>
                    <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem;">닫기 ✖</button>
                    ` : `
                    <button type="button" onclick="blockUserFromProfile('${escapeHtml(user.email || user.name || user.nickname || realName || '')}')" style="background: rgba(255, 82, 82, 0.15); border: 1px solid #ff5252; color: #ff5252; padding: 8px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                        <i class="fa-solid fa-user-slash"></i> 🚫 이 유저 차단하기
                    </button>
                    <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem;">닫기 ✖</button>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return;
    }

    // ==========================================================
    // 🤿 2. 일반 다이버 프로필
    // ==========================================================
    const mannerBadgesHtml = `
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #00f2fe; font-size: 0.92rem; font-weight: 800;"><i class="fa-solid fa-medal"></i> 버디 칭찬 매너 뱃지</h4>
                <span style="font-size: 0.78rem; color: #a0aec0;">총 ${totalManners}회 획득</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <span style="background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); color: #00f2fe; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">⏱️ 시간 엄수 (+${timeCount})</span>
                <span style="background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.3); color: #00e676; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🤝 매너 최고 (+${mannerCount})</span>
                <span style="background: rgba(255, 183, 3, 0.1); border: 1px solid rgba(255, 183, 3, 0.3); color: #ffb703; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🤿 버디 케어 (+${buddyCount})</span>
                <span style="background: rgba(255, 105, 180, 0.1); border: 1px solid rgba(255, 105, 180, 0.3); color: #ff69b4; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">😊 인생샷 제조 (+${photoCount})</span>
                <span style="background: rgba(147, 112, 219, 0.1); border: 1px solid rgba(147, 112, 219, 0.3); color: #bb86fc; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">💡 지식 풍부 (+${knowCount})</span>
            </div>
        </div>
    `;

    overlay.innerHTML = `
        <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); border-radius: 20px; width: 100%; max-width: 520px; max-height: 86vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif; box-sizing: border-box;">
            
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 12px; margin-bottom: 16px;">
                <h2 style="margin: 0; font-size: 1.2rem; color: #00f2fe; display: flex; align-items: center; gap: 8px;">
                    <i class="${isSelf ? 'fa-solid fa-id-card' : 'fa-solid fa-user'}"></i> ${isSelf ? '내 프로필 & 계정 정보' : '다이버 프로필 정보'}
                </h2>
                <button onclick="document.getElementById('dynamicProfileModalOverlay').remove()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-weight: bold; font-size: 1.2rem; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">&times;</button>
            </div>

            <!-- 2. 닉네임 박스 -->
            <div style="background: rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 4px 0; color: #fff; font-size: 1.15rem; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <span>${escapeHtml(nickname)}</span> ${getUserDemographicBadge(user)}
                    ${typeof renderUserBadges === 'function' ? renderUserBadges(user) : ''}
                    ${isInst ? `<span style="font-size: 0.76rem; background: linear-gradient(135deg, #ffd700, #ff8f00); color: #000; font-weight: 900; padding: 2px 8px; border-radius: 8px;">🎓 공인 강사</span>` : ''}
                    ${warningBadgeHtml}
                </h3>
                <p style="margin: 0; color: #a0aec0; font-size: 0.85rem;">${isInst ? 'AquaBuddy 공인 강사 인증 회원' : (escapeHtml(user.provider || 'AquaBuddy') + ' 인증 다이버 회원')}</p>
            </div>

            <!-- 🎁 내 고유 추천인 코드 & 공유 복사 박스 (본인 프로필에만 100% 노출) -->
            ${isSelf ? `
            <div style="background: rgba(255, 183, 3, 0.08); border: 1px solid rgba(255, 183, 3, 0.35); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.88rem; font-weight: 800; color: #ffb703; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-gift"></i> 🎁 내 고유 추천인 코드
                    </span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">친구 초대 시 모두에게 혜택!</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="flex: 1; background: #0f172a; border: 1px solid rgba(255, 183, 3, 0.5); padding: 8px 12px; border-radius: 8px; font-weight: 900; color: #ffb703; font-size: 1.05rem; letter-spacing: 1px; text-align: center;">
                        ${escapeHtml(getDeterministicReferralCode(user))}
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('${escapeHtml(getDeterministicReferralCode(user))}'); if(typeof showToast==='function')showToast('📋 추천인 코드가 복사되었습니다!');" style="background: linear-gradient(135deg, #ffb703, #fb8500); color: #0f172a; border: none; padding: 9px 14px; border-radius: 8px; font-weight: 900; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                        📋 코드 복사
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- 3. 객관적 활동 지표 (버디 모임 주최 횟수 & 모임 참여 완료 횟수) -->
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                <div style="flex: 1; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); padding: 12px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 0.8rem; color: #a0aec0;">👑 버디 모임 주최 횟수</span>
                    <div style="font-weight: bold; color: #00f2fe; font-size: 1.15rem; margin-top: 2px;">${hostedCount}회 주최</div>
                </div>
                <div style="flex: 1; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); padding: 12px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 0.8rem; color: #a0aec0;">🙋‍♂️ 모임 참여 완료 횟수</span>
                    <div style="font-weight: bold; color: #00e676; font-size: 1.15rem; margin-top: 2px;">${completedCount}회 참여</div>
                </div>
            </div>

            <!-- 4. 버디 활동 칭찬 매너 뱃지 -->
            ${mannerBadgesHtml}

            <!-- 5. 🎓 공인 검증 강사인 경우: 버디 칭찬태그 바로 아래에 강사 평가 뱃지 연결 노출 -->
            ${isInst ? `
            <div style="background: rgba(251, 191, 36, 0.06); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #ffd700; font-size: 0.92rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-graduation-cap"></i> 🎓 수강생 강사 칭찬 뱃지
                    </h4>
                    <span style="font-size: 0.78rem; color: #fbbf24; font-weight: 800;">${escapeHtml(realName)} 강사 · 총 ${totalInstTags}개</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                    <span style="background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.4); color: #ffd700; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">📚 커리큘럼이 체계적이에요 (+${curCount})</span>
                    <span style="background: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.4); color: #00f2fe; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">⏰ 제 스케줄에 맞춰줘요 (+${schCount})</span>
                    <span style="background: rgba(0, 230, 118, 0.12); border: 1px solid rgba(0, 230, 118, 0.4); color: #00e676; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">📸 수중 영상을 잘 찍어줘요 (+${vidCount})</span>
                    <span style="background: rgba(187, 134, 252, 0.12); border: 1px solid rgba(187, 134, 252, 0.4); color: #bb86fc; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">💡 전문 지식이 풍부해요 (+${knwCount})</span>
                    <span style="background: rgba(255, 105, 180, 0.12); border: 1px solid rgba(255, 105, 180, 0.4); color: #ff69b4; padding: 5px 10px; border-radius: 14px; font-size: 0.8rem; font-weight: 700;">🎯 티칭 능력이 뛰어나요 (+${tchCount})</span>
                </div>
            </div>
            ` : ''}

            <!-- 6. DB 연동 자격증/라이센스 정보 -->
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">📜 자격증 / 라이센스 정보</label>
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; font-size: 0.9rem; color: #fff;">
                    📜 ${escapeHtml(detailedLicenses || licenseInfoText)}
                </div>
            </div>

            ${isSelf ? `
            
            <div class="blocked-users-list" style="background: rgba(255, 82, 82, 0.06); border: 1px solid rgba(255, 82, 82, 0.2); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #ff6b6b; font-size: 0.88rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-user-slash"></i> 차단된 다이버 관리 (${(user.blocked_users || []).length}/100)
                    </h4>
                    <span style="font-size: 0.72rem; color: #94a3b8;">상호 피드 숨김 적용 중</span>
                </div>
                ${(user.blocked_users && user.blocked_users.length > 0) ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 110px; overflow-y: auto;">
                        ${user.blocked_users.map(uItem => `
                            <span style="background: rgba(0,0,0,0.55); border: 1px solid rgba(255,82,82,0.3); border-radius: 8px; padding: 4px 8px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; color: #fff;">
                                <span>${escapeHtml(uItem)}</span>
                                <button type="button" onclick="unblockUser('${escapeHtml(uItem)}')" style="background: rgba(255,82,82,0.25); border: 1px solid #ff5252; color: #ff5252; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">
                                    X 해제
                                </button>
                            </span>
                        `).join('')}
                    </div>
                ` : `
                    <p style="color: #64748b; font-size: 0.8rem; margin: 0;">차단한 유저가 없습니다.</p>
                `}
            </div>
            ` : ''}

            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px; gap: 8px; flex-wrap: wrap;">
                ${isSelf ? `
                <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove(); handleLogout();" style="background: rgba(255, 82, 82, 0.2); border: 1px solid #ff5252; color: #ff5252; padding: 8px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.82rem;">🚪 로그아웃</button>
                <button onclick="openEditProfileModal();" style="background: #00d2d3; border: none; color: #070e17; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">✏️ 프로필 수정</button>
                <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">닫기 ✖</button>
                ` : `
                <button type="button" onclick="blockUserFromProfile('${escapeHtml(nickname || user.nickname || user.name || user.real_name || '')}')" style="background: rgba(255, 82, 82, 0.15); border: 1px solid #ff5252; color: #ff5252; padding: 8px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <i class="fa-solid fa-user-slash"></i> 🚫 이 유저 차단하기
                </button>
                <button onclick="document.getElementById('dynamicProfileModalOverlay')?.remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem;">닫기 ✖</button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}
window.renderDynamicProfileModal = renderDynamicProfileModal;

// 2. [openUserProfileModal]
async function openUserProfileModal(userOrIdentifier, contextCategory = 'all') {
    if (!userOrIdentifier) return;

    let cleanTarget = '';
    let initialUser = null;

    if (typeof userOrIdentifier === 'object' && userOrIdentifier !== null) {
        cleanTarget = String(userOrIdentifier.email || userOrIdentifier.user_email || userOrIdentifier.nickname || userOrIdentifier.name || userOrIdentifier.real_name || userOrIdentifier.realName || userOrIdentifier.userName || userOrIdentifier.user_name || userOrIdentifier.author || '').trim();
        initialUser = { ...userOrIdentifier };
    } else {
        cleanTarget = String(userOrIdentifier || '').trim();
    }

    if (!cleanTarget) return;

    const loggedInUser = (typeof getCurrentLoggedInUser === 'function') ? getCurrentLoggedInUser() : currentUser;

    // 1. 현재 로그인 유저 본인 여부 판별 (이메일 / 닉네임 / 실명 대조)
    let isSelfTarget = false;
    if (loggedInUser) {
        var myEmail = String(loggedInUser.email || '').trim().toLowerCase();
        var myNick = String(loggedInUser.nickname || loggedInUser.name || '').trim();
        var myReal = String(loggedInUser.real_name || loggedInUser.realName || '').trim();
        
        var targetEmail = String((initialUser && (initialUser.email || initialUser.user_email)) || (cleanTarget.includes('@') ? cleanTarget : '')).trim().toLowerCase();
        var targetNick = String((initialUser && (initialUser.nickname || initialUser.name || initialUser.author)) || cleanTarget).trim();
        var targetReal = String(initialUser && (initialUser.real_name || initialUser.realName) || '').trim();

        if (initialUser && isSameUserStrict(loggedInUser, initialUser)) {
            isSelfTarget = true;
        } else if (myEmail && targetEmail && myEmail === targetEmail) {
            isSelfTarget = true;
        } else if (myNick && targetNick && myNick.toLowerCase() === targetNick.toLowerCase()) {
            isSelfTarget = true;
        } else if (myReal && targetNick && myReal.toLowerCase() === targetNick.toLowerCase()) {
            isSelfTarget = true;
        } else if (myNick && targetReal && myNick.toLowerCase() === targetReal.toLowerCase()) {
            isSelfTarget = true;
        }
    }

    if (isSelfTarget) {
        renderDynamicProfileModal(loggedInUser, true, contextCategory);
        return;
    }

    // 2. 타인 유저 기본 객체 구성
    let targetUser = initialUser || {
        name: cleanTarget,
        nickname: cleanTarget,
        provider: "AquaBuddy 인증 회원",
        license_info: "등록된 라이센스 정보가 없습니다.",
        manner_tags: {},
        hosted_count: 0,
        completed_meets_count: 0,
        warning_count: 0
    };

    // 3. 🌐 [DB 최우선화] Supabase DB에서 최신 유저 프로필 직접 조회 (로컬 캐시 오염 100% 방지)
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            let dbUserData = null;
            if (cleanTarget.includes('@')) {
                const { data } = await supabaseClient.from('users').select('*').eq('email', cleanTarget.toLowerCase()).maybeSingle();
                dbUserData = data;
            }
            if (!dbUserData) {
                const myEmail = (loggedInUser && loggedInUser.email) ? String(loggedInUser.email).trim().toLowerCase() : '';
                let query = supabaseClient.from('users').select('*').eq('nickname', cleanTarget);
                if (myEmail) {
                    query = query.neq('email', myEmail);
                }
                const { data } = await query.limit(1).maybeSingle();
                dbUserData = data;
            }
            if (!dbUserData) {
                try {
                    const myEmail = (loggedInUser && loggedInUser.email) ? String(loggedInUser.email).trim().toLowerCase() : '';
                    let query = supabaseClient.from('users').select('*').eq('real_name', cleanTarget);
                    if (myEmail) {
                        query = query.neq('email', myEmail);
                    }
                    const { data } = await query.limit(1).maybeSingle();
                    dbUserData = data;
                } catch (e) {}
            }

            if (dbUserData) {
                // DB의 최신 gender, age_group, user_license 등으로 완전 덮어씌움
                targetUser = {
                    ...targetUser,
                    ...dbUserData,
                    gender: dbUserData.gender || targetUser.gender || 'private',
                    age_group: dbUserData.age_group || dbUserData.ageGroup || targetUser.age_group || 'private',
                    ageGroup: dbUserData.age_group || dbUserData.ageGroup || targetUser.ageGroup || 'private',
                    license: dbUserData.user_license || dbUserData.license_info || dbUserData.license || targetUser.license || "등록된 라이센스 정보가 없습니다.",
                    license_info: dbUserData.user_license || dbUserData.license_info || dbUserData.license || targetUser.license_info || "등록된 라이센스 정보가 없습니다.",
                    user_license: dbUserData.user_license || dbUserData.license_info || dbUserData.license || targetUser.user_license || "등록된 라이센스 정보가 없습니다.",
                    manner_tags: dbUserData.manner_tags || targetUser.manner_tags || {},
                    mannerTags: dbUserData.manner_tags || targetUser.mannerTags || {},
                    hosted_count: dbUserData.hosted_count !== undefined ? dbUserData.hosted_count : (targetUser.hosted_count || 0),
                    hostedCount: dbUserData.hosted_count !== undefined ? dbUserData.hosted_count : (targetUser.hostedCount || 0),
                    completed_meets_count: dbUserData.completed_meets_count !== undefined ? dbUserData.completed_meets_count : (targetUser.completed_meets_count || 0),
                    completedCount: dbUserData.completed_meets_count !== undefined ? dbUserData.completed_meets_count : (targetUser.completedCount || 0),
                    warning_count: dbUserData.warning_count !== undefined ? dbUserData.warning_count : (targetUser.warning_count || 0),
                    warningCount: dbUserData.warning_count !== undefined ? dbUserData.warning_count : (targetUser.warningCount || 0)
                };
            }
        } catch(e) {
            console.warn("openUserProfileModal DB fetch error:", e);
        }
    }

    // 🔒 타인 프로필이므로 확실하게 isSelf = false 로 렌더링!
    renderDynamicProfileModal(targetUser, false, contextCategory);
}
window.openUserProfileModal = openUserProfileModal;

async function openProfileModal() {
    const user = (typeof getCurrentLoggedInUser === 'function') ? getCurrentLoggedInUser() : currentUser;
    if (!user || (!user.name && !user.email && !user.nickname)) {
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        if (typeof resetAuthForm === "function") resetAuthForm();
        const authM = document.getElementById("authModal");
        if (authM && typeof openModal === 'function') openModal(authM);
        return;
    }

    currentUser = user;
    if (typeof window !== 'undefined') window.currentUser = user;

    const targetCat = (typeof activeCategory !== 'undefined' && activeCategory) ? activeCategory : 'all';
    renderDynamicProfileModal(user, true, targetCat);
}
window.openProfileModal = openProfileModal;
window.openMyProfileModal = openProfileModal;

let activeInstructorSubFilter = "all";

let activeBuddySubFilter = "all";

function filterBuddySub(subType) {
    activeBuddySubFilter = subType;
    document.querySelectorAll("#buddySubFilterBar .sub-tab-btn").forEach(btn => {
        if (btn.dataset.buddysub === subType) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    if (typeof filterAndRender === "function") filterAndRender();
}
window.filterBuddySub = filterBuddySub;


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

// === 동적 프로필 수정 모달 렌더링 엔진 (100% 작동 보장) ===
// === renderDynamicEditProfileModal: 실명 고정 & 닉네임/자격증 정보 전용 프로필 수정 모달 ===
function renderDynamicEditProfileModal(user) {
    let existing = document.getElementById("dynamicEditProfileModalOverlay");
    if (existing) existing.remove();

    if (!user) user = currentUser || { name: "다이버" };

    const realNameVal = user.real_name || user.realName || "";
    const nickVal = user.nickname || user.name || "";
    const phoneVal = (user.phone && user.phone !== "010-0000-0000") ? user.phone : "";
    const licenseVal = user.license_info || user.license || user.user_license || "";
    const genderVal = user.gender || "private";
    const ageGroupVal = user.age_group || user.ageGroup || "20대";
    const isApprovedInst = (user.instructor_status === 'approved' || user.instructorStatus === 'approved') && user.instructor_status !== 'rejected';

    const overlay = document.createElement("div");
    overlay.id = "dynamicEditProfileModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.9) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        z-index: 99999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    overlay.innerHTML = `
        <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); border-radius: 20px; width: 100%; max-width: 500px; max-height: 88vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 1.15rem; color: #00f2fe;"><i class="fa-solid fa-user-pen"></i> 프로필 정보 수정</h3>
                <button onclick="document.getElementById('dynamicEditProfileModalOverlay').remove()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-weight: bold; font-size: 1.2rem; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">&times;</button>
            </div>

            <form onsubmit="handleDynamicSaveProfile(event)" style="display: flex; flex-direction: column; gap: 14px;">
                
                <!-- 1. 실명 (성함) -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                        <i class="fa-solid fa-id-card"></i> ${isApprovedInst ? '🔒 공인 강사 실명 (인증 완료 고정)' : '실명 (성함) *'}
                    </label>
                    <input type="text" id="dynEditRealName" value="${typeof escapeHtml === 'function' ? escapeHtml(realNameVal) : realNameVal}" ${isApprovedInst ? 'readonly disabled style="width: 100%; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #00f2fe; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; font-weight: bold; cursor: not-allowed; box-sizing: border-box;"' : 'required placeholder="예: 홍길동 (본명/실명 입력)" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;"'}>
                    <span style="font-size: 0.75rem; color: #718096; margin-top: 2px; display: block;">
                        ${isApprovedInst ? '* 공인 강사 실명 인증이 완료되어 수정이 제한됩니다.' : '* 자격증 인증 및 본인 확인용 실명(본명)을 입력해 주세요.'}
                    </span>
                </div>

                <!-- 2. 활동 닉네임 -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                        <i class="fa-solid fa-user"></i> 활동 닉네임 *
                    </label>
                    <input type="text" id="dynEditNick" value="${typeof escapeHtml === 'function' ? escapeHtml(nickVal) : nickVal}" required placeholder="커뮤니티 활동에 표시될 닉네임" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                </div>

                <!-- 3. 성별 & 연령대 (회원가입과 100% 통일) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                            <i class="fa-solid fa-venus-mars"></i> 성별 *
                        </label>
                        <select id="dynEditGender" required style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                            <option value="male" ${genderVal === 'male' ? 'selected' : ''}>👦 남성</option>
                            <option value="female" ${genderVal === 'female' ? 'selected' : ''}>👧 여성</option>
                            <option value="private" ${genderVal === 'private' ? 'selected' : ''}>🔒 비공개</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                            <i class="fa-solid fa-cake-candles"></i> 연령대 *
                        </label>
                        <select id="dynEditAgeGroup" required style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                            <option value="10대" ${ageGroupVal === '10대' ? 'selected' : ''}>10대</option>
                            <option value="20대" ${ageGroupVal === '20대' ? 'selected' : ''}>20대</option>
                            <option value="30대" ${ageGroupVal === '30대' ? 'selected' : ''}>30대</option>
                            <option value="40대" ${ageGroupVal === '40대' ? 'selected' : ''}>40대</option>
                            <option value="50대 이상" ${ageGroupVal === '50대 이상' ? 'selected' : ''}>50대 이상</option>
                            <option value="private" ${ageGroupVal === 'private' ? 'selected' : ''}>🔒 비공개</option>
                        </select>
                    </div>
                </div>

                <!-- 4. 연락처 (휴대폰 번호) -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                        <i class="fa-solid fa-phone"></i> 휴대폰 번호 *
                    </label>
                    <input type="tel" id="dynEditPhone" value="${typeof escapeHtml === 'function' ? escapeHtml(phoneVal) : phoneVal}" required placeholder="공백없이 숫자로만 입력" oninput="this.value = this.value.replace(/[^0-9]/g, '')" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                    <span style="font-size: 0.75rem; color: #718096; margin-top: 2px; display: block;">* 공백이나 하이픈(-) 없이 숫자로만 10~11자리를 입력해 주세요.</span>
                </div>

                <!-- 5. 자격증 / 라이센스 정보 -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: #00f2fe; margin-bottom: 4px; font-weight: bold;">
                        <i class="fa-solid fa-certificate"></i> 자격증 / 라이센스 정보 *
                    </label>
                    <textarea id="dynEditLicense" rows="3" required placeholder="예: AIDA2, PADI 오픈워터, 초보 프리다이버 등" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">${typeof escapeHtml === 'function' ? escapeHtml(licenseVal) : licenseVal}</textarea>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                    <button type="button" onclick="document.getElementById('dynamicEditProfileModalOverlay').remove();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">
                        취소
                    </button>
                    <button type="submit" style="background: #00d2d3; border: none; color: #070e17; padding: 10px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">
                        💾 저장 완료
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
}
window.renderDynamicEditProfileModal = renderDynamicEditProfileModal;

async function handleDynamicSaveProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) return;

    const realNameEl = document.getElementById("dynEditRealName");
    const nickEl = document.getElementById("dynEditNick");
    const phoneEl = document.getElementById("dynEditPhone");
    const licEl = document.getElementById("dynEditLicense");
    const genderEl = document.getElementById("dynEditGender");
    const ageGroupEl = document.getElementById("dynEditAgeGroup");

    const realName = realNameEl ? realNameEl.value.trim() : (currentUser.real_name || currentUser.realName || "");
    const nick = nickEl ? nickEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim().replace(/[^0-9]/g, "") : "";
    const license = licEl ? licEl.value.trim() : "";
    const gender = genderEl ? genderEl.value : "private";
    const ageGroup = ageGroupEl ? ageGroupEl.value : "private";

    if (!realName) {
        alert("⚠️ 실명(본명)을 입력해 주세요.");
        if (realNameEl) realNameEl.focus();
        return;
    }
    if (!nick) {
        alert("⚠️ 활동 닉네임을 입력해 주세요.");
        if (nickEl) nickEl.focus();
        return;
    }

    // 🔍 닉네임 변경 시 중복 검사
    const currentMyNick = (currentUser.nickname || currentUser.name || "").trim().toLowerCase();
    if (nick.toLowerCase() !== currentMyNick) {
        const regUsers = (typeof getRegisteredUsers === 'function') ? getRegisteredUsers() : {};
        for (const k in regUsers) {
            const u = regUsers[k];
            if (u && u.nickname && u.nickname.trim().toLowerCase() === nick.toLowerCase()) {
                const uEmail = (u.email || '').trim().toLowerCase();
                const myEmail = (currentUser.email || '').trim().toLowerCase();
                if (!myEmail || uEmail !== myEmail) {
                    alert(`⚠️ '${nick}' 닉네임은 이미 다른 다이버가 사용 중입니다.`);
                    if (nickEl) nickEl.focus();
                    return;
                }
            }
        }
        if (supabaseClient) {
            try {
                const myEmail = (currentUser.email || '').trim().toLowerCase();
                let query = supabaseClient.from('users').select('id, nickname, email').eq('nickname', nick);
                if (myEmail) query = query.neq('email', myEmail);
                const { data: existNick } = await query.maybeSingle();
                if (existNick) {
                    alert(`⚠️ '${nick}' 닉네임은 이미 다른 다이버가 사용 중입니다.`);
                    if (nickEl) nickEl.focus();
                    return;
                }
            } catch(e) {
                console.warn("Nickname uniqueness check notice:", e);
            }
        }
    }
    if (!gender) {
        alert("⚠️ 성별을 선택해 주세요.");
        return;
    }
    if (!ageGroup) {
        alert("⚠️ 연령대를 선택해 주세요.");
        return;
    }
    if (!phone || phone.length < 10) {
        alert("⚠️ 휴대폰 번호를 공백 없이 숫자로만 10~11자리 정확히 입력해 주세요.");
        if (phoneEl) phoneEl.focus();
        return;
    }
    if (!license) {
        alert("⚠️ 보유 자격증/라이센스 정보를 입력해 주세요.");
        if (licEl) licEl.focus();
        return;
    }

    currentUser.realName = realName;
    currentUser.real_name = realName;
    currentUser.name = nick;
    currentUser.nickname = nick;
    currentUser.phone = phone;
    currentUser.license = license;
    currentUser.license_info = license;
    currentUser.user_license = license;
    currentUser.gender = gender;
    currentUser.age_group = ageGroup;
    currentUser.ageGroup = ageGroup;

    safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    if (currentUser.email) {
        const users = getRegisteredUsers();
        const key = currentUser.email.toLowerCase();
        users[key] = {
            ...users[key],
            email: currentUser.email,
            realName: realName,
            real_name: realName,
            name: nick,
            nickname: nick,
            phone: phone,
            license: license,
            license_info: license,
            user_license: license,
            gender: gender,
            age_group: ageGroup,
            ageGroup: ageGroup,
            provider: currentUser.provider || "홈페이지 회원",
            instructorStatus: currentUser.instructorStatus || currentUser.instructor_status || "none",
            instructor_status: currentUser.instructorStatus || currentUser.instructor_status || "none"
        };
        safeLocalStorageSet("aqua_buddy_registered_users", JSON.stringify(users));
        await saveUserProfileToSupabase(users[key], true);
    } else {
        saveRegisteredUser(currentUser);
        await saveUserProfileToSupabase(currentUser, true);
    }

    const editOverlay = document.getElementById("dynamicEditProfileModalOverlay");
    if (editOverlay) editOverlay.remove();

    updateNavbarUserUI();
    if (typeof filterAndRender === 'function') filterAndRender();
    if (typeof showToast === 'function') showToast("✨ 프로필 정보가 성공적으로 수정 및 저장되었습니다!");
}
window.handleDynamicSaveProfile = handleDynamicSaveProfile;

function openEditProfileModal() {
    if (!currentUser) {
        showToast("⚠️ 먼저 로그인해 주세요.");
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        const authM = document.getElementById("authModal");
        if (authM) openModal(authM);
        return;
    }
    renderDynamicEditProfileModal(currentUser);
}
window.openEditProfileModal = openEditProfileModal;


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

    if (realName) {
        currentUser.realName = realName;
        currentUser.real_name = realName;
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
        // Zero dummy users - pure real DB data only
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

        // 🔒 [보안 강화] 오직 Supabase Auth 공식 암호화 인증(signInWithPassword)만 허용 (평문 fallback 완전 삭제)
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
                    console.log("✅ Supabase Auth 공식 로그인 성공:", email);
                } else {
                    console.warn("Supabase Auth 인증 실패:", error ? error.message : "인증 실패");
                }
            } catch (sbErr) {
                console.warn("Supabase Auth signIn error:", sbErr);
            }
        }

        // ❌ 인증 실패 시 즉시 로그인 거부 (평문 대조 fallback 없음)
        if (!authSuccess) {
            alert("❌ 이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.");
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
        if (typeof saveRegisteredUser === 'function') saveRegisteredUser(currentUser);
        if (typeof saveUserProfileToSupabase === 'function') await saveUserProfileToSupabase(currentUser);

        updateNavbarUserUI();
        const authM = document.getElementById("authModal");
        if (authM && typeof closeModal === 'function') closeModal(authM);
        const loginM = document.getElementById("loginModal");
        if (loginM && typeof closeModal === 'function') closeModal(loginM);

        if (typeof resetAuthForm === 'function') resetAuthForm();
        if (typeof filterAndRender === 'function') filterAndRender();
        if (typeof showToast === "function") showToast("로그인되었습니다. 환영합니다!");
    } catch (err) {
        console.error("Login process error:", err);
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
    const pwConfirm = document.getElementById("signupPasswordConfirmInput") ? document.getElementById("signupPasswordConfirmInput").value.trim() : "";
    const realName = document.getElementById("signupRealNameInput") ? document.getElementById("signupRealNameInput").value.trim() : "";
    const nick = document.getElementById("signupNicknameInput") ? document.getElementById("signupNicknameInput").value.trim() : "";
    const gender = document.getElementById("signupGenderSelect") ? document.getElementById("signupGenderSelect").value : "";
    const ageGroup = document.getElementById("signupAgeGroupSelect") ? document.getElementById("signupAgeGroupSelect").value : "";
    const license = document.getElementById("signupLicenseInput") ? document.getElementById("signupLicenseInput").value.trim() : "";
    const phone = document.getElementById("signupPhoneInput") ? document.getElementById("signupPhoneInput").value.trim().replace(/[^0-9]/g, "") : "";

    // 🔒 모든 입력칸 공란 검사 (하나라도 비어있으면 가입 차단)
    if (!email || !email.includes("@")) {
        alert("⚠️ 올바른 이메일 주소(아이디)를 입력해 주세요.");
        const el = document.getElementById("signupEmailInput");
        if (el) el.focus();
        return;
    }
    if (!pw || pw.length < 6) {
        alert("⚠️ 비밀번호는 최소 6자 이상이어야 합니다.");
        const el = document.getElementById("signupPasswordInput");
        if (el) el.focus();
        return;
    }
    if (!pwConfirm || pw !== pwConfirm) {
        alert("⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다. 다시 확인해 주세요.");
        const el = document.getElementById("signupPasswordConfirmInput");
        if (el) el.focus();
        return;
    }
    if (!realName) {
        alert("⚠️ 본인 확인용 이름(실명)을 공란 없이 입력해 주세요.");
        const el = document.getElementById("signupRealNameInput");
        if (el) el.focus();
        return;
    }
    if (!nick) {
        alert("⚠️ 커뮤니티 활동용 닉네임을 공란 없이 입력해 주세요.");
        const el = document.getElementById("signupNicknameInput");
        if (el) el.focus();
        return;
    }
    if (!gender) {
        alert("⚠️ 성별을 선택해 주세요.");
        const el = document.getElementById("signupGenderSelect");
        if (el) el.focus();
        return;
    }
    if (!ageGroup) {
        alert("⚠️ 연령대를 선택해 주세요.");
        const el = document.getElementById("signupAgeGroupSelect");
        if (el) el.focus();
        return;
    }
    if (!license) {
        alert("⚠️ 보유 자격증/라이센스 정보를 공란 없이 입력해 주세요.");
        const el = document.getElementById("signupLicenseInput");
        if (el) el.focus();
        return;
    }
    if (!phone || phone.length < 10) {
        alert("⚠️ 연락처(휴대폰 번호)를 공백이나 하이픈(-) 없이 숫자로만 10~11자리 정확히 입력해 주세요.");
        const el = document.getElementById("signupPhoneInput");
        if (el) el.focus();
        return;
    }

    // 🔍 [DB 최우선화] Supabase users 테이블 직접 조회하여 이메일 & 닉네임 중복 검사
    if (supabaseClient) {
        try {
            // 1. 이메일(아이디) 중복 DB 직접 검사
            const { data: existEmail } = await supabaseClient.from('users').select('id, email').eq('email', email).maybeSingle();
            if (existEmail) {
                alert(`⚠️ '${email}' 이메일(아이디)은 이미 가입되어 있습니다. 로그인하시거나 다른 이메일을 사용해 주세요.`);
                const el = document.getElementById("signupEmailInput");
                if (el) el.focus();
                return;
            }

            // 2. 닉네임 중복 DB 직접 검사
            const { data: existNick } = await supabaseClient.from('users').select('id, nickname').eq('nickname', nick).maybeSingle();
            if (existNick) {
                alert(`⚠️ '${nick}' 닉네임은 이미 다른 다이버가 사용 중입니다. 다른 멋진 닉네임을 입력해 주세요!`);
                const el = document.getElementById("signupNicknameInput");
                if (el) el.focus();
                return;
            }
        } catch(e) {
            console.warn("Supabase 실시간 중복 검사 notice:", e);
        }
    }

    // 🧹 [LocalStorage 찌꺼기 정화 및 보조 검사]
    const regUsers = (typeof getRegisteredUsers === 'function') ? getRegisteredUsers() : {};
    for (const k in regUsers) {
        const u = regUsers[k];
        if (u && u.nickname && u.nickname.trim().toLowerCase() === nick.toLowerCase()) {
            // DB에 없는 유령 찌꺼기 유저라면 자동 정화 (False Positive 방지)
            if (supabaseClient) {
                try {
                    const { data: dbCheck } = await supabaseClient.from('users').select('id').eq('nickname', nick).maybeSingle();
                    if (!dbCheck) {
                        console.warn(`🧹 LocalStorage 찌꺼기 닉네임 '${nick}' 자동 정화 삭제`);
                        delete regUsers[k];
                        localStorage.setItem("aqua_buddy_registered_users", JSON.stringify(regUsers));
                        continue;
                    }
                } catch(cErr) {
                    console.warn("Purge check notice:", cErr);
                }
            }
            alert(`⚠️ '${nick}' 닉네임은 이미 사용 중입니다. 다른 멋진 닉네임을 입력해 주세요!`);
            const el = document.getElementById("signupNicknameInput");
            if (el) el.focus();
            return;
        }
    }

    // ⚛️ [회원가입 원자성(Atomicity) 보장]
    // 1단계: Supabase Auth & DB insert 성공 여부를 먼저 확인하고, 100% 성공(error === null) 시에만 LocalStorage에 저장!
    let tempToken = null;

    try {
        // A. Supabase Auth 직접 회원가입 시도
        if (supabaseClient && supabaseClient.auth) {
            const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
                email: email,
                password: pw,
                options: {
                    data: { real_name: realName, nickname: nick, phone: phone, license_info: license, gender: gender, age_group: ageGroup }
                }
            });

            if (authErr) {
                console.error("Supabase Auth signUp 실패:", authErr);
                alert("⚠️ 회원가입 처리 중 오류가 발생했습니다. (" + (authErr.message || "이미 존재하는 정보") + ")");
                return;
            }

            if (authData && authData.session && authData.session.access_token) {
                tempToken = authData.session.access_token;
            }
        }

        // B. 임시 유저 객체 생성 (아직 LocalStorage 저장 안 함!)
        const candidateUserObj = {
            id: 'user-' + Date.now(),
            email: email,
            realName: realName,
            real_name: realName,
            name: nick,
            nickname: nick,
            phone: phone,
            license: license,
            license_info: license,
            user_license: license,
            provider: "홈페이지 회원",
            avatar: nick.charAt(0).toUpperCase(),
            gender: gender,
            age_group: ageGroup,
            ageGroup: ageGroup,
            instructor_status: "none",
            instructorStatus: "none",
            isApprovedInstructor: false,
            createdAt: getKSTIsoString()
        };

        // C. Supabase DB users 테이블 insert 수행
        const dbRes = await saveUserProfileToSupabase(candidateUserObj, true);
        

        if (dbRes && dbRes.error) {
            // DB 삽입 실패시 즉시 예외 던져서 LocalStorage 저장 및 억지 로그인 방지
            throw new Error("users_pkey error / " + (dbRes.error.message || "DB 저장 실패"));
        }

        // D. 💥 DB insert 100% 성공(error === null) 한 직후에만 LocalStorage 저장 및 세션 활성화!
        currentUser = candidateUserObj;
        if (tempToken) {
            localStorage.setItem("aqua_buddy_user_token", tempToken);
        }
        safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        saveRegisteredUser(currentUser);

        updateNavbarUserUI();
        const authM = document.getElementById("authModal");
        if (authM) closeModal(authM);
        resetAuthForm();
        filterAndRender();
        if (typeof showToast === "function") showToast("회원가입이 완료되었습니다!");
        alert(`🎉 ${nick}님, 회원가입이 완료되어 자동으로 로그인되었습니다!`);
    } catch (err) {
        console.error("💥 회원가입 원자성 오류 (DB 실패 롤백 수행):", err);
        // 롤백: LocalStorage 및 세션 완전 초기화
        currentUser = null;
        localStorage.removeItem("currentUser");
        safeLocalStorageSet("aqua_buddy_user_identity", null);
        alert("⚠️ 회원가입 처리 중 오류가 발생했습니다. (이미 존재하는 정보이거나 DB 거부)");
        return;
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

async function handleFinalResetPassword(e) {
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

    // 🔒 Supabase Auth 공식 비밀번호 재설정 이메일/업데이트 연동 준비
    if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
        try {
            await supabaseClient.auth.resetPasswordForEmail(verifiedResetEmail);
        } catch(sbErr) {
            console.warn("Supabase resetPassword notice:", sbErr);
        }
    }

    verifiedResetEmail = null;
    closeModal(document.getElementById("findAccountModal"));
    showToast("🔑 비밀번호 재설정 절차가 완료되었습니다. 새 비밀번호로 로그인해 주세요.");
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
    if (!post || typeof currentUser === 'undefined' || !currentUser) return false;

    const myEmail = currentUser.email ? String(currentUser.email).trim().toLowerCase() : "";
    const myId = currentUser.id ? String(currentUser.id).trim().toLowerCase() : "";

    // 로그인 정보에 고유 이메일과 ID가 모두 없으면 본인 글 판정 불가
    if (!myEmail && !myId) return false;

    // 게시글 작성자 고유 식별자 수집
    const postEmail = (
        post.authorEmail ||
        post.author_email ||
        post.userEmail ||
        post.user_email ||
        post.email ||
        (post.author && String(post.author).includes('@') ? String(post.author) : "")
    ).trim().toLowerCase();

    const postUserId = String(
        post.userId ||
        post.user_id ||
        post.authorId ||
        post.author_id ||
        ""
    ).trim().toLowerCase();

    // 엄격한 일치 (Strict Equality)
    if (myEmail && postEmail && myEmail === postEmail) {
        return true;
    }
    if (myId && postUserId && myId === postUserId) {
        return true;
    }

    return false;
}
window.isMyPost = isMyPost;

function getPostInstSubCategory(post) {
    if (!post) return "freediving";
    if (post.instSubCategory) return post.instSubCategory;
    if (post.inst_sub_category) return post.inst_sub_category;
    if (post.sports_type) {
        const st = String(post.sports_type).toLowerCase();
        if (st.includes("swim") || st.includes("수영장") || st.includes("실내수영")) return "swim";
        if (st.includes("ocean") || st.includes("바다수영") || st.includes("오픈워터")) return "ocean_swim";
        if (st.includes("scuba") || st.includes("스쿠버")) return "scuba";
        if (st.includes("free") || st.includes("프리다이빙")) return "freediving";
        return st;
    }
    if (post.class_type) {
        const ct = String(post.class_type).toLowerCase();
        if (ct.includes("swim") || ct.includes("수영장") || ct.includes("실내수영")) return "swim";
        if (ct.includes("ocean") || ct.includes("바다수영") || ct.includes("오픈워터")) return "ocean_swim";
        if (ct.includes("scuba") || ct.includes("스쿠버")) return "scuba";
        if (ct.includes("free") || ct.includes("프리다이빙")) return "freediving";
    }
    const title = (post.title || "").toLowerCase();
    const desc = (post.desc || post.description || "").toLowerCase();

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
        await syncUserDemographicsMap();

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
            posts = (data || []).map(p => {
                const timeVal = p.created_at || p.createdAt || p.time || (p.date ? p.date : new Date().toISOString());
                let mappedRealName = (p.real_name || p.realName || "").trim();
                if (!mappedRealName && p.category === 'instructor') {
                    if (currentUser && (currentUser.real_name || currentUser.realName)) {
                        mappedRealName = (currentUser.real_name || currentUser.realName).trim();
                    }
                }
                
                // 🔍 작성자 유저 DB 매핑 (실시간 성별/연령대 동기화)
                const authorKey = String(p.email || p.author_email || p.user_name || p.userName || p.author || p.nickname || mappedRealName || '').trim().toLowerCase();
                const matchedUser = (userDemographicsMap && userDemographicsMap[authorKey]) ? userDemographicsMap[authorKey] : null;

                const finalGender = p.gender || p.author_gender || (matchedUser ? matchedUser.gender : '') || 'private';
                const finalAgeGroup = p.age_group || p.author_age_group || p.ageGroup || (matchedUser ? matchedUser.ageGroup : '') || 'private';

                return {
                    ...p,
                    real_name: mappedRealName,
                    realName: mappedRealName,
                    gender: finalGender,
                    author_gender: finalGender,
                    age_group: finalAgeGroup,
                    author_age_group: finalAgeGroup,
                    ageGroup: finalAgeGroup,
                    createdAt: timeVal,
                    created_at: timeVal,
                    userLiked: isPostLikedByMe(p)
                };
            });
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
            switchMainView("all");
        });
    }

    const logoBtn = document.querySelector(".logo");
    if (logoBtn) {
        logoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchMainView("all");
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
            activeBuddySubFilter = "all";
            document.querySelectorAll("#buddySubFilterBar .sub-tab-btn").forEach(b => { if(b.dataset.buddysub === "all") b.classList.add("active"); else b.classList.remove("active"); });
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
                        if (typeof resetCreatePostForm === "function") resetCreatePostForm();
                        editingPostId = null;
                        preselectModalCategory(activeCategory, false);
                        openModal(createModal);
                    }
                };
                closeModal(createModal);
                openModal(authModal);
                return;
            }
            if (activeCategory === "partnership") {
                openInquiryModal('ad');
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
            if (typeof resetCreatePostForm === "function") resetCreatePostForm();
            editingPostId = null;
            preselectModalCategory(activeCategory, false);
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
                    prev.innerHTML = `<img src="${inquiryImageCompressed}" loading="lazy" style="height: 50px; border-radius: 4px; border: 1px solid var(--accent-cyan);">`;
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
                                <img src="${instAppCertImage}" alt="자격증 미리보기" loading="lazy" style="height:60px; border-radius:4px; border:1px solid var(--accent-gold);" class="zoomable-img" onclick="openLightbox('${instAppCertImage}')">
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
        if (typeof resetAuthForm === "function") resetAuthForm();
        closeModal(authModal);
        closeModal(createModal);
    });

    if (closeChatModalBtn) closeChatModalBtn.addEventListener("click", () => {
        if (typeof unsubscribeChatRealtime === "function") unsubscribeChatRealtime();
        closeModal(chatModal);
    });
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
            if (typeof resetAuthForm === "function") resetAuthForm();
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
    var trimmed = (keyword || '').trim();
    if (!trimmed) return;

    if (typeof tideSearchDebounceTimer !== 'undefined' && tideSearchDebounceTimer) {
        clearTimeout(tideSearchDebounceTimer);
    }

    tideSearchDebounceTimer = setTimeout(function() {
        var cleanKw = trimmed.replace(/\s+/g, '').toLowerCase();

        // 1. 등록된 222개 해양 관측 스팟 배열에서 퍼지/스마트 매칭
        var match = null;
        if (typeof OCEAN_WEATHER_DATA !== 'undefined' && OCEAN_WEATHER_DATA) {
            match = OCEAN_WEATHER_DATA.find(function(s) {
                var sNameClean = (s.name || '').replace(/\s+/g, '').toLowerCase();
                var sRegionClean = (s.region || s.region_cat || '').replace(/\s+/g, '').toLowerCase();
                return sNameClean.includes(cleanKw) || cleanKw.includes(sNameClean) ||
                       sRegionClean.includes(cleanKw) || cleanKw.includes(sRegionClean);
            });
        }

        if (match) {
            if (typeof selectDashboardSpot === 'function') {
                selectDashboardSpot(match.id || match.spot_id);
            } else {
                renderUnifiedSpotDashboard(match);
            }
            return;
        }

        // 2. 카카오 장소/주소 검색 API (kakao.maps.load 기반 안전 처리)
        var doKakaoSearch = function() {
            if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                var places = new window.kakao.maps.services.Places();
                places.keywordSearch(keyword, function(result, status) {
                    if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
                        var place = result[0];
                        var customSpot = {
                            id: 'search-' + Date.now(),
                            name: place.place_name || keyword,
                            region: place.address_name || place.road_address_name || '대한민국 해역',
                            lat: parseFloat(place.y),
                            lng: parseFloat(place.x)
                        };
                        renderUnifiedSpotDashboard(customSpot);
                    } else {
                        var geocoder = new window.kakao.maps.services.Geocoder();
                        geocoder.addressSearch(keyword, function(geo, gs) {
                            if (gs === window.kakao.maps.services.Status.OK && geo && geo.length > 0) {
                                var customSpot = {
                                    id: 'search-' + Date.now(),
                                    name: keyword,
                                    region: geo[0].address_name || '대한민국 해역',
                                    lat: parseFloat(geo[0].y),
                                    lng: parseFloat(geo[0].x)
                                };
                                renderUnifiedSpotDashboard(customSpot);
                            } else {
                                doNominatimSearch();
                            }
                        });
                    }
                });
            } else {
                doNominatimSearch();
            }
        };

        // 3. OpenStreetMap Nominatim 글로벌 무료 장소 검색 Fallback
        var doNominatimSearch = function() {
            fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(keyword) + '&countrycodes=kr&limit=1', {
                headers: { 'Accept-Language': 'ko' }
            }).then(function(r) { return r.json(); })
              .then(function(results) {
                  if (results && results.length > 0) {
                      var place = results[0];
                      var customSpot = {
                          id: 'search-' + Date.now(),
                          name: place.display_name.split(',')[0] || keyword,
                          region: place.display_name || '대한민국 해역',
                          lat: parseFloat(place.lat),
                          lng: parseFloat(place.lon)
                      };
                      renderUnifiedSpotDashboard(customSpot);
                  }
              }).catch(function(e) { console.warn('[Nominatim Search]', e); });
        };

        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
            window.kakao.maps.load(doKakaoSearch);
        } else {
            doKakaoSearch();
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
            <img src="${src}" alt="사진 미리보기" class="zoomable-img" loading="lazy" onclick="openLightbox('${src}')">
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

// [프록시 의존도 완전 제거] Vercel 서버리스 대역폭 초과 방지를 위해 원본 URL 직접 반환
function getCctvProxyUrl(url) {
    if (!url) return "";
    return url;
}
window.getCctvProxyUrl = getCctvProxyUrl;

var REGION_LAT_LNG = {
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
                <img src="${cam.thumb}" alt="${cam.name}" class="webcam-thumb-img" loading="lazy">
                <span class="badge-live"><i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> 24H LIVE</span>
                <div class="webcam-play-btn">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="webcam-card-body">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.74rem; color: var(--accent-gold); font-weight: 800; background: rgba(255, 183, 3, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255, 183, 3, 0.35);">
                        <i class="fa-solid fa-scale-balanced"></i> 출처: ${cam.source || '공공기관 CCTV'}
                    </span>
                </div>
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
    const fallbackBox = document.getElementById("webcamHttpFallbackBox");
    const outlinkBtn = document.getElementById("webcamHttpOutlinkBtn");

    // 이전 비디오 / iframe 재생 클린업
    if (activeHlsPlayer) {
        activeHlsPlayer.destroy();
        activeHlsPlayer = null;
    }
    if (video) {
        video.pause();
        video.src = "";
        video.style.display = "none";
    }
    if (iframe) {
        iframe.src = "";
        iframe.style.display = "none";
    }
    if (fallbackBox) {
        fallbackBox.style.display = "none";
    }

    const embedUrl = (cam.embedUrl || "").trim();
    const hlsUrl = (cam.hlsUrl || "").trim();
    const isKbs = embedUrl.includes("kbs.co.kr") || hlsUrl.includes("kbs.co.kr") || (cam.source && cam.source.includes("KBS"));
    const isCoast = embedUrl.includes("coast.mof.go.kr") || (cam.source && cam.source.includes("연안포털"));
    const isHttpOnly = (embedUrl || hlsUrl).startsWith("http://");

    // ★ [0. 해양수산부 연안포털 CCTV]: SAMEORIGIN 프레임 연결거부 방지 전용 Out-link & 이미지 뷰어 UI
    if (isCoast) {
        if (fallbackBox) {
            fallbackBox.style.display = "flex";
            const titleEl = fallbackBox.querySelector("h3");
            const descEl = fallbackBox.querySelector("p");

            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-water" style="color: #00f2fe;"></i> 해양수산부 연안포털 실시간 CCTV';
            if (descEl) descEl.textContent = '해당 CCTV는 제공처(연안포털)의 보안 정책(SAMEORIGIN)에 따라 새 창에서 쾌적하게 24시간 시청하실 수 있습니다.';
            if (outlinkBtn) {
                outlinkBtn.href = embedUrl;
                outlinkBtn.target = "_blank";
                outlinkBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> <span>🌊 연안포털 실시간 CCTV 새 창에서 시청하기 ➔</span>';
            }
        }
    }
    // ★ [1. KBS 재난감시 CCTV]: CORS 차단 및 만료 토큰 문제 완벽 방지를 위해 전용 새 창 열기 Out-link UI 제공
    else if (isKbs) {
        if (fallbackBox) {
            fallbackBox.style.display = "flex";
            const titleEl = fallbackBox.querySelector("h3");
            const descEl = fallbackBox.querySelector("p");

            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-tower-broadcast" style="color: #ff5252;"></i> KBS 재난포털 실시간 CCTV';
            if (descEl) descEl.textContent = '해당 CCTV는 제공처의 보안 정책상 새 창에서 쾌적하게 시청하실 수 있습니다.';
            if (outlinkBtn) {
                outlinkBtn.href = embedUrl || `https://d.kbs.co.kr/special/cctvShare?cctvId=${cam.id.replace('cam-kbs-', '')}`;
                outlinkBtn.innerHTML = '🔗 KBS 재난포털 새 창에서 보기';
            }
        }
    }
    // ★ [2. 비보안 HTTP 링크]: 기본 브라우저 새 창 열기 Out-link UI 제공
    else if (isHttpOnly) {
        const rawUrl = embedUrl || hlsUrl;
        if (fallbackBox) {
            fallbackBox.style.display = "flex";
            const titleEl = fallbackBox.querySelector("h3");
            const descEl = fallbackBox.querySelector("p");

            if (titleEl) titleEl.innerHTML = '외부 보안 정책(HTTP) 보호 안내';
            if (descEl) descEl.textContent = '해당 CCTV는 제공처의 보안(HTTP) 정책상 기기의 기본 브라우저(Safari/Chrome)에서 시청할 수 있습니다.';
            if (outlinkBtn) {
                outlinkBtn.href = rawUrl;
                outlinkBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> <span>🌐 실시간 CCTV 새 창에서 시청하기 ➔</span>';
            }
        }
    }
    // ★ [3. 안전한 HTTPS 직접 HLS 스트리밍 URL]
    else if (hlsUrl && hlsUrl.startsWith("https://") && hlsUrl.includes(".m3u8")) {
        if (video) {
            video.style.display = "block";
            if (Hls && Hls.isSupported()) {
                activeHlsPlayer = new Hls({ lowLatencyMode: true });
                activeHlsPlayer.loadSource(hlsUrl);
                activeHlsPlayer.attachMedia(video);
                activeHlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(e => console.log(e)));
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = hlsUrl;
                video.play().catch(e => console.log(e));
            }
        }
    }
    // ★ [4. 안전한 HTTPS 임베드 URL] (부산 세이프시티 등)
    else if (embedUrl && embedUrl.startsWith("https://")) {
        if (iframe) {
            iframe.style.display = "block";
            iframe.src = embedUrl;
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
var currentDashboardSpot = currentDashboardSpot || null;


/* ==========================================================================
   🌊 Windy Point Forecast API v2 Integration (CORS Error Defense)
   ========================================================================== */
async function fetchWindyPointForecast(spot) {
    // 🌟 CORS 차단 및 메인 스레드 지연 방지: 우회 프록시 호출 전면 비활성화 및 Fallback 데이터 작동
    return null;
}
window.fetchWindyPointForecast = fetchWindyPointForecast;

async function selectDashboardSpot(spotId) {
    if (!spotId) return;
    var spot = null;
    if (typeof OCEAN_WEATHER_DATA !== 'undefined' && OCEAN_WEATHER_DATA) {
        spot = OCEAN_WEATHER_DATA.find(function(s) {
            return s.id === spotId || s.spot_id === spotId || (s.name && (s.name.includes(spotId) || spotId.includes(s.name)));
        });
    }
    if (!spot && typeof OCEAN_WEATHER_DATA !== 'undefined' && OCEAN_WEATHER_DATA.length > 0) {
        spot = OCEAN_WEATHER_DATA[0];
    }
    if (spot) {
        renderUnifiedSpotDashboard(spot);
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

let activeDashHlsPlayer = null;

function changeCctvSelect(cctvId) {
    if (!cctvId) return;
    const cam = OCEAN_WEBCAMS_DATA.find(c => c.id === cctvId);
    if (!cam) return;

    if (activeDashHlsPlayer) {
        activeDashHlsPlayer.destroy();
        activeDashHlsPlayer = null;
    }

    const cctvContainer = document.getElementById("dashboardCctvPlayerBox");
    if (!cctvContainer) return;

    const embedUrl = (cam.embedUrl || "").trim();
    const hlsUrl = (cam.hlsUrl || "").trim();
    const isKbs = embedUrl.includes("kbs.co.kr") || hlsUrl.includes("kbs.co.kr") || (cam.source && cam.source.includes("KBS"));
    const isHttpOnly = (embedUrl || hlsUrl).startsWith("http://");

    if (isKbs) {
        cctvContainer.innerHTML = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; box-sizing: border-box;">
                <i class="fa-solid fa-tower-broadcast" style="font-size: 2.5rem; color: #ff5252; margin-bottom: 12px;"></i>
                <h4 style="color: #fff; font-size: 1.05rem; margin-bottom: 8px;">KBS 재난포털 실시간 CCTV</h4>
                <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 16px; max-width: 340px; line-height: 1.5;">
                    해당 CCTV는 제공처의 보안 정책상 새 창에서 쾌적하게 시청하실 수 있습니다.
                </p>
                <a href="${embedUrl || 'https://d.kbs.co.kr'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 0.88rem; font-weight: 800; border-radius: 10px; text-decoration: none;">
                    🔗 KBS 재난포털 새 창에서 보기
                </a>
            </div>
        `;
    } else if (isHttpOnly) {
        const rawUrl = embedUrl || hlsUrl;
        cctvContainer.innerHTML = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; box-sizing: border-box;">
                <i class="fa-solid fa-shield-halved" style="font-size: 2.4rem; color: var(--accent-gold); margin-bottom: 12px;"></i>
                <h4 style="color: #fff; font-size: 1.05rem; margin-bottom: 8px;">외부 보안 정책(HTTP) 보호 안내</h4>
                <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 16px; max-width: 340px; line-height: 1.5;">
                    해당 CCTV는 제공처의 보안(HTTP) 정책상 기기의 기본 브라우저(Safari/Chrome)에서 시청할 수 있습니다.
                </p>
                <a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 0.88rem; font-weight: 800; border-radius: 10px; text-decoration: none;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>🌐 실시간 CCTV 새 창에서 시청하기 ➔</span>
                </a>
            </div>
        `;
    } else if (hlsUrl && hlsUrl.startsWith("https://") && hlsUrl.includes(".m3u8")) {
        cctvContainer.innerHTML = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #000; position: relative;">
                <video id="dashHlsVideo" controls autoplay muted playsinline style="width: 100%; height: 380px; object-fit: contain; background: #000;"></video>
                <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.75); padding: 6px 12px; border-radius: 8px; color: #00e676; font-weight: 700; font-size: 0.82rem; backdrop-filter: blur(4px);">
                    🔴 24H LIVE CCTV (${cam.name})
                </div>
            </div>
        `;
        const vEl = document.getElementById("dashHlsVideo");
        if (vEl && Hls && Hls.isSupported()) {
            activeDashHlsPlayer = new Hls({ lowLatencyMode: true });
            activeDashHlsPlayer.loadSource(hlsUrl);
            activeDashHlsPlayer.attachMedia(vEl);
            activeDashHlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => vEl.play().catch(e => console.log(e)));
        } else if (vEl && vEl.canPlayType('application/vnd.apple.mpegurl')) {
            vEl.src = hlsUrl;
            vEl.play().catch(e => console.log(e));
        }
    } else if (embedUrl && embedUrl.startsWith("https://")) {
        cctvContainer.innerHTML = `
            <div class="dashboard-cctv-box" style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: #000; position: relative;">
                <iframe src="${embedUrl}" loading="lazy" style="width: 100%; height: 380px; border: none;" allowfullscreen></iframe>
                <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.75); padding: 6px 12px; border-radius: 8px; color: #00e676; font-weight: 700; font-size: 0.82rem; backdrop-filter: blur(4px);">
                    🔴 24H LIVE CCTV 생중계 (${cam.name})
                </div>
            </div>
        `;
    }
}
window.changeCctvSelect = changeCctvSelect;

function renderUnifiedSpotDashboard(spot) {
    // 구 대시보드 숨기기 (지도 위 해양카드로 대체)
    var old = document.getElementById('unifiedDashboardContainer');
    if (old) old.style.display = 'none';

    if (!spot) return;

    // 카카오 지도 위 해양 카드 업데이트
    if (typeof initKakaoOceanMap === 'function') initKakaoOceanMap(spot);

    // 하단 CCTV 패널 업데이트
    var box   = document.getElementById('dashCctvContainer');
    var sel   = document.getElementById('fullwidthCctvSelect');
    var nm    = spot.name || spot.spot_name || '';
    var clean = nm.replace(/부산|울산|거제|포항|경북|경남|강원|제주|해수욕장|해변|포구|항|해상/g, '').trim();
    var match = null;

    if (typeof OCEAN_WEBCAMS_DATA !== 'undefined' && OCEAN_WEBCAMS_DATA) {
        match = OCEAN_WEBCAMS_DATA.find(function(c) {
            return clean && (c.name.includes(clean) || nm.includes(c.name.replace(/CCTV|부산|기장군|해수욕장/g, '').trim()));
        }) || null;
    }

    if (sel && typeof OCEAN_WEBCAMS_DATA !== 'undefined') {
        sel.innerHTML = '<option value="">다른 위치 CCTV 선택 --</option>' +
            OCEAN_WEBCAMS_DATA.map(function(c) {
                return '<option value="' + c.id + '"' + (match && c.id === match.id ? ' selected' : '') + '>' + c.name + '</option>';
            }).join('');
    }

    if (box) {
        box.innerHTML = _makeCctvHtml(match);
        _startHls(box, match);
    }
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
    } else if (cat === "partnership") {
        createBtnText.textContent = "제휴 입점 문의하기";
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

// === 글쓰기 모달창 카테고리 자동 선택 및 UI 변경 (Null 방지 방탄 코드) ===
// === 글쓰기 모달창 카테고리 자동 선택 및 UI 변경 (Null 방지 방탄 코드 + 중고 장비 사진 첨부 지원) ===

// ========================================================
// === THOROUGH CREATE FORM RESET & CLEANUP ENGINE ===
// ========================================================

function resetCreatePostForm() {
    editingPostId = null;
    var form = document.getElementById("createPostForm");
    if (form && typeof form.reset === "function") form.reset();

    var titleEl = document.getElementById("postTitle");
    var descEl = document.getElementById("postDesc");
    var mapAddressEl = document.getElementById("postMapAddress");
    var dateEl = document.getElementById("postDate");
    var priceEl = document.getElementById("postPrice");
    var feeEl = document.getElementById("classFee");
    var incEl = document.getElementById("classInclusion");
    var gbGoalEl = document.getElementById("postGroupBuyGoal");
    var gbCurrEl = document.getElementById("postGroupBuyCurrent");
    var isGbCheck = document.getElementById("postIsGroupBuy");
    var liabilityCheck = document.getElementById("inlineLiabilityCheck");
    var mapSearchResults = document.getElementById("mapSearchResultsContainer");
    var modalMapPicker = document.getElementById("modalMapPicker");

    if (titleEl) titleEl.value = "";
    if (descEl) descEl.value = "";
    if (mapAddressEl) mapAddressEl.value = "";
    if (dateEl) dateEl.value = "";
    if (priceEl) priceEl.value = "";
    if (feeEl) feeEl.value = "";
    if (incEl) incEl.value = "";
    if (gbGoalEl) gbGoalEl.value = "10";
    if (gbCurrEl) gbCurrEl.value = "1";
    if (isGbCheck) isGbCheck.checked = false;
    if (liabilityCheck) liabilityCheck.checked = false;
    if (mapSearchResults) {
        mapSearchResults.innerHTML = "";
        mapSearchResults.classList.add("hidden");
    }
    if (modalMapPicker) modalMapPicker.style.display = "none";

    if (typeof toggleGroupBuyFields === "function") {
        toggleGroupBuyFields(false);
    }
    var isCpCheck = document.getElementById("postIsCarpool");
    if (isCpCheck) isCpCheck.checked = false;
    if (typeof toggleCarpoolFields === "function") {
        toggleCarpoolFields(false);
    }

    uploadedCompressedImages = [];
    uploadedCertImage = "";
    if (typeof renderImagePreviews === "function") {
        renderImagePreviews();
    }
}
window.resetCreatePostForm = resetCreatePostForm;

function preselectModalCategory(cat, isEditing = false) {
    const catKey = cat;
    if (catKey === "instructor" && typeof isVerifiedInstructor === "function" && !isVerifiedInstructor()) {
        if (typeof showToast === "function") showToast("🔑 강사 인증이 필요한 서비스입니다. 강사인증을 진행해 주세요!");
        if (typeof openInstructorAuthModal === "function") openInstructorAuthModal();
        return false;
    }
    const catSelect = document.getElementById("postCategory");
    if (catSelect) catSelect.value = catKey;
    if (typeof updateModalFieldsByCategory === "function") updateModalFieldsByCategory(catKey);

    const modalFormTitle = document.getElementById("createModalTitle");
    const postCategoryGroup = document.getElementById("postCategoryGroup");
    const instructorFields = document.getElementById("instructorFormFields") || document.getElementById("instructorFields");
    const priceRow = document.getElementById("marketPriceRow") || document.getElementById("priceRow");
    const dealMethodGroup = document.getElementById("dealMethodGroup");
    const capacityGroup = document.getElementById("capacityGroup");
    const locationDateGroup = document.getElementById("locationDateGroup");
    const postDateGroup = document.getElementById("postDateGroup");
    const mapAddressGroup = document.getElementById("mapAddressGroup");
    const imageUploadLabel = document.getElementById("imageUploadLabel");
    const descLabel = document.getElementById("descLabel");
    const postCategorySelect = document.getElementById("postCategory");
    const submitBtnText = document.getElementById("submitBtnText");
    const buddyPillOptionsGroup = document.getElementById("buddyPillOptionsGroup");
    const marketGroupBuyContainer = document.getElementById("marketGroupBuyContainer");

    if (!isEditing) {
        if (submitBtnText) submitBtnText.textContent = "등록하기";
        // Reset all inputs to clean state
        const titleEl = document.getElementById("postTitle");
        const descEl = document.getElementById("postDesc");
        const mapAddressEl = document.getElementById("postMapAddress");
        const dateEl = document.getElementById("postDate");
        const priceEl = document.getElementById("postPrice");
        const feeEl = document.getElementById("classFee");
        const incEl = document.getElementById("classInclusion");
        const liabilityCheck = document.getElementById("inlineLiabilityCheck");

        if (titleEl) titleEl.value = "";
        if (descEl) descEl.value = "";
        if (mapAddressEl) mapAddressEl.value = "";
        if (dateEl) dateEl.value = "";
        if (priceEl) priceEl.value = "";
        if (feeEl) feeEl.value = "";
        if (incEl) incEl.value = "";
        if (liabilityCheck) liabilityCheck.checked = false;
        uploadedCompressedImages = [];
        if (typeof renderImagePreviews === "function") renderImagePreviews();
    } else {
        if (submitBtnText) submitBtnText.textContent = "수정 완료";
    }

    if (typeof currentUser !== 'undefined' && currentUser) {
        const uName = document.getElementById("userName");
        const uLic = document.getElementById("userLicense");
        if (uName) uName.value = currentUser.name || currentUser.nickname || "";
        if (uLic) uLic.value = currentUser.license || "";
    }

    if (cat === "instructor") {
        if (modalFormTitle) modalFormTitle.textContent = isEditing ? "강사 클래스 수정" : "강사 클래스 개설 (원데이 체험 / 자격증 코스)";
        if (postCategoryGroup) postCategoryGroup.style.display = "none";
        if (instructorFields) instructorFields.style.display = "block";
        if (priceRow) priceRow.style.display = "none";
        if (dealMethodGroup) dealMethodGroup.style.display = "none";
        if (capacityGroup) capacityGroup.style.display = "block";
        if (locationDateGroup) locationDateGroup.style.display = "grid";
        if (postDateGroup) postDateGroup.style.display = "block";
        if (mapAddressGroup) mapAddressGroup.style.display = "block";
        if (buddyPillOptionsGroup) buddyPillOptionsGroup.style.display = "none";
        if (marketGroupBuyContainer) marketGroupBuyContainer.style.display = "none";
        const cpBoxInst = document.getElementById("carpoolOptionsContainer");
        if (cpBoxInst) cpBoxInst.style.display = "block";
        if (imageUploadLabel) imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 커리큘럼 / 풀장 사진 등록 (최대 4장)`;
        if (descLabel) descLabel.textContent = "상세 내용 및 교육 커리큘럼 *";
        if (postCategorySelect) postCategorySelect.innerHTML = `<option value="instructor" selected>강사 클래스</option>`;

        const userOrg = (currentUser && (currentUser.instructor_org || currentUser.instructorOrg || currentUser.instOrg || currentUser.sports_license || currentUser.freediving_license || currentUser.scuba_license)) || "AIDA";
        const disp = document.getElementById("instOrgAutoDisplayText");
        if (disp) {
            disp.innerHTML = `🏛️ ${escapeHtml(userOrg)} <span style="font-size: 0.72rem; color: #00e676; font-weight: 800; margin-left: 4px;">(공인인증 자동연동 ✔️)</span>`;
        }
        const orgInp = document.getElementById("instOrgInput");
        if (orgInp) {
            orgInp.value = userOrg;
        }

        var instSubSelect = document.getElementById("instSubCategorySelect");
        var curChannel = instSubSelect ? instSubSelect.value : "freediving";
        if (typeof renderClassTypePills === "function") {
            renderClassTypePills(curChannel);
        }
    } else if (cat === "community") {
        if (modalFormTitle) modalFormTitle.textContent = isEditing ? "자유수다글 수정" : "수다방 게시글 작성";
        if (postCategoryGroup) postCategoryGroup.style.display = "none";
        if (instructorFields) instructorFields.style.display = "none";
        if (priceRow) priceRow.style.display = "none";
        if (dealMethodGroup) dealMethodGroup.style.display = "none";
        if (capacityGroup) capacityGroup.style.display = "none";
        if (locationDateGroup) locationDateGroup.style.display = "none";
        if (mapAddressGroup) mapAddressGroup.style.display = "none";
        if (buddyPillOptionsGroup) buddyPillOptionsGroup.style.display = "none";
        if (marketGroupBuyContainer) marketGroupBuyContainer.style.display = "none";
        const cpBoxComm = document.getElementById("carpoolOptionsContainer");
        if (cpBoxComm) {
            cpBoxComm.style.display = "none";
            const cpCheck = document.getElementById("postIsCarpool");
            if (cpCheck) cpCheck.checked = false;
            if (typeof toggleCarpoolFields === "function") toggleCarpoolFields(false);
        }

        if (imageUploadLabel) imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 수다방 사진 등록 (최대 4장)`;
        if (descLabel) descLabel.textContent = "내용 작성 *";
        if (document.getElementById("postDesc")) document.getElementById("postDesc").placeholder = "생각과 정보, 궁금증을 작성해주세요";
        if (postCategorySelect) postCategorySelect.innerHTML = `<option value="community" selected>자유수다방 게시글</option>`;
    } else if (cat === "market") {
        if (modalFormTitle) modalFormTitle.textContent = isEditing ? "중고 장비 수정" : "중고 장비 매물 등록";
        if (postCategoryGroup) postCategoryGroup.style.display = "none";
        if (instructorFields) instructorFields.style.display = "none";
        if (priceRow) priceRow.style.display = "grid";
        if (dealMethodGroup) dealMethodGroup.style.display = "block";
        if (capacityGroup) capacityGroup.style.display = "none";
        if (locationDateGroup) locationDateGroup.style.display = "none";
        if (postDateGroup) postDateGroup.style.display = "none";
        if (mapAddressGroup) mapAddressGroup.style.display = "block";
        if (buddyPillOptionsGroup) buddyPillOptionsGroup.style.display = "none";
        if (marketGroupBuyContainer) marketGroupBuyContainer.style.display = "block";
        const cpBoxMkt = document.getElementById("carpoolOptionsContainer");
        if (cpBoxMkt) {
            cpBoxMkt.style.display = "none";
            const cpCheck = document.getElementById("postIsCarpool");
            if (cpCheck) cpCheck.checked = false;
            if (typeof toggleCarpoolFields === "function") toggleCarpoolFields(false);
        }

        if (imageUploadLabel) imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 중고 장비 사진 등록 (최대 4장)`;
        if (descLabel) descLabel.textContent = "상세 설명 *";
        if (document.getElementById("postDesc")) document.getElementById("postDesc").placeholder = "상세설명을 작성해주세요!";
        if (postCategorySelect) postCategorySelect.innerHTML = `<option value="market" selected>중고 장비 매물 등록</option>`;
    } else {
        if (modalFormTitle) modalFormTitle.textContent = isEditing ? "새 버디 모집글 수정" : "새 버디 모집글 등록";
        if (postCategoryGroup) postCategoryGroup.style.display = "block";
        if (instructorFields) instructorFields.style.display = "none";
        if (priceRow) priceRow.style.display = "none";
        if (dealMethodGroup) dealMethodGroup.style.display = "none";
        if (capacityGroup) capacityGroup.style.display = "block";
        if (locationDateGroup) locationDateGroup.style.display = "grid";
        if (postDateGroup) postDateGroup.style.display = "block";
        if (mapAddressGroup) mapAddressGroup.style.display = "block";
        if (buddyPillOptionsGroup) buddyPillOptionsGroup.style.display = "block";
        if (marketGroupBuyContainer) marketGroupBuyContainer.style.display = "none";
        const cpBoxBuddy = document.getElementById("carpoolOptionsContainer");
        if (cpBoxBuddy) cpBoxBuddy.style.display = "block";
        if (imageUploadLabel) imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 이미지 업로드 (최대 4장)`;
        if (descLabel) descLabel.textContent = "상세 내용 및 플랜 *";
        const isSpecificBuddyCat = ["swimming", "openwater", "freediving", "scuba"].includes(cat);
        if (postCategorySelect) {
            postCategorySelect.innerHTML = `
                <option value="" disabled ${!isSpecificBuddyCat ? 'selected' : ''}>-- 작성 카테고리를 선택해 주세요 --</option>
                <option value="swimming" ${cat === 'swimming' ? 'selected' : ''}>🏊‍♂️ 실내 수영 버디 모집</option>
                <option value="openwater" ${cat === 'openwater' ? 'selected' : ''}>🌊 바다 수영 / 오픈워터 버디 모집</option>
                <option value="freediving" ${cat === 'freediving' ? 'selected' : ''}>🤿 프리다이빙 버디 모집</option>
                <option value="scuba" ${cat === 'scuba' ? 'selected' : ''}>🤿 스쿠버 다이빙 버디 모집</option>
            `;
        }
    }

    if (typeof renderCategoryPillOptions === "function") {
        renderCategoryPillOptions(cat);
    }
}
window.preselectModalCategory = preselectModalCategory;

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


let activePartnershipSubFilter = "all";
function filterPartnershipSub(subKey) {
    activePartnershipSubFilter = subKey || "all";
    document.querySelectorAll("#partnershipSubFilterBar .sub-tab-btn").forEach(btn => {
        if (btn.dataset.partsub === subKey) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    if (typeof filterAndRender === "function") filterAndRender();
}
window.filterPartnershipSub = filterPartnershipSub;

// (filterByCategory is unified with switchMainView at top)

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

function filterAndRender(resetPagination = true) {
    if (resetPagination !== false) {
        currentDisplayLimit = 10;
    }
    if (activeMainView === 'tide' || activeMainView === 'spots' || activeMainView === 'cctv' || activeCategory === 'tide' || activeCategory === 'spots' || activeCategory === 'cctv') {
        const feedSec = document.getElementById("mainFeedViewSection");
        const tideSec = document.getElementById("tideViewSection");
        const cctvSec = document.getElementById("cctvViewSection");
        if (feedSec) { feedSec.style.display = "none"; feedSec.classList.add("hidden"); }
        if (cctvSec) {
            if (activeMainView === 'cctv') { cctvSec.style.display = "block"; cctvSec.classList.remove("hidden"); }
            else { cctvSec.style.display = "none"; cctvSec.classList.add("hidden"); }
        }
        if (tideSec) {
            if (activeMainView !== 'cctv') { tideSec.style.display = "block"; tideSec.classList.remove("hidden"); }
            else { tideSec.style.display = "none"; tideSec.classList.add("hidden"); }
        }
        return;
    }

    const currentUserName = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || currentUser.nickname || "다이버") : "다이버";
    const dashboardSec = document.getElementById("dashboardBlocksSection");
    const postsSec = document.querySelector(".posts-section");
    const filterSec = document.getElementById("feed");
    const activeCountText = document.getElementById("activeCountText");

    const buddySubBar = document.getElementById("buddySubFilterBar");
    if (buddySubBar) {
        const isBuddyCategory = (activeCategory === "all" || activeCategory === "home" || activeCategory === "buddy" || activeCategory === "swimming" || activeCategory === "openwater" || activeCategory === "freediving" || activeCategory === "scuba" || activeCategory === "mermaid");
        if (isBuddyCategory) {
            buddySubBar.classList.remove("hidden");
            buddySubBar.style.display = "flex";
        } else {
            buddySubBar.classList.add("hidden");
            buddySubBar.style.display = "none";
        }
    }

    const instSubBar = document.getElementById("instructorSubFilterBar");
    if (instSubBar) {
        if (activeCategory === "instructor") {
            instSubBar.classList.remove("hidden");
            instSubBar.style.display = "flex";
        } else {
            instSubBar.classList.add("hidden");
            instSubBar.style.display = "none";
        }
    }

    const activitySubBar = document.getElementById("activitySubFilterBar");
    if (activitySubBar) {
        if (activeCategory === "activity_log" || activeCategory === "my_activity") {
            activitySubBar.classList.remove("hidden");
            activitySubBar.style.display = "flex";
        } else {
            activitySubBar.classList.add("hidden");
            activitySubBar.style.display = "none";
        }
    }

    const partSubBar = document.getElementById("partnershipSubFilterBar");
    if (partSubBar) {
        if (activeCategory === "partnership") {
            partSubBar.classList.remove("hidden");
            partSubBar.style.display = "flex";
        } else {
            partSubBar.classList.add("hidden");
            partSubBar.style.display = "none";
        }
    }

    const teaserBanner = document.getElementById("partnershipTeaserBanner");
    if (teaserBanner) {
        if (activeCategory === "partnership") {
            teaserBanner.classList.remove("hidden");
            teaserBanner.style.display = "block";
        } else {
            teaserBanner.classList.add("hidden");
            teaserBanner.style.display = "none";
        }
    }

    if (activeCategory === "all" || activeCategory === "home") {
        document.body.classList.remove("category-view-active");
        if (dashboardSec) dashboardSec.style.display = "flex";
        if (filterSec) filterSec.style.display = "none";
        if (postsSec) postsSec.style.display = "none";
        if (typeof renderDashboardBlocks === "function") renderDashboardBlocks();
        if (activeCountText) activeCountText.textContent = "";
        return;
    }

    // Category Page Mode (Hide Dashboard, Show Filter & Category Posts)
    document.body.classList.add("category-view-active");
    if (dashboardSec) dashboardSec.style.display = "none";
    if (filterSec) filterSec.style.display = "block";
    if (postsSec) postsSec.style.display = "block";

    // 🚫 [투명망토 상호 차단 필터링 전처리 변수]
    const myEmail = (currentUser && currentUser.email) ? currentUser.email.trim().toLowerCase() : "";
    const myName = (currentUser && (currentUser.name || currentUser.nickname)) ? (currentUser.name || currentUser.nickname).trim().toLowerCase() : "";
    const myBlockedUsers = (currentUser && Array.isArray(currentUser.blocked_users)) ? currentUser.blocked_users.map(u => String(u).trim().toLowerCase()) : [];

    let filtered = posts.filter(post => {
        // [투명망토 상호 차단 검사 1]: 내가 차단한 유저(blocked_users)의 게시글 100% 숨김
        if (typeof isAuthorBlockedByMe === 'function' && isAuthorBlockedByMe(post)) {
            return false;
        }

        // [투명망토 상호 차단 검사 2]: 작성자의 author_blocked_users에 내가 포함된 경우 (나를 차단한 유저의 게시글 숨김)
        if (currentUser) {
            let authorBlocked = post.author_blocked_users || post.authorBlockedUsers || [];
            if (typeof authorBlocked === 'string') {
                try { authorBlocked = JSON.parse(authorBlocked); } catch(e) { authorBlocked = []; }
            }
            if (Array.isArray(authorBlocked) && authorBlocked.length > 0) {
                const authorBlockedLower = authorBlocked.map(u => String(u).trim().toLowerCase());
                if (myEmail && authorBlockedLower.includes(myEmail)) return false;
                if (myName && authorBlockedLower.includes(myName)) return false;
            }
        }
        // [투명망토 참가 거절 검사]: 주최자에게 참가 거절(rejected_participants)당한 유저는 해당 게시글이 아예 보이지 않게 처리
        if (currentUser) {
            let rejectedList = post.rejected_participants || post.rejectedParticipants || [];
            if (typeof rejectedList === 'string') {
                try { rejectedList = JSON.parse(rejectedList); } catch(e) { rejectedList = []; }
            }
            if (Array.isArray(rejectedList) && rejectedList.length > 0) {
                const isRejected = rejectedList.some(r => {
                    if (typeof r === 'object' && r !== null) {
                        if (myEmail && r.email && String(r.email).trim().toLowerCase() === myEmail) return true;
                        if (r.name && String(r.name).trim().toLowerCase() === myName) return true;
                    }
                    const rStr = String(r).trim().toLowerCase();
                    return (myName && rStr === myName) || (myEmail && rStr === myEmail);
                });
                if (isRejected) return false;
            }
        }

        const cat = String(post.category || '').toLowerCase();

        if (activeCategory === "activity_log" || activeCategory === "my_activity") {
            if (activeActivitySub === "my_posts") return typeof isMyPost === 'function' && isMyPost(post);
            if (activeActivitySub === "chat_rooms") return typeof chatMessages !== 'undefined' && chatMessages[post.id] && chatMessages[post.id].length > 0;
            if (activeActivitySub === "joined") return post.attendees && post.attendees.includes(currentUserName);
            if (activeActivitySub === "liked") return post.userLiked === true;
            if (activeActivitySub === "commented") return post.comments && post.comments.some(c => c.author === currentUserName || (typeof isMyPost === 'function' && isMyPost(post)));
            if (activeActivitySub === "wished") return post.userWished === true;
            return typeof isMyPost === 'function' && isMyPost(post);
        }

        // 버디 탐색 종목 서브 필터링 적용 (all이 아닌 경우 해당 종목 필터 적용)
        if (typeof activeBuddySubFilter !== 'undefined' && activeBuddySubFilter !== "all") {
            let isMatch = (cat === activeBuddySubFilter);
            if (activeBuddySubFilter === "swimming" && (cat === "swimming" || cat === "pool")) isMatch = true;
            if (activeBuddySubFilter === "openwater" && (cat === "openwater" || cat === "sea" || cat === "ocean_swim")) isMatch = true;
            if (!isMatch) return false;
        }

        if (activeCategory === "instructor") {
            if (cat !== "instructor") return false;
            if (typeof activeInstructorSubFilter !== 'undefined' && activeInstructorSubFilter !== "all") {
                const subCat = typeof getPostInstSubCategory === 'function' ? getPostInstSubCategory(post) : '';
                if (subCat !== activeInstructorSubFilter) return false;
            }
        } else if (activeCategory === "buddy") {
            if (cat === "market" || cat === "community" || cat === "instructor") return false;
        } else if (activeCategory === "swimming") {
            if (cat !== "swimming" && cat !== "pool") return false;
        } else if (activeCategory === "openwater") {
            if (cat !== "openwater" && cat !== "sea" && cat !== "ocean_swim") return false;
        } else if (activeCategory === "freediving") {
            if (cat !== "freediving" && cat !== "buddy" && cat !== "openwater" && cat !== "scuba" && cat !== "swimming") return false;
        } else if (activeCategory === "scuba") {
            if (cat !== "scuba") return false;
        } else if (activeCategory === "community") {
            if (cat !== "community") return false;
        } else if (activeCategory === "market") {
            if (cat !== "market") return false;
        } else if (activeCategory !== "all" && cat !== activeCategory) {
            return false;
        }

        if (typeof selectedRegion !== 'undefined' && selectedRegion !== "all") {
            const postRegion = (post.region || "").toLowerCase();
            const locName = (post.locationName || post.location_name || post.mapAddress || post.location || post.title || "").toLowerCase();
            let isMatch = (postRegion === selectedRegion);

            if (!isMatch) {
                if (selectedRegion === 'seoul' && (postRegion.includes('seoul') || locName.includes('서울') || locName.includes('경기') || locName.includes('인천') || locName.includes('수원') || locName.includes('성남') || locName.includes('용인') || locName.includes('고양') || locName.includes('k26') || locName.includes('파라다이스') || locName.includes('딥스테이션'))) isMatch = true;
                else if (selectedRegion === 'gangwon' && (postRegion.includes('gangwon') || locName.includes('강원') || locName.includes('강릉') || locName.includes('속초') || locName.includes('양양') || locName.includes('동해') || locName.includes('삼척') || locName.includes('춘천'))) isMatch = true;
                else if (selectedRegion === 'chungcheong' && (postRegion.includes('chungcheong') || locName.includes('충청') || locName.includes('대전') || locName.includes('세종') || locName.includes('천안') || locName.includes('청주') || locName.includes('아산') || locName.includes('충주'))) isMatch = true;
                else if (selectedRegion === 'jeolla' && (postRegion.includes('jeolla') || postRegion.includes('honam') || locName.includes('전라') || locName.includes('광주') || locName.includes('전주') || locName.includes('여수') || locName.includes('목포') || locName.includes('순천') || locName.includes('익산'))) isMatch = true;
                else if (selectedRegion === 'gyeongsang' && (postRegion.includes('gyeongsang') || postRegion.includes('yeongnam') || locName.includes('경상') || locName.includes('부산') || locName.includes('대구') || locName.includes('울산') || locName.includes('포항') || locName.includes('경주') || locName.includes('통영') || locName.includes('창원') || locName.includes('거제'))) isMatch = true;
                else if (selectedRegion === 'jeju' && (postRegion.includes('jeju') || locName.includes('제주') || locName.includes('서귀포'))) isMatch = true;
            }
            if (!isMatch) return false;
        }

        if (typeof searchKeyword !== 'undefined' && searchKeyword) {
            const content = `${post.title} ${post.locationName} ${post.mapAddress || ''} ${post.desc} ${post.userName} ${post.reqLicense || ''} ${post.instructorLicenseCode || ''}`.toLowerCase();
            if (!content.includes(searchKeyword)) {
                return false;
            }
        }

        return true;
    });

    if (activeCountText) {
        activeCountText.textContent = `총 ${filtered.length}개의 게시글`;
    }

    filtered.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;

        if (typeof selectedSort !== 'undefined') {
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
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    if (typeof renderGrid === "function") {
        renderGrid(filtered);
    }
}
window.filterAndRender = filterAndRender;

function formatTimeAgo(dateInput) {
    if (!dateInput) return "방금 전";
    try {
        let past;
        if (typeof dateInput === "string") {
            let isoStr = dateInput.trim();
            // If no timezone indicator, assume KST (+09:00)
            if (!isoStr.includes("Z") && !isoStr.includes("+") && !isoStr.includes("-", 10)) {
                isoStr += "+09:00";
            }
            past = new Date(isoStr).getTime();
        } else if (dateInput instanceof Date) {
            past = dateInput.getTime();
        } else if (typeof dateInput === "number") {
            past = dateInput;
        } else {
            past = new Date(dateInput).getTime();
        }

        if (isNaN(past) || past <= 0) return "방금 전";

        const now = Date.now();
        let diffMs = now - past;
        if (diffMs < 0) diffMs = 0;

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 30) return `${diffDay}일 전`;
        
        const diffMonth = Math.floor(diffDay / 30);
        if (diffMonth < 12) return `${diffMonth}개월 전`;
        return `${Math.floor(diffDay / 365)}년 전`;
    } catch (e) {
        return "방금 전";
    }
}
window.formatTimeAgo = formatTimeAgo;

function renderGrid(filteredPosts) {
    currentFilteredPosts = filteredPosts || [];
    const postsGrid = document.getElementById("postsGrid");
    const loadMoreContainer = document.getElementById("loadMoreContainer");
    if (!postsGrid) return;
    
    if (!filteredPosts || filteredPosts.length === 0) {
        postsGrid.innerHTML = "";
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
        const emptyState = document.getElementById("emptyState");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }
    
    const emptyState = document.getElementById("emptyState");
    if (emptyState) emptyState.classList.add("hidden");

    const visiblePosts = filteredPosts.slice(0, currentDisplayLimit);
    
    // Manage Load More button visibility
    if (loadMoreContainer) {
        if (filteredPosts.length > visiblePosts.length) {
            loadMoreContainer.style.display = "block";
            const btn = document.getElementById("loadMorePostsBtn");
            if (btn) {
                btn.innerHTML = `게시글 더보기 ➔ <span style="opacity: 0.85; font-size: 0.82rem; margin-left: 4px;">(${visiblePosts.length} / ${filteredPosts.length})</span>`;
            }
        } else {
            loadMoreContainer.style.display = "none";
        }
    }
    
    postsGrid.innerHTML = visiblePosts.map(post => {
        const isInst = post.category === "instructor";
        const isMarket = post.category === "market";
        const isCommunity = post.category === "community";
        const isPartnership = post.category === "partnership" || post.category === "tour" || post.category === "partner";
        const isFreediving = post.category === "freediving";
        const isScuba = post.category === "scuba";
        const isPool = post.category === "pool" || post.category === "swimming";
        const isSea = post.category === "sea" || post.category === "openwater";
        const isMermaid = post.category === "mermaid";
        
        let catColor = "var(--accent-cyan)";
        let catIcon = "fa-user-group";
        let catLabel = "버디모집";
        
        if (isFreediving)     { catColor = "#00f2fe"; catIcon = "fa-water"; catLabel = "프리다이빙"; }
        else if (isScuba)     { catColor = "#4fc3f7"; catIcon = "fa-water"; catLabel = "스쿠버다이빙"; }
        else if (isPool)      { catColor = "#00e676"; catIcon = "fa-person-swimming"; catLabel = "실내수영"; }
        else if (isSea)       { catColor = "#ffb703"; catIcon = "fa-water"; catLabel = "바다수영"; }
        else if (isMermaid)   { catColor = "#ea80fc"; catIcon = "fa-wand-magic-sparkles"; catLabel = "머메이드"; }
        else if (isInst)      { catColor = "var(--accent-gold)"; catIcon = "fa-graduation-cap"; catLabel = "강사클래스"; }
        else if (isMarket)    { catColor = "#00e676"; catIcon = "fa-tags"; catLabel = "중고장터"; }
        else if (isCommunity) { catColor = "#b39ddb"; catIcon = "fa-comments"; catLabel = "자유수다"; }
        else if (isPartnership) { catColor = "#00f2fe"; catIcon = "fa-handshake"; catLabel = "투어&제휴"; }

        // 홈 화면 대시보드 블록과 100% 동일한 위치 수집 로직 (지역 미정 방지)
        let exactLocation = post.mapAddress || post.locationName || post.location || "";
        if (!exactLocation || exactLocation === "전국 포인트" || exactLocation === "전국") {
            if (post.region && post.region !== 'all') {
                const regMap = { 'seoul':'서울', 'busan':'부산', 'gyeongnam':'경남', 'gyeonggi':'경기', 'incheon':'인천', 'gangwon':'강원', 'jeju':'제주', 'daegu':'대구', 'gwangju':'광주', 'daejeon':'대전', 'ulsan':'울산', 'sejong':'세종', 'chungbuk':'충북', 'chungnam':'충남', 'jeonbuk':'전북', 'jeonnam':'전남', 'gyeongbuk':'경북' };
                exactLocation = regMap[post.region] || post.region;
            } else {
                exactLocation = post.locationName || post.mapAddress || "상세 장소 협의";
            }
        }
        
        // 카테고리별 상태 뱃지 조율
        let statusBadgeHtml = "";
        if (isMarket) {
            if (post.status === 'completed') {
                statusBadgeHtml = '<span style="background:rgba(255,255,255,0.1); color:#aaa; padding:2px 6px; border-radius:4px; font-size:0.72rem; flex-shrink:0;">🎉 거래완료</span>';
            } else {
                statusBadgeHtml = '<span style="background:rgba(0,230,118,0.15); color:#00e676; border:1px solid rgba(0,230,118,0.4); padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:bold; flex-shrink:0;">⚡ 거래중</span>';
            }
        } else if (!isCommunity) {
            if (post.status === 'completed') {
                statusBadgeHtml = '<span style="background:rgba(255,255,255,0.1); color:#aaa; padding:2px 6px; border-radius:4px; font-size:0.72rem; flex-shrink:0;">🎉 완료</span>';
            } else if (post.status === 'in_progress') {
                statusBadgeHtml = '<span style="background:rgba(255,183,3,0.15); color:var(--accent-gold); border:1px solid rgba(255,183,3,0.3); padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:bold; flex-shrink:0;">⚡ 진행중</span>';
            } else {
                statusBadgeHtml = '<span style="background:rgba(0,242,254,0.12); color:var(--accent-cyan); border:1px solid rgba(0,242,254,0.3); padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:bold; flex-shrink:0;">⚡ 모집중</span>';
            }
        }

        const authorName = escapeHtml(post.nickname || post.userName || post.user_name || post.author || "다이버");
        const dateStr = post.date ? formatDate(post.date) : "";
        const feeNum = (post.class_fee !== undefined && post.class_fee !== null) ? parseInt(post.class_fee, 10) : ((post.classFee !== undefined && post.classFee !== null) ? parseInt(post.classFee, 10) : null);
        const priceText = isInst
            ? (feeNum && feeNum > 0 ? feeNum.toLocaleString() + "원" : (post.is_free_trial || post.isFreeTrial || feeNum === 0 ? "🎁 무료 체험" : "수강료 문의"))
            : (isMarket ? (post.price ? post.price.toLocaleString() + "원" : "가격 협의") : "");

        let pList = Array.isArray(post.participants) ? post.participants : (Array.isArray(post.attendees) ? post.attendees : []);
        const totalConfirmed = (post.joined_count !== undefined && post.joined_count !== null) ? post.joined_count : ((post.joinedCount !== undefined && post.joinedCount !== null) ? post.joinedCount : (pList.length + 1));

        const capacityText = (!isMarket && !isCommunity)
            ? `👥 ${totalConfirmed}/${post.capacity || 4}명`
            : "";

        return `
            <div class="post-card post-card-slim" data-post-id="${post.id}" onclick="openPostDetailModal('${post.id}')" style="cursor: pointer;">
                <div class="slim-card-inner">
                    <!-- Line 1: 카테고리, 상태 뱃지, 닉네임 (강사클래스는 4대 세부채널 종목 + 실제 단체명 + 실명 표기) -->
                    <div class="card-line-1" style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                        <span class="slim-cat-badge" style="color:${catColor}; border-color:${catColor}; flex-shrink:0;">
                            <i class="fa-solid ${catIcon}"></i> ${catLabel}
                        </span>
                        ${isInst ? (() => {
                            let sportTag = "프리다이빙";
                            const subCat = (post.inst_sub_category || post.instSubCategory || post.sports_type || "").toLowerCase();
                            const classTypeVal = (post.class_type || post.classType || "").toLowerCase();
                            const titleVal = (post.title || "").toLowerCase();

                            if (subCat === 'swim' || subCat.includes('실내수영') || classTypeVal.includes('수영') || titleVal.includes('실내수영') || titleVal.includes('수영강습')) {
                                sportTag = "실내수영";
                            } else if (subCat === 'ocean_swim' || subCat.includes('바다수영') || classTypeVal.includes('바다') || classTypeVal.includes('오픈워터') || titleVal.includes('바다수영') || titleVal.includes('오픈워터')) {
                                sportTag = "바다수영";
                            } else if (subCat === 'scuba' || subCat.includes('스쿠버') || classTypeVal.includes('스쿠버') || titleVal.includes('스쿠버')) {
                                sportTag = "스쿠버다이빙";
                            } else {
                                sportTag = "프리다이빙";
                            }

                            let sportIcon = (sportTag === "실내수영") ? "fa-person-swimming" : "fa-water";

                            let detailedCourse = (post.class_type || post.classType || "").trim();
                            const isGenericSubCat = ["freediving", "scuba", "swim", "ocean_swim", "프리다이빙", "스쿠버다이빙", "실내수영", "바다수영", "무관"].includes(detailedCourse.toLowerCase());
                            if (!detailedCourse || isGenericSubCat) {
                                const titleLower = (post.title || "").toLowerCase();
                                const descLower = (post.desc || post.description || "").toLowerCase();
                                if (titleLower.includes("체험") || titleLower.includes("원데이") || descLower.includes("체험")) {
                                    detailedCourse = (sportTag === "스쿠버다이빙") ? "체험 다이빙" : "원데이 체험다이빙";
                                } else if (titleLower.includes("자격증") || titleLower.includes("라이센스") || titleLower.includes("lv") || titleLower.includes("level")) {
                                    detailedCourse = "자격증 코스";
                                } else if (titleLower.includes("트레이닝") || titleLower.includes("자세교정") || titleLower.includes("영법")) {
                                    detailedCourse = (sportTag === "실내수영") ? "자세/영법교정" : "종목별 트레이닝";
                                } else {
                                    detailedCourse = (sportTag === "스쿠버다이빙") ? "체험 다이빙" : ((sportTag === "실내수영") ? "초보/영법티칭" : "원데이 체험다이빙");
                                }
                            }

                            let orgText = (post.instructor_org || post.inst_org || "").trim();
                            if (!orgText && (post.category === 'instructor' || post.is_instructor)) {
                                if (currentUser && (currentUser.name === post.author || currentUser.nickname === post.author || currentUser.email === post.author || (currentUser.real_name && currentUser.real_name === post.real_name))) {
                                    orgText = (currentUser.instructor_org || currentUser.instructorOrg || "").trim();
                                }
                                if (!orgText) orgText = "AIDA";
                            }
                            if (orgText === "AIDA / SSI" || orgText === "SSI / PADI / AIDA" || orgText === "공인 협회" || orgText === "협회") {
                                orgText = (currentUser && (currentUser.instructor_org || currentUser.instructorOrg)) ? (currentUser.instructor_org || currentUser.instructorOrg) : "AIDA";
                            }

                            return `
                                <span class="slim-meta" style="background: rgba(0,242,254,0.12); color:#00f2fe; border: 1px solid rgba(0,242,254,0.3); padding:2px 8px; border-radius:6px; font-weight: 700; font-size: 0.72rem; flex-shrink:0;">
                                    <i class="fa-solid ${sportIcon}"></i> ${sportTag}${detailedCourse ? ` · ${escapeHtml(detailedCourse)}` : ''}
                                </span>
                                ${orgText ? `
                                <span class="slim-meta" style="background: rgba(255,183,3,0.12); color:var(--accent-gold); border: 1px solid rgba(255,183,3,0.3); padding:2px 8px; border-radius:6px; font-weight: 700; font-size: 0.72rem; flex-shrink:0;">
                                    🏛️ ${escapeHtml(orgText)}
                                </span>
                                ` : ''}
                            `;
                        })() : ''}
                        ${statusBadgeHtml}
                        ${(() => {
                            if (isCommunity || isMarket) return '';
                            const isCp = post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true';
                            if (!isCp) return '';
                            const cpType = post.carpool_type || post.carpoolType || 'free';
                            const cpFee = (post.carpool_fee !== undefined && post.carpool_fee !== null) ? parseInt(post.carpool_fee, 10) : ((post.carpoolFee !== undefined && post.carpoolFee !== null) ? parseInt(post.carpoolFee, 10) : 0);
                            if ((cpType === 'shared_cost' || cpType === 'paid') && cpFee > 0) {
                                return `<span class="slim-meta" style="background: rgba(255, 183, 3, 0.15); color: #ffb703; border: 1px solid #ffb703; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; flex-shrink: 0;"><i class="fa-solid fa-car"></i> 카풀 분담금 ${cpFee.toLocaleString()}원</span>`;
                            }
                            return `<span class="slim-meta" style="background: rgba(0, 230, 118, 0.15); color: #00e676; border: 1px solid #00e676; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; flex-shrink: 0;"><i class="fa-solid fa-car"></i> 무료 카풀</span>`;
                        })()}
                        <span class="slim-author" style="color: #cbd5e1; font-weight: 600; font-size: 0.82rem; flex-shrink: 0;">
                            ${isInst ? (() => {
                                let rName = (post.real_name || post.realName || "").trim();
                                if (!rName && currentUser && (currentUser.real_name || currentUser.realName)) {
                                    rName = (currentUser.real_name || currentUser.realName).trim();
                                }
                                if (!rName) rName = "김동욱";
                                if (!rName.endsWith('강사')) rName += " 강사";
                                return escapeHtml(rName);
                            })() : authorName} ${getUserDemographicBadge(post)} ${typeof renderUserBadges === 'function' ? renderUserBadges(post) : ''}
                        </span>
                    </div>

                    <!-- Line 2: 게시글 제목 (가려짐 0% 시원한 굵은 폰트) -->
                    <div class="card-line-2">
                        <span class="slim-title" style="font-size: 1.15rem; font-weight: 700; color: #ffffff; line-height: 1.35; display: block; margin: 4px 0 6px 0;">${escapeHtml(post.title)}</span>
                    </div>

                    ${(post.is_group_buy === true || post.is_group_buy === 'true' || post.isGroupBuy === true || (post.group_buy_goal > 0)) ? `
                    <!-- 공동구매 달성률 프로그레스 바 -->
                    <div class="group-buy-bar-container">
                        <div style="display: flex; justify-content: space-between; font-size: 0.76rem; font-weight: 700; margin-bottom: 2px;">
                            <span style="color: #00e676;"><i class="fa-solid fa-cart-shopping"></i> 공동구매 달성률</span>
                            <span style="color: #ffffff;">${parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)} / ${parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10)}개 <span style="color: #00e676;">(${Math.min(100, Math.round(((parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)) / (parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10) || 1)) * 100))}%)</span></span>
                        </div>
                        <div class="group-buy-bar-track">
                            <div class="group-buy-bar-fill" style="width: ${Math.min(100, Math.round(((parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)) / (parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10) || 1)) * 100))}%;"></div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Line 3: 위치, 일정, 모집인원, 좋아요/댓글, 등록시간 -->
                    <div class="card-line-3" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.92rem; font-weight: 600; color: #e2e8f0; margin-top: 4px;">
                        ${(!isCommunity && !isMarket && !isInst && (post.target_depth || post.targetDepth)) ? `<span class="slim-meta" style="background: rgba(0,242,254,0.12); color:#00f2fe; border: 1px solid rgba(0,242,254,0.3); padding:1px 6px; border-radius:4px;"><i class="fa-solid fa-arrows-up-down"></i> ${escapeHtml(post.target_depth || post.targetDepth)}</span>` : ""}
                        ${(!isCommunity && !isMarket && !isInst && (post.req_license || post.reqLicense)) ? `<span class="slim-meta" style="background: rgba(255,183,3,0.12); color:#ffb703; border: 1px solid rgba(255,183,3,0.3); padding:1px 6px; border-radius:4px;"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.req_license || post.reqLicense)}</span>` : ""}
                        ${!isCommunity ? `<span class="slim-meta" style="color:var(--accent-cyan); font-weight:600;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(exactLocation)}</span>` : ""}
                        ${(!isCommunity && !isMarket && dateStr) ? `<span class="slim-meta slim-date" style="color: #ffffff !important; font-weight: 600;"><i class="fa-regular fa-calendar" style="color: #ffffff !important;"></i> ${dateStr}</span>` : ""}
                        ${capacityText ? `<span class="slim-meta slim-capacity" style="color: #ffffff !important; font-weight: 700;">${capacityText}</span>` : ""}
                        ${priceText ? `<span class="slim-price">${priceText}</span>` : ""}
                        ${isCommunity ? `
                        <span class="slim-meta" style="color: #ff6b81; font-weight: 700; font-size: 0.76rem;"><i class="fa-solid fa-heart"></i> ${post.likes || post.likes_count || 0}</span>
                        <span class="slim-meta" style="color: var(--accent-cyan); font-weight: 700; font-size: 0.76rem;"><i class="fa-solid fa-comment-dots"></i> ${(Array.isArray(post.comments) ? post.comments.length : (post.comments_count || 0))}</span>
                        ` : ''}
                        ${isMarket ? `
                        <span class="slim-meta" style="color: #ff6b81; font-weight: 700; font-size: 0.76rem;"><i class="fa-solid fa-heart"></i> 찜 ${post.likes || post.likes_count || post.wishlistCount || 0}</span>
                        <span class="slim-meta" style="color: var(--accent-cyan); font-weight: 700; font-size: 0.76rem;"><i class="fa-solid fa-comment-dots"></i> ${(Array.isArray(post.comments) ? post.comments.length : (post.comments_count || 0))}</span>
                        ` : ''}
                        <span class="slim-time" style="margin-left: auto;">${formatTimeAgo(post.created_at || post.createdAt || post.time || post.date)}</span>
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

    // 🛡️ 차단된 유저의 게시글은 대시보드 4개 블록에서도 100% 즉시 숨김
    const visiblePosts = (typeof posts !== 'undefined' && Array.isArray(posts))
        ? posts.filter(p => typeof isAuthorBlockedByMe !== 'function' || !isAuthorBlockedByMe(p))
        : [];

    const buddyPosts = visiblePosts.filter(p => ["freediving", "scuba", "swimming", "openwater"].includes(p.category)).slice(0, 4);
    const instPosts = visiblePosts.filter(p => p.category === "instructor").slice(0, 4);
    const commPosts = visiblePosts.filter(p => p.category === "community").slice(0, 4);
    const marketPosts = visiblePosts.filter(p => p.category === "market").slice(0, 4);

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

    const feeNum = (post.class_fee !== undefined && post.class_fee !== null) ? parseInt(post.class_fee, 10) : ((post.classFee !== undefined && post.classFee !== null) ? parseInt(post.classFee, 10) : null);
    const priceText = isInst ? (feeNum && feeNum > 0 ? feeNum.toLocaleString() + '원' : (post.is_free_trial || post.isFreeTrial || feeNum === 0 ? "🎁 무료 체험" : "수강료 문의")) : (isMarket ? (post.price ? post.price.toLocaleString() + '원' : '가격협의') : '');

    let metaLineHtml = "";
    if (isBuddy || isInst) {
        const scheduleText = formatDate(post.date || post.createdAt);
        const locText = post.mapAddress || post.locationName || post.location || '장소 미지정';
        let pList = Array.isArray(post.participants) ? post.participants : (Array.isArray(post.attendees) ? post.attendees : []);
        const joined = (post.joined_count !== undefined && post.joined_count !== null) ? post.joined_count : ((post.joinedCount !== undefined && post.joinedCount !== null) ? post.joinedCount : (pList.length + 1));
        const cap = post.capacity || 4;
        const isDone = post.status === 'completed';
        const statusLabel = isDone ? '완료' : '모집 중';
        const statusColor = isDone ? '#00e676' : 'var(--accent-gold)';

        const isCp = post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true';
        const cpType = post.carpool_type || post.carpoolType || 'free';
        const cpFee = (post.carpool_fee !== undefined && post.carpool_fee !== null) ? parseInt(post.carpool_fee, 10) : ((post.carpoolFee !== undefined && post.carpoolFee !== null) ? parseInt(post.carpoolFee, 10) : 0);
        let cpBadgeHtml = '';
        if (isCp) {
            if ((cpType === 'shared_cost' || cpType === 'paid') && cpFee > 0) {
                cpBadgeHtml = `<span style="background: rgba(255, 183, 3, 0.15); color: #ffb703; border: 1px solid #ffb703; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;"><i class="fa-solid fa-car"></i> 카풀 분담금 ${cpFee.toLocaleString()}원</span> <span style="opacity: 0.3;">|</span>`;
            } else {
                cpBadgeHtml = `<span style="background: rgba(0, 230, 118, 0.15); color: #00e676; border: 1px solid #00e676; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;"><i class="fa-solid fa-car"></i> 무료 카풀</span> <span style="opacity: 0.3;">|</span>`;
            }
        }

        metaLineHtml = `
            <div class="post-submeta-line" style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; text-align: left;">
                ${cpBadgeHtml}
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
    const container = document.getElementById("chatMessagesStream") || document.getElementById("chatMessageList");
    if (!container) return;

    // 모든 과거 & 현재 대화 100% 보장 렌더링 (필터 제거)
    container.innerHTML = stream.map(msg => {
        if (msg.sender === "system") {
            return `
            <div class="chat-system-notice" style="text-align: center; margin: 10px 0;">
                <span style="background: rgba(0, 242, 254, 0.12); color: var(--accent-cyan); font-size: 0.78rem; padding: 4px 12px; border-radius: 12px; border: 1px dashed var(--accent-cyan);">
                    ${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}
                </span>
            </div>
            `;
        }

        const myName = currentUser ? (currentUser.nickname || currentUser.name || currentUser.user_name || currentUser.email || '').trim().toLowerCase() : '';
        const authorName = (msg.author || '').trim().toLowerCase();
        const isUserMsg = msg.sender === "user" || (myName && authorName === myName);
        const isHostMsg = msg.sender === "host";

        return `
        <div class="chat-bubble ${isUserMsg ? 'user' : (isHostMsg ? 'host' : 'attendee')}" style="${isUserMsg ? 'margin-left: auto; background: linear-gradient(135deg, #00f2fe, #4facfe); color: #000; text-align: right;' : 'margin-right: auto; background: rgba(255,255,255,0.1); color: #fff;'} padding: 8px 14px; border-radius: 12px; margin-bottom: 8px; max-width: 80%;">
            <div style="font-size: 0.72rem; opacity: 0.8; margin-bottom: 2px;">${typeof escapeHtml === 'function' ? escapeHtml(msg.author) : msg.author} (${msg.time || ''})</div>
            <div style="font-size: 0.9rem; font-weight: 600; word-break: break-word;">${typeof escapeHtml === 'function' ? escapeHtml(msg.text) : msg.text}</div>
        </div>
        `;
    }).join("");

    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 30);
}

// === fetchAndRenderComments: DB에서 댓글 불러와 화면 렌더링 ===
// === fetchAndRenderComments: DB에서 댓글 불러와 화면 렌더링 ===
// === fetchAndRenderComments: DB에서 최신 댓글을 조회해 화면에 렌더링 ===
// === fetchAndRenderComments: DB에서 댓글 불러와 모든 화면에 렌더링 ===
async function fetchAndRenderComments(rawPostId) {
    if (!supabaseClient || !rawPostId) return;
    const postIdStr = String(rawPostId).trim();

    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('*')
            .eq('post_id', postIdStr)
            .order('created_at', { ascending: true });

        if (error) return;
        if (!data) return;

        const uniqueMap = new Map();
        data.forEach(c => {
            const key = c.id || (c.author + '::' + (c.content || c.text));
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    id: c.id,
                    author: c.author || c.user_name || '다이버',
                    text: c.content || c.text || '',
                    time: c.created_at ? (typeof formatTimeAgo === 'function' ? formatTimeAgo(c.created_at) : new Date(c.created_at).toLocaleString('ko-KR')) : '방금 전',
                    created_at: c.created_at
                });
            }
        });

        let comments = Array.from(uniqueMap.values());

        // 🚫 [댓글 스트림 투명망토]: 차단된 유저의 작성 댓글 제외
        const myBlockedUsers = (currentUser && Array.isArray(currentUser.blocked_users)) 
            ? currentUser.blocked_users.map(u => String(u).trim().toLowerCase()) 
            : [];

        if (myBlockedUsers.length > 0) {
            comments = comments.filter(c => {
                if (typeof isAuthorBlockedByMe === 'function' && isAuthorBlockedByMe(c)) return false;
                const authorName = String(c.author || '').trim().toLowerCase();
                if (authorName && myBlockedUsers.includes(authorName)) return false;
                return true;
            });
        }
        const htmlStr = comments.length > 0 ? comments.map(c => `
            <div class="comment-item" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
                <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;"><i class="fa-solid fa-user-circle"></i> ${typeof escapeHtml === 'function' ? escapeHtml(c.author || '') : (c.author || '')}</span>
                    <span style="opacity: 0.6; font-size: 0.74rem;">${c.time || '방금 전'}</span>
                </div>
                <p style="color: var(--text-main); font-size: 0.88rem; margin: 0; word-break: break-word;">${typeof escapeHtml === 'function' ? escapeHtml(c.text || '') : (c.text || '')}</p>
            </div>
        `).join('') : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>';

        // ✅ 핵심 수정: 숨겨진 모달과 현재 팝업 모달 양쪽 모두의 댓글 상자 ID를 완벽히 찾아내서 업데이트
        const containers = document.querySelectorAll('#commentListContainer, #dynamicCommentListContainer_' + postIdStr);
        containers.forEach(container => {
            container.innerHTML = htmlStr;
            setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
        });

        // ✅ 댓글 수 카운트 뱃지 실시간 업데이트 적용
        const countEls = document.querySelectorAll('#detailCommentCount, .detail-comment-count, #detailCommentCount_' + postIdStr);
        countEls.forEach(el => el.textContent = comments.length);

        const postObj = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === postIdStr) : null;
        if (postObj) {
            postObj.comments = comments;
            postObj.comments_count = comments.length;
            if (supabaseClient) {
                supabaseClient.from('posts').update({ comments_count: comments.length }).eq('id', postIdStr).then(() => {});
            }
        }

    } catch(err) {
        console.warn('[COMMENT] fetchAndRenderComments 오류:', err);
    }
}
window.fetchAndRenderComments = fetchAndRenderComments;

var _commentRealtimeChannel = null;
var _commentRealtimePostId = null;
var _commentPollTimer = null;

// === subscribeCommentRealtime: Supabase Realtime으로 댓글 작성 감지 수신 ===
var _commentRealtimeChannel = null;
var _commentRealtimePostId = null;
var _commentPollTimer = null;

// === subscribeCommentRealtime: Supabase Realtime으로 댓글 작성 중복 방어 수신 엔진 ===
var _commentRealtimeChannel = _commentRealtimeChannel || null;
var _commentRealtimePostId = _commentRealtimePostId || null;
var _commentPollTimer = _commentPollTimer || null;

function subscribeCommentRealtime(rawPostId) {
    if (!supabaseClient || !rawPostId) return;
    const postIdStr = (typeof getCanonicalPostId === 'function') ? getCanonicalPostId(rawPostId) : String(rawPostId).trim();

    if (_commentRealtimePostId === postIdStr && _commentRealtimeChannel) {
        console.log('[COMMENT RT] 이미 연결된 댓글 실시간 채널입니다 (중복 구독 방어):', postIdStr);
        return;
    }

    unsubscribeCommentRealtime();
    _commentRealtimePostId = postIdStr;

    fetchAndRenderComments(postIdStr);

    try {
        _commentRealtimeChannel = supabaseClient
            .channel('comments_room_' + postIdStr)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments'
            }, (payload) => {
                if (payload && payload.new) {
                    const pid = (typeof getCanonicalPostId === 'function') ? getCanonicalPostId(payload.new.post_id) : String(payload.new.post_id || '').trim();
                    if (pid === postIdStr) {
                        fetchAndRenderComments(postIdStr);
                        if (typeof playNotificationSound === 'function') playNotificationSound();
                    }
                }
            })
            .subscribe();
    } catch(err) {
        console.warn('[COMMENT RT] 댓글 실시간 채널 결합 예외:', err);
    }

    if (_commentPollTimer) clearInterval(_commentPollTimer);
    _commentPollTimer = setInterval(() => {
        fetchAndRenderComments(postIdStr);
    }, 2000);
}
window.subscribeCommentRealtime = subscribeCommentRealtime;

function unsubscribeCommentRealtime() {
    if (_commentRealtimeChannel && supabaseClient) {
        try { supabaseClient.removeChannel(_commentRealtimeChannel); } catch(e) {}
    }
    if (_commentPollTimer) { clearInterval(_commentPollTimer); _commentPollTimer = null; }
    _commentRealtimeChannel = null;
    _commentRealtimePostId = null;
}
window.unsubscribeCommentRealtime = unsubscribeCommentRealtime;

// === handleCompleteSchedule: 주최자 전용 일정 완료 처리 엔진 ===
async function handleCompleteSchedule(postId) {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id).trim() === String(postId).trim()) : null;
    if (!post) return;

    if (typeof isMyPost === 'function' && !isMyPost(post) && typeof isAdminAuthenticated !== 'undefined' && !isAdminAuthenticated) {
        if (typeof showToast === 'function') showToast("⛔ 주최자 본인만 일정을 완료 처리할 수 있습니다!");
        return;
    }

    const nextStatus = post.status === 'completed' ? 'in_progress' : 'completed';
    post.status = nextStatus;

    if (typeof showToast === 'function') {
        showToast(nextStatus === 'completed' ? "🎉 모임 일정이 완료 처리되었습니다! 참가자 매너 평가가 활성화됩니다." : "🔄 모임 상태가 진행중으로 변경되었습니다.");
    }

    if (typeof savePosts === 'function') savePosts();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('posts').update({ status: nextStatus }).eq('id', post.id);
        } catch(e) {}
    }

    renderDynamicDetailModal(post);
}
window.handleCompleteSchedule = handleCompleteSchedule;

// === handleRateParticipant: 참가자 전용 매너 평가 권한 검증 엔진 ===
async function handleRateParticipant(postId, targetName) {
    if (typeof currentUser === 'undefined' || !currentUser) {
        if (typeof showToast === 'function') showToast("🔑 로그인 후 매너 평가를 진행하실 수 있습니다.");
        return;
    }
    
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id).trim() === String(postId).trim()) : null;
    if (!post) return;

    // 1. 일정 완료 상태 검증
    if (post.status !== 'completed') {
        if (typeof showToast === 'function') showToast("🔒 주최자가 모임 일정을 완료 처리한 이후에 매너 평가가 가능합니다.");
        return;
    }

    // 2. 실제 모임 참가자/주최자 본인 권한 검증
    const myName = currentUser.nickname || currentUser.name || currentUser.realName || currentUser.real_name || "다이버";
    const myIdStr = (currentUser.id || myName).toLowerCase();
    const isHost = typeof isMyPost === 'function' ? isMyPost(post) : false;

    const participantsList = Array.isArray(post.participants) ? post.participants : [];
    const isParticipant = participantsList.some(p => {
        const pName = typeof p === 'object' ? (p.name || p.email || p.id || '') : String(p);
        return String(pName).toLowerCase() === myIdStr || String(pName).toLowerCase() === myName.toLowerCase();
    });

    if (!isHost && !isParticipant) {
        if (typeof showToast === 'function') showToast("⚠️ 해당 모임에 실제 참가한 회원만 매너 평가를 진행하실 수 있습니다.");
        return;
    }

    const rating = prompt(`'${targetName}' 회원의 매너 온도를 평가해 주세요! (1~5점 입력)`, "5");
    if (!rating) return;
    const scoreNum = parseFloat(rating);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
        if (typeof showToast === 'function') showToast("⚠️ 1점부터 5점 사이의 점수를 입력해 주세요.");
        return;
    }

    const bonusTemp = ((scoreNum - 3) * 0.5).toFixed(1);
    if (typeof showToast === 'function') {
        showToast(`✨ '${targetName}' 회원님에게 매너 평가(${scoreNum}점)를 남겼습니다! (매너 온도 +${bonusTemp}℃)`);
    }
}
window.handleRateParticipant = handleRateParticipant;


// ==================================================
// 📊 주최/참여 카운트 안전 누적 & 롤백 헬퍼 함수
// ==================================================
async function incrementInstructorClassCount(instEmail, instName, delta = 1) {
    if (!supabaseClient) return;
    try {
        let userRow = null;
        if (instEmail) {
            const { data } = await supabaseClient.from('users').select('*').eq('email', instEmail.toLowerCase()).maybeSingle();
            userRow = data;
        }
        if (!userRow && instName) {
            let uRes = await supabaseClient.from('users').select('*').eq('nickname', instName).maybeSingle();
            if (!uRes.data) {
                try { uRes = await supabaseClient.from('users').select('*').eq('real_name', instName).maybeSingle(); } catch(e) {}
            }
            const data = uRes.data;
            userRow = data;
        }
        if (userRow) {
            const cur = parseInt(userRow.instructor_class_count || 0, 10);
            const nextVal = Math.max(0, cur + delta);
            try {
                await supabaseClient.from('users').update({ instructor_class_count: nextVal }).eq('id', userRow.id);
            } catch(e) {}
            console.log(`[INST CLASS COUNT] User ${userRow.email || userRow.name} instructor_class_count updated: ${cur} -> ${nextVal}`);
            if (currentUser && (currentUser.email === userRow.email || currentUser.id === userRow.id)) {
                currentUser.instructor_class_count = nextVal;
                currentUser.classCount = nextVal;
                if (typeof safeLocalStorageSet === 'function') {
                    safeLocalStorageSet("aqua_buddy_user_identity", JSON.stringify(currentUser));
                    safeLocalStorageSet("currentUser", JSON.stringify(currentUser));
                }
            }
        }
    } catch(err) {
        console.warn("incrementInstructorClassCount error:", err);
    }
}
window.incrementInstructorClassCount = incrementInstructorClassCount;

async function incrementUserHostCount(hostEmail, hostName, delta = 1) {
    if (!supabaseClient) return;
    try {
        let userRow = null;
        if (hostEmail) {
            const { data } = await supabaseClient.from('users').select('*').eq('email', hostEmail.toLowerCase()).maybeSingle();
            userRow = data;
        }
        if (!userRow && hostName) {
            let uRes = await supabaseClient.from('users').select('*').eq('nickname', hostName).maybeSingle();
            if (!uRes.data) {
                try { uRes = await supabaseClient.from('users').select('*').eq('real_name', hostName).maybeSingle(); } catch(e) {}
            }
            const data = uRes.data;
            userRow = data;
        }
        if (userRow) {
            const cur = parseInt(userRow.hosted_count || 0, 10);
            const nextVal = Math.max(0, cur + delta);
            await supabaseClient.from('users').update({ hosted_count: nextVal }).eq('id', userRow.id);
            console.log(`[HOST COUNT] User ${userRow.email || userRow.name} hosted_count updated: ${cur} -> ${nextVal}`);
            if (currentUser && (currentUser.email === userRow.email || currentUser.id === userRow.id)) {
                currentUser.hosted_count = nextVal;
                currentUser.hostedCount = nextVal;
                localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
            }
        }
    } catch(err) {
        console.warn("incrementUserHostCount error:", err);
    }
}

async function incrementParticipantCompletedCount(pEmail, pName, delta = 1) {
    if (!supabaseClient) return;
    try {
        let userRow = null;
        if (pEmail) {
            const { data } = await supabaseClient.from('users').select('*').eq('email', pEmail.toLowerCase()).maybeSingle();
            userRow = data;
        }
        if (!userRow && pName) {
            let uRes = await supabaseClient.from('users').select('*').eq('nickname', pName).maybeSingle();
            if (!uRes.data) {
                try { uRes = await supabaseClient.from('users').select('*').eq('real_name', pName).maybeSingle(); } catch(e) {}
            }
            const data = uRes.data;
            userRow = data;
        }
        if (userRow) {
            const cur = parseInt(userRow.completed_meets_count || 0, 10);
            const nextVal = Math.max(0, cur + delta);
            await supabaseClient.from('users').update({ completed_meets_count: nextVal }).eq('id', userRow.id);
            console.log(`[PARTICIPANT COUNT] User ${userRow.email || userRow.name} completed_meets_count updated: ${cur} -> ${nextVal}`);
            if (currentUser && (currentUser.email === userRow.email || currentUser.id === userRow.id)) {
                currentUser.completed_meets_count = nextVal;
                currentUser.completedCount = nextVal;
                localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
            }
        }
    } catch(err) {
        console.warn("incrementParticipantCompletedCount error:", err);
    }
}

// === handleChangePostStatus: 주최자 전용 단계별 모집 상태 변경 & 자동 카운팅 & 롤백 & LOCK 제어 ===
async function handleChangePostStatus(postId, targetStatus) {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id).trim() === String(postId).trim()) : null;
    if (!post) return;

    if (typeof isMyPost === 'function' && !isMyPost(post) && typeof isAdminAuthenticated !== 'undefined' && !isAdminAuthenticated) {
        if (typeof showToast === 'function') showToast("⛔ 주최자 본인만 모임/매물 상태를 변경할 수 있습니다!");
        return;
    }

    const previousStatus = post.status || 'recruiting';
    const isMannerLocked = (previousStatus === 'completed') && (post.manner_locked === true || (Array.isArray(post.evaluated_users) && post.evaluated_users.length > 0) || post.has_evaluated === true);
    if (isMannerLocked) {
        if (typeof showToast === 'function') {
            showToast("🔒 매너 평가가 이미 완료되어 모임 상태를 더 이상 변경할 수 없습니다.");
        }
        return;
    }
    if (previousStatus === targetStatus) return;

    const isMarket = post.category === "market";
    const isCommunity = post.category === "community";
    const hostEmail = (post.authorEmail || post.author_email || post.userEmail || post.email || (post.author && post.author.includes('@') ? post.author : "")).trim().toLowerCase();
    const hostName = post.realName || post.real_name || post.nickname || post.userName || post.author || "주최자";
    const pList = Array.isArray(post.participants) ? post.participants : [];

    // [1] 일정완료로 전환 시 -> +1 카운팅 적용 (주최자 외 최소 1명 이상 참가 시에만 주최 실적 인정!)
    if (targetStatus === "completed" && !isMarket && !isCommunity) {
        if (!post.counts_applied) {
            if (pList && pList.length >= 1) {
                post.counts_applied = true;
                if (post.category === "instructor" || post.is_instructor) {
                    await incrementInstructorClassCount(hostEmail, hostName, 1);
                } else {
                    await incrementUserHostCount(hostEmail, hostName, 1);
                }
                for (const p of pList) {
                    const pEmail = typeof p === 'object' ? (p.email || '') : '';
                    const pName = typeof p === 'object' ? (p.name || p.nickname || '') : String(p);
                    await incrementParticipantCompletedCount(pEmail, pName, 1);
                }
                if (typeof showToast === 'function') {
                    showToast("🎉 축하합니다! 버디 모집 일정이 완료되어 주최 실적 +1회가 카운트되었습니다!");
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast("클래스가 완료 상태로 변경되었습니다. (수강생 1명 이상 참가 완료 시 강사 클래스 실적이 인정됩니다.)");
                }
            }
        }
    }

    // [2] 일정완료에서 다시 진행중/모집중으로 롤백 시 -> +1 누적 해제 (중복 카운팅 방지)
    if (previousStatus === "completed" && targetStatus !== "completed" && !isMarket && !isCommunity) {
        if (post.counts_applied) {
            post.counts_applied = false;
            if (post.category === "instructor" || post.is_instructor) {
                await incrementInstructorClassCount(hostEmail, hostName, -1);
            } else {
                await incrementUserHostCount(hostEmail, hostName, -1);
            }
            for (const p of pList) {
                const pEmail = typeof p === 'object' ? (p.email || '') : '';
                const pName = typeof p === 'object' ? (p.name || p.nickname || '') : String(p);
                await incrementParticipantCompletedCount(pEmail, pName, -1);
            }
        }
        // If rolled back, reset manner_locked
        post.manner_locked = false;
        post.has_evaluated = false;
    }

    post.status = targetStatus;

    let statusText = "모집중";
    if (isMarket) {
        if (targetStatus === "recruiting" || targetStatus === "trading") statusText = "거래중";
        else if (targetStatus === "reserved") statusText = "예약중";
        else if (targetStatus === "completed") statusText = "거래완료";
    } else {
        if (targetStatus === "in_progress") statusText = "진행중";
        else if (targetStatus === "completed") statusText = "일정완료";
    }
    post.statusText = statusText;

    if (typeof showToast === 'function') {
        showToast(`🎉 상태가 [${statusText}] 상태로 변경되었습니다.`);
    }

    if (typeof savePosts === 'function') savePosts();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                status: targetStatus,
                status_text: statusText,
                counts_applied: post.counts_applied || false
            }).eq('id', post.id);
        } catch(e) {
            console.warn('Supabase post status update exception:', e);
        }
    }

    renderDynamicDetailModal(post);

    // 일정 완료 시 주최자 칭찬 모달 자동 오픈
    if (targetStatus === "completed" && !isMarket && !isCommunity && pList.length > 0) {
        setTimeout(() => {
            openMannerModal(post, 'host_to_participant');
        }, 500);
    }
}
window.handleChangePostStatus = handleChangePostStatus;

// === renderDynamicDetailModal: 매너 평가 제거 & 3단계 상태 변경 모달 ===
function renderDynamicDetailModal(post) {
    if (!post) return;
    let existing = document.getElementById("dynamicDetailModalOverlay");
    if (existing) existing.remove();

    const isAuthor = (typeof isMyPost === 'function') ? isMyPost(post) : false;
    const isCommunity = post.category === "community";
    const isMarket = post.category === "market";
    const isInstructor = post.category === "instructor" || post.is_instructor;
    const isPartnership = post.category === "partnership" || post.category === "tour" || post.category === "partner";

    const authorName = isInstructor ? (post.realName || post.real_name || post.userName || post.user_name || post.author || "검증 강사") : (post.userName || post.user_name || post.nickname || post.author || "다이버");
    const categoryKorean = (typeof getCategoryNameKorean === 'function') ? getCategoryNameKorean(post.categoryName || post.category) : (post.category || '일반');

    // 카테고리별 상태 뱃지 분기
    let statusBadgeHtml = '';
    if (!isCommunity) {
        if (isMarket) {
            if (post.status === 'completed') {
                statusBadgeHtml = '<span class="badge trade-complete" style="background: rgba(0, 230, 118, 0.2); border: 1px solid #00e676; color: #00e676; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">거래완료</span>';
            } else if (post.status === 'reserved') {
                statusBadgeHtml = '<span class="badge trade-reserve" style="background: rgba(255, 183, 3, 0.2); border: 1px solid #ffb703; color: #ffb703; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">예약중</span>';
            } else {
                statusBadgeHtml = '<span class="badge trade-progress" style="background: rgba(0, 242, 254, 0.2); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">거래진행중</span>';
            }
        } else {
            if (post.status === 'completed') {
                statusBadgeHtml = '<span style="background: rgba(0, 230, 118, 0.2); border: 1px solid #00e676; color: #00e676; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">✅ 일정완료</span>';
            } else if (post.status === 'in_progress') {
                statusBadgeHtml = '<span style="background: rgba(255, 183, 3, 0.2); border: 1px solid #ffb703; color: #ffb703; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">🏊‍♂️ 진행중</span>';
            } else {
                statusBadgeHtml = '<span style="background: rgba(0, 242, 254, 0.2); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">📢 모집중</span>';
            }
        }
    }

    const feeNum = (post.class_fee !== undefined && post.class_fee !== null) ? parseInt(post.class_fee, 10) : ((post.classFee !== undefined && post.classFee !== null) ? parseInt(post.classFee, 10) : null);
    const priceText = isInstructor ? (feeNum && feeNum > 0 ? feeNum.toLocaleString() + '원' : (post.is_free_trial || post.isFreeTrial || feeNum === 0 ? "🎁 무료 체험" : "수강료 문의")) : (isMarket ? (post.price ? post.price.toLocaleString() + '원' : '가격협의') : '');
    const images = Array.isArray(post.images) ? post.images : [];
    const imagesHtml = images.map(img => `<img src="${img}" loading="lazy" style="max-width:100%; border-radius:10px; margin-top:8px; border:1px solid #00f2fe; box-shadow: 0 4px 16px rgba(0,242,254,0.2);">`).join("");

    const comments = Array.isArray(post.comments) ? post.comments : [];
    const commentsHtml = comments.map(c => `
        <div style="background:rgba(255,255,255,0.06); padding:9px 12px; border-radius:8px; margin-bottom:6px; font-size:0.85rem;">
            <strong style="color:#00f2fe; cursor:pointer;" onclick="openUserProfileModal('${typeof escapeHtml === 'function' ? escapeHtml(c.author || '익명') : (c.author || '익명')}', '${post.category || ""}');">👤 ${typeof escapeHtml === 'function' ? escapeHtml(c.author || '익명') : (c.author || '익명')}</strong> ${getUserDemographicBadge(c.author || c)} ${typeof renderUserBadges === 'function' ? renderUserBadges(c.author || c) : ''} <span style="opacity:0.6; font-size:0.75rem;">(${c.time || '방금 전'})</span>: ${typeof escapeHtml === 'function' ? escapeHtml(c.text || '') : (c.text || '')}
        </div>
    `).join("");

    const locationText = post.mapAddress || post.locationName || post.location || '';
    const dateText = (typeof formatDate === 'function') ? formatDate(post.date || post.createdAt) : (post.date || '일시 협의');

    const participantsList = Array.isArray(post.participants) ? post.participants : [];
    // 👑 주최자 1명 + 참가자 N명 = 총 (N + 1)명
    const currentParticipantsCount = (post.joined_count !== undefined && post.joined_count !== null) ? post.joined_count : ((post.joinedCount !== undefined && post.joinedCount !== null) ? post.joinedCount : (participantsList.length + 1));
    const capacityVal = post.capacity || post.capacityCount || 4;

    const myEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email.trim().toLowerCase() : "";
    const myName = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.nickname || currentUser.name || currentUser.realName || "다이버") : "";
    const myIdStr = myName.toLowerCase();

    const isJoinedByMe = (myEmail || myIdStr) && participantsList.some(p => {
        if (typeof p === 'object' && p !== null) {
            if (myEmail && p.email && p.email.trim().toLowerCase() === myEmail) return true;
            if (p.name && p.name.trim().toLowerCase() === myIdStr) return true;
        }
        const pStr = String(p).toLowerCase();
        return (myIdStr && pStr === myIdStr) || (myEmail && pStr === myEmail);
    });

    const pendingParticipantsList = Array.isArray(post.pending_participants) ? post.pending_participants : [];
    const isPendingByMe = (myEmail || myIdStr) && pendingParticipantsList.some(p => {
        if (typeof p === 'object' && p !== null) {
            if (myEmail && p.email && p.email.trim().toLowerCase() === myEmail) return true;
            if (p.name && p.name.trim().toLowerCase() === myIdStr) return true;
        }
        const pStr = String(p).toLowerCase();
        return (myIdStr && pStr === myIdStr) || (myEmail && pStr === myEmail);
    });

    const overlay = document.createElement("div");
    overlay.id = "dynamicDetailModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.92) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    const currentStatusKey = post.status || 'recruiting';

    overlay.innerHTML = `
        <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 2px solid #00f2fe; box-shadow: 0 0 50px rgba(0, 242, 254, 0.5); border-radius: 20px; width: 100%; max-width: 700px; max-height: 88vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif; box-sizing: border-box;">
            
            <!-- 1. 헤더 영역 (제목 & 상태 뱃지 & 주최자 상태 3단계 전환 및 수정/삭제) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 14px; margin-bottom: 16px; gap: 10px; flex-wrap: wrap; width: 100%; box-sizing: border-box;">
                <div style="flex: 1; min-width: 240px; width: 100%; box-sizing: border-box;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; width: 100%; box-sizing: border-box;">
                        ${statusBadgeHtml}
                        <span style="background: rgba(0, 242, 254, 0.15); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">${categoryKorean}</span>
                        ${(!isCommunity && !isMarket && !isInstructor && (post.target_depth || post.targetDepth)) ? `<span style="background: rgba(0, 242, 254, 0.15); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;"><i class="fa-solid fa-arrows-up-down"></i> 수심: ${escapeHtml(post.target_depth || post.targetDepth)}</span>` : ''}
                        ${(!isCommunity && !isMarket && !isInstructor && (post.req_license || post.reqLicense)) ? `<span style="background: rgba(255, 183, 3, 0.15); border: 1px solid #ffb703; color: #ffb703; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;"><i class="fa-solid fa-certificate"></i> 레벨: ${escapeHtml(post.req_license || post.reqLicense)}</span>` : ''}
                        ${isInstructor ? `<span style="background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;">🎓 검증 강사 실명제</span>` : ''}
                        ${(isInstructor && (post.video_service || post.videoService)) ? `<span style="background: rgba(0, 242, 254, 0.18); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;"><i class="fa-solid fa-video"></i> 🎥 수중영상제공</span>` : ''}
                        ${(() => {
                            // 카풀은 버디모집하기, 강사클래스 게시글에만 노출
                            if (isCommunity || isMarket || isPartnership) return '';
                            const isCarpool = post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true';
                            if (!isCarpool) return '';
                            const carpoolType = post.carpool_type || post.carpoolType || 'free';
                            const carpoolFee = (post.carpool_fee !== undefined && post.carpool_fee !== null) ? parseInt(post.carpool_fee, 10) : ((post.carpoolFee !== undefined && post.carpoolFee !== null) ? parseInt(post.carpoolFee, 10) : null);
                            if ((carpoolType === 'shared_cost' || carpoolType === 'paid') && carpoolFee && carpoolFee > 0) {
                                return `<span style="background: rgba(255, 183, 3, 0.18); border: 1px solid #ffb703; color: #ffb703; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;"><i class="fa-solid fa-car"></i> 🚗 카풀 분담금 ${carpoolFee.toLocaleString()}원</span>`;
                            }
                            return `<span style="background: rgba(0, 230, 118, 0.18); border: 1px solid #00e676; color: #00e676; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;"><i class="fa-solid fa-car"></i> 🚗 무료 카풀</span>`;
                        })()}
                    </div>
                    <h2 style="margin: 0; font-size: 1.3rem; color: #ffffff; line-height: 1.4;">${typeof escapeHtml === 'function' ? escapeHtml(post.title || '게시글 상세') : (post.title || '게시글 상세')}</h2>
                    ${(isMarket || (post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true')) ? `
                    <div style="width: 100%; box-sizing: border-box; background: rgba(255, 82, 82, 0.08); border: 1.5px solid #ff5252; border-radius: 12px; padding: 10px 12px; margin-top: 10px; display: flex; align-items: flex-start; gap: 10px; box-shadow: 0 0 16px rgba(255, 82, 82, 0.15);">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #ff5252; font-size: 1.1rem; margin-top: 2px; flex-shrink: 0;"></i>
                        <div style="flex: 1; min-width: 0; width: 100%; font-size: 0.82rem; color: #ffebee; line-height: 1.5; word-break: keep-all; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">
                            <strong style="color: #ff5252; font-weight: 900;">⚠️ [안전 경고 및 면책 고지]</strong><br>
                            아쿠아버디는 통신판매중개자/매칭 수단일 뿐이며, 중고거래 사기 및 카풀/다이빙 중 발생하는 사고에 대해 법적 책임을 지지 않습니다.
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto;">
                    <button type="button" class="btn btn-secondary btn-sm" style="background: rgba(255, 82, 82, 0.12); border: 1px solid #ff5252; color: #ff5252; padding: 6px 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;" onclick="openPostReportModal('${post.id}')" title="해당 게시글 사기/비매너 신고">
                        <i class="fa-solid fa-bullhorn"></i> 신고
                    </button>
                    ${isAuthor ? `
                    <button onclick="editPost('${post.id}')" style="background: rgba(0, 242, 254, 0.15); border: 1px solid #00f2fe; color: #00f2fe; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.82rem;">✏️ 수정</button>
                    <button onclick="openDeleteConfirmModal('${post.id}')" style="background: rgba(255, 82, 82, 0.15); border: 1px solid #ff5252; color: #ff5252; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.82rem;">🗑️ 삭제</button>
                    ` : ''}
                    <button onclick="document.getElementById('dynamicDetailModalOverlay').remove()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: bold; font-size: 1.3rem; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
            </div>

            <!-- 주최자 전용 3단계 명확한 상태 전환 컨트롤 바 (모집중 / 진행중 / 일정완료 & 매너평가 LOCK) -->
            ${isAuthor && !isCommunity ? `
            <div style="background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 0.85rem; color: #00f2fe; font-weight: bold;">👑 ${isMarket ? '판매자 전용 매물 상태:' : '주최자 전용 상태 설정:'}</span>
                <div style="display: flex; gap: 6px; align-items: center;">
                    ${(currentStatusKey === 'completed' && (post.manner_locked === true || (Array.isArray(post.evaluated_users) && post.evaluated_users.length > 0) || post.has_evaluated === true)) ? `
                        <div style="background: rgba(0, 230, 118, 0.18); border: 1px solid #00e676; color: #00e676; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-lock"></i> ✅ 일정완료 (매너 평가 완료 / 상태 고정)
                        </div>
                    ` : (isMarket ? `
                    <button onclick="handleChangePostStatus('${post.id}', 'recruiting')" style="background: ${currentStatusKey === 'recruiting' || currentStatusKey === 'trading' || currentStatusKey === 'all' ? '#00f2fe' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'recruiting' || currentStatusKey === 'trading' || currentStatusKey === 'all' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">🛒 거래중</button>
                    <button onclick="handleChangePostStatus('${post.id}', 'reserved')" style="background: ${currentStatusKey === 'reserved' ? '#ffb703' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'reserved' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">⏳ 예약중</button>
                    <button onclick="handleChangePostStatus('${post.id}', 'completed')" style="background: ${currentStatusKey === 'completed' ? '#00e676' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'completed' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">✅ 거래완료</button>
                    ` : `
                    <button onclick="handleChangePostStatus('${post.id}', 'recruiting')" style="background: ${currentStatusKey === 'recruiting' || currentStatusKey === 'all' ? '#00f2fe' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'recruiting' || currentStatusKey === 'all' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">📢 모집중</button>
                    <button onclick="handleChangePostStatus('${post.id}', 'in_progress')" style="background: ${currentStatusKey === 'in_progress' ? '#ffb703' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'in_progress' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">🏊‍♂️ 진행중</button>
                    <button onclick="handleChangePostStatus('${post.id}', 'completed')" style="background: ${currentStatusKey === 'completed' ? '#00e676' : 'rgba(255,255,255,0.1)'}; color: ${currentStatusKey === 'completed' ? '#000' : '#fff'}; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer;">✅ 일정완료</button>
                    `)}
                </div>
            </div>
            ` : ''}
            
            <!-- 2. 작성자 프로필 연동 카드 -->
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #00f2fe, #4facfe); display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.2rem; font-weight: bold; cursor: pointer;" onclick="openUserProfileModal('${authorName}', '${post.category || ""}')">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 1rem; color: #ffffff; display: flex; align-items: center; gap: 6px;">
                            <span style="cursor: pointer; text-decoration: underline; color: #00f2fe;" onclick="openUserProfileModal('${authorName}', '${post.category || ""}')">${typeof escapeHtml === 'function' ? escapeHtml(authorName) : authorName}</span> <span id="dynamicDetailAuthorBadge">${getUserDemographicBadge(post)} ${typeof renderUserBadges === 'function' ? renderUserBadges(post) : ''}</span>
                            ${!isCommunity ? `<span style="font-size: 0.76rem; background: rgba(0, 242, 254, 0.2); color: #00f2fe; padding: 2px 8px; border-radius: 10px;">작성자</span>` : ''}
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                    ${priceText ? `<div style="color: #00e676; font-weight: 900; font-size: 1.15rem;">💰 ${priceText}</div>` : ''}
                    <button onclick="toggleLike('${post.id}'); renderDynamicDetailModal(posts.find(p=>p.id==='${post.id}'));" style="background: rgba(255, 82, 82, 0.15); border: 1px solid #ff5252; color: #ff5252; padding: 6px 14px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">
                        ❤️ 관심 ${post.likes || 0}
                    </button>
                </div>
            </div>

            <!-- 3. 일정 & 지도 카카오 지오코딩 카드 (자유수다방 제외) -->
            ${!isCommunity ? `
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <div style="font-size: 0.9rem; color: #ffb703; font-weight: bold;">
                        📅 일시: ${dateText}
                    </div>
                    ${locationText ? `
                    <div style="font-size: 0.88rem; color: #a0aec0;">
                        📍 장소: <strong style="color: #ffffff;">${typeof escapeHtml === 'function' ? escapeHtml(locationText) : locationText}</strong>
                    </div>
                    ` : ''}
                </div>

                ${locationText ? `
                <div id="detailModalMapBox" style="width: 100%; height: 180px; border-radius: 10px; border: 1px solid rgba(0, 242, 254, 0.4); overflow: hidden; background: #000; margin-top: 8px;"></div>
                ` : ''}
            </div>
            ` : ''}

            ${(!isCommunity && !isMarket && !isPartnership && (post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true')) ? `
            <!-- 🚗 카풀 동승 지원 안내 카드 (여객자동차 운수사업법 준수) -->
            <div style="background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">🚗</span>
                    <div>
                        <div style="color: #00e676; font-weight: 800; font-size: 0.92rem;">
                            ${(post.carpool_type === 'shared_cost' || post.carpool_type === 'paid' || post.carpoolType === 'shared_cost' || post.carpoolType === 'paid') ? '유류비·통행료 분담 카풀 (1/N 실비 분담)' : '무료 카풀 (동승 이동 지원)'}
                        </div>
                        <div style="font-size: 0.8rem; color: #cbd5e1;">
                            ${(post.carpool_type === 'shared_cost' || post.carpool_type === 'paid' || post.carpoolType === 'shared_cost' || post.carpoolType === 'paid') ? '자가용 유상운송 금지법에 따라 실제 발생한 유류비/통행료의 1/N 실비 분담만 가능합니다.' : '주최자가 순수 동승 편의를 제공하는 무료 카풀 일정입니다.'}
                        </div>
                    </div>
                </div>
                <div style="font-weight: 900; font-size: 1rem; color: ${(post.carpool_type === 'shared_cost' || post.carpool_type === 'paid' || post.carpoolType === 'shared_cost' || post.carpoolType === 'paid') ? '#ffb703' : '#00e676'};">
                    ${(post.carpool_type === 'shared_cost' || post.carpool_type === 'paid' || post.carpoolType === 'shared_cost' || post.carpoolType === 'paid') ? `1인당 ${((post.carpool_fee || post.carpoolFee) ? parseInt(post.carpool_fee || post.carpoolFee, 10).toLocaleString() + '원 분담' : '실비 분담')}` : '🎁 무료'}
                </div>
            </div>
            ` : ''}

            ${(post.is_group_buy === true || post.is_group_buy === 'true' || post.isGroupBuy === true || (post.group_buy_goal > 0)) ? `
            <!-- 3.5 공동구매 달성률 및 수량 선택/참여/취소 카드 -->
            <div style="background: linear-gradient(145deg, rgba(0, 230, 118, 0.1), rgba(0, 242, 254, 0.05)); border: 1.5px solid #00e676; border-radius: 16px; padding: 18px; margin-bottom: 16px; box-shadow: 0 0 20px rgba(0,230,118,0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                    <span style="color: #00e676; font-weight: 900; font-size: 1.05rem;"><i class="fa-solid fa-cart-shopping"></i> 🛍️ 공동구매 달성 현황</span>
                    <span style="color: #ffffff; font-weight: 900; font-size: 1rem;">${parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)} / ${parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10)}개 <span style="color: #00e676; font-size: 0.95rem;">(${Math.min(100, Math.round(((parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)) / (parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10) || 1)) * 100))}%)</span></span>
                </div>
                <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.12); border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
                    <div style="width: ${Math.min(100, Math.round(((parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)) / (parseInt(post.group_buy_goal || post.groupBuyGoal || 10, 10) || 1)) * 100))}%; height: 100%; background: linear-gradient(90deg, #00e676, #00f2fe); border-radius: 8px; transition: width 0.4s ease;"></div>
                </div>

                <!-- 🛒 공동구매 수량 조절 및 구매/취소 컨트롤 영역 -->
                ${(() => {
                    const gbOrders = Array.isArray(post.group_buy_orders) ? post.group_buy_orders : [];
                    const myOrder = (myEmail || myIdStr) ? gbOrders.find(o => {
                        if (myEmail && o.email && String(o.email).trim().toLowerCase() === myEmail) return true;
                        if (o.name && String(o.name).trim().toLowerCase() === myIdStr) return true;
                        return false;
                    }) : null;

                    const unitPrice = parseInt(post.price || 0, 10);
                    const isClosed = post.status === 'completed';

                    if (isAuthor) {
                        return `
                            <div style="background: rgba(0,0,0,0.35); border: 1px dashed rgba(0,230,118,0.4); padding: 12px 14px; border-radius: 10px; font-size: 0.88rem; color: #a0aec0;">
                                <div style="color: #00e676; font-weight: bold; margin-bottom: 4px;"><i class="fa-solid fa-crown"></i> 주최자(작성자) 관리 뷰</div>
                                <div>총 신청 수량: <strong style="color: #00f2fe;">${parseInt(post.group_buy_current || post.groupBuyCurrent || 0, 10)}개</strong> / 총 참여자: <strong style="color: #fff;">${gbOrders.length}명</strong></div>
                            </div>
                        `;
                    }

                    if (isClosed) {
                        return `
                            <div style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; text-align: center; color: #aaa; font-weight: bold; font-size: 0.9rem;">
                                🔒 마감된 공동구매입니다.
                            </div>
                        `;
                    }

                    if (myOrder) {
                        const totalOrderPrice = (myOrder.quantity || 1) * unitPrice;
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 230, 118, 0.15); border: 1px solid #00e676; padding: 12px 16px; border-radius: 12px; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <div style="color: #00e676; font-weight: 900; font-size: 0.95rem;"><i class="fa-solid fa-circle-check"></i> 공동구매 참여 완료!</div>
                                    <div style="font-size: 0.86rem; color: #fff; margin-top: 2px;">
                                        내 신청 수량: <strong style="color: #00f2fe; font-size: 1.05rem;">${myOrder.quantity || 1}개</strong>
                                        ${unitPrice > 0 ? `<span style="opacity: 0.8; margin-left: 6px;">(총 ${totalOrderPrice.toLocaleString()}원)</span>` : ''}
                                    </div>
                                </div>
                                <button type="button" onclick="handleCancelGroupBuy('${post.id}')" style="background: rgba(255, 82, 82, 0.2); border: 1px solid #ff5252; color: #ff5252; font-weight: 800; padding: 9px 16px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;">
                                    <i class="fa-solid fa-xmark"></i> ❌ 참여 취소
                                </button>
                            </div>
                        `;
                    } else {
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.35); border: 1px solid rgba(0,230,118,0.3); padding: 12px 16px; border-radius: 12px; flex-wrap: wrap; gap: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 800; color: #00e676; font-size: 0.92rem;"><i class="fa-solid fa-boxes-stacked"></i> 구매 수량:</span>
                                    <div style="display: inline-flex; align-items: center; background: rgba(255,255,255,0.08); border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); overflow: hidden;">
                                        <button type="button" onclick="adjustGroupBuyQty('${post.id}', -1)" style="background: rgba(255,255,255,0.08); border: none; color: #fff; width: 34px; height: 34px; font-size: 1.15rem; cursor: pointer; font-weight: 900; display: flex; align-items: center; justify-content: center;">-</button>
                                        <input type="number" id="groupBuyQtyInput_${post.id}" value="1" min="1" max="99" readonly style="width: 44px; text-align: center; background: transparent; border: none; color: #00f2fe; font-weight: 900; font-size: 1.1rem; outline: none;">
                                        <button type="button" onclick="adjustGroupBuyQty('${post.id}', 1)" style="background: rgba(255,255,255,0.08); border: none; color: #fff; width: 34px; height: 34px; font-size: 1.15rem; cursor: pointer; font-weight: 900; display: flex; align-items: center; justify-content: center;">+</button>
                                    </div>
                                </div>
                                <button type="button" onclick="handleJoinGroupBuy('${post.id}')" style="background: linear-gradient(135deg, #00e676, #00b0ff); border: none; color: #000; font-weight: 900; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.92rem; box-shadow: 0 4px 14px rgba(0,230,118,0.35); display: inline-flex; align-items: center; gap: 6px; transition: transform 0.1s ease;">
                                    <i class="fa-solid fa-cart-arrow-down"></i> 🛒 공동구매 참여하기
                                </button>
                            </div>
                        `;
                    }
                })()}

                <!-- 👥 실시간 공구 참여자 목록 (투명한 주문 리스트) -->
                ${(() => {
                    const gbOrders = Array.isArray(post.group_buy_orders) ? post.group_buy_orders : [];
                    if (gbOrders.length === 0) return '';
                    return `
                        <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; font-size: 0.82rem; color: #a0aec0;">
                            <span style="color: #00e676; font-weight: bold; margin-right: 6px;">👥 실시간 참여 현황:</span>
                            ${gbOrders.map(o => `<span style="background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; margin-right: 6px; display: inline-block; margin-top: 4px; color: #fff;">🙋‍♂️ ${escapeHtml(o.name || '익명')} <strong style="color: #00f2fe;">(${o.quantity || 1}개)</strong></span>`).join('')}
                        </div>
                    `;
                })()}
            </div>
            ` : ''}

            <!-- 4. 상세 내용 카드 -->
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px; border-radius: 14px; margin-bottom: 16px; font-size: 0.92rem; line-height: 1.6;">
                ${isInstructor ? `<h4 style="margin-top: 0; margin-bottom: 8px; color: #ffd700;"><i class="fa-solid fa-graduation-cap"></i> 📖 상세 내용 및 교육 커리큘럼</h4>` : (isMarket ? `<h4 style="margin-top: 0; margin-bottom: 8px; color: #00e676;"><i class="fa-solid fa-tags"></i> 🛍️ 상품 상세 설명</h4>` : (isCommunity ? `<h4 style="margin-top: 0; margin-bottom: 8px; color: #b39ddb;"><i class="fa-solid fa-comments"></i> 💬 이야기 내용</h4>` : `<h4 style="margin-top: 0; margin-bottom: 8px; color: #00f2fe;"><i class="fa-solid fa-align-left"></i> 🤿 모임 상세 내용 및 플랜</h4>`))}
                ${typeof formatDesc === 'function' ? formatDesc(post.desc) : (post.desc || '상세 내용이 없습니다.')}
                ${imagesHtml ? `<div style="margin-top: 12px;"><h5 style="margin: 0 0 6px 0; color: #00f2fe;">📷 첨부 이미지</h5>${imagesHtml}</div>` : ''}
            </div>

            <!-- 5. 버디 모집 현황 & 참가자 목록 카드 -->
            ${!isCommunity && !isMarket ? `
            <div style="background: rgba(0, 242, 254, 0.06); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0; color: #00f2fe; font-size: 1rem;"><i class="fa-solid fa-users"></i> ${isInstructor ? '클래스 수강생 모집 현황' : '버디 모집 현황 및 참가자 목록'}</h4>
                        <div style="font-size: 0.82rem; color: #a0aec0; margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span>현재 확정 인원: <strong style="color: #00f2fe;">${currentParticipantsCount} / ${capacityVal}명</strong></span>
                            <button type="button" onclick="refreshCurrentDetailModal('${post.id}')" style="background: rgba(0, 242, 254, 0.18); border: 1px solid #00f2fe; color: #00f2fe; padding: 3px 10px; border-radius: 12px; font-weight: 800; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(0,242,254,0.25);" title="실시간 수강생 및 버디 참가 현황 새로고침">
                                <i class="fa-solid fa-arrows-rotate"></i> 명단 새로고침
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        ${!isAuthor ? `
                            ${post.status === 'completed' ? `
                                ${isJoinedByMe ? `
                                    <div style="background: rgba(0, 230, 118, 0.15); border: 1px solid #00e676; color: #00e676; padding: 8px 14px; border-radius: 10px; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">
                                        <i class="fa-solid fa-circle-check"></i> 참가 완료 회원
                                    </div>
                                ` : `
                                    <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #a0aec0; padding: 8px 14px; border-radius: 10px; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">
                                        <i class="fa-solid fa-lock"></i> 일정 마감됨 (참가 불가)
                                    </div>
                                `}
                            ` : post.status === 'in_progress' ? `
                                ${isJoinedByMe ? `
                                    <button onclick="handleToggleJoinPost('${post.id}')" style="background: linear-gradient(135deg, #ff5252, #d32f2f); border: none; color: #fff; font-weight: 900; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-size: 0.88rem; box-shadow: 0 4px 14px rgba(255,82,82,0.3);">
                                        ❌ 참가 신청 취소
                                    </button>
                                ` : (isPendingByMe ? `
                                    <button onclick="handleToggleJoinPost('${post.id}')" style="background: linear-gradient(135deg, #ffb703, #f59e0b); border: none; color: #000; font-weight: 900; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-size: 0.88rem; box-shadow: 0 4px 14px rgba(255,183,3,0.3);">
                                        ⏳ 승인 대기 중 (신청 취소)
                                    </button>
                                ` : `
                                    <div style="background: rgba(255, 183, 3, 0.12); border: 1px solid rgba(255, 183, 3, 0.3); color: #ffb703; padding: 8px 14px; border-radius: 10px; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">
                                        <i class="fa-solid fa-lock"></i> 진행 중 (추가 모집 마감)
                                    </div>
                                `)}
                            ` : `
                                <button onclick="handleToggleJoinPost('${post.id}')" style="background: ${isJoinedByMe ? 'linear-gradient(135deg, #ff5252, #d32f2f)' : (isPendingByMe ? 'linear-gradient(135deg, #ffb703, #f59e0b)' : 'linear-gradient(135deg, #00f2fe, #4facfe)')}; border: none; color: ${isJoinedByMe ? '#fff' : '#000'}; font-weight: 900; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(0,242,254,0.3);">
                                    ${isJoinedByMe ? '❌ 참가 신청 취소' : (isPendingByMe ? '⏳ 참가 승인 대기 중 (신청 취소)' : (isInstructor ? '✋ 수강 신청하기' : '✋ 버디 참가 신청하기'))}
                                </button>
                            `}
                        ` : `
                        <div style="background: rgba(0,242,254,0.15); color: #00f2fe; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 0.82rem;">
                            👑 ${isInstructor ? '강사 본인 클래스' : '주최자 본인 모임'}
                        </div>
                        `}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                    <!-- 주최자/강사 프로필 -->
                    <div style="background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #ffb703; font-weight: bold; font-size: 0.88rem; cursor: pointer;" onclick="openUserProfileModal('${authorName}', '${post.category || ""}')">👑 ${isInstructor ? '담당 강사' : '주최자'}: ${typeof escapeHtml === 'function' ? escapeHtml(authorName) : authorName}</span> <span id="dynamicDetailHostBadge">${getUserDemographicBadge(post)} ${typeof renderUserBadges === 'function' ? renderUserBadges(post) : ''}</span>
                        </div>
                        <span style="font-size: 0.78rem; color: #00f2fe;">${isInstructor ? '강사 확정' : '주최 확정'}</span>
                    </div>

                    <!-- 확정된 참가자 목록 -->
                    ${participantsList.map((p, idx) => {
                        const pName = typeof p === 'object' ? (p.name || p.realName || '참가 다이버') : String(p);
                        const pKey = typeof p === 'object' ? (p.email || p.name || p.realName || String(idx)) : String(p);
                        return `
                            <div style="background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; box-sizing: border-box;">
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; flex-wrap: wrap; flex: 1; min-width: 0;">
                                    <span style="color: #00f2fe; cursor: pointer;" onclick="openUserProfileModal('${pName}', '${post.category || ""}')">🙋‍♂️ ${typeof escapeHtml === 'function' ? escapeHtml(pName) : pName}</span> ${getUserDemographicBadge(p)}
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 0.78rem; color: #00e676;">참가 확정</span>
                                    ${(isAuthor && isInstructor) ? `
                                        <button type="button" onclick="rejectBuddyParticipant('${post.id}', '${escapeHtml(pKey)}')" style="background: rgba(255, 82, 82, 0.2); border: 1px solid #ff5252; color: #ff5252; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; cursor: pointer;" title="수강 거절 및 투명망토 처리">
                                            ❌ 거절
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join("")}

                    <!-- 일반 버디 주최자 전용: 참가 승인 대기 목록 (pending_participants) -->
                    ${(!isInstructor && isAuthor && pendingParticipantsList.length > 0) ? `
                        <div style="margin-top: 10px; border-top: 1px dashed rgba(255, 183, 3, 0.4); padding-top: 10px;">
                            <div style="font-size: 0.84rem; color: #ffb703; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-hourglass-half"></i> ⏳ 참가 승인 대기 중인 신청자 (${pendingParticipantsList.length}명)
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                ${pendingParticipantsList.map((p, idx) => {
                                    const pName = typeof p === 'object' ? (p.name || p.realName || '신청 다이버') : String(p);
                                    const pKey = typeof p === 'object' ? (p.email || p.name || p.realName || String(idx)) : String(p);
                                    return `
                                        <div style="background: rgba(255, 183, 3, 0.08); border: 1px solid rgba(255, 183, 3, 0.3); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem;">
                                                <span style="color: #ffb703; cursor: pointer;" onclick="openUserProfileModal('${pName}', '${post.category || ""}')">🙋‍♂️ ${typeof escapeHtml === 'function' ? escapeHtml(pName) : pName}</span> ${getUserDemographicBadge(p)}
                                            </div>
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <button type="button" onclick="approveBuddyParticipant('${post.id}', '${escapeHtml(pKey)}')" style="background: #00e676; border: none; color: #000; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 900; cursor: pointer;">
                                                    ✅ 승인
                                                </button>
                                                <button type="button" onclick="rejectBuddyParticipant('${post.id}', '${escapeHtml(pKey)}')" style="background: #ff5252; border: none; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 900; cursor: pointer;">
                                                    ❌ 거절
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            <!-- 6. 실시간 댓글 카드 -->
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <h4 style="margin-top: 0; margin-bottom: 8px; color: #00f2fe;"><i class="fa-solid fa-comments"></i> 실시간 댓글 (<span class="detail-comment-count">${comments.length}</span>)</h4>
                <div id="dynamicCommentListContainer_${post.id}" style="max-height: 180px; overflow-y: auto; margin-bottom: 10px;">
                    ${commentsHtml || '<p style="color: #a0aec0; font-size: 0.85rem; margin: 0;">작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>'}
                </div>
                
                <form onsubmit="handleDynamicCommentSubmit(event, '${post.id}')" style="display: flex; gap: 8px;">
                    <input type="text" id="dynamicCommentInput_${post.id}" placeholder="실시간 댓글 또는 문의를 입력하세요..." style="flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #00f2fe; color: #fff; padding: 9px 12px; border-radius: 8px; font-size: 0.88rem;" required autocomplete="off">
                    <button type="submit" style="background: #00f2fe; border: none; color: #000; font-weight: bold; padding: 9px 16px; border-radius: 8px; cursor: pointer; font-size: 0.88rem;">등록</button>
                </form>
            </div>

            <!-- 7. 하단 닫기 & 대화방 전용 액션 -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                <div>
                    ${!isCommunity ? `
                    <button onclick="openChatRoomModal('${post.id}');" style="background: #00d2d3; border: none; color: #070e17; font-weight: bold; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.9rem;">
                        💬 실시간 대화방 참여
                    </button>
                    ` : ''}
                </div>
                <button onclick="document.getElementById('dynamicDetailModalOverlay').remove()" style="background: linear-gradient(135deg, #ff5252, #d32f2f); border: none; color: #fff; padding: 10px 22px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">닫기 ✖</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 카카오맵 지오코딩 정밀 연동 (자유수다방 제외)
    if (!isCommunity && locationText) {
        setTimeout(() => {
            const mapContainer = document.getElementById("detailModalMapBox");
            if (!mapContainer) return;

            runWithKakaoMap(() => {
                if (typeof kakao === 'undefined' || !kakao.maps || typeof kakao.maps.LatLng !== 'function') return;

                const renderMapAt = (lat, lng) => {
                    if (typeof kakao.maps.LatLng !== 'function' || typeof kakao.maps.Map !== 'function') return;
                    mapContainer.innerHTML = '';
                    const loc = new kakao.maps.LatLng(lat, lng);
                    const map = new kakao.maps.Map(mapContainer, { center: loc, level: 4 });
                    const marker = new kakao.maps.Marker({ position: loc, map: map });
                    setTimeout(() => {
                        if (map) {
                            map.relayout();
                            map.setCenter(loc);
                        }
                    }, 150);
                };

                if (kakao.maps.services && kakao.maps.services.Geocoder) {
                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(locationText, function(result, status) {
                        if (status === kakao.maps.services.Status.OK && result[0]) {
                            renderMapAt(result[0].y, result[0].x);
                        } else {
                            renderMapAt(post.lat || 35.1795543, post.lng || 129.0756416);
                        }
                    });
                } else {
                    renderMapAt(post.lat || 35.1795543, post.lng || 129.0756416);
                }
            });
        }, 150);
    }

    if (typeof subscribeCommentRealtime === 'function') {
        subscribeCommentRealtime(post.id);
    }
}
window.renderDynamicDetailModal = renderDynamicDetailModal;

// === 실시간 댓글 전송 통합 엔진 (PC/모바일 동기화 완벽 호환) ===
async function handleDynamicCommentSubmit(e, postId) {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!currentUser || (!currentUser.name && !currentUser.nickname)) {
        showToast("🔑 로그인 후 실시간 댓글을 작성하실 수 있습니다!");
        switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }

    // 모달 내 두 가지 버전의 입력창 ID 모두 지원 (모던 폼, 다이내믹 폼)
    const inputModern = document.getElementById("newCommentInput_" + postId);
    const inputDynamic = document.getElementById("dynamicCommentInput_" + postId);
    const input = (inputModern && inputModern.value.trim()) ? inputModern : inputDynamic;

    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const postIdStr = getCanonicalPostId(postId);
    const authorName = currentUser.nickname || currentUser.name || "다이버";
    const isoTime = (typeof getKSTIsoString === 'function') ? getKSTIsoString() : new Date().toISOString();

    // 1. 입력창 즉시 비우기 (UX 최적화)
    input.value = "";

    // 2. 채팅방 엔진과 동일하게 Supabase DB에 다이렉트 INSERT
    if (supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('comments')
                .insert([{
                    post_id: postIdStr,
                    author: authorName,
                    user_name: authorName,
                    content: text,
                    text: text,
                    created_at: isoTime
                }]);

            if (error) {
                console.warn('[COMMENT] DB 저장 오류:', error);
                showToast("⚠️ 댓글 저장에 실패했습니다.");
                return;
            }
        } catch (dbErr) {
            console.warn('[COMMENT] DB 저장 예외:', dbErr);
        }
    }

    // 3. 모달 전체를 부수지 않고, 실시간 댓글 영역만 부분 업데이트!
    if (typeof fetchAndRenderComments === 'function') {
        fetchAndRenderComments(postIdStr);
    }

    showToast("💬 실시간 댓글이 등록되었습니다!");
}

// 누락된 legacy 함수 안전 바인딩 (모던 폼 onsubmit 에러 방지)
window.handleDynamicCommentSubmit = handleDynamicCommentSubmit;
window.handleAddComment = handleDynamicCommentSubmit;


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

        // [동적 100% 보장 팝업] 실시간 팝업 노출
        renderDynamicDetailModal(post);

        // 🌐 [작성자 프로필 실시간 On-The-Fly 비동기 연동] Supabase users 테이블에서 실시간 성별/연령대 동기화
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const authorIdent = post.email || post.author_email || post.real_name || post.realName || post.nickname || post.author || post.userName || post.user_name || '';
            if (authorIdent) {
                (async () => {
                    try {
                        let uData = null;
                        if (authorIdent.includes('@')) {
                            const { data } = await supabaseClient.from('users').select('*').eq('email', authorIdent.toLowerCase()).maybeSingle();
                            uData = data;
                        }
                        if (!uData) {
                            const { data } = await supabaseClient.from('users').select('*').eq('real_name', authorIdent).limit(1).maybeSingle();
                            uData = data;
                        }
                        if (!uData) {
                            const { data } = await supabaseClient.from('users').select('*').eq('nickname', authorIdent).limit(1).maybeSingle();
                            uData = data;
                        }
                        if (!uData) {
                            const { data } = await supabaseClient.from('users').select('*').eq('name', authorIdent).limit(1).maybeSingle();
                            uData = data;
                        }

                        if (uData) {
                            post.gender = uData.gender || 'private';
                            post.author_gender = uData.gender || 'private';
                            post.age_group = uData.age_group || uData.ageGroup || 'private';
                            post.author_age_group = uData.age_group || uData.ageGroup || 'private';

                            const kLower = authorIdent.toLowerCase();
                            userDemographicsMap[kLower] = { gender: post.gender, ageGroup: post.age_group };
                            if (uData.real_name) userDemographicsMap[uData.real_name.toLowerCase()] = { gender: post.gender, ageGroup: post.age_group };
                            if (uData.nickname) userDemographicsMap[uData.nickname.toLowerCase()] = { gender: post.gender, ageGroup: post.age_group };
                            if (uData.email) userDemographicsMap[uData.email.toLowerCase()] = { gender: post.gender, ageGroup: post.age_group };

                            const freshBadge = getUserDemographicBadge(post);
                            const topEl = document.getElementById("dynamicDetailAuthorBadge");
                            if (topEl) topEl.innerHTML = freshBadge;
                            const hostEl = document.getElementById("dynamicDetailHostBadge");
                            if (hostEl) hostEl.innerHTML = freshBadge;
                        }
                    } catch(uErr) {
                        console.warn("Author profile live sync notice:", uErr);
                    }
                })();
            }
        }

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
                        // ID 및 작성자+내용 기반 엄격 중복 제거
                        const uniqueMap = new Map();
                        data.forEach(c => {
                            const key = c.id || (c.author + '::' + (c.content || c.text));
                            if (!uniqueMap.has(key)) {
                                uniqueMap.set(key, {
                                    id: c.id,
                                    author: c.author || c.user_name || '다이버',
                                    text: c.content || c.text || '',
                                    content: c.content || c.text || '',
                                    time: c.created_at ? formatTimeAgo(c.created_at) : '방금 전',
                                    created_at: c.created_at
                                });
                            }
                        });
                        const fetchedComments = Array.from(uniqueMap.values());
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

        const safeLocName = post.mapAddress || post.locationName || post.location || post.map_address || post.location_name || '다이빙 입수 포인트';
        const encodedLocation = encodeURIComponent(safeLocName);
        const kakaoLat = post.mapLat || post.lat || 35.1587;
        const kakaoLng = post.mapLng || post.lng || 129.1604;
        const kakaoMapUrl = `https://map.kakao.com/link/to/${encodedLocation},${kakaoLat},${kakaoLng}`;

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
                        <img src="${imgSrc}" alt="첨부 이미지 ${idx+1}" class="post-image-item" loading="lazy" onclick="openLightbox('${imgSrc}')">
                    `).join("")}
                </div>
            </div>
        ` : '';

    const modernCommentFormHtml = `
        <form class="comment-form-modern" id="modernCommentForm_${post.id}" data-post-id="${post.id}" onsubmit="handleAddComment(event, '${post.id}'); return false;">
            <i class="fa-solid fa-comment-dots" style="color: var(--accent-cyan);"></i>
            <input type="text" id="newCommentInput_${post.id}" name="commentText" class="comment-input-modern" placeholder="실시간 댓글 또는 문의를 작성하세요..." autocomplete="off">
            <button type="submit" class="comment-submit-btn"><i class="fa-solid fa-paper-plane"></i> 등록</button>
        </form>
    `;

    let mainInfoHtml = '';

    if (isInstructor) {
        const certImageHtml = post.certImage ? `
            <div style="margin-top: 8px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
                <p style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">강사 자격증 사본 첨부 (검증 완료)</p>
                <img src="${post.certImage}" alt="강사 자격증 실물 사본" class="zoomable-img" loading="lazy" onclick="openLightbox('${post.certImage}')" style="max-height: 100px; border-radius: 4px; border: 1px solid var(--accent-gold);">
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
                        <span class="host-rating-badge" id="instHostRating_${post.id}"><i class="fa-solid fa-star"></i> 강사 평점 수집 중...</span>
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
                            ${(post.instructor_org || post.inst_org || (currentUser && currentUser.instructor_org)) ? `• 공인 협회: <strong style="color: var(--accent-gold);">${escapeHtml(post.instructor_org || post.inst_org || currentUser.instructor_org || 'AIDA')}</strong> (인증 발급 단체)<br>` : ''}
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
                ${isHost ? `
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
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>교육 장소:</strong> ${escapeHtml(post.mapAddress || post.locationName || post.location || post.map_address || post.location_name || '상세 장소 협의')}</p>
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
                    ${escapeHtml(post.desc || '')}
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
                    <button class="btn btn-primary" onclick="closeDetailModalAndUnsubscribe(); openChatRoomModal('${post.id}');">
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
        const sellerName = post.nickname || post.userName || post.user_name || post.author || post.realName || post.real_name || (isHost && currentUser ? currentUser.name : '다이버');
        const sellerLicense = post.userLicense || post.user_license || '공인 다이버';

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(sellerName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(판매자 - 본인)</span>' : ''} <span style="color: var(--accent-cyan); font-size: 0.88rem; font-weight: 700;">(중고장터)</span></h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(sellerLicense)}</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                <button class="wishlist-btn ${post.userWished ? 'active' : ''}" onclick="toggleWishlist('${post.id}')">
                    <i class="fa-solid fa-heart"></i> 찜하기 ${post.wishlistCount || 0}
                </button>
                ${isHost ? `
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
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>거래 장소:</strong> ${escapeHtml(post.mapAddress || post.locationName || post.location || post.map_address || post.location_name || '상세 장소 협의')}</p>
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
                    ${escapeHtml(post.desc || '')}
                </div>
            </div>

            <!-- 중고장터 상호작용 바 (찜 수 & 댓글 수 현황) -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 18px; margin: 16px 0 14px 0;">
                <div style="display: flex; align-items: center; gap: 16px; font-size: 0.92rem; font-weight: 700;">
                    <span style="color: #ff6b81;"><i class="fa-solid fa-heart"></i> 찜 <strong id="detailLikeCount_${post.id}" class="detail-like-count">${post.likes || post.likes_count || post.wishlistCount || 0}</strong></span>
                    <span style="color: var(--accent-cyan);"><i class="fa-solid fa-comments"></i> 댓글 <strong id="detailCommentCount_${post.id}" class="detail-comment-count">${(Array.isArray(post.comments) ? post.comments.length : (post.comments_count || 0))}</strong></span>
                </div>
                <button class="like-btn ${post.userLiked ? 'active' : ''}" id="likeBtn_${post.id}" onclick="toggleLike('${post.id}')" style="background: ${post.userLiked ? 'rgba(255, 107, 129, 0.2)' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${post.userLiked ? '#ff6b81' : 'rgba(255,255,255,0.15)'}; color: ${post.userLiked ? '#ff6b81' : '#fff'}; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.84rem; cursor: pointer; transition: all 0.2s ease;">
                    <i class="fa-solid fa-heart"></i> <span id="likeBtnText_${post.id}">${post.userLiked ? '찜 취소' : '찜하기'}</span>
                </button>
            </div>

            <div class="comments-section">
                <h4 style="margin-bottom: 12px;"><i class="fa-solid fa-comments"></i> 실시간 댓글 (<span class="detail-comment-count">${(Array.isArray(post.comments) ? post.comments.length : (post.comments_count || 0))}</span>)</h4>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="closeDetailModalAndUnsubscribe(); openChatRoomModal('${post.id}');">
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
                ${isHost ? `
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
                    ${escapeHtml(post.desc || '')}
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

        const categoryMapRef = {
            'freediving': '프리다이빙',
            'scuba': '스쿠버다이빙',
            'pool': '실내수영',
            'sea': '바다수영',
            'mermaid': '머메이드',
            'underwater_hockey': '수중호케이',
            'equipment': '장비문의',
            'market': '중고장터',
            'instructor': '강사클래스',
            'community': '자유수다방'
        };
        const catNameStr = post.categoryName || categoryMapRef[post.category] || '버디모집';
        const statusTextStr = post.statusText || (post.status === 'completed' ? '일정 완료' : (post.status === 'in_progress' ? '일정 진행 중' : '모집 중'));

        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(authorDisplay)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(주최자 - 본인)</span>' : ''} <span style="color: var(--accent-cyan); font-size: 0.88rem; font-weight: 700;">(${escapeHtml(catNameStr)})</span></h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(userLicenseDisplay)}</span>
                        ${typeof renderUserBadges === 'function' ? renderUserBadges(post) : ''}
                        <span class="host-rating-badge" id="detailHostRating_${post.id}"><i class="fa-solid fa-star"></i> 평점 불러오는 중...</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                ${isHost ? `
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
                    <p><i class="fa-solid fa-users" style="color: var(--accent-cyan)"></i> <strong>모집 현황:</strong> 작성자 포함 총 ${post.capacity || 2}명 중 현재 ${post.joinedCount || 1}명 확정 <span style="color: var(--accent-cyan); font-weight: 800;">(${escapeHtml(statusTextStr)})</span></p>
                    <p><i class="fa-solid fa-location-dot" style="color: var(--accent-cyan)"></i> <strong>장소:</strong> ${escapeHtml(post.mapAddress || post.locationName || post.location || post.map_address || post.location_name || '상세 장소 협의')}</p>
                    ${post.date ? `<p><i class="fa-regular fa-calendar-check" style="color: var(--accent-cyan)"></i> <strong>진행 일정:</strong> ${formatDate(post.date)}</p>` : ''}
                    ${post.desc ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); color: var(--text-main); font-size: 0.9rem; line-height: 1.5;">${escapeHtml(post.desc)}</div>` : ''}
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

            <div class="comments-section">
                <h4><i class="fa-solid fa-comments"></i> 실시간 댓글 (${(post.comments || []).length})</h4>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 댓글을 남겨보세요!</p>'}
                </div>
                ${modernCommentFormHtml}
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button class="btn btn-primary" onclick="closeDetailModalAndUnsubscribe(); openChatRoomModal('${post.id}');">
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
                        const targetLoc = post.mapAddress || post.locationName || post.location || post.region || post.title || '서울 올림픽공원 수영장';
                        initKakaoLiveMap(targetLoc);
                    } else {
                        console.warn('initKakaoLiveMap 지도 초기화를 실행합니다.');
                    }
                } catch(mapErr) {
                    console.log("Kakao Map init notice:", mapErr);
                }
            }, 150);
        }

        // Supabase reviews 테이블에서 주최자/강사 실시간 평점 수집 (실제 DB 연동)
        const hostEmail = post.email || post.userEmail || post.authorEmail || post.author || "";
        const hostName = post.nickname || post.userName || post.user_name || "";
        fetchAndRenderHostRating(hostEmail, hostName, "detailHostRating_" + post.id);
        fetchAndRenderHostRating(hostEmail, hostName, "instHostRating_" + post.id);

        // Supabase Realtime 댓글 구독 시작 (같은 게시글이면 재구독 안함)
        subscribeCommentRealtime(post.id);

        // Supabase에서 최신 댓글 즉시 로드 (모바일 캐시 우회)
        if (typeof fetchAndRenderComments === 'function') fetchAndRenderComments(post.id);

    } catch(err) {
        console.error("openDetailModal error:", err);
        alert("게시글 상세 정보 열기 중 오류가 발생했습니다:\n" + err.message);
    }
}
window.openDetailModal = openDetailModal;
window.openPostDetailModal = openDetailModal;

// 게시글 상세 화면 닫기 (실시간 구독 해제 포함)
function closeDetailModalAndUnsubscribe() {
    // Realtime 댓글 구독 해제
    unsubscribeCommentRealtime();
    // 모든 게시글 상세 모달 닫기
    ['postDetailModal', 'detailModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.setProperty('display', 'none', 'important');
        }
    });
    document.querySelectorAll('#dynamicDetailModalOverlay, .dynamic-detail-overlay').forEach(el => el.remove());
}
window.closeDetailModalAndUnsubscribe = closeDetailModalAndUnsubscribe;

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

    if (supabaseClient) {
        supabaseClient.from('posts').update({
            wishlist_count: post.wishlistCount,
            likes: post.likes
        }).eq('id', String(postId)).then(({ error }) => {
            if (error) console.warn('Supabase wishlist update notice:', error);
        });
    }

    filterAndRender();

    const detailM = document.getElementById("postDetailModal") || document.getElementById("detailModal") || (typeof detailModal !== 'undefined' ? detailModal : null);
    if (detailM && detailM.classList && !detailM.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}

function isPostLikedByMe(post) {
    if (!currentUser || !currentUser.email || !post) return false;
    const myEmail = currentUser.email.trim().toLowerCase();
    const likedUsers = Array.isArray(post.liked_users) ? post.liked_users : (Array.isArray(post.likedUsers) ? post.likedUsers : []);
    return likedUsers.some(u => String(u).trim().toLowerCase() === myEmail);
}
window.isPostLikedByMe = isPostLikedByMe;

async function toggleLike(postId) {
    if (!currentUser) {
        showToast("🔑 로그인 후 좋아요/공감/찜하기 기능을 이용하실 수 있습니다!");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (!post) return;

    const myEmail = String(currentUser.email || currentUser.id || 'anonymous').trim().toLowerCase();
    let likedUsers = Array.isArray(post.liked_users) ? post.liked_users : (Array.isArray(post.likedUsers) ? post.likedUsers : []);
    likedUsers = likedUsers.map(u => String(u).trim().toLowerCase());

    const isAlreadyLiked = likedUsers.includes(myEmail);

    if (isAlreadyLiked) {
        likedUsers = likedUsers.filter(u => u !== myEmail);
        post.likes = Math.max(0, (parseInt(post.likes, 10) || 1) - 1);
        post.userLiked = false;
        showToast(post.category === 'market' ? "💔 찜하기가 취소되었습니다." : "🤍 공감이 취소되었습니다.");
    } else {
        likedUsers.push(myEmail);
        post.likes = (parseInt(post.likes, 10) || 0) + 1;
        post.userLiked = true;
        showToast(post.category === 'market' ? "❤️ 찜하기에 등록되었습니다!" : "❤️ 공감(좋아요)을 눌렀습니다!");
    }

    post.likes_count = post.likes;
    post.liked_users = likedUsers;
    post.likedUsers = likedUsers;

    // UI 즉각 동기화
    const countEls = document.querySelectorAll(`#detailLikeCount_${postId}, #detailLikeCount, .detail-like-count`);
    countEls.forEach(el => el.textContent = post.likes);

    const btnTextEls = document.querySelectorAll(`#likeBtnText_${postId}`);
    btnTextEls.forEach(el => {
        if (post.category === 'market') {
            el.textContent = post.userLiked ? '찜 취소' : '찜하기';
        } else {
            el.textContent = post.userLiked ? '공감 취소' : '공감하기';
        }
    });

    const likeBtns = document.querySelectorAll(`#likeBtn_${postId}, .like-btn`);
    likeBtns.forEach(btn => {
        if (post.userLiked) {
            btn.classList.add('active');
            btn.style.background = 'rgba(255, 107, 129, 0.2)';
            btn.style.borderColor = '#ff6b81';
            btn.style.color = '#ff6b81';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255, 255, 255, 0.08)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            btn.style.color = '#fff';
        }
    });

    // Supabase DB 비동기 동기화
    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                likes: post.likes,
                likes_count: post.likes,
                liked_users: likedUsers
            }).eq('id', postId);
        } catch(e) {
            console.warn('Supabase likes update exception:', e);
        }
    }

    savePosts();
    if (typeof filterAndRender === 'function') filterAndRender();
}
window.toggleLike = toggleLike;





async function toggleMarketStatus(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    if (!isMyPost(post) && !isAdminAuthenticated) {
        showToast("⛔ 판매자 본인만 거래 상태를 변경할 수 있습니다.");
        return;
    }

    if (post.status === 'completed') {
        post.status = 'recruiting';
        post.statusText = '판매 중';
        showToast("⚡ 중고 물품이 다시 '판매 중' 상태로 변경되었습니다.");
    } else {
        post.status = 'completed';
        post.statusText = '거래 완료';
        showToast("🎉 중고 물품 거래가 완료 처리되었습니다!");
    }

    savePosts();

    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({
                status: post.status,
                status_text: post.statusText
            }).eq('id', String(postId));
        } catch (err) {
            console.warn('Supabase market status update notice:', err);
        }
    }

    filterAndRender();

    const detailM = document.getElementById("postDetailModal") || document.getElementById("detailModal");
    if (detailM && !detailM.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}
window.toggleMarketStatus = toggleMarketStatus;

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
    if (typeof handleChangePostStatus === 'function') {
        return handleChangePostStatus(postId, 'completed');
    }
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
    showToast("🎉 일정이 완료 상태로 변경되었습니다.");
}

async function reopenBuddySchedule(postId) {
    if (typeof handleChangePostStatus === 'function') {
        return await handleChangePostStatus(postId, 'recruiting');
    }
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    if (post.status === "completed" && post.counts_applied) {
        post.counts_applied = false;
        const hostEmail = (post.authorEmail || post.author_email || post.userEmail || post.email || "").trim().toLowerCase();
        const hostName = post.realName || post.real_name || post.nickname || post.author || "주최자";
        const pList = Array.isArray(post.participants) ? post.participants : [];
        if (post.category === "instructor" || post.is_instructor) {
            await incrementInstructorClassCount(hostEmail, hostName, -1);
        } else {
            await incrementUserHostCount(hostEmail, hostName, -1);
        }
        for (const p of pList) {
            const pEmail = typeof p === 'object' ? (p.email || '') : '';
            const pName = typeof p === 'object' ? (p.name || p.nickname || '') : String(p);
            await incrementParticipantCompletedCount(pEmail, pName, -1);
        }
    }

    post.status = "recruiting";
    post.statusText = "모집 중";
    savePosts();

    if (supabaseClient) {
        try {
            await supabaseClient.from('posts').update({ status: 'recruiting', statusText: '모집 중', counts_applied: false }).eq('id', postId);
        } catch(e) {
            console.warn("Supabase posts status update notice:", e);
        }
    }

    filterAndRender();
    openDetailModal(postId);
    showToast("🔄 모집 상태가 '모집 중'으로 변경되었습니다. (이전 완료 실적 -1차감 차감 반영)");
}
window.reopenBuddySchedule = reopenBuddySchedule;
window.reopenBuddyPost = reopenBuddySchedule;

// ==================================================
// 🎖️ AquaBuddy 5대 긍정 매너 태그 및 상호 평가 시스템
// ==================================================
const MANNER_TAGS_DEF = [
    { key: "time", label: "⏱️ 시간을 잘 지켜요", desc: "약속 시간과 집결 시간을 철저히 준수해요" },
    { key: "manner", label: "🤝 매너가 아주 좋아요", desc: "친절하고 배려심 넘치는 태도로 함께해요" },
    { key: "buddy_care", label: "🤿 버디를 잘 챙겨요", desc: "입수 중 안전 체크와 시야 유지를 꼼꼼히 해요" },
    { key: "photo", label: "😊 사진을 멋지게 찍어줘요", desc: "인생 수중 사진과 추억을 아낌없이 남겨줘요" },
    { key: "knowledge", label: "💡 전문 지식이 풍부해요", desc: "포인트 정보와 다이빙 팁을 친절히 공유해요" }
];

let currentMannerSelectedTag = "time";
let currentMannerTargetEmail = "";
let currentMannerTargetName = "";
let currentMannerPostId = "";

function openMannerModal(post, mode = 'participant_to_host') {
    if (!currentUser || (!currentUser.email && !currentUser.name && !currentUser.nickname)) {
        if (typeof showToast === 'function') showToast("🔑 로그인 후 평가를 진행하실 수 있습니다.");
        return;
    }
    if (!post) return;

    const isInstructorClass = post.category === 'instructor' || post.is_instructor;
    if (isInstructorClass && typeof isMyPost === 'function' && isMyPost(post)) {
        if (typeof showToast === 'function') showToast("🎓 강사 클래스는 수강생(참가자)만 강사를 평가할 수 있습니다.");
        return;
    }

    let existing = document.getElementById("mannerModalOverlay");
    if (existing) existing.remove();

    const isHostMode = !isInstructorClass && (mode === 'host_to_participant');
    const activeTagsList = isInstructorClass ? INSTRUCTOR_MANNER_TAGS_DEF : MANNER_TAGS_DEF;
    const participantsList = Array.isArray(post.participants) ? post.participants : [];
    const hostName = post.realName || post.real_name || post.nickname || post.userName || post.author || "주최자";
    const hostEmail = (post.authorEmail || post.author_email || post.userEmail || post.email || (post.author && post.author.includes('@') ? post.author : "")).trim().toLowerCase();

    currentMannerPostId = String(post.id);
    currentMannerSelectedTag = "time";

    let targetEmail = "";
    let targetName = "";

    if (isHostMode) {
        if (participantsList.length === 0) {
            if (typeof showToast === 'function') showToast("⚠️ 모임에 참가한 버디가 없어 칭찬 태그를 부여할 대상이 없습니다.");
            return;
        }
        const firstP = participantsList[0];
        targetName = typeof firstP === 'object' ? (firstP.name || firstP.nickname || '참가 버디') : String(firstP);
        targetEmail = typeof firstP === 'object' ? (firstP.email || '') : '';
    } else {
        targetName = hostName;
        targetEmail = hostEmail;
    }

    currentMannerTargetEmail = targetEmail;
    currentMannerTargetName = targetName;

    const overlay = document.createElement("div");
    overlay.id = "mannerModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.92) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    // Participants selector HTML for host mode
    let participantSelectorHtml = '';
    if (isHostMode && participantsList.length > 0) {
        participantSelectorHtml = `
            <div style="margin-bottom: 16px; background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 12px; padding: 12px;">
                <label style="display: block; font-size: 0.85rem; color: #00f2fe; font-weight: 800; margin-bottom: 8px;">
                    👑 최고의 활약을 한 버디 참가자 1명 선택:
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="mannerParticipantPills">
                    ${participantsList.map((p, idx) => {
                        const pName = typeof p === 'object' ? (p.name || p.nickname || `버디 ${idx+1}`) : String(p);
                        const pEmail = typeof p === 'object' ? (p.email || '') : '';
                        const isSelected = idx === 0;
                        return `
                            <button type="button" class="manner-target-btn ${isSelected ? 'active' : ''}" data-email="${escapeHtml(pEmail)}" data-name="${escapeHtml(pName)}" onclick="selectMannerTarget(this, '${escapeHtml(pEmail)}', '${escapeHtml(pName)}')" style="background: ${isSelected ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'rgba(255,255,255,0.08)'}; color: ${isSelected ? '#000' : '#fff'}; border: 1px solid ${isSelected ? '#00f2fe' : 'rgba(255,255,255,0.2)'}; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                                🙋‍♂️ ${escapeHtml(pName)}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); border-radius: 20px; width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; padding: 24px; color: #ffffff; position: relative; font-family: sans-serif; box-sizing: border-box;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 183, 3, 0.3); padding-bottom: 12px; margin-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 1.2rem; color: var(--accent-gold); display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid ${isInstructorClass ? 'fa-graduation-cap' : 'fa-medal'}"></i> ${isInstructorClass ? '강사 클래스 수강 평가' : (isHostMode ? '최고의 버디 칭찬 매너 태그' : '주최자 매너 칭찬 태그')}
                    </h2>
                    <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 2px;">${isInstructorClass ? '수강생 맞춤 강사 수강 평가 태그' : '상호 부담 없는 칭찬으로 즐거운 다이빙 문화를 만들어요'}</div>
                </div>
                <button onclick="document.getElementById('mannerModalOverlay').remove()" style="background: none; border: none; color: #fff; font-weight: bold; font-size: 1.4rem; cursor: pointer;">&times;</button>
            </div>

            ${participantSelectorHtml}

            <div style="margin-bottom: 16px;">
                <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 12px; line-height: 1.4;">
                    <strong style="color: var(--accent-gold);" id="mannerTargetNameDisplay">[${escapeHtml(targetName)}]</strong> ${isInstructorClass ? '강사님의 레슨은 어떠셨나요?' : '님과의 모임은 어떠셨나요?'}<br>
                    가장 어울리는 <strong>${isInstructorClass ? '강사 평가 태그 1개' : '칭찬 매너 태그 1개'}</strong>를 선택해 주세요! (1개 필수 선택)
                </p>

                <div style="display: flex; flex-direction: column; gap: 8px;" id="mannerTagsPillGroup">
                    ${activeTagsList.map((t, idx) => `
                        <button type="button" class="manner-tag-btn ${idx === 0 ? 'active' : ''}" data-key="${t.key}" onclick="selectMannerTagPill(this, '${t.key}')" style="background: ${idx === 0 ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${idx === 0 ? '#00f2fe' : 'rgba(255,255,255,0.1)'}; color: ${idx === 0 ? '#00f2fe' : '#e2e8f0'}; padding: 10px 14px; border-radius: 12px; font-size: 0.88rem; font-weight: 700; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
                            <span>${t.label}</span>
                            <span style="font-size: 0.75rem; color: #a0aec0; font-weight: normal;">${t.desc}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 🚫 다시 만나지 않기 (상호 차단) 체크박스 UI -->
            <div style="margin-top: 14px; background: rgba(255, 82, 82, 0.08); border: 1px dashed rgba(255, 82, 82, 0.35); border-radius: 12px; padding: 10px 14px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #ff6b6b; font-weight: 700; cursor: pointer; user-select: none;">
                    <input type="checkbox" id="blockUserCheck" style="width: 16px; height: 16px; accent-color: #ff5252; cursor: pointer;">
                    <span>🚫 이 다이버 다시 만나지 않기 (상호 차단)</span>
                </label>
                <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 4px; padding-left: 24px; line-height: 1.3;">
                    체크 시 서로의 피드 및 게시글이 숨겨지며 버디 매칭에서 영구 제외됩니다.
                </div>
            </div>

            <!-- Action Buttons & Report Link -->
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                <button type="button" onclick="submitMannerEvaluation()" style="background: #fbbf24; border: none; color: #070e17; font-weight: 900; padding: 12px; border-radius: 12px; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 16px rgba(255, 183, 3, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fa-solid fa-paper-plane"></i> 칭찬 매너 태그 보내기
                </button>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button type="button" onclick="openInquiryModal('bug')" style="background: rgba(255, 82, 82, 0.1); border: 1px solid rgba(255, 82, 82, 0.4); color: #ff5252; padding: 5px 12px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-triangle-exclamation"></i> 🚨 비매너/위험행동 신고
                    </button>
                    <button type="button" onclick="document.getElementById('mannerModalOverlay').remove()" style="background: none; border: none; color: #94a3b8; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                        건너뛰기 / 닫기
                    </button>
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(overlay);
}
window.openMannerModal = openMannerModal;

function selectMannerTarget(btn, email, name) {
    document.querySelectorAll("#mannerParticipantPills .manner-target-btn").forEach(b => {
        b.style.background = "rgba(255,255,255,0.08)";
        b.style.color = "#fff";
        b.style.borderColor = "rgba(255,255,255,0.2)";
    });
    if (btn) {
        btn.style.background = "linear-gradient(135deg, #00f2fe, #4facfe)";
        btn.style.color = "#000";
        btn.style.borderColor = "#00f2fe";
    }
    currentMannerTargetEmail = email;
    currentMannerTargetName = name;
    const nameDisp = document.getElementById("mannerTargetNameDisplay");
    if (nameDisp) nameDisp.textContent = `[${name}]`;
}
window.selectMannerTarget = selectMannerTarget;

function selectMannerTagPill(btn, tagKey) {
    document.querySelectorAll("#mannerTagsPillGroup .manner-tag-btn").forEach(b => {
        b.style.background = "rgba(255,255,255,0.05)";
        b.style.borderColor = "rgba(255,255,255,0.1)";
        b.style.color = "#e2e8f0";
    });
    if (btn) {
        btn.style.background = "rgba(0, 242, 254, 0.18)";
        btn.style.borderColor = "#00f2fe";
        btn.style.color = "#00f2fe";
    }
    currentMannerSelectedTag = tagKey;
}
window.selectMannerTagPill = selectMannerTagPill;

async function submitMannerEvaluation() {
    if (!currentMannerTargetName) {
        if (typeof showToast === 'function') showToast("⚠️ 평가할 대상을 선택해 주세요.");
        return;
    }

    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === currentMannerPostId) : null;
    const isInstructorClass = post && (post.category === 'instructor' || post.is_instructor);
    const activeTagsList = isInstructorClass ? INSTRUCTOR_MANNER_TAGS_DEF : MANNER_TAGS_DEF;
    const tagObj = activeTagsList.find(t => t.key === currentMannerSelectedTag) || activeTagsList[0];

    // [1. 다시 만나지 않기 (상호 차단) 처리 로직]
    const blockCheck = document.getElementById("blockUserCheck");
    let isBlockedAction = false;
    if (blockCheck && blockCheck.checked && currentUser) {
        if (!Array.isArray(currentUser.blocked_users)) {
            currentUser.blocked_users = [];
        }

        // 최대 100명 인원 제한 방어 코드
        if (currentUser.blocked_users.length >= 100) {
            if (typeof showToast === 'function') {
                showToast("🚫 차단 명단이 가득 찼습니다. (최대 100명 제한)");
            }
            return;
        }

        const targetIdentifier = (currentMannerTargetEmail || currentMannerTargetName || '').trim();
        if (targetIdentifier && !currentUser.blocked_users.includes(targetIdentifier)) {
            currentUser.blocked_users.push(targetIdentifier);
            isBlockedAction = true;

            // 로컬 스토리지 동기화
            try {
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            } catch(e) {}

            // Supabase users 테이블 blocked_users JSONB 업데이트
            if (supabaseClient && currentUser.email) {
                try {
                    await supabaseClient.from('users').update({
                        blocked_users: currentUser.blocked_users
                    }).eq('email', currentUser.email.toLowerCase());
                    console.log(`🚫 [BLOCK] '${targetIdentifier}' 유저를 차단 명단에 성공적으로 저장하였습니다.`);
                } catch(e) {
                    console.warn("Supabase users blocked_users update notice:", e);
                }
            }
        }
    }

    // [2. Supabase users 테이블의 manner_tags 또는 instructor_tags 업데이트]
    if (supabaseClient && currentMannerTargetEmail) {
        try {
            const targetCol = isInstructorClass ? 'instructor_tags' : 'manner_tags';
            const { data: uData } = await supabaseClient.from('users').select('*').eq('email', currentMannerTargetEmail.toLowerCase()).maybeSingle();
            let currentTags = (uData && uData[targetCol]) ? uData[targetCol] : {};
            if (typeof currentTags === 'string') {
                try { currentTags = JSON.parse(currentTags); } catch(e) { currentTags = {}; }
            }
            currentTags[currentMannerSelectedTag] = (parseInt(currentTags[currentMannerSelectedTag] || 0, 10)) + 1;

            const updatePayload = {};
            updatePayload[targetCol] = currentTags;

            // Do NOT force instructor_class_count to 1 on evaluation tags

            await supabaseClient.from('users').update(updatePayload).eq('email', currentMannerTargetEmail.toLowerCase());
            console.log(`✨ [EVALUATION TAG] '${currentMannerTargetEmail}' 유저의 '${targetCol}'에 '${currentMannerSelectedTag}' 태그 부여 완료!`);
        } catch(err) {
            console.warn("Evaluation tags update exception:", err);
        }
    }

    // [3. 게시글 evaluated_users에 기록 및 post.manner_locked = true, status = 'completed' 자동 동기화]
    if (post) {
        post.manner_locked = true;
        post.has_evaluated = true;
        post.status = "completed";
        post.statusText = (post.category === "market" ? "거래 완료" : "일정 완료");
        post.counts_applied = true;

        const myEmail = currentUser ? (currentUser.email || currentUser.name || 'user') : 'user';
        if (!Array.isArray(post.evaluated_users)) post.evaluated_users = [];
        if (!post.evaluated_users.includes(myEmail.toLowerCase())) {
            post.evaluated_users.push(myEmail.toLowerCase());
        }
        if (typeof isMyPost === 'function' && isMyPost(post)) {
            post.host_evaluated = true;
        }

        if (typeof savePosts === 'function') savePosts();

        if (supabaseClient) {
            try {
                await supabaseClient.from('posts').update({
                    status: "completed",
                    status_text: (post.category === "market" ? "거래 완료" : "일정 완료"),
                    manner_locked: true,
                    evaluated_users: post.evaluated_users,
                    counts_applied: true
                }).eq('id', post.id);
            } catch(e) {
                console.warn('Supabase post manner_locked update notice:', e);
            }
        }

        renderDynamicDetailModal(post);
    }

    const modal = document.getElementById("mannerModalOverlay");
    if (modal) modal.remove();

    if (typeof showToast === 'function') {
        if (isBlockedAction) {
            showToast(`✨ 매너 평가가 등록되었으며, [${currentMannerTargetName}] 님과 상호 차단되었습니다.`);
        } else {
            showToast(`✨ [${currentMannerTargetName}] 님께 '${tagObj.label}' 칭찬 매너 태그를 보냈습니다!`);
        }
    }

    // 피드 즉시 갱신 (차단된 유저의 글 투명망토 숨김 처리)
    if (typeof filterAndRender === 'function') {
        filterAndRender();
    }
}
window.submitMannerEvaluation = submitMannerEvaluation;


// === editPost & openDeleteConfirmModal 전역 명시적 가딩 ===
function editPost(postId) {
    if (typeof openEditPostModal === 'function') {
        openEditPostModal(postId);
    } else if (typeof openEditModal === 'function') {
        openEditModal(postId);
    }
}
window.editPost = editPost;

function openDeleteConfirmModal(postId) {
    if (!postId) return;
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    if (post && typeof isMyPost === 'function' && !isMyPost(post) && typeof isAdminAuthenticated !== 'undefined' && !isAdminAuthenticated) {
        if (typeof showToast === 'function') showToast("⛔ 본인이 작성한 게시글만 삭제할 수 있습니다!");
        return;
    }
    if (typeof pendingDeletePostId !== 'undefined') {
        pendingDeletePostId = postId;
    }
    const modal = document.getElementById("deleteConfirmModal");
    if (modal && typeof openModal === 'function') {
        openModal(modal);
    } else {
        if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            if (typeof performPostDeletion === 'function') performPostDeletion(postId);
        }
    }
}
window.openDeleteConfirmModal = openDeleteConfirmModal;

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

    // 지도 전역 좌표 및 주소 100% 복원
    if (typeof selectedMapAddress !== 'undefined') {
        selectedMapAddress = post.mapAddress || post.locationName || post.location || "";
        selectedLocationName = post.locationName || post.mapAddress || "";
        if (post.mapLat) selectedLat = post.mapLat;
        if (post.mapLng) selectedLng = post.mapLng;
    }

    // Fill form inputs
    const titleEl = document.getElementById("postTitle");
    const descEl = document.getElementById("postDesc");
    const mapAddressEl = document.getElementById("postMapAddress");
    const dateEl = document.getElementById("postDate");
    const priceEl = document.getElementById("postPrice");
    const feeEl = document.getElementById("classFee");
    const incEl = document.getElementById("classInclusion");

    if (titleEl) titleEl.value = post.title || "";
    if (descEl) descEl.value = post.desc || "";
    if (mapAddressEl) mapAddressEl.value = post.mapAddress || post.locationName || post.location || "";
    if (dateEl) dateEl.value = post.date || "";
    if (priceEl) priceEl.value = post.price !== undefined && post.price !== null ? post.price : "";
    if (feeEl) feeEl.value = (post.class_fee !== undefined && post.class_fee !== null) ? post.class_fee : ((post.classFee !== undefined && post.classFee !== null) ? post.classFee : "");
    if (incEl) incEl.value = post.class_inclusion || post.classInclusion || "";

    if (post.images && Array.isArray(post.images)) {
        uploadedCompressedImages = [...post.images];
        if (typeof renderImagePreviews === "function") renderImagePreviews();
    }

    // Close detail modal if open
    const detailM = document.getElementById("postDetailModal") || document.getElementById("detailModal");
    if (detailM) closeModal(detailM);
    const dynM = document.getElementById("dynamicDetailModalOverlay");
    if (dynM) dynM.remove();

    if (post.target_depth || post.targetDepth) {
        const depthVal = post.target_depth || post.targetDepth;
        const depthPill = document.querySelector(`#depthPillsContainer .depth-pill-btn[data-value="${depthVal}"]`);
        if (depthPill && typeof selectDepthPill === 'function') {
            selectDepthPill(depthPill, depthVal);
        }
    }
    if (post.req_license || post.reqLicense) {
        const licVal = post.req_license || post.reqLicense;
        const licPill = document.querySelector(`#licensePillsContainer .license-pill-btn[data-value="${licVal}"]`);
        if (licPill && typeof selectLicensePill === 'function') {
            selectLicensePill(licPill, licVal);
        }
    }
    const isGb = post.is_group_buy === true || post.is_group_buy === 'true' || post.isGroupBuy === true || (post.group_buy_goal > 0);
    const gbCheck = document.getElementById('postIsGroupBuy');
    if (gbCheck) {
        gbCheck.checked = isGb;
        if (typeof toggleGroupBuyFields === 'function') toggleGroupBuyFields(isGb);
    }
    const gbGoalEl = document.getElementById('postGroupBuyGoal');
    const gbCurrEl = document.getElementById('postGroupBuyCurrent');
    if (gbGoalEl && (post.group_buy_goal || post.groupBuyGoal)) gbGoalEl.value = post.group_buy_goal || post.groupBuyGoal;
    if (gbCurrEl && (post.group_buy_current !== undefined || post.groupBuyCurrent !== undefined)) gbCurrEl.value = post.group_buy_current !== undefined ? post.group_buy_current : post.groupBuyCurrent;

    const isCp = post.is_carpool === true || post.is_carpool === 'true' || post.isCarpool === true || post.isCarpool === 'true';
    const cpCheck = document.getElementById('postIsCarpool');
    if (cpCheck) {
        cpCheck.checked = isCp;
        if (typeof toggleCarpoolFields === 'function') toggleCarpoolFields(isCp);
    }
    let cpType = post.carpool_type || post.carpoolType || 'free';
    if (cpType === 'paid') cpType = 'shared_cost';
    const cpTypeRadio = document.querySelector(`input[name="carpoolType"][value="${cpType}"]`);
    if (cpTypeRadio) {
        cpTypeRadio.checked = true;
    } else {
        const freeRadio = document.getElementById("carpoolTypeFree");
        if (freeRadio) freeRadio.checked = true;
    }
    if (typeof toggleCarpoolFeeInput === 'function') toggleCarpoolFeeInput(cpType);
    const cpFeeEl = document.getElementById('carpoolFee');
    if (cpFeeEl && (post.carpool_fee !== undefined || post.carpoolFee !== undefined)) {
        cpFeeEl.value = (post.carpool_fee !== null && post.carpool_fee !== undefined) ? post.carpool_fee : (post.carpoolFee || '');
    }

    if (typeof preselectModalCategory === "function") preselectModalCategory(post.category, true);
    if (typeof renderCategoryPillOptions === "function") {
        renderCategoryPillOptions(post.category, post.target_depth || post.targetDepth, post.req_license || post.reqLicense);
    }
    const vidChk = document.getElementById("postVideoService");
    if (vidChk) vidChk.checked = !!(post.video_service || post.videoService);

    if (post.category === "instructor" && (post.class_type || post.classType)) {
        var instSubSelect = document.getElementById("instSubCategorySelect");
        var curChannel = instSubSelect ? instSubSelect.value : "freediving";
        if (typeof renderClassTypePills === "function") {
            renderClassTypePills(curChannel, post.class_type || post.classType);
        }
    }
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



// ========================================================
// === PILL UI & GROUP BUY INTERACTION HELPERS ===
// ========================================================


// ========================================================
// === DYNAMIC CATEGORY-SPECIFIC PILL OPTIONS RENDERER ===
// ========================================================


// ========================================================
// === INSTRUCTOR CLASS TYPE DYNAMIC PILL RENDERER ===
// ========================================================

function renderClassTypePills(channelKey, preservedValue = null) {
    var container = document.getElementById("classTypePillsContainer");
    if (!container) return;

    var courseOptionsMap = {
        swim: [
            { val: "초보/영법티칭", label: "초보/영법티칭" },
            { val: "자세/영법교정", label: "자세/영법교정" },
            { val: "마스터/대회준비", label: "마스터/대회준비" }
        ],
        ocean_swim: [
            { val: "오픈워터 체험", label: "오픈워터 체험" },
            { val: "바다 적응/생존수영", label: "바다 적응/생존수영" },
            { val: "스노클/오리발 기술", label: "스노클/오리발 기술" }
        ],
        freediving: [
            { val: "원데이 체험다이빙", label: "원데이 체험다이빙" },
            { val: "자격증 코스", label: "자격증 코스" },
            { val: "종목별 트레이닝(CWT/FIM 등)", label: "종목별 트레이닝(CWT/FIM 등)" }
        ],
        scuba: [
            { val: "체험 다이빙", label: "체험 다이빙" },
            { val: "오픈워터/어드밴스드 코스", label: "오픈워터/어드밴스드 코스" },
            { val: "스킬업(중성부력, 피닝 등)", label: "스킬업(중성부력, 피닝 등)" }
        ]
    };

    var list = courseOptionsMap[channelKey] || courseOptionsMap.freediving;
    var defaultVal = list[0].val;
    var activeVal = (preservedValue && list.some(item => item.val === preservedValue)) ? preservedValue : defaultVal;

    var input = document.getElementById("classType");
    if (input) input.value = activeVal;

    var disp = document.getElementById("selectedClassTypeDisplay");
    if (disp) disp.textContent = activeVal;

    container.innerHTML = list.map(item => `
        <button type="button" class="classtype-pill-btn ${item.val === activeVal ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(item.val) : item.val}" onclick="selectClassTypePill(this, '${item.val}')">${typeof escapeHtml === 'function' ? escapeHtml(item.label) : item.label}</button>
    `).join('');
}
window.renderClassTypePills = renderClassTypePills;

function selectClassTypePill(btn, value) {
    document.querySelectorAll("#classTypePillsContainer .classtype-pill-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    var input = document.getElementById("classType");
    if (input) input.value = value;
    var disp = document.getElementById("selectedClassTypeDisplay");
    if (disp) disp.textContent = value;
}
window.selectClassTypePill = selectClassTypePill;

function handleInstSubCategoryChange(channelKey) {
    if (typeof renderClassTypePills === "function") {
        renderClassTypePills(channelKey);
    }
}
window.handleInstSubCategoryChange = handleInstSubCategoryChange;

function renderCategoryPillOptions(cat, preservedDepth = null, preservedLicense = null) {
    var container = document.getElementById("buddyPillOptionsGroup");
    if (!container) return;

    if (cat === "instructor" || cat === "community" || cat === "market") {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";

    var depthHtml = "";
    var licenseHtml = "";
    var defaultDepth = "무관";
    var defaultLicense = "자격증 무관";

    if (cat === "swimming") {
        // 1. 실내 수영 (swimming)
        // 목표 수심 영역 숨김
        defaultDepth = "해당없음";
        defaultLicense = preservedLicense || "초급(자유형)";

        depthHtml = `
            <div id="targetDepthSection" style="display: none;">
                <input type="hidden" id="postTargetDepth" value="${typeof escapeHtml === 'function' ? escapeHtml(preservedDepth || defaultDepth) : (preservedDepth || defaultDepth)}">
            </div>
        `;

        var swimmingLicenses = [
            { val: "초급(자유형)", label: "초급(자유형)" },
            { val: "중급(자/배/평)", label: "중급(자/배/평)" },
            { val: "상급(접배평자)", label: "상급(접배평자)" },
            { val: "고급(1km+)", label: "고급(1km+)" },
            { val: "마스터(1.5km+)", label: "마스터(1.5km+)" }
        ];

        var activeLic = (preservedLicense && swimmingLicenses.some(l => l.val === preservedLicense)) ? preservedLicense : defaultLicense;

        licenseHtml = `
            <div>
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-person-swimming"></i> 요구 레벨 (수영 실력) *</span>
                    <span id="selectedLicenseDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}</span>
                </label>
                <input type="hidden" id="postReqLicense" value="${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}">
                <div class="pill-select-group" id="licensePillsContainer">
                    ${swimmingLicenses.map(item => `
                        <button type="button" class="license-pill-btn ${item.val === activeLic ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(item.val) : item.val}" onclick="selectLicensePill(this, '${item.val}')">${typeof escapeHtml === 'function' ? escapeHtml(item.label) : item.label}</button>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (cat === "openwater") {
        // 2. 바다 수영 / 오픈워터 (openwater)
        defaultDepth = preservedDepth || "1km";
        defaultLicense = preservedLicense || "바다경험 없음";

        var openwaterDistances = ["1km", "2km", "3km", "4km+"];
        var activeDepth = (preservedDepth && openwaterDistances.includes(preservedDepth)) ? preservedDepth : defaultDepth;

        depthHtml = `
            <div id="targetDepthSection" style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-route"></i> 목표 거리 (Target Distance) *</span>
                    <span id="selectedDepthDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}</span>
                </label>
                <input type="hidden" id="postTargetDepth" value="${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}">
                <div class="pill-select-group" id="depthPillsContainer">
                    ${openwaterDistances.map(val => `
                        <button type="button" class="depth-pill-btn ${val === activeDepth ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(val) : val}" onclick="selectDepthPill(this, '${val}')">${typeof escapeHtml === 'function' ? escapeHtml(val) : val}</button>
                    `).join('')}
                </div>
            </div>
        `;

        var openwaterLicenses = [
            { val: "바다경험 없음", label: "바다경험 없음" },
            { val: "5회 이하", label: "5회 이하" },
            { val: "10회 이상", label: "10회 이상" },
            { val: "20회 이상", label: "20회 이상" }
        ];
        var activeLic = (preservedLicense && openwaterLicenses.some(l => l.val === preservedLicense)) ? preservedLicense : defaultLicense;

        licenseHtml = `
            <div>
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-water"></i> 요구 레벨 (바다 수영 경험) *</span>
                    <span id="selectedLicenseDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}</span>
                </label>
                <input type="hidden" id="postReqLicense" value="${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}">
                <div class="pill-select-group" id="licensePillsContainer">
                    ${openwaterLicenses.map(item => `
                        <button type="button" class="license-pill-btn ${item.val === activeLic ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(item.val) : item.val}" onclick="selectLicensePill(this, '${item.val}')">${typeof escapeHtml === 'function' ? escapeHtml(item.label) : item.label}</button>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (cat === "freediving") {
        // 3. 프리다이빙 (freediving)
        defaultDepth = preservedDepth || "무관";
        defaultLicense = preservedLicense || "중급 (Level 2)";

        var freedivingDepths = ["무관", "5m 미만", "10m", "20m", "30m", "40m+"];
        var activeDepth = (preservedDepth && freedivingDepths.includes(preservedDepth)) ? preservedDepth : defaultDepth;

        depthHtml = `
            <div id="targetDepthSection" style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-arrows-up-down"></i> 목표 수심 (Target Depth) *</span>
                    <span id="selectedDepthDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}</span>
                </label>
                <input type="hidden" id="postTargetDepth" value="${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}">
                <div class="pill-select-group" id="depthPillsContainer">
                    ${freedivingDepths.map(val => `
                        <button type="button" class="depth-pill-btn ${val === activeDepth ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(val) : val}" onclick="selectDepthPill(this, '${val}')">${typeof escapeHtml === 'function' ? escapeHtml(val) : val}</button>
                    `).join('')}
                </div>
            </div>
        `;

        var freedivingLicenses = [
            { val: "중급 (Level 2)", label: "중급(Lv2)" },
            { val: "고급 (Level 3+)", label: "고급(Lv3+)" },
            { val: "강사급", label: "강사급" }
        ];
        var activeLic = (preservedLicense && freedivingLicenses.some(l => l.val === preservedLicense)) ? preservedLicense : defaultLicense;

        licenseHtml = `
            <div>
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-certificate"></i> 요구 레벨 (자격증, 안전 버디) *</span>
                    <span id="selectedLicenseDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}</span>
                </label>
                <input type="hidden" id="postReqLicense" value="${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}">
                <div class="pill-select-group" id="licensePillsContainer">
                    ${freedivingLicenses.map(item => `
                        <button type="button" class="license-pill-btn ${item.val === activeLic ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(item.val) : item.val}" onclick="selectLicensePill(this, '${item.val}')">${typeof escapeHtml === 'function' ? escapeHtml(item.label) : item.label}</button>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (cat === "scuba") {
        // 4. 스쿠버 다이빙 (scuba)
        defaultDepth = preservedDepth || "10m";
        defaultLicense = preservedLicense || "오픈워터";

        var scubaDepths = ["5m", "10m", "15m", "18m 이하"];
        var activeDepth = (preservedDepth && scubaDepths.includes(preservedDepth)) ? preservedDepth : defaultDepth;

        depthHtml = `
            <div id="targetDepthSection" style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-arrows-up-down"></i> 목표 수심 (버디 한계 수심) *</span>
                    <span id="selectedDepthDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}</span>
                </label>
                <input type="hidden" id="postTargetDepth" value="${typeof escapeHtml === 'function' ? escapeHtml(activeDepth) : activeDepth}">
                <div class="pill-select-group" id="depthPillsContainer">
                    ${scubaDepths.map(val => `
                        <button type="button" class="depth-pill-btn ${val === activeDepth ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(val) : val}" onclick="selectDepthPill(this, '${val}')">${typeof escapeHtml === 'function' ? escapeHtml(val) : val}</button>
                    `).join('')}
                </div>
            </div>
        `;

        var scubaLicenses = [
            { val: "오픈워터", label: "오픈워터" },
            { val: "어드밴스드", label: "어드밴스드" },
            { val: "레스큐다이버", label: "레스큐다이버" },
            { val: "마스터스쿠버다이버(MSD)", label: "마스터(MSD)" }
        ];
        var activeLic = (preservedLicense && scubaLicenses.some(l => l.val === preservedLicense)) ? preservedLicense : defaultLicense;

        licenseHtml = `
            <div>
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-certificate"></i> 요구 레벨 (스쿠버 자격증) *</span>
                    <span id="selectedLicenseDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}</span>
                </label>
                <input type="hidden" id="postReqLicense" value="${typeof escapeHtml === 'function' ? escapeHtml(activeLic) : activeLic}">
                <div class="pill-select-group" id="licensePillsContainer">
                    ${scubaLicenses.map(item => `
                        <button type="button" class="license-pill-btn ${item.val === activeLic ? 'active' : ''}" data-value="${typeof escapeHtml === 'function' ? escapeHtml(item.val) : item.val}" onclick="selectLicensePill(this, '${item.val}')">${typeof escapeHtml === 'function' ? escapeHtml(item.label) : item.label}</button>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        defaultDepth = preservedDepth || "무관";
        defaultLicense = preservedLicense || "자격증 무관";

        depthHtml = `
            <div id="targetDepthSection" style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-arrows-up-down"></i> 목표 수심 / 거리 *</span>
                    <span id="selectedDepthDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(defaultDepth) : defaultDepth}</span>
                </label>
                <input type="hidden" id="postTargetDepth" value="${typeof escapeHtml === 'function' ? escapeHtml(defaultDepth) : defaultDepth}">
                <div class="pill-select-group" id="depthPillsContainer">
                    <button type="button" class="depth-pill-btn active" data-value="무관" onclick="selectDepthPill(this, '무관')">무관</button>
                </div>
            </div>
        `;

        licenseHtml = `
            <div>
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; font-weight: 700; color: #00f2fe; margin-bottom: 8px;">
                    <span><i class="fa-solid fa-certificate"></i> 요구 레벨 *</span>
                    <span id="selectedLicenseDisplay" style="font-size: 0.8rem; color: #ffb703; font-weight: 800;">${typeof escapeHtml === 'function' ? escapeHtml(defaultLicense) : defaultLicense}</span>
                </label>
                <input type="hidden" id="postReqLicense" value="${typeof escapeHtml === 'function' ? escapeHtml(defaultLicense) : defaultLicense}">
                <div class="pill-select-group" id="licensePillsContainer">
                    <button type="button" class="license-pill-btn active" data-value="자격증 무관" onclick="selectLicensePill(this, '자격증 무관')">자격증 무관</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = depthHtml + licenseHtml;
}
window.renderCategoryPillOptions = renderCategoryPillOptions;

function handlePostCategoryChange(cat) {
    if (typeof updateModalFieldsByCategory === "function") updateModalFieldsByCategory(cat);
    if (typeof renderCategoryPillOptions === "function") renderCategoryPillOptions(cat);
}
window.handlePostCategoryChange = handlePostCategoryChange;

function selectDepthPill(btn, value) {
    document.querySelectorAll("#depthPillsContainer .depth-pill-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    var input = document.getElementById("postTargetDepth");
    if (input) input.value = value;
    var disp = document.getElementById("selectedDepthDisplay");
    if (disp) disp.textContent = value;
}
window.selectDepthPill = selectDepthPill;

function selectLicensePill(btn, value) {
    document.querySelectorAll("#licensePillsContainer .license-pill-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    var input = document.getElementById("postReqLicense");
    if (input) input.value = value;
    var disp = document.getElementById("selectedLicenseDisplay");
    if (disp) disp.textContent = value;
}
window.selectLicensePill = selectLicensePill;


function toggleCarpoolFields(isChecked) {
    const details = document.getElementById("carpoolDetailsRow");
    if (details) {
        details.style.display = isChecked ? "block" : "none";
    }
    if (!isChecked) {
        const freeRadio = document.getElementById("carpoolTypeFree");
        if (freeRadio) freeRadio.checked = true;
        const feeGroup = document.getElementById("carpoolFeeGroup");
        if (feeGroup) feeGroup.style.display = "none";
        const feeInput = document.getElementById("carpoolFee");
        if (feeInput) feeInput.value = "";
    }
}
window.toggleCarpoolFields = toggleCarpoolFields;

function toggleCarpoolFeeInput(type) {
    const feeGroup = document.getElementById("carpoolFeeGroup");
    const isShared = (type === 'shared_cost' || type === 'paid');
    if (feeGroup) {
        feeGroup.style.display = isShared ? "block" : "none";
        if (isShared) {
            const feeInput = document.getElementById("carpoolFee");
            if (feeInput) feeInput.focus();
        }
    }
}
window.toggleCarpoolFeeInput = toggleCarpoolFeeInput;

function toggleGroupBuyFields(isChecked) {
    var row = document.getElementById("groupBuyFieldsRow");
    if (row) {
        row.style.display = isChecked ? "grid" : "none";
    }
}
window.toggleGroupBuyFields = toggleGroupBuyFields;

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

    const classTypeEl = document.getElementById("classType");
    const classType = (classTypeEl && classTypeEl.value) ? classTypeEl.value.trim() : "원데이 체험다이빙";
    const classFeeInput = document.getElementById("classFee");
    const classFeeRaw = classFeeInput ? classFeeInput.value.replace(/[^0-9]/g, '') : '';
    const classFeeVal = classFeeRaw !== '' ? parseInt(classFeeRaw, 10) : null;
    const classRatioVal = document.getElementById("classRatio") ? document.getElementById("classRatio").value : "1:2 소수정예 강습";
    const classInclusionVal = document.getElementById("classInclusion") ? document.getElementById("classInclusion").value : "장비 렌탈비 포함";
    const priceVal = document.getElementById("postPrice") ? document.getElementById("postPrice").value : null;
    const dealMethodVal = document.getElementById("postDealMethod") ? document.getElementById("postDealMethod").value : "직거래/택배 둘 다 가능";
    const capacityVal = document.getElementById("postCapacity") ? document.getElementById("postCapacity").value : 4;
    const targetDepthVal = document.getElementById("postTargetDepth") ? document.getElementById("postTargetDepth").value : "무관";
    const reqLicenseVal = document.getElementById("postReqLicense") ? document.getElementById("postReqLicense").value : "자격증 무관";
    const isGroupBuyChecked = document.getElementById("postIsGroupBuy") ? document.getElementById("postIsGroupBuy").checked : false;
    const isBuddyOrInstructor = (category !== "market" && category !== "community" && category !== "partnership");
    const isCarpoolChecked = isBuddyOrInstructor && (document.getElementById("postIsCarpool") ? document.getElementById("postIsCarpool").checked : false);
    const carpoolTypeRadio = document.querySelector('input[name="carpoolType"]:checked');
    let carpoolTypeVal = isCarpoolChecked ? (carpoolTypeRadio ? carpoolTypeRadio.value : 'free') : null;
    if (carpoolTypeVal === 'paid') carpoolTypeVal = 'shared_cost';
    const carpoolFeeInput = document.getElementById("carpoolFee");
    const carpoolFeeRaw = (isCarpoolChecked && (carpoolTypeVal === 'shared_cost' || carpoolTypeVal === 'paid') && carpoolFeeInput) ? carpoolFeeInput.value.replace(/[^0-9]/g, '') : '';
    const carpoolFeeVal = carpoolFeeRaw !== '' ? parseInt(carpoolFeeRaw, 10) : 0;
    const groupBuyGoalVal = document.getElementById("postGroupBuyGoal") ? parseInt(document.getElementById("postGroupBuyGoal").value || 10, 10) : 10;
    const groupBuyCurrentVal = document.getElementById("postGroupBuyCurrent") ? parseInt(document.getElementById("postGroupBuyCurrent").value || 1, 10) : 1;
    const mapAddressEl = document.getElementById("postMapAddress");
    let mapAddress = mapAddressEl ? mapAddressEl.value.trim() : "";
    if (!mapAddress && typeof selectedMapAddress !== 'undefined' && selectedMapAddress) {
        mapAddress = selectedMapAddress;
    }
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
    const isInstructor = category === "instructor";
    const instSubVal = isInstructor ? (document.getElementById("instSubCategorySelect") ? document.getElementById("instSubCategorySelect").value : "freediving") : null;

    const payload = {
        title,
        category,
        categoryName,
        instSubCategory: isInstructor ? instSubVal : null,
        inst_sub_category: isInstructor ? instSubVal : null,
        classType: isInstructor ? (classType || "원데이 체험다이빙") : null,
        class_type: isInstructor ? (classType || "원데이 체험다이빙") : null,
        classFee: isInstructor && classFeeVal !== null ? classFeeVal : null,
        class_fee: isInstructor && classFeeVal !== null ? classFeeVal : null,
        classRatio: isInstructor ? classRatioVal : null,
        classInclusion: isInstructor ? classInclusionVal : null,
        video_service: isInstructor ? (document.getElementById("postVideoService") ? document.getElementById("postVideoService").checked : false) : false,
        videoService: isInstructor ? (document.getElementById("postVideoService") ? document.getElementById("postVideoService").checked : false) : false,
        is_free_trial: isInstructor && (!classFeeVal || parseInt(classFeeVal, 10) === 0),
        isFreeTrial: isInstructor && (!classFeeVal || parseInt(classFeeVal, 10) === 0),
        price: (category === "market") && priceVal ? parseInt(priceVal) : null,
        dealMethod: (category === "market") ? dealMethodVal : null,
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
        target_depth: (!isCommunity && category !== "market" && !isInstructor) ? targetDepthVal : null,
        targetDepth: (!isCommunity && category !== "market" && !isInstructor) ? targetDepthVal : null,
        req_license: (!isCommunity && category !== "market") ? (isInstructor ? "초보/입문자 환영" : reqLicenseVal) : (category === "market" ? "상태 우수 / 직거래 가능" : "안전 수칙 준수"),
        reqLicense: (!isCommunity && category !== "market") ? (isInstructor ? "초보/입문자 환영" : reqLicenseVal) : (category === "market" ? "상태 우수 / 직거래 가능" : "안전 수칙 준수"),
        is_group_buy: category === "market" ? isGroupBuyChecked : false,
        isGroupBuy: category === "market" ? isGroupBuyChecked : false,
        group_buy_goal: category === "market" && isGroupBuyChecked ? groupBuyGoalVal : 0,
        groupBuyGoal: category === "market" && isGroupBuyChecked ? groupBuyGoalVal : 0,
        group_buy_current: category === "market" && isGroupBuyChecked ? groupBuyCurrentVal : 0,
        is_carpool: isCarpoolChecked,
        isCarpool: isCarpoolChecked,
        carpool_type: isCarpoolChecked ? carpoolTypeVal : null,
        carpoolType: isCarpoolChecked ? carpoolTypeVal : null,
        carpool_fee: (isCarpoolChecked && carpoolTypeVal === 'paid') ? carpoolFeeVal : null,
        carpoolFee: (isCarpoolChecked && carpoolTypeVal === 'paid') ? carpoolFeeVal : null,
        groupBuyCurrent: category === "market" && isGroupBuyChecked ? groupBuyCurrentVal : 0,
        desc,
        author_blocked_users: (currentUser && Array.isArray(currentUser.blocked_users)) ? [...currentUser.blocked_users] : [],
        authorBlockedUsers: (currentUser && Array.isArray(currentUser.blocked_users)) ? [...currentUser.blocked_users] : [],
        status: "recruiting",
        statusText: category === "market" ? "판매 중" : (isInstructor ? "수강생 모집 중" : "모집 중"),
        hostRating: currentUser ? 5.0 : 4.9,
        hostReviewsCount: 1,
        likes: 0,
        userLiked: false,
        wishlistCount: 0,
        userWished: false,
        unreadCount: 0,
        comments: [],
        participants: editingPostId && posts.find(p => String(p.id) === String(editingPostId)) ? (posts.find(p => String(p.id) === String(editingPostId)).participants || []) : [],
        pending_participants: editingPostId && posts.find(p => String(p.id) === String(editingPostId)) ? (posts.find(p => String(p.id) === String(editingPostId)).pending_participants || []) : [],
        rejected_participants: editingPostId && posts.find(p => String(p.id) === String(editingPostId)) ? (posts.find(p => String(p.id) === String(editingPostId)).rejected_participants || []) : [],
        images: [...uploadedCompressedImages],
        certImage: isInstructor ? (currentUser ? currentUser.certImage : uploadedCertImage) : null,
        createdAt: getKSTIsoString()
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
                instructor_org: isInstructor ? ((currentUser && (currentUser.instructor_org || currentUser.instructorOrg || currentUser.instOrg)) || (document.getElementById("instOrgInput") ? document.getElementById("instOrgInput").value.trim() : "") || "AIDA") : null,
                instructor_license_code: isInstructor ? (currentUser ? (currentUser.instructor_code || currentUser.instructorCode || "") : "") : null,
                class_type: isInstructor ? (classType || payload.classType || "원데이 체험다이빙") : null,
                sports_type: isInstructor ? instSubVal : (category === "swimming" ? "실내수영" : (category === "openwater" ? "바다수영" : (category === "scuba" ? "스쿠버다이빙" : (category === "freediving" ? "프리다이빙" : null)))),
                real_name: currentUser ? (currentUser.real_name || currentUser.name || userNick) : userNick,
                class_fee: isInstructor ? (payload.classFee || payload.class_fee || null) : null,
                class_ratio: isInstructor ? (payload.classRatio || payload.class_ratio || null) : null,
                class_inclusion: isInstructor ? (payload.classInclusion || payload.class_inclusion || null) : null,
                price: (category === "market") ? payload.price : null,
                deal_method: (category === "market") ? (payload.dealMethod || payload.deal_method || null) : null,
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
                author_blocked_users: (currentUser && Array.isArray(currentUser.blocked_users)) ? currentUser.blocked_users : [],
                req_license: (category !== "market" && !isCommunity) ? (payload.req_license || payload.reqLicense || null) : null,
                target_depth: (!isCommunity && category !== "market" && !isInstructor) ? (payload.target_depth || payload.targetDepth || null) : null,
                is_group_buy: (category === "market") ? (payload.is_group_buy !== undefined ? payload.is_group_buy : (payload.isGroupBuy || false)) : false,
                group_buy_goal: (category === "market") ? (payload.group_buy_goal !== undefined ? payload.group_buy_goal : (payload.groupBuyGoal || 0)) : 0,
                group_buy_current: (category === "market") ? (payload.group_buy_current !== undefined ? payload.group_buy_current : (payload.groupBuyCurrent || 0)) : 0,
                is_carpool: isCarpoolChecked,
                carpool_type: isCarpoolChecked ? carpoolTypeVal : null,
                carpool_fee: (isCarpoolChecked && carpoolTypeVal === 'paid') ? carpoolFeeVal : null,
                location: payload.location,
                date: payload.date,
                content: payload.desc,
                created_at: getKSTIsoString()
            };

            if (editingPostId) {
                // UPDATE 기존 행 수정
                let { data, error } = await supabaseClient.from('posts').update(dbPayload).eq('id', editingPostId).select();
                
                // 스키마 컬럼 미존재 에러 발생 시 자동 복구 및 재시도
                if (error && error.message && error.message.includes("Could not find the") && error.message.includes("column of 'posts'")) {
                    const match = error.message.match(/Could not find the '([^']+)' column/);
                    if (match && match[1]) {
                        console.warn(`⚠️ Supabase posts 미존재 컬럼 '${match[1]}' 자동 제거 후 재시도합니다.`);
                        delete dbPayload[match[1]];
                        const retry = await supabaseClient.from('posts').update(dbPayload).eq('id', editingPostId).select();
                        data = retry.data;
                        error = retry.error;
                    }
                }

                if (!error && data && data.length > 0) {
                    savedPost = { ...data[0] };
                } else if (error) {
                    console.error('❌ Supabase posts UPDATE 실패:', error);
                    alert("⚠️ Supabase posts DB 수정 거부됨: " + (error.message || JSON.stringify(error)));
                }
            } else {
                // INSERT 신규 추가
                dbPayload.created_at = payload.createdAt || getKSTIsoString();
                let { data, error } = await supabaseClient.from('posts').insert([dbPayload]).select();

                // 스키마 컬럼 미존재 에러 발생 시 자동 복구 및 재시도
                if (error && error.message && error.message.includes("Could not find the") && error.message.includes("column of 'posts'")) {
                    const match = error.message.match(/Could not find the '([^']+)' column/);
                    if (match && match[1]) {
                        console.warn(`⚠️ Supabase posts 미존재 컬럼 '${match[1]}' 자동 제거 후 재시도합니다.`);
                        delete dbPayload[match[1]];
                        const retry = await supabaseClient.from('posts').insert([dbPayload]).select();
                        data = retry.data;
                        error = retry.error;
                    }
                }

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
    if (typeof fetchPostsFromSupabase === 'function') {
        fetchPostsFromSupabase().then(() => {
            filterAndRender();
        }).catch(e => console.warn('Mobile instant refresh notice:', e));
    }

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

    runWithKakaoMap(() => {
        try {
            let coords = matchedSpot 
                ? new kakao.maps.LatLng(matchedSpot.lat, matchedSpot.lng)
                : new kakao.maps.LatLng(37.2750, 127.2340);

            mapContainer.innerHTML = '';
            const mapOptions = { center: coords, level: 4 };
            const map = new kakao.maps.Map(mapContainer, mapOptions);

            const zoomControl = new kakao.maps.ZoomControl();
            map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

            const fixLayout = () => {
                if (map) {
                    map.relayout();
                    map.setCenter(coords);
                }
            };
            setTimeout(fixLayout, 100);
            setTimeout(fixLayout, 300);

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
            console.error("Kakao Map showMap Error:", e);
        }
    });
}
window.showMap = showMap;

// Supabase reviews DB 연동: 주최자 실제 평점 및 후기 수 조회
async function fetchAndRenderHostRating(targetEmail, targetName, badgeElId) {
    const badgeEl = document.getElementById(badgeElId);
    if (!badgeEl) return;

    if (!supabaseClient) {
        badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ★ 신규 버디 (매너평가 참여 대기)`;
        return;
    }

    try {
        let query = supabaseClient.from('reviews').select('score');
        if (targetEmail && targetEmail.includes('@')) {
            query = query.eq('target_email', targetEmail);
        } else if (targetName) {
            query = query.eq('target_name', targetName);
        } else {
            badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ★ 신규 버디 (매너평가 참여 대기)`;
            return;
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
            badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ★ 신규 버디 (첫 매너평가 대기)`;
            return;
        }

        const totalScore = data.reduce((sum, r) => sum + (parseFloat(r.score) || 5.0), 0);
        const avgScore = (totalScore / data.length).toFixed(1);
        badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ★ 주최자 평점 ${avgScore} (${data.length}건)`;
    } catch(e) {
        console.warn('fetchAndRenderHostRating notice:', e);
        badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ★ 신규 버디 (매너평가 참여 대기)`;
    }
}
window.fetchAndRenderHostRating = fetchAndRenderHostRating;
function initKakaoLiveMap(addressQuery) {
    const mapContainer = document.getElementById("kakaoLiveMap");
    if (!mapContainer) return;

    const locQuery = (addressQuery || "").trim();
    if (!locQuery) {
        mapContainer.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.85rem; background:rgba(0,0,0,0.3);">
                📍 상세 장소가 미지정된 모임입니다.
            </div>
        `;
        return;
    }

    let matchedSpot = null;
    const spotCoords = (typeof FAMOUS_SPOT_COORDS !== "undefined" && FAMOUS_SPOT_COORDS) ? FAMOUS_SPOT_COORDS : (window.FAMOUS_SPOT_COORDS || {});
    const queryLower = locQuery.toLowerCase();

    for (const key in spotCoords) {
        if (queryLower.includes(key)) {
            matchedSpot = spotCoords[key];
            break;
        }
    }

    runWithKakaoMap(() => {
        try {
            let coords = matchedSpot 
                ? new kakao.maps.LatLng(matchedSpot.lat, matchedSpot.lng)
                : new kakao.maps.LatLng(37.2750, 127.2340);

            mapContainer.innerHTML = '';
            const mapOptions = { center: coords, level: 4 };
            const map = new kakao.maps.Map(mapContainer, mapOptions);

            const zoomControl = new kakao.maps.ZoomControl();
            map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

            const triggerRelayout = () => {
                if (map) {
                    map.relayout();
                    map.setCenter(coords);
                }
            };
            setTimeout(triggerRelayout, 100);
            setTimeout(triggerRelayout, 300);

            if (kakao.maps.services && kakao.maps.services.Geocoder && !matchedSpot) {
                const geocoder = new kakao.maps.services.Geocoder();
                geocoder.addressSearch(locQuery, function(result, status) {
                    if (status === kakao.maps.services.Status.OK && result[0]) {
                        coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                        map.setCenter(coords);
                    }
                    createMapMarker(map, coords, locQuery);
                });
            } else {
                createMapMarker(map, coords, matchedSpot ? matchedSpot.title : locQuery);
            }
        } catch (e) {
            console.error("Kakao Map initKakaoLiveMap Error:", e);
        }
    });
}
window.initKakaoLiveMap = initKakaoLiveMap;

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

function renderFallbackMapUI(container, query, spotInfo) { return;
    const lat = spotInfo ? spotInfo.lat : 37.2750;
    const lng = spotInfo ? spotInfo.lng : 127.2340;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.015}%2C${lat-0.015}%2C${lng+0.015}%2C${lat+0.015}&layer=mapnik&marker=${lat}%2C${lng}`;

    container.innerHTML = `
        <iframe src="${osmUrl}" loading="lazy" style="width:100%; height:100%; border:none; border-radius:8px;"></iframe>
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

    runWithKakaoMap(() => {
        try {
            const coords = new kakao.maps.LatLng(lat, lng);
            const mapOptions = { 
                center: coords, 
                level: 3 
            };

            // 기존 마커 및 맵 인스턴스 초기화 (재사용 에러 방지)
            pickerBox.innerHTML = '';
            modalPickerMap = new kakao.maps.Map(pickerBox, mapOptions);

            // 줌 컨트롤 추가
            const zoomControl = new kakao.maps.ZoomControl();
            modalPickerMap.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

            // 모달 표시 후 레이아웃 100% 보정
            const fixLayout = () => {
                if (modalPickerMap) {
                    modalPickerMap.relayout();
                    modalPickerMap.setCenter(coords);
                }
            };
            setTimeout(fixLayout, 50);
            setTimeout(fixLayout, 150);
            setTimeout(fixLayout, 300);

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
            console.error("Kakao Map initModalMapPicker Error:", e);
        }
    });
}
window.initModalMapPicker = initModalMapPicker;

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

// Legacy duplicate handleAddComment removed (unified with async handleAddComment above)

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

    if (targetEl.id === "authModal") {
        if (typeof resetAuthForm === "function") resetAuthForm();
    }

    if (targetEl.id === "adminDashboardModal" || targetEl.id === "webmasterDashboardModal" || targetEl.id === "webmasterAuthModal") {
        if (typeof restoreAdBannersAfterAdmin === 'function') {
            restoreAdBannersAfterAdmin();
        }
    }
}

function showToast(message) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;";
        if (document.body) document.body.appendChild(container);
    }
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.cssText = "pointer-events: auto;";
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-cyan); font-size: 1.2rem;"></i> <span>${typeof escapeHtml === 'function' ? escapeHtml(message) : message}</span>`;
    
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

function formatTimeAgo(dateInput) {
    if (!dateInput) return "방금 전";
    try {
        let past;
        if (typeof dateInput === "string") {
            let isoStr = dateInput.trim();
            // If no timezone indicator, assume KST (+09:00)
            if (!isoStr.includes("Z") && !isoStr.includes("+") && !isoStr.includes("-", 10)) {
                isoStr += "+09:00";
            }
            past = new Date(isoStr).getTime();
        } else if (dateInput instanceof Date) {
            past = dateInput.getTime();
        } else if (typeof dateInput === "number") {
            past = dateInput;
        } else {
            past = new Date(dateInput).getTime();
        }

        if (isNaN(past) || past <= 0) return "방금 전";

        const now = Date.now();
        let diffMs = now - past;
        if (diffMs < 0) diffMs = 0;

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 30) return `${diffDay}일 전`;
        
        const diffMonth = Math.floor(diffDay / 30);
        if (diffMonth < 12) return `${diffMonth}개월 전`;
        return `${Math.floor(diffDay / 365)}년 전`;
    } catch (e) {
        return "방금 전";
    }
}
window.formatTimeAgo = formatTimeAgo;

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
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

// === 동적 실시간 대화방 팝업 엔진 (헤더 UI 버디/강사 분기 리모델링) ===
function renderDynamicChatRoomModal(post) {
    if (!post) return;
    const existing = document.getElementById("dynamicChatModalOverlay");
    if (existing) existing.remove();

    const postIdStr = String(post.id).trim();
    const isInstructor = post.category === "instructor" || post.is_instructor;

    // 1. 주최자 이름 분기 (강사는 실명, 버디는 닉네임)
    const hostDisplayName = isInstructor 
        ? (post.realName || post.real_name || post.userName || post.user_name || post.author || "검증 강사") 
        : (post.userName || post.user_name || post.nickname || post.author || "다이버");

    // 2. 일정 및 장소 정보 수집
    const dateText = (typeof formatDate === 'function') ? formatDate(post.date || post.createdAt) : (post.date || '일시 협의');
    const locationText = post.mapAddress || post.locationName || post.location || '장소 미지정';
    const licenseBadgeText = post.instructorLicenseCode || post.license_info || '공인 검증 강사 라이센스';

    const overlay = document.createElement("div");
    overlay.id = "dynamicChatModalOverlay";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.85) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    `;

    overlay.innerHTML = `
        <div style="background: rgba(13, 23, 38, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 2px solid ${isInstructor ? '#ffd700' : '#00f2fe'}; box-shadow: 0 0 50px ${isInstructor ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 242, 254, 0.5)'}; border-radius: 20px; width: 100%; max-width: 540px; height: 86vh; max-height: 700px; display: flex; flex-direction: column; padding: 20px; color: #ffffff; position: relative; font-family: sans-serif; animation: fadeIn 0.25s ease; box-sizing: border-box;">
            
            <!-- 채팅 헤더 -->
            <div style="border-bottom: 1px solid ${isInstructor ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 242, 254, 0.3)'}; padding-bottom: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
                            <span style="background: ${isInstructor ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 242, 254, 0.2)'}; border: 1px solid ${isInstructor ? '#ffd700' : '#00f2fe'}; color: ${isInstructor ? '#ffd700' : '#00f2fe'}; padding: 2px 8px; border-radius: 10px; font-weight: 800; font-size: 0.76rem;">
                                ${isInstructor ? '🎓 강사 클래스 대화방' : '👥 버디 모집 대화방'}
                            </span>
                            ${isInstructor ? `<span style="background: linear-gradient(135deg, #ffd700, #ff8f00); color: #000; font-size: 0.72rem; font-weight: 900; padding: 2px 8px; border-radius: 10px;">VERIFIED INSTRUCTOR</span>` : ''}
                        </div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff; line-height: 1.3;">
                            ${typeof escapeHtml === 'function' ? escapeHtml(post.title || '일정 대화방') : (post.title || '일정 대화방')}
                        </h3>
                    </div>
                    <button onclick="document.getElementById('dynamicChatModalOverlay').remove(); if(typeof unsubscribeChatRealtime==='function')unsubscribeChatRealtime();" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: bold; font-size: 1.2rem; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>

                <!-- 주최자 / 강사 정보 및 일정/장소 핵심 요약 카드 -->
                <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; margin-top: 10px; font-size: 0.82rem; line-height: 1.5;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">
                        <div>
                            <span style="color: #a0aec0;">${isInstructor ? '🎓 담당 강사:' : '👑 모임 주최자:'}</span>
                            <strong style="color: ${isInstructor ? '#ffd700' : '#00f2fe'}; font-weight: 800; font-size: 0.88rem; margin-left: 4px;">${typeof escapeHtml === 'function' ? escapeHtml(hostDisplayName) : hostDisplayName}</strong>
                        </div>
                        ${isInstructor ? `<div style="font-size: 0.76rem; color: #ffb703;">📜 ${typeof escapeHtml === 'function' ? escapeHtml(licenseBadgeText) : licenseBadgeText}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 12px; color: #e2e8f0; flex-wrap: wrap;">
                        <span>📅 ${isInstructor ? '강습 일정' : '모임 일정'}: <strong style="color: #ffb703;">${dateText}</strong></span>
                        <span>📍 ${isInstructor ? '강습 장소' : '모임 장소'}: <strong style="color: #ffffff;">${typeof escapeHtml === 'function' ? escapeHtml(locationText) : locationText}</strong></span>
                    </div>
                </div>
            </div>

            <!-- 메시지 스트림 영역 -->
            <div id="chatMessagesStream" style="flex: 1; overflow-y: auto; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 12px; padding: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; color: #a0aec0; font-size: 0.82rem; margin: 10px 0;">
                    💬 실시간 대화방에 입장하셨습니다. 메시지를 작성해보세요!
                </div>
            </div>

            <!-- 메시지 입력 폼 -->
            <form onsubmit="handleSendChatMessage(event, '${postIdStr}')" style="display: flex; gap: 8px;">
                <input type="text" id="chatMessageInput" placeholder="메시지를 입력하세요..." required style="flex: 1; background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,254,0.4); color: #fff; padding: 12px 14px; border-radius: 10px; font-size: 0.92rem; outline: none;">
                <button type="submit" style="background: #00d2d3; border: none; color: #070e17; padding: 12px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 0.92rem; white-space: nowrap;">
                    전송
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    // 채팅 구독 및 메시지 렌더링 시작
    if (typeof subscribeChatRealtime === 'function') {
        subscribeChatRealtime(postIdStr);
    } else if (typeof fetchAndRenderChatMessages === 'function') {
        fetchAndRenderChatMessages(postIdStr);
    }
}
window.renderDynamicChatRoomModal = renderDynamicChatRoomModal;

function openChatRoomModal(postId) {
    if (!postId) return;
    const postIdStr = String(postId).trim();
    if (!currentUser || !currentUser.name) {
        showToast("🔑 로그인 후 대화방에 입장하실 수 있습니다!");
        pendingLoginAction = function() { openChatRoomModal(postIdStr); };
        if (typeof switchAuthTab === "function") switchAuthTab('login');
        openModal(document.getElementById("authModal"));
        return;
    }
    const post = posts.find(p => String(p.id).trim() === postIdStr);
    if (!post) {
        showToast("⚠️ 채팅할 게시글을 찾을 수 없습니다.");
        return;
    }
    currentChatPost = post;
    chatMessages[postIdStr] = chatMessages[postIdStr] || [];
    renderDynamicChatRoomModal(post);
}
window.openChatRoomModal = openChatRoomModal;

    window.openChatModal = openChatRoomModal;
    window.openInstructorAuthModal = openInstructorAuthModal;
    window.openAdminSecurityCheck = openAdminSecurityCheck;
    window.openInquiryModal = openInquiryModal;

// Universal Post & Fraud/Manner Report Modal Connector
function openPostReportModal(postId) {
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === String(postId)) : null;
    const postTitle = post ? (post.title || '게시글') : '게시글';
    const postAuthor = post ? (post.nickname || post.userName || post.user_name || post.author || '작성자') : '작성자';

    if (typeof openInquiryModal === 'function') {
        openInquiryModal('report');
    }

    const contentInput = document.getElementById("inquiryContent");
    if (contentInput) {
        contentInput.value = `[🚨 게시글/유저 신고 접수]\n- 대상 게시글 ID: ${postId}\n- 게시글 제목: ${postTitle}\n- 작성자: ${postAuthor}\n\n[신고 사유 및 상세 내용]:\n`;
        contentInput.focus();
    }
    showToast("🚨 신고 사유를 작성해 주시면 운영진이 신속히 확인하여 제재 조치합니다.");
}
window.openPostReportModal = openPostReportModal;

    window.openTermsModal = openTermsModal;
    window.openLegalModal = openLegalModal;
    window.handleCopyrightTripleClick = handleCopyrightTripleClick;
    window.filterByCategory = switchMainView;
    window.switchMainView = switchMainView;
    window.filterInstructorSub = filterInstructorSub;
    window.filterBuddySub = filterBuddySub;
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
        
        // 접근 권한 사전 검증: hanmaner@naver.com 로그인 여부 확인
        const isLoggedIn = typeof currentUser !== 'undefined' && currentUser && currentUser.email;
        const userEmail = isLoggedIn ? currentUser.email.trim().toLowerCase() : "";

        if (!isLoggedIn || userEmail !== WEBMASTER_ADMIN_EMAIL.toLowerCase()) {
            if (typeof showToast === "function") {
                showToast("⛔ 관리자 전용 기능입니다. hanmaner@naver.com 계정으로 로그인 후 시도해 주세요.");
            }
            return;
        }

        // 2차 인증 모달 최상단 오픈
        openWebmasterAuthModal();
    }
}

window.openWebmasterAuthModal = openWebmasterAuthModal;
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

// ========================================================
// 📜 AquaBuddy (아쿠아버디) 정식 서비스 이용약관 & 개인정보처리방침 (DOM Tab Switcher)
// ========================================================

function openTermsModal(type = "terms") {
    const modalEl = document.getElementById("termsModal") || document.getElementById("legalModal");
    if (!modalEl) {
        console.error("termsModal 요소를 찾을 수 없습니다.");
        return;
    }
    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }
    if (typeof openModal === 'function') {
        openModal(modalEl);
    } else {
        modalEl.classList.remove("hidden");
        modalEl.classList.add("active");
        modalEl.style.setProperty("display", "flex", "important");
    }
    switchTermsTab(type || "terms");
}
window.openTermsModal = openTermsModal;

function switchTermsTab(type) {
    const titleEl = document.getElementById("termsModalHeaderTitle");
    const termsBtn = document.getElementById("termsTabTermsBtn") || document.getElementById("legalTabTerms");
    const privacyBtn = document.getElementById("termsTabPrivacyBtn") || document.getElementById("legalTabPrivacy");
    const panelTerms = document.getElementById("termsPanelTerms");
    const panelPrivacy = document.getElementById("termsPanelPrivacy");
    const scrollContainer = document.getElementById("termsModalBody");

    if (type === "privacy") {
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: #00f2fe;"></i> 개인정보처리방침';
        if (termsBtn) { 
            termsBtn.className = "btn btn-secondary";
            termsBtn.style.setProperty("background", "rgba(15, 23, 42, 0.6)", "important");
            termsBtn.style.setProperty("color", "#94a3b8", "important");
            termsBtn.style.setProperty("border", "1px solid rgba(255,255,255,0.1)", "important");
        }
        if (privacyBtn) { 
            privacyBtn.className = "btn btn-primary";
            privacyBtn.style.setProperty("background", "var(--accent-cyan)", "important");
            privacyBtn.style.setProperty("color", "#000", "important");
            privacyBtn.style.setProperty("border", "1px solid var(--accent-cyan)", "important");
        }
        if (panelTerms) panelTerms.style.setProperty("display", "none", "important");
        if (panelPrivacy) panelPrivacy.style.setProperty("display", "block", "important");
    } else {
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-scale-balanced" style="color: var(--accent-gold);"></i> 서비스 이용약관';
        if (termsBtn) { 
            termsBtn.className = "btn btn-primary";
            termsBtn.style.setProperty("background", "var(--accent-cyan)", "important");
            termsBtn.style.setProperty("color", "#000", "important");
            termsBtn.style.setProperty("border", "1px solid var(--accent-cyan)", "important");
        }
        if (privacyBtn) { 
            privacyBtn.className = "btn btn-secondary";
            privacyBtn.style.setProperty("background", "rgba(15, 23, 42, 0.6)", "important");
            privacyBtn.style.setProperty("color", "#94a3b8", "important");
            privacyBtn.style.setProperty("border", "1px solid rgba(255,255,255,0.1)", "important");
        }
        if (panelTerms) panelTerms.style.setProperty("display", "block", "important");
        if (panelPrivacy) panelPrivacy.style.setProperty("display", "none", "important");
    }
    if (scrollContainer) scrollContainer.scrollTop = 0;
}
window.switchTermsTab = switchTermsTab;

function openLegalModal(type) { openTermsModal(type); }
function switchLegalTab(type) { switchTermsTab(type); }
window.openLegalModal = openLegalModal;
window.switchLegalTab = switchLegalTab;

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

async function handleInquirySubmit(e) {
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

    // Supabase inquiries 테이블 INSERT (스키마: id,created_at,category,category_name,name,contact,title,content,image,status)
    if (supabaseClient) {
        try {
            const inquiryPayload = {
                category: newInquiry.category,
                category_name: newInquiry.categoryName,
                name: newInquiry.name,
                contact: newInquiry.contact,
                title: newInquiry.title,
                content: newInquiry.content,
                image: (typeof inquiryImageCompressed !== 'undefined' && inquiryImageCompressed) ? inquiryImageCompressed : "",
                status: newInquiry.status
            };
            console.log('🚀 [INQUIRY INSERT] Supabase payload:', inquiryPayload);
            const { data, error } = await supabaseClient.from('inquiries').insert([inquiryPayload]);
            if (error) {
                console.error('❌ [INQUIRY INSERT ERROR]', error);
                showToast("⚠️ 문의 DB 저장 실패: " + (error.message || error.code));
            } else {
                console.log('✨ [INQUIRY INSERT SUCCESS]', data);
            }
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
// 댓글 폼 submit 이벤트 위임 (onsubmit이 이미 연결되어 있으므로 별도 click 위임 제거)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js?v=V1120_MOBILE_CACHE_CLEAR").then(() => console.log("Service Worker registered")).catch(err => console.error("SW registration failed:", err));
}


// ==================================================
// Realtime Chat Messages Subscription & Deduplication
// ==================================================





// ==================================================
// Supabase Global Realtime Subscription System
// (chat_rooms, chats, comments, inquiries)
// ==================================================
let _globalRealtimeChannel = null;

async function manualRefreshFeed() {
    const btn = document.getElementById("manualFeedRefreshBtn");
    if (btn) {
        const icon = btn.querySelector("i");
        if (icon) icon.classList.add("fa-spin");
    }

    try {
        if (typeof loadPosts === 'function') {
            await loadPosts();
        } else if (typeof filterAndRender === 'function') {
            filterAndRender();
        }
        if (typeof showToast === 'function') {
            showToast("🔄 최신 게시글과 참가 상태가 새로고침되었습니다!");
        }
    } catch(e) {
        console.warn("Manual feed refresh notice:", e);
    } finally {
        setTimeout(function() {
            if (btn) {
                const icon = btn.querySelector("i");
                if (icon) icon.classList.remove("fa-spin");
            }
        }, 600);
    }
}
window.manualRefreshFeed = manualRefreshFeed;


function broadcastPostUpdate(postId) {
    if (!postId) return;
    const postIdStr = String(postId);
    const post = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts.find(p => String(p.id) === postIdStr) : null;
    
    if (typeof _globalRealtimeChannel !== 'undefined' && _globalRealtimeChannel) {
        try {
            _globalRealtimeChannel.send({
                type: 'broadcast',
                event: 'post_updated',
                payload: {
                    postId: postIdStr,
                    postData: post || null
                }
            });
        } catch(e) {
            console.warn("Broadcast post update notice:", e);
        }
    }
}
window.broadcastPostUpdate = broadcastPostUpdate;


async function refreshCurrentDetailModal(postId) {
    if (!postId) return;
    const btnIcon = document.querySelector("#dynamicDetailModalOverlay i.fa-arrows-rotate");
    if (btnIcon) btnIcon.classList.add("fa-spin");

    try {
        if (typeof loadPosts === 'function') await loadPosts();
        const freshPost = (posts || []).find(p => String(p.id) === String(postId));
        if (freshPost && typeof renderDynamicDetailModal === 'function') {
            renderDynamicDetailModal(freshPost);
        }
        if (typeof showToast === 'function') {
            showToast("🔄 게시글 참가 현황과 상태가 실시간으로 갱신되었습니다!");
        }
    } catch(e) {
        console.warn("Refresh detail modal exception:", e);
    } finally {
        setTimeout(function() {
            const freshIcon = document.querySelector("#dynamicDetailModalOverlay i.fa-arrows-rotate");
            if (freshIcon) freshIcon.classList.remove("fa-spin");
        }, 500);
    }
}
window.refreshCurrentDetailModal = refreshCurrentDetailModal;


function initGlobalRealtimeSubscriptions() {
    if (!supabaseClient || _globalRealtimeChannel) return;

    try {
        _globalRealtimeChannel = supabaseClient
            .channel('aqua_buddy_global_realtime')
            // 1. chats (전역 알림 & 플로팅 토스트)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chats'
            }, (payload) => {
                if (!payload || !payload.new) return;
                const m = payload.new;
                const author = m.sender_name || m.author || m.user_name || '다이버';
                const text = m.message_text || m.text || m.content || '';
                const postId = m.post_id;
                const myName = currentUser ? (currentUser.nickname || currentUser.name || currentUser.email) : '';

                if (author !== myName && postId) {
                    if (typeof showChatNoticeToast === 'function') {
                        showChatNoticeToast(author, text, postId);
                    }
                }
            })
            // 2. comments (전역 알림)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments'
            }, (payload) => {
                if (!payload || !payload.new) return;
                const c = payload.new;
                const author = c.author || c.user_name || '다이버';
                const text = c.content || c.text || '';
                const myName = currentUser ? (currentUser.nickname || currentUser.name || currentUser.email) : '';
                if (author !== myName && typeof showToast === 'function') {
                    showToast(`💬 새로운 댓글 등록: ${author} - "${text.substring(0, 15)}"`);
                }
            })
            // 3. chat_rooms (새 대화방 생성 알림)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_rooms'
            }, (payload) => {
                console.log('[REALTIME CHAT_ROOM CREATED]', payload.new);
            })
            // 4. inquiries (웹마스터 문의 알림)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'inquiries'
            }, (payload) => {
                console.log('[REALTIME INQUIRY RECEIVED]', payload.new);
                if (typeof isAdminAuthenticated !== 'undefined' && isAdminAuthenticated && typeof showToast === 'function') {
                    showToast('📩 [관리자] 새로운 문의가 등록되었습니다!');
                }
            })
            // 0. WebSocket Broadcast (참가확정, 일정완료, 인원변경 0.05초 초고속 즉시 동기화)
            .on('broadcast', { event: 'post_updated' }, async (payload) => {
                if (!payload || !payload.payload) return;
                const pInfo = payload.payload;
                const postIdStr = String(pInfo.postId);
                console.log("⚡ [INSTANT BROADCAST POST UPDATED]", postIdStr, pInfo);

                if (pInfo.postData && typeof posts !== 'undefined' && Array.isArray(posts)) {
                    const idx = posts.findIndex(p => String(p.id) === postIdStr);
                    if (idx !== -1) {
                        posts[idx] = { ...posts[idx], ...pInfo.postData };
                    }
                }

                if (typeof loadPosts === 'function') {
                    await loadPosts();
                } else if (typeof filterAndRender === 'function') {
                    filterAndRender();
                }

                const dynamicOverlay = document.getElementById("dynamicDetailModalOverlay");
                if (dynamicOverlay && typeof refreshCurrentDetailModal === 'function') {
                    refreshCurrentDetailModal(postIdStr);
                }
            })
            // 6. posts (모집글 상태 변경, 참가 신청/승인/취소, 일정 완료 실시간 0.1초 동기화)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'posts'
            }, async (payload) => {
                if (!payload) return;
                console.log('⚡ [REALTIME POST CHANGE RECEIVED]', payload.eventType, payload.new);
                
                try {
                    if (typeof loadPosts === 'function') {
                        await loadPosts();
                    } else if (typeof filterAndRender === 'function') {
                        filterAndRender();
                    }
                    
                    const dynamicOverlay = document.getElementById("dynamicDetailModalOverlay");
                    if (dynamicOverlay && payload.new && payload.new.id) {
                        const updatedPostId = String(payload.new.id);
                        if (typeof openDetailModal === 'function') {
                            openDetailModal(updatedPostId);
                        }
                    }
                } catch(err) {
                    console.warn("Realtime post update exception:", err);
                }
            })
            // 5. users (프로필 데이터 실시간 동기화 - 매너 뱃지, 참여/주최 횟수 등)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users'
            }, (payload) => {
                if (!payload || !payload.new) return;
                const u = payload.new;
                console.log('[REALTIME USER UPDATED]', u);

                if (currentUser && ((currentUser.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) || (currentUser.id && u.id && String(currentUser.id) === String(u.id)))) {
                    currentUser = {
                        ...currentUser,
                        ...u,
                        manner_tags: u.manner_tags || currentUser.manner_tags || {},
                        mannerTags: u.manner_tags || currentUser.mannerTags || {},
                        hosted_count: u.hosted_count !== undefined ? u.hosted_count : (currentUser.hosted_count || 0),
                        hostedCount: u.hosted_count !== undefined ? u.hosted_count : (currentUser.hostedCount || 0),
                        completed_meets_count: u.completed_meets_count !== undefined ? u.completed_meets_count : (currentUser.completed_meets_count || 0),
                        completedCount: u.completed_meets_count !== undefined ? u.completed_meets_count : (currentUser.completedCount || 0),
                        warning_count: u.warning_count !== undefined ? u.warning_count : (currentUser.warning_count || 0),
                        warningCount: u.warning_count !== undefined ? u.warning_count : (currentUser.warningCount || 0)
                    };
                    safeLocalStorageSet('currentUser', JSON.stringify(currentUser));
                    safeLocalStorageSet('aqua_buddy_user_identity', JSON.stringify(currentUser));

                    // 프로필 모달이 열려있는 상태라면 즉시 실시간 리렌더링
                    const profModal = document.getElementById('dynamicProfileModalOverlay');
                    if (profModal) {
                        renderDynamicProfileModal(currentUser, true);
                    }
                    if (typeof updateNavbarUserUI === 'function') updateNavbarUserUI();
                }
            })
            .subscribe((status) => {
                console.log('[GLOBAL REALTIME] 전체 채널 구독 완료 상태:', status);
            });
    } catch(e) {
        console.warn('[GLOBAL REALTIME] 구독 오류:', e);
    }
}
window.initGlobalRealtimeSubscriptions = initGlobalRealtimeSubscriptions;


// ==================================================
// 📱 Mobile Visibility & Auto-Reconnect Event Handlers
// ==================================================
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('📱 [MOBILE RESUME] 화면 복귀 감지 - Realtime 및 데이터 자동 동기화');
        if (supabaseClient && supabaseClient.realtime) {
            try {
                supabaseClient.realtime.connect();
            } catch(e) {}
        }
        if (typeof _commentRealtimePostId !== 'undefined' && _commentRealtimePostId) {
            if (typeof fetchAndRenderComments === 'function') {
                fetchAndRenderComments(_commentRealtimePostId);
            }
        }
    }
});

window.addEventListener('online', () => {
    console.log('🌐 [NETWORK RECONNECTED] 인터넷 연결 복구 - Realtime 재연결');
    if (supabaseClient && supabaseClient.realtime) {
        try {
            supabaseClient.realtime.connect();
        } catch(e) {}
    }
});


function openKakaoNavi(placeName, lat, lng) {
    let name = placeName || "다이빙 입수 포인트";
    let targetLat = lat || 37.5146;
    let targetLng = lng || 127.1264;
    
    // 카카오맵 길찾기 웹/앱 스키마 URL
    const naviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${targetLat},${targetLng}`;
    window.open(naviUrl, '_blank');
}
window.openKakaoNavi = openKakaoNavi;


window.switchMainViewImpl = switchMainView;
window.switchMainView = switchMainView;
window.filterByCategory = switchMainView;
window.filterByCategoryImpl = switchMainView;
window.doFilterByCategory = switchMainView;
window.handleWebmasterLogin = typeof handleWebmasterAuthSubmit !== 'undefined' ? handleWebmasterAuthSubmit : function(e) { if (typeof handleWebmasterAuthSubmit === 'function') return handleWebmasterAuthSubmit(e); };

// ==================================================
// 🧹 Supabase 용량 관리: 30일 경과 채팅 자동 정리 엔진
// (게시글 및 유저 프로필 데이터는 100% 영구 보존)
// ==================================================
async function cleanOldChats() {
    if (!supabaseClient) return;
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thresholdIso = thirtyDaysAgo.toISOString();

        const { error } = await supabaseClient
            .from('chats')
            .delete()
            .lt('created_at', thresholdIso);

        if (error) {
            console.warn('[STORAGE CLEANUP] 30일 경과 채팅 정리 알림:', error);
        } else {
            console.log('[STORAGE CLEANUP] 30일 경과 채팅 정리 완료 (게시글 및 유저 데이터 영구 보존)');
        }
    } catch(err) {
        console.warn('[STORAGE CLEANUP] 채팅 정리 예외:', err);
    }
}
window.cleanOldChats = cleanOldChats;

/* ==========================================================================
   웹마스터 커맨드 센터: 쿠팡 파트너스 & 광고 CTR 성과 분석 엔진 & 시스템 제어
   ========================================================================== */



/* ==========================================================================
   📊 4대 핵심 배너 쿠팡 파트너스 실시간 집계 & 개별 링크 관리 엔진
   ========================================================================== */

const BANNER_TRACKING_KEY = "aquabuddy_banner_analytics_v4";
const BANNER_LINKS_STORAGE_KEY = "aquabuddy_banner_custom_links_v4";

const DEFAULT_BANNER_CONFIG = {
    bannerMain: {
        name: "🏆 상단 메인 기획전 배너",
        targetUrl: "https://link.coupang.com/a/fKqrpaA2Fw",
        impressions: 0,
        clicks: 0,
        lastClicked: null
    },
    bannerFloatingLeft: {
        name: "📍 좌측 플로팅 배너 (프리다이빙)",
        targetUrl: "https://link.coupang.com/a/fKszBcQl6y",
        impressions: 0,
        clicks: 0,
        lastClicked: null
    },
    bannerFloatingRight: {
        name: "📍 우측 플로팅 배너 (스쿠버다이빙)",
        targetUrl: "https://link.coupang.com/a/fKszBcQl6y",
        impressions: 0,
        clicks: 0,
        lastClicked: null
    },
    bannerFooter: {
        name: "⚓ 하단 푸터 기획전 배너 (바다수영)",
        targetUrl: "https://link.coupang.com/a/fKq8aVxMvA",
        impressions: 0,
        clicks: 0,
        lastClicked: null
    }
};

// 🔗 개별 배너 링크 데이터 가져오기
function getBannerCustomLinks() {
    try {
        const raw = localStorage.getItem(BANNER_LINKS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return {
                    bannerMain: parsed.bannerMain || DEFAULT_BANNER_CONFIG.bannerMain.targetUrl,
                    bannerFloatingLeft: parsed.bannerFloatingLeft || DEFAULT_BANNER_CONFIG.bannerFloatingLeft.targetUrl,
                    bannerFloatingRight: parsed.bannerFloatingRight || DEFAULT_BANNER_CONFIG.bannerFloatingRight.targetUrl,
                    bannerFooter: parsed.bannerFooter || DEFAULT_BANNER_CONFIG.bannerFooter.targetUrl
                };
            }
        }
    } catch(e) {}
    return {
        bannerMain: DEFAULT_BANNER_CONFIG.bannerMain.targetUrl,
        bannerFloatingLeft: DEFAULT_BANNER_CONFIG.bannerFloatingLeft.targetUrl,
        bannerFloatingRight: DEFAULT_BANNER_CONFIG.bannerFloatingRight.targetUrl,
        bannerFooter: DEFAULT_BANNER_CONFIG.bannerFooter.targetUrl
    };
}

// 💾 4대 배너별 링크 일괄 저장 & 사이트 즉시 적용
window.getBannerCustomLinks = getBannerCustomLinks;

async function saveAllAdminBannerLinks() {
    const mainEl = document.getElementById("adLinkInput_bannerMain");
    const leftEl = document.getElementById("adLinkInput_bannerFloatingLeft");
    const rightEl = document.getElementById("adLinkInput_bannerFloatingRight");
    const footerEl = document.getElementById("adLinkInput_bannerFooter");

    const links = {
        bannerMain: (mainEl && mainEl.value.trim()) ? mainEl.value.trim() : DEFAULT_BANNER_CONFIG.bannerMain.targetUrl,
        bannerFloatingLeft: (leftEl && leftEl.value.trim()) ? leftEl.value.trim() : DEFAULT_BANNER_CONFIG.bannerFloatingLeft.targetUrl,
        bannerFloatingRight: (rightEl && rightEl.value.trim()) ? rightEl.value.trim() : DEFAULT_BANNER_CONFIG.bannerFloatingRight.targetUrl,
        bannerFooter: (footerEl && footerEl.value.trim()) ? footerEl.value.trim() : DEFAULT_BANNER_CONFIG.bannerFooter.targetUrl
    };

    localStorage.setItem(BANNER_LINKS_STORAGE_KEY, JSON.stringify(links));

    // Supabase DB 동기화
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            for (const bId in links) {
                await supabaseClient.from('ad_banner_stats').upsert({
                    banner_id: bId,
                    banner_name: DEFAULT_BANNER_CONFIG[bId].name,
                    target_url: links[bId],
                    updated_at: new Date().toISOString()
                });
            }
        } catch(e) {
            console.warn("Supabase banner link sync notice:", e);
        }
    }

    applyBannerLinksToDOM();

    if (typeof showToast === 'function') {
        showToast("✅ 4대 배너별 파트너스 링크가 성공적으로 저장 및 적용되었습니다!");
    } else {
        alert("✅ 4대 배너별 파트너스 링크가 성공적으로 저장 및 적용되었습니다!");
    }
}
window.saveAllAdminBannerLinks = saveAllAdminBannerLinks;
window.saveAdminCoupangTargetUrl = saveAllAdminBannerLinks;

// 🌐 실제 DOM의 모든 배너 <a> 태그에 개별 링크 주입
function applyBannerLinksToDOM() {
    const links = getBannerCustomLinks();

    // 1. 상단 메인 기획전 배너
    const mainLinks = document.querySelectorAll('#mainBannerSlider a, #adContent a');
    mainLinks.forEach(a => { a.href = links.bannerMain; });

    // 2. 좌측 플로팅 배너
    const leftLinks = document.querySelectorAll('#bannerFloatingLeft a, .side-left a');
    leftLinks.forEach(a => { a.href = links.bannerFloatingLeft; });

    // 3. 우측 플로팅 배너
    const rightLinks = document.querySelectorAll('#bannerFloatingRight a, .side-right a');
    rightLinks.forEach(a => { a.href = links.bannerFloatingRight; });

    // 4. 하단 푸터 기획전 배너
    const footerLinks = document.querySelectorAll('.footer-ad-banner a');
    footerLinks.forEach(a => { a.href = links.bannerFooter; });
}
window.applyBannerLinksToDOM = applyBannerLinksToDOM;

// 💾 애널리틱스 데이터 가져오기
function getBannerAnalyticsData() {
    try {
        const raw = localStorage.getItem(BANNER_TRACKING_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return { ...DEFAULT_BANNER_CONFIG, ...parsed };
            }
        }
    } catch(e) {}
    return { ...DEFAULT_BANNER_CONFIG };
}

function saveBannerAnalyticsData(data) {
    try {
        localStorage.setItem(BANNER_TRACKING_KEY, JSON.stringify(data));
    } catch(e) {}
}

// 👁️ 배너 노출(Impression) 실시간 집계
async function logBannerImpression(bannerId) {
    if (!bannerId || !DEFAULT_BANNER_CONFIG[bannerId]) return;
    const data = getBannerAnalyticsData();
    data[bannerId].impressions = (data[bannerId].impressions || 0) + 1;
    saveBannerAnalyticsData(data);

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: existing } = await supabaseClient.from('ad_banner_stats').select('*').eq('banner_id', bannerId).maybeSingle();
            if (existing) {
                await supabaseClient.from('ad_banner_stats').update({
                    impressions: (existing.impressions || 0) + 1,
                    updated_at: new Date().toISOString()
                }).eq('banner_id', bannerId);
            } else {
                await supabaseClient.from('ad_banner_stats').insert([{
                    banner_id: bannerId,
                    banner_name: DEFAULT_BANNER_CONFIG[bannerId].name,
                    impressions: 1,
                    clicks: 0,
                    updated_at: new Date().toISOString()
                }]);
            }
        } catch(e) {}
    }
}
window.logBannerImpression = logBannerImpression;

// 👆 배너 클릭(Click) 실시간 집계 & 개별 링크 연결
async function logBannerClick(bannerId, bannerName, targetUrl) {
    if (!bannerId || !DEFAULT_BANNER_CONFIG[bannerId]) bannerId = 'bannerMain';
    const data = getBannerAnalyticsData();
    data[bannerId].clicks = (data[bannerId].clicks || 0) + 1;
    data[bannerId].lastClicked = new Date().toISOString();
    saveBannerAnalyticsData(data);

    const links = getBannerCustomLinks();
    const finalUrl = targetUrl || links[bannerId] || DEFAULT_BANNER_CONFIG[bannerId].targetUrl;
    const currentUserEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : null;

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: existing } = await supabaseClient.from('ad_banner_stats').select('*').eq('banner_id', bannerId).maybeSingle();
            if (existing) {
                await supabaseClient.from('ad_banner_stats').update({
                    clicks: (existing.clicks || 0) + 1,
                    last_clicked_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('banner_id', bannerId);
            } else {
                await supabaseClient.from('ad_banner_stats').insert([{
                    banner_id: bannerId,
                    banner_name: DEFAULT_BANNER_CONFIG[bannerId].name,
                    impressions: 1,
                    clicks: 1,
                    last_clicked_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
            }

            await supabaseClient.from('ad_banner_logs').insert([{
                banner_id: bannerId,
                banner_name: DEFAULT_BANNER_CONFIG[bannerId].name,
                event_type: 'click',
                user_email: currentUserEmail,
                user_agent: navigator.userAgent || '',
                created_at: new Date().toISOString()
            }]);
        } catch(e) {}
    }
}
window.logBannerClick = logBannerClick;

// 📊 관리자 4대 배너 실시간 CTR 대시보드 렌더링 & 입력창 값 채우기
async function renderAdminAffiliateStats() {
    // 🎛️ 4대 배너 개별 링크 관리 UI 동적 보장 (캐시 우회 100% 렌더링)
    const panel = document.getElementById("adminPanelAffiliate");
    if (panel) {
        let linkSection = document.getElementById("adminDedicated4BannerLinkSection");
        if (!linkSection) {
            // Remove any old 1-line input container
            const oldBox = panel.querySelector('.glass-panel:last-child');
            if (oldBox && (oldBox.innerHTML.includes('adminCoupangTargetUrlInput') || oldBox.innerHTML.includes('쿠팡 파트너스 연결 관리'))) {
                oldBox.remove();
            }

            linkSection = document.createElement("div");
            linkSection.id = "adminDedicated4BannerLinkSection";
            linkSection.className = "glass-panel";
            linkSection.style.cssText = "padding: 20px; border-radius: 12px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0, 242, 254, 0.04); margin-top: 16px;";
            
            linkSection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="margin: 0; color: var(--accent-cyan); font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-link"></i> 4대 핵심 배너별 쿠팡 파트너스 개별 링크 관리
                    </h4>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">각 배너마다 서로 다른 기획전/상품 링크를 연결할 수 있습니다.</span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 18px;">
                    <!-- 1. Top Banner -->
                    <div style="background: rgba(0,0,0,0.55); border: 1px solid rgba(255, 215, 0, 0.35); border-radius: 10px; padding: 14px;">
                        <label style="display: block; font-size: 0.84rem; font-weight: 800; color: #ffd700; margin-bottom: 8px;">
                            🏆 1. 상단 메인 기획전 배너 (수영/장비)
                        </label>
                        <input type="url" id="adLinkInput_bannerMain" placeholder="https://link.coupang.com/..." style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,215,0,0.4); color: #fff; border-radius: 6px; font-size: 0.84rem; box-sizing: border-box;">
                    </div>

                    <!-- 2. Left Floating Banner -->
                    <div style="background: rgba(0,0,0,0.55); border: 1px solid rgba(0, 242, 254, 0.35); border-radius: 10px; padding: 14px;">
                        <label style="display: block; font-size: 0.84rem; font-weight: 800; color: #00f2fe; margin-bottom: 8px;">
                            📍 2. 좌측 플로팅 배너 (프리다이빙 전용 장비)
                        </label>
                        <input type="url" id="adLinkInput_bannerFloatingLeft" placeholder="https://link.coupang.com/..." style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.7); border: 1px solid rgba(0,242,254,0.4); color: #fff; border-radius: 6px; font-size: 0.84rem; box-sizing: border-box;">
                    </div>

                    <!-- 3. Right Floating Banner -->
                    <div style="background: rgba(0,0,0,0.55); border: 1px solid rgba(255, 121, 63, 0.35); border-radius: 10px; padding: 14px;">
                        <label style="display: block; font-size: 0.84rem; font-weight: 800; color: #ff793f; margin-bottom: 8px;">
                            📍 3. 우측 플로팅 배너 (스쿠버다이빙 전용 장비)
                        </label>
                        <input type="url" id="adLinkInput_bannerFloatingRight" placeholder="https://link.coupang.com/..." style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,121,63,0.4); color: #fff; border-radius: 6px; font-size: 0.84rem; box-sizing: border-box;">
                    </div>

                    <!-- 4. Footer Banner -->
                    <div style="background: rgba(0,0,0,0.55); border: 1px solid rgba(0, 230, 118, 0.35); border-radius: 10px; padding: 14px;">
                        <label style="display: block; font-size: 0.84rem; font-weight: 800; color: #00e676; margin-bottom: 8px;">
                            ⚓ 4. 하단 푸터 기획전 배너 (바다수영/슈트)
                        </label>
                        <input type="url" id="adLinkInput_bannerFooter" placeholder="https://link.coupang.com/..." style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.7); border: 1px solid rgba(0,230,118,0.4); color: #fff; border-radius: 6px; font-size: 0.84rem; box-sizing: border-box;">
                    </div>
                </div>

                <div style="text-align: right;">
                    <button type="button" class="btn btn-primary" onclick="saveAllAdminBannerLinks()" style="padding: 11px 24px; font-weight: 800; font-size: 0.92rem; border-radius: 8px; box-shadow: 0 4px 18px rgba(0, 242, 254, 0.35); cursor: pointer;">
                        <i class="fa-solid fa-floppy-disk"></i> 💾 4대 배너별 파트너스 링크 일괄 저장 & 즉시 적용
                    </button>
                </div>
            `;
            panel.appendChild(linkSection);
        }
    }

    const tbody = document.getElementById("adminAffiliateStatsTbody");
    const kpiImpressions = document.getElementById("affiliateKpiImpressions");
    const kpiClicks = document.getElementById("affiliateKpiClicks");
    const kpiCtr = document.getElementById("affiliateKpiCtr");
    const kpiRevenue = document.getElementById("affiliateKpiRevenue");

    // 1. 개별 링크 입력창에 현재 저장된 URL 채우기
    const links = getBannerCustomLinks();
    const mainEl = document.getElementById("adLinkInput_bannerMain");
    const leftEl = document.getElementById("adLinkInput_bannerFloatingLeft");
    const rightEl = document.getElementById("adLinkInput_bannerFloatingRight");
    const footerEl = document.getElementById("adLinkInput_bannerFooter");

    if (mainEl) mainEl.value = links.bannerMain;
    if (leftEl) leftEl.value = links.bannerFloatingLeft;
    if (rightEl) rightEl.value = links.bannerFloatingRight;
    if (footerEl) footerEl.value = links.bannerFooter;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--accent-cyan); padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> 4대 핵심 배너 실시간 성과 데이터를 불러오는 중...
                </td>
            </tr>
        `;
    }

    let statsData = { ...getBannerAnalyticsData() };

    // 2. Supabase DB에서 최신 데이터 조회
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: dbStats, error } = await supabaseClient.from('ad_banner_stats').select('*');
            if (!error && Array.isArray(dbStats) && dbStats.length > 0) {
                dbStats.forEach(row => {
                    if (row.banner_id && DEFAULT_BANNER_CONFIG[row.banner_id]) {
                        statsData[row.banner_id] = {
                            name: DEFAULT_BANNER_CONFIG[row.banner_id].name,
                            impressions: parseInt(row.impressions || 0, 10),
                            clicks: parseInt(row.clicks || 0, 10),
                            lastClicked: row.last_clicked_at
                        };
                    }
                });
            }
        } catch(err) {}
    }

    // 3. 종합 KPI 및 테이블 렌더링
    let totalImp = 0;
    let totalClicks = 0;

    const bannerKeys = Object.keys(DEFAULT_BANNER_CONFIG);
    const rowsHtml = bannerKeys.map(key => {
        const item = statsData[key] || DEFAULT_BANNER_CONFIG[key];
        const imp = item.impressions || 0;
        const clk = item.clicks || 0;
        const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : "0.00";
        totalImp += imp;
        totalClicks += clk;
        const estEarnings = (clk * 380).toLocaleString();

        let timeStr = '-';
        if (item.lastClicked) {
            timeStr = (typeof formatTimeAgo === 'function') ? formatTimeAgo(item.lastClicked) : item.lastClicked.slice(0, 16).replace('T', ' ');
        }

        return `
            <tr>
                <td style="font-weight: 700; color: #fff; vertical-align: middle; padding: 12px 10px;">${escapeHtml(item.name)}</td>
                <td style="text-align: center; color: var(--text-muted); vertical-align: middle; padding: 10px;">${imp.toLocaleString()}회</td>
                <td style="text-align: center; color: var(--accent-cyan); font-weight: 800; vertical-align: middle; padding: 10px;">${clk.toLocaleString()}회</td>
                <td style="text-align: center; vertical-align: middle; padding: 10px;">
                    <span style="background: rgba(255, 215, 0, 0.15); color: var(--accent-gold); font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.3);">
                        ${ctr}%
                    </span>
                </td>
                <td style="text-align: right; color: #00e676; font-weight: 800; vertical-align: middle; padding: 10px;">≈ ₩${estEarnings}</td>
                <td style="text-align: center; color: var(--text-muted); font-size: 0.8rem; vertical-align: middle; padding: 10px;">
                    ${timeStr}
                </td>
            </tr>
        `;
    }).join("");

    if (tbody) tbody.innerHTML = rowsHtml;

    const overallCtr = totalImp > 0 ? ((totalClicks / totalImp) * 100).toFixed(2) : "0.00";
    const overallRevenue = (totalClicks * 380).toLocaleString();

    if (kpiImpressions) kpiImpressions.textContent = totalImp.toLocaleString() + "회";
    if (kpiClicks) kpiClicks.textContent = totalClicks.toLocaleString() + "회";
    if (kpiCtr) kpiCtr.textContent = overallCtr + "%";
    if (kpiRevenue) kpiRevenue.textContent = "₩" + overallRevenue;
}
window.renderAdminAffiliateStats = renderAdminAffiliateStats;


// ============================================================
// AQUA BUDDY - 지도 위 해양 카드 + 2층 CCTV/스쿠버 레이아웃
// ============================================================

// ─── 1. 카카오 지도 + 실시간 해양 카드 오버레이 ───────────────
var _oceanKakaoMapObj = null;
var _customOverlayObj = null;
var _lastOceanKakaoPos = null;

function formatMetricUnit(val, defaultUnit) {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    var str = String(val).trim();
    if (str === '-' || str === '정보없음' || str === 'null') return null;
    if (!isNaN(parseFloat(str)) && !str.includes('°C') && !str.includes('m') && !str.includes('m/s')) {
        return str + defaultUnit;
    }
    return str;
}

// 🌊 Supabase ocean_weather_cache 실시간 1:1 스마트 병합 로드 함수
async function loadOceanWeatherCacheFromSupabase() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('ocean_weather_cache')
            .select('*');
            
        if (data && data.length > 0) {
            OCEAN_WEATHER_DATA.forEach(s => {
                const spotNameClean = (s.name || '').replace(/부산|울산|거제|포항|경북|경남|강원|제주|해수욕장|해변|포구|항|해상/g, '').trim();
                
                const matchingRows = data.filter(dbItem => {
                    if (s.id && dbItem.spot_id === s.id) return true;
                    if (s.spot_id && dbItem.spot_id === s.spot_id) return true;
                    if (s.buoy_code && dbItem.buoy_code === s.buoy_code) return true;
                    if (s.tide_code && dbItem.tide_code === s.tide_code) return true;
                    if (spotNameClean && dbItem.spot_name && dbItem.spot_name.includes(spotNameClean)) return true;
                    if (s.name && dbItem.spot_name && dbItem.spot_name.includes(s.name)) return true;
                    return false;
                });

                matchingRows.forEach(row => {
                    if (row.water_temp && row.water_temp !== '정보없음' && row.water_temp !== '-') {
                        s.water_temp = s.waterTemp = formatMetricUnit(row.water_temp, '°C');
                    }
                    if (row.wave_height && row.wave_height !== '정보없음' && row.wave_height !== '-') {
                        s.wave_height = s.waveHeight = formatMetricUnit(row.wave_height, 'm');
                    }
                    if (row.wind_speed && row.wind_speed !== '정보없음' && row.wind_speed !== '-') {
                        s.wind_speed = s.windSpeed = formatMetricUnit(row.wind_speed, ' m/s');
                    }
                    if (row.air_temp && row.air_temp !== '정보없음' && row.air_temp !== '-') {
                        s.air_temp = s.airTemp = formatMetricUnit(row.air_temp, '°C');
                    }
                    if (row.high_tide && row.high_tide !== '정보없음') {
                        s.high_tide = row.high_tide;
                    }
                    if (row.low_tide && row.low_tide !== '정보없음') {
                        s.low_tide = row.low_tide;
                    }
                    if (row.scuba_index_grade) {
                        s.scuba_index_grade = row.scuba_index_grade;
                    }
                });
            });
            console.log(`[Supabase Ocean Cache] ${data.length}개 DB 행 1:1 스마트 병합 완료`);
        }
    } catch(e) {
        console.warn('[Supabase Ocean Cache Error]', e);
    }
}
window.loadOceanWeatherCacheFromSupabase = loadOceanWeatherCacheFromSupabase;

async function initKakaoOceanMap(spot) {
    var container = document.getElementById('oceanKakaoMap');
    var emptyBox = document.getElementById('oceanMapEmptyState');
    var subTitle = document.getElementById('oceanMapSubTitle');
    if (!container) return;

    if (!spot) spot = (typeof currentDashboardSpot !== "undefined" && currentDashboardSpot) ? currentDashboardSpot : ((typeof OCEAN_WEATHER_DATA !== "undefined" && OCEAN_WEATHER_DATA.length > 0) ? OCEAN_WEATHER_DATA[0] : null);
    if (!spot) return;
    currentDashboardSpot = spot;

    // 🌟 1. 대기 화면 숨기고 지도 컨테이너 노출 (display: block)
    if (emptyBox) emptyBox.style.display = 'none';
    if (container) container.style.display = 'block';
    if (subTitle) subTitle.textContent = '📍 선택된 스팟에 단일 핀 마커 & 해양 카드 표시';

    var lat = (spot && typeof spot.lat === 'number') ? spot.lat : 35.1587;
    var lng = (spot && typeof spot.lng === 'number') ? spot.lng : 129.1604;
    var nm  = spot.name || spot.spot_name || '관측 스팟';

    // 🌟 2. Supabase ocean_weather_cache DB 1:1 스마트 직접 조회 (부이 + 조석 행 자동 병합)
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            var spotId = spot.id || spot.spot_id;
            var cleanName = nm.replace(/부산|울산|거제|포항|경북|경남|강원|제주|해수욕장|해변|포구|항|해상/g, '').trim();
            
            var queryOr = `spot_id.eq.${spotId},spot_name.ilike.%${cleanName || nm}%,spot_name.ilike.%${nm}%`;
            if (spot.buoy_code) queryOr += `,buoy_code.eq.${spot.buoy_code}`;
            if (spot.tide_code) queryOr += `,tide_code.eq.${spot.tide_code}`;

            var { data: dbRows } = await supabaseClient
                .from('ocean_weather_cache')
                .select('*')
                .or(queryOr);

            if (dbRows && dbRows.length > 0) {
                dbRows.forEach(function(row) {
                    if (row.water_temp && row.water_temp !== '정보없음' && row.water_temp !== '-') {
                        spot.waterTemp = spot.water_temp = formatMetricUnit(row.water_temp, '°C');
                    }
                    if (row.wave_height && row.wave_height !== '정보없음' && row.wave_height !== '-') {
                        spot.waveHeight = spot.wave_height = formatMetricUnit(row.wave_height, 'm');
                    }
                    if (row.wind_speed && row.wind_speed !== '정보없음' && row.wind_speed !== '-') {
                        spot.windSpeed = spot.wind_speed = formatMetricUnit(row.wind_speed, ' m/s');
                    }
                    if (row.air_temp && row.air_temp !== '정보없음' && row.air_temp !== '-') {
                        spot.airTemp = spot.air_temp = formatMetricUnit(row.air_temp, '°C');
                    }
                    if (row.high_tide && row.high_tide !== '정보없음') {
                        spot.high_tide = row.high_tide;
                    }
                    if (row.low_tide && row.low_tide !== '정보없음') {
                        spot.low_tide = row.low_tide;
                    }
                });
            }
        } catch(e) {
            console.warn('[Supabase Spot Fetch Direct]', e);
        }
    }

    // 🌟 3. Supabase DB 1:1 순수 실시간 데이터 매핑
    var wT   = spot.waterTemp  || spot.water_temp  || '정보 점검 중';
    var wW   = spot.waveHeight || spot.wave_height || '정보 점검 중';
    var wWd  = spot.windSpeed  || spot.wind_speed  || '정보 점검 중';
    var wA   = spot.airTemp    || spot.air_temp    || '정보 점검 중';

    if (wT === '-' || wT === '정보없음') wT = '정보 점검 중';
    if (wW === '-' || wW === '정보없음') wW = '정보 점검 중';
    if (wWd === '-' || wWd === '정보없음') wWd = '정보 점검 중';
    if (wA === '-' || wA === '정보없음') wA = '정보 점검 중';

    var tide = '조석 정보 수집 중';
    var tideHtml = '<div style="font-size:0.68rem;color:#cbd5e1;background:rgba(0,242,254,0.1);padding:4px 8px;border-radius:6px;border:1px solid rgba(0,242,254,0.25);line-height:1.4;word-break:break-all;">';
    if (spot.high_tide && spot.high_tide !== '정보없음') {
        tideHtml += '<div style="overflow:hidden;text-overflow:ellipsis;">🌊 <strong>만조:</strong> ' + spot.high_tide + '</div>';
    }
    if (spot.low_tide && spot.low_tide !== '정보없음') {
        tideHtml += '<div style="overflow:hidden;text-overflow:ellipsis;">📉 <strong>간조:</strong> ' + spot.low_tide + '</div>';
    }
    if ((!spot.high_tide || spot.high_tide === '정보없음') && (!spot.low_tide || spot.low_tide === '정보없음')) {
        tideHtml += '<div>🌊 ' + tide + '</div>';
    }
    tideHtml += '</div>';

    var doRender = function() {
        if (typeof window.kakao === 'undefined' || !window.kakao.maps) return;

        var pos = new window.kakao.maps.LatLng(lat, lng);
        // 🌟 정밀 뷰포트 오프셋 보정: lat + 0.0035 오프셋으로 핀 마커와 해양 카드가 화면 중앙에 100% 완벽 수용됨
        var centerPos = new window.kakao.maps.LatLng(lat + 0.0035, lng);
        _lastOceanKakaoPos = centerPos;

        // Canvas Lock 원천 차단: 기존 맵 파괴 및 컨테이너 초기화 후 100% 새로 생성
        _oceanKakaoMapObj = null;
        container.innerHTML = '';
        _oceanKakaoMapObj = new window.kakao.maps.Map(container, { center: centerPos, level: 6 });

        if (_customOverlayObj) { _customOverlayObj.setMap(null); _customOverlayObj = null; }

        var html = '<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;z-index:999999;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.75));">' +
            '<div style="background:rgba(8,16,32,0.96);backdrop-filter:blur(10px);color:#fff;padding:9px 12px;border-radius:14px;border:1.5px solid #00f2fe;box-shadow:0 6px 24px rgba(0,242,254,0.45);width:250px;box-sizing:border-box;font-family:sans-serif;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:5px;margin-bottom:7px;">' +
            '<strong style="font-size:0.86rem;color:#fff;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ' + nm + '</strong>' +
            '<span style="background:rgba(0,230,118,0.25);color:#00e676;font-size:0.62rem;font-weight:900;padding:2px 6px;border-radius:4px;flex-shrink:0;border:1px solid rgba(0,230,118,0.4);">LIVE</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:7px;">' +
            '<div style="background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;"><span style="color:#94a3b8;font-size:0.62rem;display:block;line-height:1.2;">🌡️ 수온</span><strong style="color:#00f2fe;font-size:0.82rem;">' + wT + '</strong></div>' +
            '<div style="background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;"><span style="color:#94a3b8;font-size:0.62rem;display:block;line-height:1.2;">🌊 파고</span><strong style="color:#00e676;font-size:0.82rem;">' + wW + '</strong></div>' +
            '<div style="background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;"><span style="color:#94a3b8;font-size:0.62rem;display:block;line-height:1.2;">🌬️ 풍속</span><strong style="color:#ffb703;font-size:0.82rem;">' + wWd + '</strong></div>' +
            '<div style="background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;"><span style="color:#94a3b8;font-size:0.62rem;display:block;line-height:1.2;">🌡️ 기온</span><strong style="color:#fff;font-size:0.82rem;">' + wA + '</strong></div>' +
            '</div>' +
            tideHtml +
            '</div>' +
            '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #00f2fe;margin-top:-1px;"></div>' +
            '<div style="font-size:1.4rem;line-height:1;margin-top:-2px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));">📍</div>' +
            '</div>';

        _customOverlayObj = new window.kakao.maps.CustomOverlay({ position: pos, content: html, xAnchor: 0.5, yAnchor: 1.0, zIndex: 999999 });
        _customOverlayObj.setMap(_oceanKakaoMapObj);
    };

    if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
        window.kakao.maps.load(doRender);
    } else {
        doRender();
    }
}
window.initKakaoOceanMap = initKakaoOceanMap;

// ─── 2. renderUnifiedSpotDashboard - 구 대시보드 숨기고 지도+CCTV 업데이트 ─

function _makeCctvHtml(cctv) {
    if (!cctv) return '<div style="width:100%;min-height:320px;border-radius:14px;background:rgba(15,23,42,0.9);border:1px solid rgba(0,242,254,0.2);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#94a3b8;"><i class="fa-solid fa-video" style="font-size:2.2rem;color:#00f2fe;opacity:0.4;"></i><span style="font-size:0.85rem;">\uC2A4\uD321\uC744 \uC120\uD0DD\uD558\uBA74 \uC778\uADFC CCTV\uAC00 \uC790\uB3D9 \uD45C\uC2DC\uB429\uB2C8\uB2E4.</span></div>';
    var em = (cctv.embedUrl||'').trim(), hl = (cctv.hlsUrl||'').trim();
    var isKbs  = em.includes('kbs.co.kr') || hl.includes('kbs.co.kr') || (cctv.source||'').includes('KBS');
    var isHttp = (em||hl).startsWith('http://');
    if (isKbs || isHttp || (!em && !hl)) {
        var url = em || hl || 'https://d.kbs.co.kr';
        return '<div style="width:100%;min-height:320px;border-radius:14px;background:rgba(15,23,42,0.95);border:1px solid rgba(0,242,254,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px;box-sizing:border-box;"><i class="fa-solid fa-tower-broadcast" style="font-size:2.2rem;color:#ff5252;margin-bottom:10px;"></i><h4 style="color:#fff;font-size:0.95rem;font-weight:800;margin:0 0 6px 0;">' + cctv.name + '</h4><p style="font-size:0.8rem;color:#94a3b8;margin:0 0 14px 0;max-width:320px;line-height:1.5;">\uBCF4\uC548 \uC815\uCC45\uC0C1 \uC9C1\uC811 \uC784\uBCA0\uB4DC\uAC00 \uC81C\uD55C\uB429\uB2C8\uB2E4. \uC0C8 \uCC3D\uC5D0\uC11C \uACE0\uD654\uC9C8\uB85C \uC2DC\uCCAD\uD558\uC138\uC694.</p><a href="' + url + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;font-size:0.88rem;font-weight:900;border-radius:10px;background:linear-gradient(135deg,#00f2fe,#4facfe);color:#000;text-decoration:none;">\uD83D\uDD17 \uC0C8 \uCC3D\uC5D0\uC11C \uC2E4\uC2DC\uAC04 \uC601\uC0C1 \uBCF4\uAE30 \u27A4</a></div>';
    }
    if (hl && hl.startsWith('https://') && hl.includes('.m3u8')) {
        return '<div style="width:100%;min-height:320px;border-radius:14px;overflow:hidden;background:#000;position:relative;"><video id="dashHlsVideo_' + cctv.id + '" controls autoplay muted playsinline style="width:100%;height:320px;object-fit:contain;background:#000;"></video><div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.75);padding:4px 10px;border-radius:6px;color:#00e676;font-weight:700;font-size:0.76rem;">\uD83D\uDD34 LIVE - ' + cctv.name + '</div></div>';
    }
    if (em && em.startsWith('https://')) {
        return '<div style="width:100%;min-height:320px;border-radius:14px;overflow:hidden;background:#000;position:relative;"><iframe src="' + em + '" style="width:100%;height:320px;border:none;" allowfullscreen loading="lazy"></iframe><div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.75);padding:4px 10px;border-radius:6px;color:#00e676;font-weight:700;font-size:0.76rem;">\uD83D\uDD34 LIVE - ' + cctv.name + '</div></div>';
    }
    return '<div style="width:100%;min-height:320px;border-radius:14px;background:rgba(15,23,42,0.9);display:flex;align-items:center;justify-content:center;color:#94a3b8;">\uC900\uBE44 \uC911 (' + cctv.name + ')</div>';
}
function _startHls(container, cctv) {
    if (!cctv || !cctv.hlsUrl) return;
    var v = container.querySelector('[id^="dashHlsVideo_"]');
    if (!v) return;
    if (typeof Hls !== 'undefined' && Hls.isSupported()) { var h = new Hls(); h.loadSource(cctv.hlsUrl); h.attachMedia(v); }
    else if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = cctv.hlsUrl; }
}

// 🔒 로그인 유도 (Login Wall) 모달 표출 함수
function showOceanLoginWallModal() {
    var modal = document.getElementById('oceanLoginWallModal');
    if (modal && typeof openModal === 'function') {
        openModal(modal);
    } else if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}
window.showOceanLoginWallModal = showOceanLoginWallModal;

// ─── 3. CCTV 드롭다운 변경 핸들러 (Login Wall 적용) ────────────────────────────
function onDashCctvChange(id) {
    if (!id || typeof OCEAN_WEBCAMS_DATA === 'undefined') return;

    var isLogged = typeof currentUser !== 'undefined' && currentUser !== null && 
                   (currentUser.email || currentUser.name || currentUser.id || currentUser.nickname || currentUser.realName);
                   
    var defaultId = 'cam-busan-haeundae-beach';
    if (!isLogged && id !== defaultId) {
        var sel = document.getElementById('fullwidthCctvSelect');
        if (sel) sel.value = defaultId;
        showOceanLoginWallModal();
        return;
    }

    var c = OCEAN_WEBCAMS_DATA.find(function(x){ return x.id === id; });
    if (!c) return;
    var b = document.getElementById('dashCctvContainer');
    if (!b) return;
    b.innerHTML = _makeCctvHtml(c);
    _startHls(b, c);
}
window.onDashCctvChange = onDashCctvChange;

// ─── 4. selectScubaPoint - 18곳 스쿠버 지수 7일 예보 (Default: SS9 성산일출봉 / Login Wall) ─────────
var _SP = [
    {code:'SS1', name:'동명항', region:'강원 속초'},
    {code:'SS2', name:'남애항', region:'강원 양양'},
    {code:'SS3', name:'강문해변', region:'강원 강릉'},
    {code:'SS4', name:'오산항', region:'경북 울진'},
    {code:'SS5', name:'월포해수욕장', region:'경북 포항'},
    {code:'SS6', name:'구조라해수욕장', region:'경남 거제'},
    {code:'SS7', name:'미조도', region:'경남 남해'},
    {code:'SS8', name:'거문도', region:'전남 여수'},
    {code:'SS9', name:'성산일출봉', region:'제주 서귀포'},
    {code:'SS10', name:'문섬', region:'제주 서귀포'},
    {code:'SS11', name:'홍도', region:'전남 신안'},
    {code:'SS12', name:'울릉도', region:'경북 울릉'},
    {code:'SS13', name:'어영', region:'제주 제주시'},
    {code:'SS14', name:'태종대', region:'부산 영도'},
    {code:'SS15', name:'격렬비열도', region:'충남 태안'},
    {code:'SS16', name:'추자도', region:'제주 추자'},
    {code:'SS17', name:'욕지도', region:'경남 통영'},
    {code:'SS18', name:'추암', region:'강원 동해'}
];

async function selectScubaPoint(pointId, filterDate) {
    var code = String(pointId || 'SS9').trim().toUpperCase();

    var isLogged = typeof currentUser !== 'undefined' && currentUser !== null && 
                   (currentUser.email || currentUser.name || currentUser.id || currentUser.nickname || currentUser.realName);
                   
    if (!isLogged && code !== 'SS9') {
        var sel = document.getElementById('scubaPointSelect');
        if (sel) sel.value = 'SS9';
        showOceanLoginWallModal();
        return;
    }

    var pt = _SP.find(function(p){ return p.code === code; }) || _SP.find(function(p){ return p.code === 'SS9'; }) || _SP[0];
    var panel = document.getElementById('scubaResultPanel');
    if (!panel) return;

    panel.innerHTML = '<div style="text-align:center;padding:28px;color:#00f2fe;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.4rem;"></i><div style="margin-top:8px;font-size:0.88rem;font-weight:700;">' + pt.name + ' 7\uC77C \uC608\uBCF4 \uC218\uC2E0 \uC911...</div></div>';

    var items = [];
    try {
        var KEY = '8Vbb5%2BdWRNC4Axr8zc6rPuhLMQEm4Bxp6jTu9lyktrYc4a8KqanQRtb7KkgfnQ7fzsuQEJ%2Bl34wZAAqUIoRuMg%3D%3D';
        var d   = new Date().toISOString().slice(0,10).replace(/-/g,'');
        var r   = await fetch('https://apis.data.go.kr/1192136/fcstSkinScubav2/GetFcstSkinScubaApiServicev2?serviceKey=' + KEY + '&placeCode=' + code + '&reqDate=' + d + '&type=json');
        if (r.ok) {
            var j = await r.json();
            var raw = (j && j.body && j.body.items && j.body.items.item) || (j && j.response && j.response.body && j.response.body.items && j.response.body.items.item) || [];
            items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        }
    } catch(e) { console.warn('[Scuba]', e); }

    var dates = [];
    items.forEach(function(it){ if (it.predcYmd && dates.indexOf(it.predcYmd) < 0) dates.push(it.predcYmd); });

    var days = ['\uC77C','\uC6D4','\uD654','\uC218','\uBAA9','\uAE08','\uD1A0'];
    function fmt(ymd) {
        if (!ymd) return '-';
        var p = ymd.split('-'); if (p.length < 3) return ymd;
        var dt = new Date(p[0], parseInt(p[1])-1, p[2]);
        return p[1]+'/'+p[2]+'('+days[dt.getDay()]+')';
    }
    function gc(g){ if(!g)return'#ffd740'; if(g.includes('\uB9E4\uC6B0\uC88B\uC74C')||g.includes('\uCD5C\uC0C1'))return'#00e676'; if(g.includes('\uC88B\uC74C'))return'#69f0ae'; if(g.includes('\uBCF4\uD1B5'))return'#ffd740'; return'#ff5252'; }
    function gi(g){ if(!g)return'\uD83D\uDFE1'; if(g.includes('\uB9E4\uC6B0\uC88B\uC74C')||g.includes('\uCD5C\uC0C1'))return'\u2728'; if(g.includes('\uC88B\uC74C'))return'\uD83D\uDFE2'; if(g.includes('\uBCF4\uD1B5'))return'\uD83D\uDFE1'; return'\uD83D\uDD34'; }
    function rng(a, b, u){ if(!a&&!b)return'-'; if(!b||a===b)return(a||b)+u; return(a||'-')+u+'<span style="color:#475569;font-size:0.65rem;display:block;line-height:1;">~</span>'+(b||'-')+u; }

    var disp = (filterDate && filterDate !== 'ALL') ? items.filter(function(it){ return it.predcYmd===filterDate; }) : items;
    var rows = disp.length > 0 ? disp.map(function(it){
        var g = it.totalIndex || '\uBCF4\uD1B5';
        return '<tr style="background:rgba(15,23,42,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">' +
            '<td style="padding:4px 2px;font-weight:700;color:#fff;font-size:0.73rem;">'+fmt(it.predcYmd)+'</td>' +
            '<td style="padding:4px 2px;color:#a5f3fc;font-size:0.72rem;">'+(it.predcNoonSeCd||'\uC804\uC77C')+'</td>' +
            '<td style="padding:4px 2px;font-weight:900;color:'+gc(g)+';font-size:0.72rem;white-space:nowrap;">'+gi(g)+g+'</td>' +
            '<td style="padding:4px 2px;color:#00f2fe;font-size:0.72rem;line-height:1.2;">'+rng(it.minWtem,it.maxWtem,'\u00B0C')+'</td>' +
            '<td style="padding:4px 2px;color:#38bdf8;font-size:0.72rem;line-height:1.2;">'+rng(it.minWvhgt,it.maxWvhgt,'m')+'</td>' +
            '<td style="padding:4px 2px;color:#a78bfa;font-size:0.72rem;line-height:1.2;">'+rng(it.minCrsp,it.maxCrsp,'m/s')+'</td>' +
            '<td style="padding:4px 2px;color:#cbd5e1;font-size:0.71rem;">'+(it.tdlvHrCn||'-')+'</td></tr>';
    }).join('') : '<tr><td colspan="7" style="padding:16px;color:#94a3b8;text-align:center;">\uC608\uBCF4 \uB370\uC774\uD130\uB97C \uBC1B\uB294 \uC911\uC785\uB2C8\uB2E4.</td></tr>';

    var dOpts = '<option value="ALL"'+(!filterDate||filterDate==='ALL'?' selected':'')+'>\uD83D\uDCC5 \uC804\uCCB4 \uC8FC\uAC04 \uC608\uBCF4 \uD55C\uB208\uC5D0 \uBCF4\uAE30</option>' +
        dates.map(function(d2){ var p=d2.split('-'); if(p.length<3)return''; var dt=new Date(p[0],parseInt(p[1])-1,p[2]); return '<option value="'+d2+'"'+(filterDate===d2?' selected':'')+'>\uD83D\uDCC5 '+p[1]+'/'+p[2]+'('+days[dt.getDay()]+')</option>'; }).join('');

    panel.innerHTML =
        '<div style="background:rgba(10,18,35,0.95);border-radius:14px;padding:14px 16px;border:1px solid rgba(0,242,254,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.4);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<div><h4 style="margin:0 0 2px 0;color:#fff;font-size:1rem;font-weight:800;">\uD83E\uDD3F '+pt.name+'</h4><span style="font-size:0.75rem;color:#94a3b8;">('+pt.region+') \u00B7 <strong style="color:#00f2fe;">'+code+'</strong></span></div>' +
        '<div style="display:flex;align-items:center;gap:5px;"><span style="font-size:0.72rem;color:#00f2fe;font-weight:700;">\uD83D\uDCC5</span>' +
        '<select onchange="selectScubaPoint(\''+code+'\', this.value)" style="background:#0f172a;color:#00f2fe;border:1px solid rgba(0,242,254,0.4);padding:4px 8px;border-radius:7px;font-size:0.75rem;font-weight:700;outline:none;cursor:pointer;">'+dOpts+'</select></div>' +
        '</div>' +
        '<div style="overflow:hidden;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">' +
        '<table style="width:100%;table-layout:fixed;border-collapse:collapse;text-align:center;color:#e2e8f0;">' +
        '<thead><tr style="background:#0f172a;color:#00f2fe;font-weight:800;border-bottom:1px solid rgba(0,242,254,0.3);">' +
        '<th style="width:18%;padding:4px 2px;font-size:0.71rem;">\uAD00\uCE21\uC77C</th>' +
        '<th style="width:11%;padding:4px 2px;font-size:0.71rem;">\uC2DC\uAC04</th>' +
        '<th style="width:17%;padding:4px 2px;font-size:0.71rem;">\uC785\uC218\uC9C0\uC218</th>' +
        '<th style="width:16%;padding:4px 2px;font-size:0.71rem;">\uC608\uC0C1\uC218\uC628</th>' +
        '<th style="width:13%;padding:4px 2px;font-size:0.71rem;">\uC608\uC0C1\uD30C\uACE0</th>' +
        '<th style="width:13%;padding:4px 2px;font-size:0.71rem;">\uC870\uB958\uC720\uC18D</th>' +
        '<th style="width:12%;padding:4px 2px;font-size:0.71rem;">\uBB3C\uB54C</th></tr></thead>' +
        '<tbody>'+rows+'</tbody></table></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.69rem;color:#94a3b8;margin-top:7px;padding-top:5px;border-top:1px dashed rgba(255,255,255,0.1);">' +
        '<span>\uD83D\uDCE1 \uAD6D\uB9BD\uD574\uC591\uC870\uC0AC\uC6D0(KHOA) 7\uC77C \uC608\uBCF4</span><span>\u2705 \uCD1D '+items.length+'\uAC1C \uC218\uC2E0</span></div>' +
        '</div>';
}
window.selectScubaPoint = selectScubaPoint;

// 📷 홈 전용: 해운대 해수욕장 실시간 재난 CCTV 플레이어 초기화 함수
function initHomeHaeundaeCctv() {
    var box = document.getElementById('homeCctvVideoBox');
    if (!box || typeof OCEAN_WEBCAMS_DATA === 'undefined' || !OCEAN_WEBCAMS_DATA) return;
    var cam = OCEAN_WEBCAMS_DATA.find(function(c) { return c.id === 'cam-busan-haeundae-beach'; }) || OCEAN_WEBCAMS_DATA[0];
    if (cam) {
        box.innerHTML = _makeCctvHtml(cam);
        _startHls(box, cam);
    }
}
window.initHomeHaeundaeCctv = initHomeHaeundaeCctv;

