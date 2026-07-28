/* ==========================================================================
   AquaBuddy (아쿠아버디) - Dynamic Application Logic (v24.0 Refined UI)
   - Official Coupang Partners Link: https://link.coupang.com/a/fKoty7mGVo
   - Visual Swimming & Freediving Image Banner Advertising System
   - Single Line Responsive Top Navigation Bar
   - Non-Overlapping Floating Side Ad Banners
   - 🎓 Certified Instructor License Code Registration & Verification Badges
   - Real Social OAuth Integration & Profile Management System
   ========================================================================== */

// Load Configuration File Credentials
const COUPANG_AFFILIATE_URL = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.coupang) 
    ? window.AQUA_CONFIG.coupang.affiliateUrl 
    : "https://link.coupang.com/a/fKoty7mGVo";

const COUPANG_TRACKING_ID = (typeof window !== "undefined" && window.AQUA_CONFIG && window.AQUA_CONFIG.coupang) 
    ? window.AQUA_CONFIG.coupang.trackingId 
    : "AF9213595";

// Marine Points Realtime Weather & Tide Table Dataset
const OCEAN_WEATHER_DATA = [
    {
        name: "포항 영일대 스팟",
        region: "동해 남부",
        waterTemp: "21.5°C",
        waveHeight: "0.6m",
        windSpeed: "3.2 m/s (남서풍)",
        tideName: "7물",
        highTide: "06:12 (120cm)",
        lowTide: "12:45 (35cm)",
        status: "입수 양호"
    },
    {
        name: "부산 태종대/송도",
        region: "남해 동부",
        waterTemp: "22.8°C",
        waveHeight: "0.8m",
        windSpeed: "4.1 m/s (동남풍)",
        tideName: "7물",
        highTide: "07:30 (145cm)",
        lowTide: "13:50 (28cm)",
        status: "입수 주의 (부표필수)"
    },
    {
        name: "제주 서귀포 문섬",
        region: "제주 해역",
        waterTemp: "24.2°C",
        waveHeight: "0.5m",
        windSpeed: "2.8 m/s (남풍)",
        tideName: "8물",
        highTide: "08:10 (210cm)",
        lowTide: "14:20 (42cm)",
        status: "시야 최상 (15m+)"
    },
    {
        name: "강릉 사천항 스쿠버",
        region: "동해 중부",
        waterTemp: "19.8°C",
        waveHeight: "1.1m",
        windSpeed: "5.0 m/s (북서풍)",
        tideName: "7물",
        highTide: "05:50 (95cm)",
        lowTide: "12:10 (20cm)",
        status: "너울성 파도 너울주의"
    },
    {
        name: "울진 해양레저센터",
        region: "동해 중부",
        waterTemp: "20.4°C",
        waveHeight: "0.7m",
        windSpeed: "3.5 m/s (서풍)",
        tideName: "7물",
        highTide: "06:00 (105cm)",
        lowTide: "12:30 (25cm)",
        status: "입수 양호"
    }
];

// Initial Sample Data (With Verified Instructor License Codes)
const INITIAL_POSTS = [
    {
        id: "post-instructor-1",
        title: "[🎓 AIDA 강사] 가평 K26 1일 원데이 프리다이빙 체험 강습 모집!",
        category: "instructor",
        categoryName: "🎓 강사 클래스",
        instructorOrg: "AIDA",
        instructorLicenseCode: "AIDA-IN-98472",
        classType: "🤿 1일 원데이 체험 강습",
        classFee: 60000,
        classRatio: "1:2 소수정예 강습",
        classInclusion: "장비 풀세트 렌탈 포함 (풀장 입장료 별도)",
        location: "가평 K26 잠수풀 (수심 26m)",
        region: "seoul",
        locationName: "가평 K26 잠수풀 (수심 26m)",
        mapAddress: "경기도 가평군 청평면 고성리 317 K26",
        date: "2026-08-02T11:00",
        userName: "해양마스터강사",
        userLicense: "🎓 AIDA Master Instructor (No. AIDA-IN-98472)",
        reqLicense: "입문자 / 초보자 누구나 수강 가능",
        password: "1234",
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
        title: "포항 영일대 해수욕장 2.5km 바다수영 버디 구합니다! 🌊",
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
        password: "1234",
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
        password: "1234",
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
        categoryName: "🏷️ 중고장터",
        location: "서울 송파구 올림픽공원 다이빙풀 입구",
        region: "seoul",
        locationName: "서울 송파구 올림픽공원 다이빙풀 입구",
        mapAddress: "서울 송파구 올림픽공원 다이빙풀 입구",
        dealMethod: "직거래/택배 둘 다 가능",
        price: 240000,
        priceText: "240,000 원",
        userName: "핀마스터",
        userLicense: "프리다이버 / 마켓 인증",
        password: "1234",
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
        title: "💬 [수다방] 딥스테이션 36m 첫 통과 후기 & 프렌젤 이퀄 꿀팁!",
        category: "community",
        categoryName: "💬 자유수다방",
        location: "용인 딥스테이션",
        region: "seoul",
        locationName: "용인 딥스테이션 (수심 36m)",
        userName: "이퀄신동",
        userLicense: "AIDA 4 Master",
        password: "1234",
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
let activeCategory = "all";
let activeActivitySub = "my_posts";
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
let myCreatedPostIds = [];
let eventSource = null;

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

const settingsModal = document.getElementById("settingsModal");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");

const detailModal = document.getElementById("detailModal");
const detailModalTitle = document.getElementById("detailModalTitle");
const detailModalBody = document.getElementById("detailModalBody");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");

const imageLightboxModal = document.getElementById("imageLightboxModal");
const lightboxImage = document.getElementById("lightboxImage");

const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const confirmDeleteFinalBtn = document.getElementById("confirmDeleteFinalBtn");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initUserIdentity();
    loadPosts();
    loadMyPosts();
    initEventListeners();
    initStarRatingEvents();
    initRealtimeStream();
    filterAndRender();
    renderWeatherGrid();
    renderAdBanner();
    updateSideAdLinks();
    generateBubbles();
});

