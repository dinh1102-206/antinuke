const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'channelCreate',
    async execute(channel) {
        const guild = channel.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiChannelCreate?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.ChannelCreate, channel.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiChannelCreate;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'channelCreate',
            executor.id,
            modConfig.limit || 2,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Tạo Kênh Hàng Loạt (Mass Channel Create)',
                `Kênh vừa tạo: **#${channel.name}** (\`${channel.id}\`)`
            );

            // Auto-delete the spam created channel
            if (guild.members.me?.permissions.has('ManageChannels')) {
                await channel.delete('[Anti-Nuke] Xoá kênh spam do kẻ tấn công tạo').catch(() => null);
            }
        }
    }
};
