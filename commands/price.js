const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('node:fs');
const { generateChart } = require('../utils/chartMaker');
const { formatInGameCurrency, scrapeSpecificItem } = require('../utils/scraper');
const stickers = require('../sticker.json');

async function buildFiatResponse(db) {
    const today = db[db.length - 1];
    
    // Siapkan data sumbu X (Bulan-Tanggal) dan Y (Harga IDR) untuk chart utama
    const chartData = db.map(d => ({
        label: d.date.slice(5), // Ambil MM-DD (Contoh: 05-02)
        value: d.idr.last
    })).filter(d => d.value > 0);

    const chartBuffer = await generateChart(chartData, 'Rp');
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'fiat-chart.png' });

    const embed = new EmbedBuilder()
        .setTitle(`Market Intelligence: BGL Fiat Chart`)
        .setColor(0x2B2D31)
        .setDescription(`Laporan akumulasi pasar terkini untuk aset ${stickers.bgl}`)
        .addFields(
            { name: '🌐 USD Rate (Intl)', value: `**Tertinggi:** $${today.usd.high}\n**Terendah:** $${today.usd.low}\n**Terakhir:** $${today.usd.last}`, inline: true },
            { name: '🇮🇩 IDR Rate (Lokal)', value: `**Tertinggi:** Rp${today.idr.high}\n**Terendah:** Rp${today.idr.low}\n**Terakhir:** Rp${today.idr.last}`, inline: true }
        )
        .setImage('attachment://fiat-chart.png')
        .setFooter({ text: 'Scalper Financial Analytics' })
        .setTimestamp();

    return { embeds: [embed], files: [attachment] };
}

async function buildItemResponse(category, itemKeyword) {
    const result = await scrapeSpecificItem(category, itemKeyword);
    if (result.error) return { content: `⚠️ ${result.error}` };

    const chartBuffer = await generateChart(result.chartData); 
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'item-chart.png' });

    const embed = new EmbedBuilder()
        .setTitle(`In-Game Market: ${itemKeyword.toUpperCase()}`)
        .setColor(0x4ade80)
        .setDescription(`Analisis nilai tukar barang secara real-time dari bursa.`)
        .addFields(
            { name: '📈 Harga Tertinggi', value: formatInGameCurrency(result.stats.high), inline: false },
            { name: '📉 Harga Terendah', value: formatInGameCurrency(result.stats.low), inline: false },
            { name: '💰 Harga Terakhir', value: formatInGameCurrency(result.stats.last), inline: false }
        )
        .setImage('attachment://item-chart.png')
        .setFooter({ text: `Kategori: ${category} | Scalper Market Engine` })
        .setTimestamp();

    return { embeds: [embed], files: [attachment] };
}

module.exports = {
    name: 'price',
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Pantau harga BGL (Fiat) atau Harga Barang (In-Game)')
        .addStringOption(opt => opt.setName('kategori').setDescription('Contoh: seeds, hats').setRequired(false))
        .addStringOption(opt => opt.setName('item').setDescription('Contoh: acid, rayman').setRequired(false)),

    async executeSlash(interaction) {
        await interaction.deferReply();
        const categoryParam = interaction.options.getString('kategori');
        const itemParam = interaction.options.getString('item');

        if (categoryParam && itemParam) {
            const response = await buildItemResponse(categoryParam, itemParam);
            await interaction.editReply(response);
        } else {
            let db = [];
            if (fs.existsSync('./db.json')) db = JSON.parse(fs.readFileSync('./db.json'));
            if (db.length === 0) return interaction.editReply("⏳ Database Fiat sedang disinkronkan, coba lagi beberapa detik.");
            const response = await buildFiatResponse(db);
            await interaction.editReply(response);
        }
    },

    async executePrefix(message, args) {
        if (args.length >= 2) {
            const category = args[0];
            const itemKeyword = args.slice(1).join(" ");
            const loadingMsg = await message.reply(`🔍 Memindai pasar untuk mencari **${itemKeyword}**...`);
            const response = await buildItemResponse(category, itemKeyword);
            
            if (response.content) await loadingMsg.edit(response.content);
            else { await loadingMsg.delete(); await message.reply(response); }
        } else {
            let db = [];
            if (fs.existsSync('./db.json')) db = JSON.parse(fs.readFileSync('./db.json'));
            if (db.length === 0) return message.reply("⏳ Database Fiat sedang disinkronkan, coba beberapa detik lagi.");
            
            const loadingMsg = await message.reply("⏳ Memuat data bursa Fiat...");
            const response = await buildFiatResponse(db);
            await loadingMsg.delete();
            await message.reply(response);
        }
    }
};