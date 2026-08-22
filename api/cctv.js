export default async function handler(req, res) {
    const { cctvId } = req.query;

    if (!cctvId) {
        return res.status(400).json({ error: "cctvId is required" });
    }

    try {
        // 1. Fetch KBS CCTV popup page to get tokenized stream request URL
        const popupUrl = `https://d.kbs.co.kr/special/cctv/cctvPopup?type=LIVE&cctvId=${cctvId}`;
        const pageRes = await fetch(popupUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://d.kbs.co.kr/"
            }
        });

        if (!pageRes.ok) {
            return res.status(502).json({ error: "Failed to fetch KBS page" });
        }

        const html = await pageRes.text();

        // 2. Extract value from <input type="hidden" id="url" value="..." />
        const match = html.match(/id=["']url["']\s+value=["']([^"']+)["']/i) || html.match(/value=["'](https:\/\/kbsapi\.loomex\.net[^"']+)["']/i);
        if (!match || !match[1]) {
            return res.status(404).json({ error: "Stream URL not found in KBS page" });
        }

        const streamTokenUrl = match[1];

        // 3. Fetch ASCII-encoded m3u8 URL from Loomex API
        const streamRes = await fetch(streamTokenUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": popupUrl
            }
        });

        if (!streamRes.ok) {
            return res.status(502).json({ error: "Failed to fetch stream token from Loomex" });
        }

        const rawText = await streamRes.text();
        const charCodes = rawText.trim().split(/\r?\n/).map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
        const realM3u8Url = String.fromCharCode(...charCodes);

        if (!realM3u8Url.startsWith("http")) {
            return res.status(500).json({ error: "Decoded stream URL is invalid", rawText });
        }

        // 4. Redirect to the real m3u8 stream
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
        return res.redirect(302, realM3u8Url);

    } catch (err) {
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}