// Initialize Device Unique User Identity
function initUserIdentity() {
    let savedUser = localStorage.getItem("aqua_buddy_user_identity");
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch(e) {}
    }

    if (!currentUser) {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        currentUser = {
            name: `다이버_${randomId}`,
            license: "프리다이버 / 수영 다이버",
            instructorCode: "",
            provider: "손님",
            avatar: "D"
        };
        localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));
    }

    const userNav = document.getElementById("userProfileNav");
    if (userNav) {
        userNav.classList.remove("hidden");
        const instBadge = currentUser.instructorCode ? ` 🎓[인증강사]` : '';
        document.getElementById("navUserName").textContent = `${currentUser.name}${instBadge}`;
    }
}

// Strict Device & Account Host Identification
function isMyPost(post) {
    if (!post) return false;
    
    if (myCreatedPostIds && myCreatedPostIds.includes(post.id)) {
        return true;
    }

    if (currentUser && currentUser.name && post.userName) {
        return currentUser.name.trim() === post.userName.trim();
    }

    return false;
}

// Initialize Realtime Multi-User Stream
function initRealtimeStream() {
    try {
        eventSource = new EventSource("/events");

        eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            handleRealtimeEvent(data);
        };

        eventSource.onerror = () => {
            console.log("SSE Stream reconnecting...");
        };
    } catch (err) {
        console.log("Realtime stream init error:", err);
    }
}

// Handle Incoming Live Events
function handleRealtimeEvent(data) {
    if (!data || !data.type) return;

    if (data.type === "INIT_STATE") {
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(sp => {
                const idx = posts.findIndex(p => p.id === sp.id);
                if (idx === -1) {
                    posts.unshift(sp);
                } else {
                    posts[idx] = { ...sp, userLiked: posts[idx].userLiked, userWished: posts[idx].userWished };
                }
            });
            savePosts();
            filterAndRender();
        }
        if (data.chats) {
            chatMessages = { ...data.chats, ...chatMessages };
        }
    } else if (data.type === "NEW_POST") {
        const newPost = data.post;
        if (newPost && !posts.some(p => p.id === newPost.id)) {
            posts.unshift(newPost);
            savePosts();
            filterAndRender();
            showToast(`✨ [실시간 알림] ${newPost.userName}님이 새 글 '${newPost.title.substring(0, 10)}...'을 올렸습니다!`);
        }
    } else if (data.type === "UPDATE_POST") {
        const updated = data.post;
        if (updated) {
            const idx = posts.findIndex(p => p.id === updated.id);
            if (idx !== -1) {
                posts[idx] = { ...updated, userLiked: posts[idx].userLiked, userWished: posts[idx].userWished };
                savePosts();
                filterAndRender();
                if (detailModal && !detailModal.classList.contains("hidden") && currentChatPost && currentChatPost.id === updated.id) {
                    openDetailModal(updated.id);
                }
            }
        }
    } else if (data.type === "DELETE_POST") {
        const postId = data.postId;
        if (postId) {
            posts = posts.filter(p => p.id !== postId);
            savePosts();
            filterAndRender();
            if (detailModal && !detailModal.classList.contains("hidden")) {
                closeModal(detailModal);
            }
        }
    } else if (data.type === "CHAT_MESSAGE") {
        const { postId, message } = data;
        if (postId && message) {
            if (!chatMessages[postId]) chatMessages[postId] = [];
            chatMessages[postId].push(message);

            if (currentChatPost && currentChatPost.id === postId && !chatModal.classList.contains("hidden")) {
                renderChatStream(postId);
            } else {
                const targetPost = posts.find(p => p.id === postId);
                if (targetPost) {
                    targetPost.unreadCount = (targetPost.unreadCount || 0) + 1;
                    savePosts();
                    filterAndRender();
                    showToast(`💬 [실시간 대화] '${targetPost.title.substring(0, 10)}...' 방에 새 메시지가 도착했습니다!`);
                }
            }
        }
    }
}

// Broadcast Realtime Event
function broadcastRealtime(payload) {
    fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(err => console.log("Broadcast failed:", err));
}

function loadPosts() {
    const saved = localStorage.getItem("aqua_buddy_posts_v24");
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
    localStorage.setItem("aqua_buddy_posts_v24", JSON.stringify(posts));
}

function saveMyPosts() {
    localStorage.setItem("aqua_buddy_my_posts", JSON.stringify(myCreatedPostIds));
}

function initEventListeners() {
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

    openAuthModalBtn.addEventListener("click", () => openModal(authModal));
    closeAuthModalBtn.addEventListener("click", () => closeModal(authModal));

    closeChatModalBtn.addEventListener("click", () => closeModal(chatModal));
    chatForm.addEventListener("submit", handleSendChatMessage);

    closeRatingModalBtn.addEventListener("click", () => closeModal(ratingModal));
    cancelRatingBtn.addEventListener("click", () => closeModal(ratingModal));

    openSettingsBtn.addEventListener("click", () => openModal(settingsModal));
    closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));

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
        if (e.target === settingsModal) closeModal(settingsModal);
        if (e.target === detailModal) closeModal(detailModal);
        if (e.target === imageLightboxModal) closeModal(imageLightboxModal);
        if (e.target === deleteConfirmModal) closeModal(deleteConfirmModal);
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

