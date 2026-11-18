const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban) {
        const guild = ban.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiBan?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.MemberBanAdd, ban.user.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiBan;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'guildBanAdd',
            executor.id,
            modConfig.limit || 1,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Cấm Thành Viên Hàng Loạt (Mass Ban)',
                `Nạn nhân bị cấm: **${ban.user.tag || ban.user.username}** (\`${ban.user.id}\`)`
            );

            // Attempt to unban victim
            if (guild.members.me?.permissions.has('BanMembers')) {
                await guild.bans.remove(ban.user.id, '[Anti-Nuke] Gỡ cấm cho nạn nhân bị ban bởi kẻ tấn công').catch(() => null);
            }
        }
    }
};
