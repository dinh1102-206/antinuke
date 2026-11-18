const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Only trigger on Bot accounts
        if (!member.user.bot) return;

        const guild = member.guild;
        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiBotAdd?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.BotAdd, member.id, 10, 2);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;

        // If the inviter is the server owner or whitelisted, allow it
        if (db.isImmune(guild, executor.id)) return;

        // Immediately ban the unauthorized bot
        try {
            await member.ban({
                reason: `[Anti-Nuke] Bot trái phép được thêm bởi người dùng không có thẩm quyền (${executor.tag || executor.id})`
            });
        } catch (err) {
            console.error(`[AntiNuke] Không thể ban bot trái phép ${member.user.tag}:`, err.message);
        }

        // Punish the executor who invited the bot
        await punish(
            guild,
            executor,
            'Thêm Bot Trái Phép (Unauthorized Bot Add)',
            `Bot độc hại vừa được thêm: **${member.user.tag}** (\`${member.id}\`)`
        );
    }
};
