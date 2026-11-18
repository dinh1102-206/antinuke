const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const { punish } = require('../utils/punisher');

const DANGEROUS_PERMS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers
];

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        const guild = newMember.guild;
        const guildConfig = db.getGuildConfig(guild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiMemberRoleUpdate?.enabled) return;

        // Check added roles
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        if (addedRoles.size === 0) return;

        // Check if any newly added role has dangerous permissions
        const dangerousAddedRoles = addedRoles.filter(role => 
            DANGEROUS_PERMS.some(perm => role.permissions.has(perm))
        );

        if (dangerousAddedRoles.size === 0) return;

        const entry = await getAuditEntry(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(guild, executor.id)) return;

        // Revoke the dangerous role from the target
        if (guild.members.me?.permissions.has('ManageRoles')) {
            await newMember.roles.remove(
                dangerousAddedRoles,
                '[Anti-Nuke] Thu hồi vai trò nguy hiểm được cấp trái phép'
            ).catch(() => null);
        }

        // Punish the rogue executor who assigned it
        await punish(
            guild,
            executor,
            'Cấp Vai Trò Quản Trị Trái Phép (Illegal Admin Role Grant)',
            `Cấp vai trò: ${dangerousAddedRoles.map(r => `**@${r.name}**`).join(', ')} cho thành viên <@${newMember.id}>`
        );
    }
};
