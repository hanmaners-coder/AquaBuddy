/* ==========================================================================
   AquaBuddy (아쿠아버디) - API Keys & Configuration File
   ========================================================================== */

const AQUA_CONFIG = {
    // Coupang Partners API Configuration
    coupang: {
        accessKey: "8ce602cc-073c-46d3-87b2-33688c3dabe2",
        secretKey: "34e1bfc8050cea4b78d668b25bcd1808591de0e1",
        trackingId: "AF9213595"
    },
    // Naver Open API / Commerce API Configuration
    naver: {
        clientId: "",
        clientSecret: ""
    },
    // Kakao Map API Key
    kakaoMapKey: "7c316726691ea5e02f234a85f5a20bab"
};

// Export to global scope
if (typeof window !== "undefined") {
    window.AQUA_CONFIG = AQUA_CONFIG;
}
