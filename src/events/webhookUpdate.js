const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'webhookUpdate',
    async execute(channel) {
        const guild = channel.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiWebhook?.enabled) return;

        // Check if a webhook was created
        const entry = await getAuditEntry(guild, AuditLogEvent.WebhookCreate, null, 10, 1);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiWebhook;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'webhookCreate',
            executor.id,
            modConfig.limit || 1,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Tạo Webhook Trái Phép (Anti-Webhook)',
                `Tại kênh: **#${channel.name}** (\`${channel.id}\`)`
            );

            // Auto-delete created rogue webhook
            if (guild.members.me?.permissions.has('ManageWebhooks')) {
                const webhooks = await channel.fetchWebhooks().catch(() => null);
                if (webhooks) {
                    for (const [, wh] of webhooks) {
                        if (wh.owner?.id === executor.id) {
                            await wh.delete('[Anti-Nuke] Xoá webhook do người dùng trái phép tạo').catch(() => null);
                        }
                    }
                }
            }
        }
    }
};
