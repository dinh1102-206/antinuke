const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const limiter = require('../utils/limiter');
const { punish } = require('../utils/punisher');

const DANGEROUS_PERMS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.MentionEveryone
];

module.exports = {
    name: 'roleUpdate',
    async execute(oldRole, newRole) {
        const guild = newRole.guild;
        if (!guild) return;

        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiRoleUpdate?.enabled) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.RoleUpdate, newRole.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        // Check if dangerous permissions were newly added
        const hadDangerous = DANGEROUS_PERMS.some(p => oldRole.permissions.has(p));
        const hasDangerous = DANGEROUS_PERMS.some(p => newRole.permissions.has(p));

        const newlyAddedDangerous = !hadDangerous && hasDangerous;

        const modConfig = guildConfig.modules.antiRoleUpdate;
        const shouldPunish = newlyAddedDangerous || limiter.checkAndRecord(
            guild.id,
            'roleUpdate',
            executor.id,
            modConfig.limit || 2,
            modConfig.timeWindow || 10
        );

        if (shouldPunish) {
            await punish(
                guild,
                executor,
                newlyAddedDangerous ? 'Cấp Quyền Quản Trị Trái Phép (Dangerous Perms Given)' : 'Chỉnh Sửa Vai Trò Trái Phép (Role Update)',
                `Vai trò bị chỉnh sửa: **@${newRole.name}** (\`${newRole.id}\`)`
            );

            // Revert permissions and name
            if (guild.members.me?.permissions.has('ManageRoles') && newRole.position < guild.members.me.roles.highest.position) {
                await newRole.edit({
                    name: oldRole.name,
                    color: oldRole.color,
                    hoist: oldRole.hoist,
                    mentionable: oldRole.mentionable,
                    permissions: oldRole.permissions,
                    reason: '[Anti-Nuke] Khôi phục vai trò về trạng thái an toàn ban đầu'
                }).catch(() => null);
            }
        }
    }
};
