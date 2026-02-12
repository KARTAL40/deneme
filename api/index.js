const axios = require('axios');

module.exports = async (req, res) => {
    const channelId = req.query.id || "50448";
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

    try {
        // 1. Token Çekme
        const page = await axios.get(`https://catcast.tv/embed/${channelId}`, { 
            headers: { "User-Agent": userAgent } 
        });
        const tokenMatch = page.data.match(/token[=:]["']?([a-f0-9]{32})["']?/i);
        const token = tokenMatch ? tokenMatch[1] : "";

        // 2. M3U8 Linkini Oluşturma (Autopilot üzerinden)
        const targetUrl = `https://autopilot.catcast.tv/mobile.m3u8?channel_id=${channelId}&token=${token}&server=v2.catcast.tv`;
        
        const response = await axios.get(targetUrl, {
            headers: { 
                "User-Agent": userAgent, 
                "Referer": "https://catcast.tv/" 
            }
        });

        let m3u8Content = response.data;
        
        // 3. Linkleri VLC'nin anlayacağı Tam URL'lere çevirme
        const baseUrl = `https://v2.catcast.tv/hls/`;
        const modifiedLines = m3u8Content.split('\n').map(line => {
            if (line.startsWith('#') || line.trim() === '') return line;
            return line.startsWith('http') ? line : baseUrl + line;
        });

        // 4. Yanıtı Gönderme
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache');
        
        res.status(200).send(modifiedLines.join('\n'));
        
    } catch (error) {
        res.status(500).send("Hata: Sunucuya ulaşılamadı. " + error.message);
    }
};
