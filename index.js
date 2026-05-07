const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config.json');
const { scrapeMarketData } = require('./utils/scraper');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.name) client.commands.set(command.name, command);
}

async function updateBotStatus() {
    console.log("🔄 Menarik data market real-time...");
    const latestData = await scrapeMarketData();
    if (latestData && latestData.idr && latestData.idr.last) {
        // FIX: Status Watching langsung pakai harga IDR/USD BGL terkini
        client.user.setActivity(`Bgl: Rp${latestData.idr.last} | ${config.prefix}help`, { type: ActivityType.Watching });
        console.log(`✅ Status Update: BGL Rp${latestData.idr.last} / $${latestData.usd?.last}`);
    } else {
        console.log("⚠️ Gagal menarik data market. Cek token tumbal.");
    }
}

client.once('clientReady', async () => {
    console.log(`📊 Scalper Engine Online: ${client.user.tag}`);
    await updateBotStatus();
    setInterval(updateBotStatus, config.scrapeIntervalMins * 60000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try { await command.executeSlash(interaction); } catch (e) { console.error(e); }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command || !command.executePrefix) return;
    try { await command.executePrefix(message, args); } catch (e) { console.error(e); }
});

client.login(config.botToken);