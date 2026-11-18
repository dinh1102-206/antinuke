const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const guild = member.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiKick?.enabled) return;

        // Verify if it was a kick (not normal voluntary leave)
        const entry = await getAuditEntry(guild, AuditLogEvent.MemberKick, member.id, 5, 1);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiKick;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'guildMemberKick',
            executor.id,
            modConfig.limit || 1,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Đuổi Thành Viên Hàng Loạt (Mass Kick)',
                `Nạn nhân bị kick: **${member.user.tag || member.user.username}** (\`${member.id}\`)`
            );
        }
    }
};
