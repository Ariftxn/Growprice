const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
// Membaca semua file di dalam folder commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Mengambil struktur data dari setiap command
    if ('data' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] Command di ${filePath} kehilangan properti 'data'.`);
    }
}

// Menyiapkan REST API Discord
const rest = new REST({ version: '10' }).setToken(config.botToken);

(async () => {
    try {
        console.log(`⏳ Mulai mendaftarkan ${commands.length} Slash Commands...`);

        // Mengirim data command ke Discord secara Global
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`✅ Berhasil mendaftarkan ${data.length} Slash Commands!`);
    } catch (error) {
        console.error("❌ Gagal mendaftarkan commands:", error);
    }
})();