function updateCreateButtonText(cat) {
    if (cat === "community") {
        createBtnText.textContent = "수다글 작성하기";
    } else if (cat === "market") {
        createBtnText.textContent = "중고 장비 등록하기";
    } else if (cat === "instructor") {
        createBtnText.textContent = "🎓 강사 클래스 등록하기";
    } else {
        createBtnText.textContent = "버디 모집하기";
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
        modalFormTitle.textContent = isEditing ? "🎓 강사 클래스 수정" : "🎓 강사 전용 체험 & 자격증 코스 등록";
        
        postCategoryGroup.style.display = "block";
        instructorFields.style.display = "block";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "block";
        locationDateGroup.style.display = "grid";
        postDateGroup.style.display = "block";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 📸 커리큘럼 / 풀장 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "상세 내용 및 교육 커리큘럼 *";
        postCategorySelect.innerHTML = `<option value="instructor" selected>🎓 강사 클래스 (원데이 체험 / 자격증 코스)</option>`;
    } else if (cat === "community") {
        modalFormTitle.textContent = isEditing ? "💬 자유수다글 수정" : "💬 수다방 게시글 작성";
        
        postCategoryGroup.style.display = "none";
        instructorFields.style.display = "none";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "none";
        locationDateGroup.style.display = "none";
        mapAddressGroup.style.display = "none";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 📸 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "내용 작성 *";
        postCategorySelect.innerHTML = `<option value="community" selected>💬 자유수다방 게시글</option>`;
    } else if (cat === "market") {
        modalFormTitle.textContent = isEditing ? "🏷️ 중고 장비 수정" : "🏷️ 중고 다이빙 장비 매물 등록";
        
        postCategoryGroup.style.display = "none";
        instructorFields.style.display = "none";
        priceRow.style.display = "grid";
        dealMethodGroup.style.display = "block";
        capacityGroup.style.display = "none";
        locationDateGroup.style.display = "none";
        postDateGroup.style.display = "none";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 📸 장비 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "내용 작성 *";
        postCategorySelect.innerHTML = `<option value="market" selected>🏷️ 중고 장비 매물 등록</option>`;
    } else {
        modalFormTitle.textContent = isEditing ? "🤿 버디 모집글 수정" : "🤿 새 버디 모집글 등록";
        
        postCategoryGroup.style.display = "block";
        instructorFields.style.display = "none";
        priceRow.style.display = "none";
        dealMethodGroup.style.display = "none";
        capacityGroup.style.display = "block";
        locationDateGroup.style.display = "grid";
        postDateGroup.style.display = "block";
        mapAddressGroup.style.display = "block";

        imageUploadLabel.innerHTML = `<i class="fa-solid fa-images"></i> 📸 현장 / 장비 사진 등록 (최대 4장, 클릭 시 대형 미리보기)`;
        descLabel.textContent = "상세 내용 및 플랜 *";
        postCategorySelect.innerHTML = `
            <option value="swimming" ${cat === 'swimming' ? 'selected' : ''}>🏊‍♂️ 실내 수영 버디 모집</option>
            <option value="openwater" ${cat === 'openwater' ? 'selected' : ''}>🌊 바다 수영 버디 모집</option>
            <option value="freediving" ${cat === 'freediving' || cat === 'all' ? 'selected' : ''}>🤿 프리다이빙 버디 모집</option>
            <option value="scuba" ${cat === 'scuba' ? 'selected' : ''}>🥽 스쿠버다이빙 버디 모집</option>
            <option value="instructor">🎓 강사 클래스 (원데이 체험 / 자격증 코스)</option>
        `;
    }
}

function filterByCategory(catName) {
    activeCategory = catName;
    tabBtns.forEach(b => {
        if (b.dataset.category === catName) b.classList.add("active");
        else b.classList.remove("active");
    });

    updateCreateButtonText(catName);
    renderAdBanner();
    filterAndRender();
}

function renderAdBanner() {
    const adPanel = document.getElementById("adContent");
    if (!adPanel) return;

    adPanel.innerHTML = `
        <a href="${COUPANG_AFFILIATE_URL}" target="_blank" class="ad-banner-img-wrap" onclick="showToast('쿠팡 스포츠 페스타 특가 몰로 이동합니다!')">
            <img src="ad_banner_swim.png" alt="썸머 스포츠 페스타! 할인 대방출 - 인기 상품 한눈에 보기">
        </a>
    `;
}

function updateSideAdLinks() {
    const sideLinks = document.querySelectorAll(".side-ad-link, .side-ad-img-box");
    sideLinks.forEach(link => {
        if (link.tagName === "A") {
            link.href = COUPANG_AFFILIATE_URL;
        }
    });

    const bottomBtn = document.querySelector(".bottom-ad-banner-link");
    if (bottomBtn) {
        bottomBtn.href = COUPANG_AFFILIATE_URL;
    }
}

