export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No url provided");
    try {
        const response = await fetch(url);
        const data = await response.arrayBuffer();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        return res.status(200).send(Buffer.from(data));
    } catch (e) {
        return res.status(500).send(e.message);
    }
}
