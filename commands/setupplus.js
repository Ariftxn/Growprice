const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const wait = (ms) => new Promise(res => setTimeout(res, ms));

module.exports = {
    name: 'setupplus',
    data: new SlashCommandBuilder()
        .setName('setupplus')
        .setDescription('Copy Channels dan Roles secara lengkap'),
        
    async executeSlash(interaction) { await this.runCode(interaction, interaction.channel); },
    async executePrefix(message, args) { await this.runCode(message, message.channel); },

    async runCode(ctx, channel) {
        if (!ctx.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const templatePath = path.join(__dirname, '../template-aktif.json'); 
        if (!fs.existsSync(templatePath)) return ctx.reply("❌ Scrape dulu!");

        const { layout, roles } = JSON.parse(fs.readFileSync(templatePath));
        const guild = ctx.guild;

        await channel.setName('progres');
        const msg = await ctx.reply("🚀 Memulai Setup Plus (Channels & Roles)...");

        const existingChannels = await guild.channels.fetch();
        const excludeIds = [channel.id];
        if (channel.parentId) excludeIds.push(channel.parentId);

        const channelsToDelete = existingChannels.filter(ch => !excludeIds.includes(ch.id));
        for (const [id, ch] of channelsToDelete) { 
            try { await ch.delete(); await wait(400); } catch (e) {} 
        }

        const existingRoles = await guild.roles.fetch();
        for (const [id, r] of existingRoles) {
            if (r.name !== "@everyone" && r.editable && !r.managed) {
                try { await r.delete(); await wait(400); } catch (e) {}
            }
        }

        if (roles) {
            const reversedRoles = roles.slice().reverse();
            for (const r of reversedRoles) {
                try {
                    await guild.roles.create({
                        name: r.name, color: r.color, hoist: r.hoist, permissions: BigInt(r.permissions)
                    });
                    await wait(800);
                } catch (e) {}
            }
        }

        const layoutData = layout || [];
        for (const cat of layoutData) {
            try {
                const category = await guild.channels.create({ name: cat.categoryName, type: ChannelType.GuildCategory });
                await wait(800);
                for (const ch of cat.channels) {
                    await guild.channels.create({
                        name: ch.name,
                        type: ch.type === 2 ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: category.id
                    });
                    await wait(800);
                }
            } catch (e) {}
        }

        try { fs.unlinkSync(templatePath); } catch (err) {}
        await wait(3000);
        await channel.delete();
    }
};