const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { renderCrashGame } = require('../utils/gameCanvas');

function getCrashMultiplier() {
    return Math.random() < 0.5 ? (Math.random() * 0.99) : (1.0 + (Math.random() * 3.0));
}

async function buildCrashResponse(user, amount, currency) {
    const validCurrencies = ['wl', 'dl', 'bgl'];
    const cur = currency.toLowerCase();

    if (isNaN(amount) || amount <= 0) return { content: "⚠️ Nominal bet tidak valid!" };
    if (!validCurrencies.includes(cur)) return { content: "⚠️ Mata uang tidak valid! Gunakan: WL, DL, atau BGL." };

    const multiplier = getCrashMultiplier();
    const payout = multiplier >= 1.0 ? amount * multiplier : 0;
    const canvasBuffer = await renderCrashGame(user.username, amount, cur, multiplier, payout);
    const attachment = new AttachmentBuilder(canvasBuffer, { name: 'crash.png' });

    const isWin = multiplier >= 1.0;
    const embed = new EmbedBuilder()
        .setTitle(isWin ? '📈 WIN! Market Pump!' : '📉 LOSE! Market Crash!')
        .setColor(isWin ? 0x4ade80 : 0xf87171)
        .setDescription(`Permainan selesai. Berikut adalah rekapan transaksi market Anda.`)
        .setImage('attachment://crash.png')
        .setFooter({ text: 'Scalper MiniGames Engine' })
        .setTimestamp();

    return { embeds: [embed], files: [attachment] };
}

module.exports = {
    name: 'crash',
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription('Bermain game Market Crash dengan Locks')
        .addNumberOption(opt => opt.setName('amount').setDescription('Jumlah taruhan').setRequired(true))
        .addStringOption(opt => opt.setName('currency').setDescription('WL / DL / BGL').setRequired(true)),

    async executeSlash(interaction) {
        await interaction.deferReply();
        const amount = interaction.options.getNumber('amount');
        const currency = interaction.options.getString('currency');
        const response = await buildCrashResponse(interaction.user, amount, currency);
        await interaction.editReply(response);
    },

    async executePrefix(message, args) {
        if (args.length < 2) return message.reply(`⚠️ Format salah! Contoh: \`!crash 5 bgl\``);
        const amount = parseFloat(args[0]);
        const currency = args[1];
        const loadingMsg = await message.reply("🎲 Menghubungkan ke pasar gelap...");
        const response = await buildCrashResponse(message.author, amount, currency);
        
        if (response.content) await loadingMsg.edit(response.content);
        else { await loadingMsg.delete(); await message.reply(response); }
    }
};