const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'roleDelete',
    async execute(role) {
        const guild = role.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiRoleDelete?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.RoleDelete, role.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        const modConfig = guildConfig.modules.antiRoleDelete;
        const shouldPunish = limiter.checkAndRecord(
            guild.id,
            'roleDelete',
            executor.id,
            modConfig.limit || 1,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                'Xoá Vai Trò (Role Delete)',
                `Vai trò bị xoá: **@${role.name}** (\`${role.id}\`)`
            );
        }

        // Auto recreate role if enabled
        if (guildConfig.autoRestore && guild.members.me?.permissions.has('ManageRoles')) {
            try {
                await guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions,
                    position: role.position,
                    reason: `[Anti-Nuke] Tự động khôi phục vai trò bị xoá bởi ${executor.tag || executor.id}`
                });
            } catch (err) {
                console.error(`[AntiNuke] Không thể khôi phục vai trò ${role.name}:`, err.message);
            }
        }
    }
};