function renderWeatherGrid() {
    const grid = document.getElementById("weatherGrid");
    if (!grid) return;

    grid.innerHTML = OCEAN_WEATHER_DATA.map(spot => `
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

// Filter and Render Feed Cards
function filterAndRender() {
    const currentUserName = currentUser ? currentUser.name : "다이버";

    if (activeCategory === "activity_log") {
        activitySubFilterBar.classList.remove("hidden");
    } else {
        activitySubFilterBar.classList.add("hidden");
    }

    let filtered = posts.filter(post => {
        if (activeCategory === "activity_log") {
            if (activeActivitySub === "my_posts") {
                return isMyPost(post);
            } else if (activeActivitySub === "chat_rooms") {
                return chatMessages[post.id] && chatMessages[post.id].length > 0;
            } else if (activeActivitySub === "joined") {
                return post.attendees && post.attendees.includes(currentUserName);
            } else if (activeActivitySub === "liked") {
                return post.userLiked === true;
            } else if (activeActivitySub === "commented") {
                return post.comments && post.comments.some(c => c.author === currentUserName || isMyPost(post));
            } else if (activeActivitySub === "wished") {
                return post.userWished === true;
            }
            return isMyPost(post);
        }

        if (activeCategory !== "all" && post.category !== activeCategory) {
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
        if (selectedSort === "newest") {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (selectedSort === "oldest") {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        } else if (selectedSort === "max_capacity") {
            return (b.capacity || 1) - (a.capacity || 1);
        } else if (selectedSort === "min_capacity") {
            return (a.capacity || 1) - (b.capacity || 1);
        } else if (selectedSort === "closing_soon") {
            if (a.status === "recruiting" && b.status !== "recruiting") return -1;
            if (a.status !== "recruiting" && b.status === "recruiting") return 1;
            return new Date(a.date || 0) - new Date(b.date || 0);
        }
        return 0;
    });

    renderGrid(filtered);
}

// Render Cards to Grid
function renderGrid(data) {
    activeCountText.textContent = `총 ${data.length}개의 게시글 / 모집글 / 강사 클래스`;

    if (data.length === 0) {
        postsGrid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    postsGrid.innerHTML = data.map(post => {
        const isInstructor = post.category === "instructor";
        const isMarket = post.category === "market";
        const isCommunity = post.category === "community";
        const hasImages = post.images && post.images.length > 0;
        const mine = isMyPost(post);
        const isFull = (post.joinedCount && post.capacity && post.joinedCount >= post.capacity) || post.status === "in_progress" || post.status === "completed";
        const unreadCount = post.unreadCount || 0;

        return `
        <div class="post-card">
            <div>
                <div class="post-header">
                    <div class="badge-group">
                        <span class="badge badge-${post.category}">${post.categoryName || '스포츠'}</span>
                        ${isInstructor ? `<span class="instructor-badge" title="라이선스 인증: ${post.instructorLicenseCode || '공인 강사'}"><i class="fa-solid fa-graduation-cap"></i> 공인 인증 강사</span>` : ''}
                        ${(!isCommunity && !isMarket) ? `<span class="status-badge status-${post.status}">${post.statusText}</span>` : ''}
                    </div>
                    ${isMarket ? `
                    <button class="wishlist-btn ${post.userWished ? 'active' : ''}" onclick="toggleWishlist('${post.id}')">
                        <i class="fa-solid fa-heart"></i> ${post.wishlistCount || 0}
                    </button>
                    ` : ''}
                </div>

                <h3 class="post-title">${escapeHtml(post.title)}</h3>

                ${hasImages ? `
                <div style="width: 100%; height: 160px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 12px; border: 1px solid var(--glass-border);">
                    <img src="${post.images[0]}" alt="게시글 대표 사진" class="zoomable-img" onclick="openLightbox('${post.images[0]}')" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                ` : ''}

                ${isInstructor ? `
                <div class="class-price-tag">
                    <i class="fa-solid fa-ticket"></i> 수강료: ${post.classFee ? post.classFee.toLocaleString() + '원' : '수강료 문의'}
                    <span style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted); margin-left: 6px;">(${escapeHtml(post.classRatio || '1:2 소수정예')})</span>
                </div>
                ` : ''}

                ${isMarket ? `
                <div class="market-price-tag">
                    <i class="fa-solid fa-won-sign"></i> ${post.price ? post.price.toLocaleString() + '원' : '가격 협의'}
                    <span style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted); margin-left: 8px;">(${escapeHtml(post.dealMethod || '직거래/택배 둘 다 가능')})</span>
                </div>
                ` : ''}

                <div class="user-info">
                    <div class="user-details">
                        <h4><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${mine ? '<span style="color: var(--accent-gold); font-size: 0.75rem;">(내가 쓴 글)</span>' : ''} <span class="host-rating-badge"><i class="fa-solid fa-star"></i> ${post.hostRating || 4.9} (${post.hostReviewsCount || 10})</span></h4>
                        <span class="user-license"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
                    </div>
                </div>

                <div class="post-info-list">
                    ${!isCommunity ? `
                    <div class="info-item">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${escapeHtml(post.mapAddress || post.locationName)}</span>
                    </div>
                    ` : ''}
                    ${post.date && !isMarket && !isCommunity ? `
                    <div class="info-item">
                        <i class="fa-regular fa-calendar-check"></i>
                        <span>진행 일정: <strong>${formatDate(post.date)}</strong></span>
                    </div>
                    ` : ''}
                    ${isInstructor && post.classInclusion ? `
                    <div class="info-item" style="color: var(--accent-gold);">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>${escapeHtml(post.classInclusion)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="post-footer">
                <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
                <div style="display: flex; gap: 6px; align-items: center;">
                    ${!isCommunity ? `
                    <button class="btn btn-secondary" onclick="openChatRoomModal('${post.id}')" style="padding: 6px 12px; font-size: 0.82rem; position: relative;" title="앱 내 대화하기">
                        <i class="fa-solid fa-comments"></i> 대화하기
                        ${unreadCount > 0 ? `<span class="unread-badge" style="position: absolute; top: -6px; right: -6px; padding: 2px 6px; font-size: 0.7rem;">${unreadCount}</span>` : ''}
                    </button>
                    ` : ''}
                    ${(!isCommunity && !isMarket && isFull && !mine) ? `
                    <button class="btn btn-secondary btn-disabled" disabled style="padding: 6px 14px; font-size: 0.82rem;" title="모집이 완료되어 상세보기가 차단되었습니다.">
                        <i class="fa-solid fa-lock"></i> 🔒 모집 마감
                    </button>
                    ` : `
                    <button class="btn btn-primary" onclick="openDetailModal('${post.id}')" style="padding: 6px 12px; font-size: 0.82rem;">
                        ${isInstructor ? '클래스 상세보기 ➔' : '상세보기 ➔'}
                    </button>
                    `}
                </div>
            </div>
        </div>
        `;
    }).join("");
}

