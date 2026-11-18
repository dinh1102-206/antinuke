const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'channelUpdate',
    async execute(oldChannel, newChannel) {
        const guild = newChannel.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiChannelUpdate?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.ChannelUpdate, newChannel.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiChannelUpdate;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'channelUpdate',
            executor.id,
            modConfig.limit || 2,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Chỉnh Sửa Kênh Trái Phép (Channel Update)',
                `Kênh bị sửa: **#${newChannel.name}** (\`${newChannel.id}\`)`
            );

            // Revert name if changed
            if (oldChannel.name !== newChannel.name && guild.members.me?.permissions.has('ManageChannels')) {
                await newChannel.setName(oldChannel.name, '[Anti-Nuke] Khôi phục tên kênh ban đầu').catch(() => null);
            }
        }
    }
};
