const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function buildHelpEmbed() {
    return new EmbedBuilder()
        .setTitle('Sistem Bantuan Scalper Engine')
        .setColor(0xFAA61A)
        .setDescription('Daftar perintah yang tersedia (Mendukung Prefix dan Slash Command).')
        .addFields(
            { name: '📊 Analitik Fiat', value: `\`${config.prefix}price\`\nMenampilkan grafik harga IDR & USD untuk BGL.` },
            { name: '🛒 Analitik Item', value: `\`${config.prefix}price <kategori> <item>\`\nCari barang In-Game secara real-time. (Contoh: \`!price seeds acid\`)` },
            { name: '🎲 Mini Games', value: `\`${config.prefix}crash <jumlah> <wl/dl/bgl>\`\nGame Market Crash. (Contoh: \`!crash 5 bgl\`)` },
            { name: '🛠️ Server Setup (Admin)', value: `\`${config.prefix}setup\` atau \`${config.prefix}setupplus\`` }
        )
        .setFooter({ text: 'Scalper Profesional Tools' })
        .setTimestamp();
}

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder().setName('help').setDescription('Menampilkan daftar perintah'),
    async executeSlash(interaction) { await interaction.reply({ embeds: [buildHelpEmbed()] }); },
    async executePrefix(message, args) { await message.reply({ embeds: [buildHelpEmbed()] }); }
};