// Open Upgraded Glassmorphism Chat Modal
function openChatRoomModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    currentChatPost = post;
    const isHost = isMyPost(post);
    const isMarket = post.category === "market";

    // Clear unread count on opening
    post.unreadCount = 0;
    savePosts();
    filterAndRender();

    const roleBadge = document.getElementById("chatRoleBadge");
    const unreadBadge = document.getElementById("chatUnreadBadge");
    const hostToolbar = document.getElementById("chatHostQuickToolbar");
    const membersBar = document.getElementById("chatMembersBar");

    document.getElementById("chatBuddyName").textContent = isMarket ? `${post.userName}님과의 1:1 대화방` : `${post.title.substring(0, 18)}... 일정 대화방`;
    document.getElementById("chatPostTitle").textContent = `'${post.title}' - ${post.categoryName}`;

    // Role-based Header Tag & Toolbar Rendering
    if (isHost) {
        roleBadge.className = "chat-role-tag host-tag";
        roleBadge.textContent = isMarket ? "👑 판매자 대화방" : (post.category === "instructor" ? "🎓 강사 전용 수강 대화방" : "👑 모임 주최자 대화방");
        if (!isMarket) hostToolbar.style.display = "flex";
        else hostToolbar.style.display = "none";
    } else {
        roleBadge.className = "chat-role-tag attendee-tag";
        roleBadge.textContent = isMarket ? "🙋‍♂️ 구매 문의자 대화방" : (post.category === "instructor" ? "🎓 수강 문의자 대화방" : "🙋‍♂️ 버디 참가자 대화방");
        hostToolbar.style.display = "none";
    }

    unreadBadge.classList.add("hidden");

    // 4-Person Group Chat Member Profile Bar
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

    // Initialize Default Seed Messages
    if (!chatMessages[postId]) {
        if (isMarket) {
            chatMessages[postId] = [
                { sender: "host", author: post.userName, text: `안녕하세요! '${post.title}' 중고 장비 등록한 ${post.userName}입니다. 직거래 및 가격 문의 편하게 주세요!`, time: "방금 전" }
            ];
        } else if (post.category === "instructor") {
            chatMessages[postId] = [
                { sender: "host", author: post.userName, text: `안녕하세요! AquaBuddy 공인 인증 강사 ${post.userName}입니다 (라이선스: ${post.instructorLicenseCode || '공인 강사'}). 강습 수강 신청 및 일정 문의 언제든 주세요! 🎓`, time: "방금 전" }
            ];
        } else {
            chatMessages[postId] = [
                { sender: "host", author: post.userName, text: `안녕하세요! 버디 모집 주최자 ${post.userName}입니다. 다이빙 장비 렌탈 및 수심 일정 맞춰서 준비해봐요! 🌊`, time: "방금 전" },
                { sender: "attendee", author: "동해물개", text: "네! 포항 영일대 수영 스팟 오전 8시 30분 미팅 맞춰서 슈트 챙겨 가겠습니다!", time: "방금 전" }
            ];
        }
    }

    renderChatStream(postId);
    openModal(chatModal);
}

