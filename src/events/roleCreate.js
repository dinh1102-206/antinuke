const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'roleCreate',
    async execute(role) {
        const guild = role.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiRoleCreate?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.RoleCreate, role.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiRoleCreate;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'roleCreate',
            executor.id,
            modConfig.limit || 2,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Tạo Vai Trò Hàng Loạt (Mass Role Create)',
                `Vai trò vừa tạo: **@${role.name}** (\`${role.id}\`)`
            );

            // Delete the spam role
            if (guild.members.me?.permissions.has('ManageRoles') && role.position < guild.members.me.roles.highest.position) {
                await role.delete('[Anti-Nuke] Xoá vai trò spam do kẻ tấn công tạo').catch(() => null);
            }
        }
    }
};
