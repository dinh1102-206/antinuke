const { AuditLogEvent, ChannelType } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'channelDelete',
    async execute(channel) {
        const guild = channel.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiChannelDelete?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.ChannelDelete, channel.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiChannelDelete;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'channelDelete',
            executor.id,
            modConfig.limit || 1,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Xoá Kênh (Channel Delete)',
                `Kênh bị xoá: **#${channel.name}** (\`${channel.id}\`)`
            );
        }

        // Auto-restore channel if enabled
        if (guildConfig.autoRestore && guild.members.me?.permissions.has('ManageChannels')) {
            try {
                const parent = channel.parentId ? guild.channels.cache.get(channel.parentId) : null;
                const permissionOverwrites = channel.permissionOverwrites?.cache?.map(o => ({
                    id: o.id,
                    allow: o.allow,
                    deny: o.deny,
                    type: o.type
                })) || [];

                await guild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    topic: channel.topic || undefined,
                    nsfw: channel.nsfw || undefined,
                    parent: parent ? parent.id : undefined,
                    position: channel.position,
                    permissionOverwrites: permissionOverwrites,
                    reason: `[Anti-Nuke] Tự động khôi phục kênh bị xoá bởi ${executor.tag || executor.id}`
                });
            } catch (err) {
                console.error(`[AntiNuke] Không thể khôi phục kênh ${channel.name}:`, err.message);
            }
        }
    }
};