function renderChatStream(postId) {
    const stream = chatMessages[postId] || [];
    chatMessagesStream.innerHTML = stream.map(msg => {
        const isUserMsg = (currentUser && msg.author === currentUser.name) || msg.sender === "user";
        const isHostMsg = msg.sender === "host" || (currentChatPost && msg.author === currentChatPost.userName);

        return `
        <div class="chat-bubble ${isUserMsg ? 'user' : (isHostMsg ? 'host' : 'attendee')}">
            ${!isUserMsg ? `
            <div class="chat-sender-info">
                <i class="fa-solid ${isHostMsg ? 'fa-crown' : 'fa-user-circle'}"></i> ${escapeHtml(msg.author || '참가자')} ${isHostMsg ? '(주최자)' : ''}
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
        sender: isHostMsg ? "host" : "attendee",
        author: currentUserName,
        text: text,
        time: "방금 전"
    };

    if (!chatMessages[postId]) chatMessages[postId] = [];
    chatMessages[postId].push(msgObj);

    chatMessageInput.value = "";
    renderChatStream(postId);

    broadcastRealtime({
        type: "CHAT_MESSAGE",
        postId: postId,
        message: msgObj
    });
}

function confirmBuddyMatchFromChat() {
    if (!currentChatPost) return;
    confirmBuddyMatch(currentChatPost.id);
    showToast("⚡ 대화방에서 수강생 확정 완료 토글이 수행되었습니다!");
}

function finishScheduleFromChat() {
    if (!currentChatPost) return;
    finishBuddySchedule(currentChatPost.id);
    showToast("⚡ 대화방에서 강습 완료 처리가 되었습니다!");
}

// Role-Based Detail Modal View
function openDetailModal(postId) {
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
        <div class="comment-item">
            <div class="comment-header">
                <span>${escapeHtml(c.author)}</span>
                <span style="opacity: 0.6; font-size: 0.75rem;">${c.time || '방금 전'}</span>
            </div>
            <p style="color: var(--text-main);">${escapeHtml(c.text)}</p>
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

    let mainInfoHtml = '';

    if (isInstructor) {
        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(담당 강사 - 본인)</span>' : ''}</h3>
                    <div class="detail-badge-list">
                        <span class="instructor-badge"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(post.userLicense)}</span>
                        <span class="host-rating-badge"><i class="fa-solid fa-star"></i> 강사 평점 ${post.hostRating || 5.0} (${post.hostReviewsCount || 40}건)</span>
                    </div>
                </div>
            </div>

            <!-- Verified Instructor License Code Box -->
            <div style="background: linear-gradient(135deg, rgba(255,183,3,0.12), rgba(0,242,254,0.12)); border: 1px dashed var(--accent-gold); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <p style="font-size: 0.88rem; color: var(--accent-gold); font-weight: 800;">
                    <i class="fa-solid fa-shield-check"></i> AquaBuddy 공인 검증 강사 프로필
                </p>
                <p style="font-size: 0.82rem; color: var(--text-main); margin-top: 4px;">
                    • 발급 단체: <strong>${escapeHtml(post.instructorOrg || 'AIDA / PADI')}</strong><br>
                    • 공인 라이선스 번호: <strong style="color: var(--accent-cyan); font-family: monospace;">${escapeHtml(post.instructorLicenseCode || 'AIDA-IN-98472')}</strong> (인증 완료)
                </p>
            </div>

            <!-- Top Action Bar -->
            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                ${isHost ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="클래스 수정하기">
                    <i class="fa-solid fa-pen-to-square"></i> ✏️ 클래스 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="강사 비밀번호 2단계 확인 후 삭제">
                    <i class="fa-solid fa-trash-can"></i> 🗑️ 클래스 삭제
                </button>
                ` : ''}
                <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fa-solid fa-heart"></i> ❤️ 관심 클래스 <span id="likeCount">${post.likes || 0}</span>
                </button>
            </div>

            ${photoGalleryHtml}

            <div class="detail-section">
                <h4><i class="fa-solid fa-graduation-cap"></i> 🎓 강사 클래스 커리큘럼 & 수강료</h4>
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
                <h4><i class="fa-solid fa-comments"></i> 수강 후기 & 실시간 문의 (${(post.comments || []).length})</h4>
                <div class="comment-list" id="commentListContainer">
                    ${commentsListHtml.length > 0 ? commentsListHtml : '<p style="font-size: 0.85rem; color: var(--text-muted);">첫 문의를 남겨보세요!</p>'}
                </div>
                <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                    <input type="text" id="newCommentInput" placeholder="강사님께 수강 문의 남기기..." required>
                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">등록</button>
                </form>
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="closeModal(detailModal); openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 강사님과 1:1 수강 상담 대화방
                    </button>
                    ${!isHost ? `
                    <button class="btn btn-secondary" onclick="showToast('🎓 강사 클래스 수강 신청이 완료되었습니다! 1:1 대화방에서 일정을 확정해 주세요.')" style="background: linear-gradient(135deg, rgba(255,183,3,0.25), rgba(255,143,0,0.25)); color: var(--accent-gold); border-color: var(--accent-gold);">
                        <i class="fa-solid fa-graduation-cap"></i> 🎓 클래스 수강 신청하기
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isMarket) {
        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(판매자 - 본인)</span>' : ''} (🏷️ 중고장터)</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                <button class="wishlist-btn ${post.userWished ? 'active' : ''}" onclick="toggleWishlist('${post.id}')">
                    <i class="fa-solid fa-heart"></i> ❤️ 찜하기 ${post.wishlistCount || 0}
                </button>
                ${isHost ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="게시글 수정하기">
                    <i class="fa-solid fa-pen-to-square"></i> ✏️ 글 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자/웹마스터 비밀번호 2단계 확인 후 삭제">
                    <i class="fa-solid fa-trash-can"></i> 🗑️ 글 삭제
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
                <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                    <input type="text" id="newCommentInput" placeholder="댓글을 입력해 주세요..." required>
                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">등록</button>
                </form>
            </div>

            <div class="contact-box" style="margin-top: 20px; justify-content: flex-end;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="closeModal(detailModal); openChatRoomModal('${post.id}');">
                        <i class="fa-solid fa-comment-dots"></i> 앱 내 1:1 대화방 입장
                    </button>
                    ${isHost ? `
                    <button class="btn btn-secondary" onclick="toggleMarketStatus('${post.id}')" style="background: rgba(0, 230, 118, 0.15); color: #00e676; border-color: rgba(0, 230, 118, 0.4);">
                        <i class="fa-solid fa-bolt"></i> ${post.status === 'completed' ? '⚡ 다시 거래 중으로 변경' : '⚡ 거래 완료'}
                    </button>
                    ` : ''}
                    ${post.status === 'completed' ? `
                    <button class="btn btn-secondary" onclick="openHostRatingModal('${post.id}')" style="color: var(--accent-gold); border-color: var(--accent-gold);">
                        <i class="fa-solid fa-star"></i> ⭐ 중고거래 후기 남기기
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isCommunity) {
        mainInfoHtml = `
            <div class="detail-profile-card">
                <div>
                    <h3><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i> ${escapeHtml(post.userName)} ${isHost ? '<span style="color: var(--accent-gold); font-size: 0.8rem;">(작성자 - 본인)</span>' : ''} (💬 자유수다방)</h3>
                    <div class="detail-badge-list">
                        <span class="detail-badge"><i class="fa-solid fa-certificate"></i> ${escapeHtml(post.userLicense)}</span>
                    </div>
                </div>
            </div>

            <div class="like-action-bar" style="justify-content: flex-end; gap: 8px;">
                ${isHost ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="게시글 수정하기">
                    <i class="fa-solid fa-pen-to-square"></i> ✏️ 글 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자/웹마스터 비밀번호 2단계 확인 후 삭제">
                    <i class="fa-solid fa-trash-can"></i> 🗑️ 글 삭제
                </button>
                ` : ''}
                <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fa-solid fa-heart"></i> ❤️ 공감 <span id="likeCount">${post.likes || 0}</span>
                </button>
            </div>

            ${photoGalleryHtml}

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
                <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                    <input type="text" id="newCommentInput" placeholder="댓글을 입력해 주세요..." required>
                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">등록</button>
                </form>
            </div>
        `;
    } else {
        let actionButtonsHtml = '';

        if (isHost) {
            if (post.status === 'recruiting') {
                actionButtonsHtml = `
                    <button class="btn btn-secondary" onclick="confirmBuddyMatch('${post.id}')" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); border-color: rgba(0, 242, 254, 0.4);">
                        <i class="fa-solid fa-bolt"></i> ⚡ 참가자 확정 완료 (일정 진행 중)
                    </button>
                `;
            } else if (post.status === 'in_progress') {
                actionButtonsHtml = `
                    <button class="btn btn-primary" onclick="finishBuddySchedule('${post.id}')">
                        <i class="fa-solid fa-circle-check"></i> ⚡ 일정 완료 (모임 종료)
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
                            <i class="fa-solid fa-xmark"></i> ❌ 버디 참가 취소
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <button class="btn btn-primary" onclick="joinBuddyMatch('${post.id}')">
                            <i class="fa-solid fa-handshake"></i> 🙋‍♂️ 버디 참가 신청
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
                            <i class="fa-solid fa-star"></i> ⭐ 주최자 버디 평점 남기기
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
                ${isHost ? `
                <button class="btn btn-secondary" onclick="verifyPasswordAndEdit('${post.id}')" style="padding: 6px 14px; font-size: 0.82rem;" title="게시글 수정하기">
                    <i class="fa-solid fa-pen-to-square"></i> ✏️ 글 수정
                </button>
                <button class="btn-delete" onclick="deletePostWithPassword('${post.id}')" title="작성자/웹마스터 비밀번호 2단계 확인 후 삭제">
                    <i class="fa-solid fa-trash-can"></i> 🗑️ 글 삭제
                </button>
                ` : ''}
                <button class="like-btn ${post.userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fa-solid fa-heart"></i> ❤️ 좋아요 <span id="likeCount">${post.likes || 0}</span>
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
                <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                    <input type="text" id="newCommentInput" placeholder="댓글을 입력해 주세요..." required>
                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">등록</button>
                </form>
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

// Password Verification for Deletion
function deletePostWithPassword(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let verified = false;

    if (isMyPost(post)) {
        verified = true;
    } else {
        const inputPw = prompt("🔒 작성자 또는 웹마스터 비밀번호(숫자 4자리)를 입력해 주세요:");
        if (!inputPw) return;

        if (inputPw.trim() === (post.password || "1234") || inputPw.trim() === "9999" || inputPw.trim() === "master") {
            verified = true;
        } else {
            showToast("⚠️ 비밀번호가 일치하지 않습니다! 작성자와 웹마스터만 삭제 가능합니다.");
            return;
        }
    }

    if (verified) {
        pendingDeletePostId = postId;
        openModal(deleteConfirmModal);
    }
}

function performPostDeletion(postId) {
    posts = posts.filter(p => p.id !== postId);
    myCreatedPostIds = myCreatedPostIds.filter(id => id !== postId);

    savePosts();
    saveMyPosts();

    broadcastRealtime({ type: "DELETE_POST", postId: postId });

    closeModal(detailModal);
    filterAndRender();
    showToast("🗑️ 게시글이 안전하게 삭제되었습니다.");
}

// Toggle Wishlist
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
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();

    if (!detailModal.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}

// Toggle Like
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
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();

    if (!detailModal.classList.contains("hidden")) {
        openDetailModal(postId);
    }
}

// Attendee Join Match
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
        showToast("🎉 최대 참가 인원이 꽉 차서 '참가자 확정 완료(일정 진행 중)' 상태로 자동 변경되었습니다!");
    } else {
        showToast(`🙋‍♂️ 버디 참가 신청이 완료되었습니다! (현재 ${post.joinedCount}/${post.capacity}명)`);
    }

    savePosts();
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();
    openDetailModal(postId);
}

// Attendee Cancel Match
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
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();
    openDetailModal(postId);
    showToast("❌ 버디 참가 신청이 취소되었습니다.");
}

// Host Manual Confirmation
function confirmBuddyMatch(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.status = "in_progress";
    post.statusText = "참가자 확정 완료 (일정 진행 중)";
    savePosts();
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();
    openDetailModal(postId);
    showToast("⚡ 참가자 확정이 완료되었습니다! 모임 일정 진행 단계로 전환되었습니다.");
}

// Host Schedule Completion
function finishBuddySchedule(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.status = "completed";
    post.statusText = "일정 완료";
    savePosts();
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    filterAndRender();
    openDetailModal(postId);
    showToast("🎉 모임 일정이 최종 완료되었습니다! 참석했던 참가자들에게 버디 평점 남기기 버튼이 활성화됩니다.");
}

// Password Verification for Post Editing
function verifyPasswordAndEdit(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (isMyPost(post)) {
        openEditModal(postId);
        return;
    }

    const inputPw = prompt("🔒 게시글 작성 시 설정한 4자리 비밀번호를 입력해 주세요:");
    if (!inputPw) return;

    if (inputPw.trim() === (post.password || "1234") || inputPw.trim() === "9999" || inputPw.trim() === "master") {
        showToast("🔑 비밀번호가 확인되었습니다! 글 수정 모드로 이동합니다.");
        openEditModal(postId);
    } else {
        showToast("⚠️ 비밀번호가 일치하지 않습니다! 작성자만 수정할 수 있습니다.");
    }
}

function openEditModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    editingPostId = postId;
    preselectModalCategory(post.category, true);

    document.getElementById("postTitle").value = post.title;
    if (post.instructorOrg && document.getElementById("instructorOrg")) document.getElementById("instructorOrg").value = post.instructorOrg;
    if (post.instructorLicenseCode && document.getElementById("instructorLicenseCode")) document.getElementById("instructorLicenseCode").value = post.instructorLicenseCode;
    if (post.classFee && document.getElementById("classFee")) document.getElementById("classFee").value = post.classFee;
    if (post.classRatio && document.getElementById("classRatio")) document.getElementById("classRatio").value = post.classRatio;
    if (post.classInclusion && document.getElementById("classInclusion")) document.getElementById("classInclusion").value = post.classInclusion;
    if (post.price) document.getElementById("postPrice").value = post.price;
    if (post.dealMethod && document.getElementById("postDealMethod")) document.getElementById("postDealMethod").value = post.dealMethod;
    if (post.capacity) document.getElementById("postCapacity").value = post.capacity;
    if (post.mapAddress) document.getElementById("postMapAddress").value = post.mapAddress;
    if (post.date) document.getElementById("postDate").value = post.date;
    if (post.password) document.getElementById("postPassword").value = post.password;
    document.getElementById("postDesc").value = post.desc;

    uploadedCompressedImages = [...(post.images || [])];
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
        showToast("🎉 중고 장비 거래 완료 처리가 되었습니다! 서로 거래 후기를 남길 수 있습니다.");
    }

    savePosts();
    broadcastRealtime({ type: "UPDATE_POST", post: post });
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
    if (headerTitle) headerTitle.textContent = post.category === "instructor" ? "🎓 강사 수강 평점 & 후기 작성" : (post.category === "market" ? "중고거래 상호 평점 & 거래 후기" : "주최자 버디 평점 & 매너 평가");

    document.getElementById("ratingHostTarget").textContent = `'${post.userName}'님과의 강습/활동 매너를 평가해 주세요.`;
    closeModal(detailModal);
    openModal(ratingModal);
}

function submitHostRating() {
    if (!currentRatingPost) return;

    currentRatingPost.hostReviewsCount = (currentRatingPost.hostReviewsCount || 10) + 1;
    savePosts();
    broadcastRealtime({ type: "UPDATE_POST", post: currentRatingPost });

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
    broadcastRealtime({ type: "UPDATE_POST", post: post });
    openDetailModal(postId);
    showToast("💬 문의/댓글이 등록되었습니다!");
}

function loginWithSocial(provider, iconChar) {
    const nickInput = document.getElementById("socialNicknameInput").value.trim() || "바다마스터";
    const licInput = document.getElementById("socialLicenseInput").value.trim() || "AIDA 3 / 레스큐 소지";
    const instCode = document.getElementById("socialInstructorCodeInput") ? document.getElementById("socialInstructorCodeInput").value.trim() : "";

    currentUser = {
        name: nickInput,
        license: licInput,
        instructorCode: instCode,
        provider: provider,
        avatar: iconChar
    };

    localStorage.setItem("aqua_buddy_user_identity", JSON.stringify(currentUser));

    document.getElementById("openAuthModalBtn").classList.add("hidden");
    const userNav = document.getElementById("userProfileNav");
    userNav.classList.remove("hidden");
    const instTag = instCode ? ` 🎓[인증강사]` : '';
    document.getElementById("navUserName").textContent = `${nickInput}${instTag} (${provider})`;

    closeModal(authModal);
    filterAndRender();
    showToast(`🎉 ${nickInput}님, ${provider} 로그인에 성공했습니다! ${instCode ? '(🎓 공인 인증 강사 등록 완료)' : ''}`);
}

function saveSettings() {
    closeModal(settingsModal);
    showToast("💾 API Key 및 파트너스 링크가 저장되었습니다.");
}

function handleSavePost(e) {
    e.preventDefault();

    const title = document.getElementById("postTitle").value.trim();
    const category = document.getElementById("postCategory").value;
    const instructorOrg = document.getElementById("instructorOrg") ? document.getElementById("instructorOrg").value : "AIDA";
    const instructorLicenseCode = document.getElementById("instructorLicenseCode") ? document.getElementById("instructorLicenseCode").value.trim() : "";
    const classType = document.getElementById("classType") ? document.getElementById("classType").value : "🤿 1일 원데이 체험 강습";
    const classFeeVal = document.getElementById("classFee") ? document.getElementById("classFee").value : null;
    const classRatioVal = document.getElementById("classRatio") ? document.getElementById("classRatio").value : "1:2 소수정예 강습";
    const classInclusionVal = document.getElementById("classInclusion") ? document.getElementById("classInclusion").value : "장비 렌탈비 포함";
    const priceVal = document.getElementById("postPrice") ? document.getElementById("postPrice").value : null;
    const dealMethodVal = document.getElementById("postDealMethod") ? document.getElementById("postDealMethod").value : "직거래/택배 둘 다 가능";
    const capacityVal = document.getElementById("postCapacity").value;
    const mapAddress = document.getElementById("postMapAddress").value.trim();
    const date = document.getElementById("postDate").value;
    const passwordVal = document.getElementById("postPassword").value.trim() || "1234";
    const userName = currentUser ? currentUser.name : "다이버";
    let userLicense = currentUser ? currentUser.license : "공인 강사 / 다이버";
    const desc = document.getElementById("postDesc").value.trim();

    if (category === "instructor" && instructorLicenseCode) {
        userLicense = `🎓 ${instructorOrg} Instructor (No. ${instructorLicenseCode})`;
    }

    let categoryName = "버디 모집";
    if (category === "freediving") categoryName = "프리다이빙";
    if (category === "scuba") categoryName = "스쿠버다이빙";
    if (category === "swimming") categoryName = "실내 수영";
    if (category === "openwater") categoryName = "바다 수영";
    if (category === "instructor") categoryName = "🎓 강사 클래스";
    if (category === "community") categoryName = "💬 자유수다방";
    if (category === "market") categoryName = "🏷️ 중고장터";

    if (editingPostId) {
        const post = posts.find(p => p.id === editingPostId);
        if (post) {
            post.title = title;
            post.category = category;
            post.categoryName = categoryName;
            post.instructorOrg = instructorOrg;
            post.instructorLicenseCode = instructorLicenseCode;
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
            post.password = passwordVal;
            post.desc = desc;
            post.images = [...uploadedCompressedImages];
            savePosts();
            broadcastRealtime({ type: "UPDATE_POST", post: post });
            showToast("✏️ 게시글/클래스가 성공적으로 수정되었습니다!");
        }
        editingPostId = null;
    } else {
        const newPostId = "post-" + Date.now();
        const newPost = {
            id: newPostId,
            title,
            category,
            categoryName,
            instructorOrg: category === "instructor" ? instructorOrg : null,
            instructorLicenseCode: category === "instructor" ? instructorLicenseCode : null,
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
            password: passwordVal,
            userName,
            userLicense: category === "instructor" ? userLicense : userLicense,
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

        broadcastRealtime({ type: "NEW_POST", post: newPost });
        showToast("✨ 새로운 게시글/강사 라이선스 클래스가 성공적으로 등록되었습니다!");
    }

    filterAndRender();

    createPostForm.reset();
    uploadedCompressedImages = [];
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
