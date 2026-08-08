/* ==========================================================================
   AquaBuddy (아쿠아버디) - Global Configuration Credentials (v32.0 Supabase DB)
   ========================================================================== */

window.AQUA_CONFIG = {
    // Supabase Backend Database Credentials
    supabase: {
        url: "https://ogfzfgsvmjuimjjhaubs.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZnpmZ3N2bWp1aW1qamhhdWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTE5NjgsImV4cCI6MjEwMDc4Nzk2OH0.UV_saHismzZs4uaic5i4h30OrV5PELERBWxKZGACR_o"
    },

    // Kakao Developers JavaScript API Key
    kakao: {
        appKey: "7c316726691ea5e02f234a85f5a20bab",
        redirectUri: "https://aqua-buddy-nu.vercel.app/"
    },

    // Coupang Partners Official Category Target Links & Tracking Credentials
    coupang: {
        trackingId: "AF9213595",
        
        // 1. Center Main Banner (쿠스페 - 썸머 스포츠 페스타)
        cuspeUrl: "https://link.coupang.com/a/fKqrpaA2Fw",
        
        // 2. Left Floating Banner (프리다이빙)
        freedivingUrl: "https://link.coupang.com/a/fKqE2ov1Qi",
        
        // 3. Right Floating Banner (스쿠버다이빙)
        scubaUrl: "https://link.coupang.com/a/fKszBcQl6y",
        
        // 4. Bottom Wide Banner (바다수영 / 오픈워터)
        openwaterUrl: "https://link.coupang.com/a/fKq8aVxMvA"
    },
    wsUrl: "ws://localhost:8082",
};
