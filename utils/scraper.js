const axios = require('axios');
const fs = require('node:fs');
const config = require('../config.json');
const itemsDb = require('../items.json');

// --- In-Game Converter ---
function parseInGamePrice(text) {
    const regex = /(\d+(?:\.\d+)?)\s*(bgl|dl|wl)/gi;
    let totalWl = 0, match, found = false;
    while ((match = regex.exec(text)) !== null) {
        found = true;
        let amount = parseFloat(match[1]), currency = match[2].toLowerCase();
        if (currency === 'bgl') totalWl += amount * 10000;
        if (currency === 'dl') totalWl += amount * 100;
        if (currency === 'wl') totalWl += amount;
    }
    return found ? totalWl : null;
}

function formatInGameCurrency(totalWl) {
    if (!totalWl) return "0 WL";
    let bgl = Math.floor(totalWl / 10000), rem = totalWl % 10000;
    let dl = Math.floor(rem / 100), wl = Math.round(rem % 100);
    let res = [];
    if (bgl > 0) res.push(`${bgl} BGL`);
    if (dl > 0) res.push(`${dl} DL`);
    if (wl > 0) res.push(`${wl} WL`);
    return res.join(" ");
}

// --- History Builder (Menyusun Chart ke Belakang) ---
function processHistoricalMessages(messages, type) {
    let dailyData = {};
    messages.forEach(msg => {
        const date = msg.timestamp.split('T')[0]; 
        const cleanText = msg.content.replace(/\s+/g, '').toLowerCase();
        let matches = [];

        if (type === 'IDR') {
            let regex = /(\d{1,3}(?:\.\d{3})*)/g;
            let m;
            while ((m = regex.exec(cleanText)) !== null) {
                let price = parseFloat(m[1].replace(/\./g, ''));
                if (price >= 1000 && price <= 50000) matches.push(price); // Ambil angka BGL saja
            }
        } else { // USD
            let regex = /(\d+(?:\.\d+)?)/g;
            let m;
            while ((m = regex.exec(cleanText)) !== null) {
                let price = parseFloat(m[1]);
                if (price >= 0.1 && price <= 20) matches.push(price); // Pasti harga USD BGL
            }
        }

        if (matches.length > 0) {
            if (!dailyData[date]) dailyData[date] = [];
            dailyData[date].push(...matches);
        }
    });

    let history = [];
    for (let date in dailyData) {
        let valid = dailyData[date];
        history.push({
            date: date,
            high: Math.max(...valid),
            low: Math.min(...valid),
            last: valid[0] // Pesan teratas di hari itu
        });
    }
    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calculateStats(prices) {
    if (prices.length === 0) return { high: 0, low: 0, last: 0 };
    return { high: Math.max(...prices), low: Math.min(...prices), last: prices[0] };
}

// Fitur Pencarian Spesifik
async function scrapeSpecificItem(categoryKey, keyword) {
    const channelId = itemsDb[categoryKey.toLowerCase()];
    if (!channelId) return { error: `Kategori **${categoryKey}** tidak ditemukan.` };

    try {
        const headers = { 'Authorization': config.userToken };
        const res = await axios.get(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, { headers });
        let allPricesWl = [];
        res.data.reverse().forEach(msg => {
            if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
                const p = parseInGamePrice(msg.content);
                if (p) allPricesWl.push(p);
            }
        });
        if (allPricesWl.length === 0) return { error: `Tidak ada data transaksi **${keyword}**.` };
        
        let chartData = allPricesWl.map((val, i) => ({ label: `Trx ${i+1}`, value: val }));
        return { chartData, stats: calculateStats(allPricesWl) };
    } catch (err) { return { error: "Akses ke server target terputus." }; }
}

async function scrapeMarketData() {
    try {
        const headers = { 'Authorization': config.userToken };
        // Tarik 100 pesan ke belakang agar chart terbentuk!
        const [idrRes, intlRes] = await Promise.all([
            axios.get(`https://discord.com/api/v10/channels/${config.channelIdr}/messages?limit=100`, { headers }),
            axios.get(`https://discord.com/api/v10/channels/${config.channelIntl}/messages?limit=100`, { headers })
        ]);

        const idrHistory = processHistoricalMessages(idrRes.data, 'IDR');
        const usdHistory = processHistoricalMessages(intlRes.data, 'USD');

        // Gabungkan tanggal yang ada
        let mergedDb = {};
        idrHistory.forEach(d => { mergedDb[d.date] = { date: d.date, idr: { high: d.high, low: d.low, last: d.last }, usd: { high: 0, low: 0, last: 0 }}; });
        usdHistory.forEach(d => {
            if (!mergedDb[d.date]) mergedDb[d.date] = { date: d.date, idr: { high: 0, low: 0, last: 0 }, usd: { high: 0, low: 0, last: 0 }};
            mergedDb[d.date].usd = { high: d.high, low: d.low, last: d.last };
        });

        // Simpan ke db.json
        let finalDb = Object.values(mergedDb).sort((a, b) => new Date(a.date) - new Date(b.date));
        if (finalDb.length > 30) finalDb = finalDb.slice(-30);
        fs.writeFileSync('./db.json', JSON.stringify(finalDb, null, 2));

        return finalDb[finalDb.length - 1]; // Return data hari ini
    } catch (err) { 
        console.error("❌ Scraper Error:", err.response ? err.response.statusText : err.message); 
        return null; 
    }
}

module.exports = { scrapeMarketData, scrapeSpecificItem, formatInGameCurrency };