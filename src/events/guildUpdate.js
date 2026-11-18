const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { getAuditEntry } = require('../utils/audit');
const { punish } = require('../utils/punisher');

module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild) {
        const guildConfig = db.getGuildConfig(newGuild.id);
        if (!guildConfig.enabled || !guildConfig.modules?.antiServerUpdate?.enabled) return;

        // Check if sensitive properties changed
        const nameChanged = oldGuild.name !== newGuild.name;
        const iconChanged = oldGuild.icon !== newGuild.icon;
        const bannerChanged = oldGuild.banner !== newGuild.banner;
        const vanityChanged = oldGuild.vanityURLCode !== newGuild.vanityURLCode;

        if (!nameChanged && !iconChanged && !bannerChanged && !vanityChanged) return;

        const entry = await getAuditEntry(newGuild, AuditLogEvent.GuildUpdate, null, 10, 2);
        if (!entry || !entry.executor) return;

        const executor = entry.executor;
        if (db.isImmune(newGuild, executor.id)) return;

        const changes = [];
        if (nameChanged) changes.push(`Tên: "${oldGuild.name}" -> "${newGuild.name}"`);
        if (iconChanged) changes.push('Ảnh đại diện máy chủ (Icon)');
        if (bannerChanged) changes.push('Banner máy chủ');
        if (vanityChanged) changes.push(`Vanity URL: "${oldGuild.vanityURLCode}" -> "${newGuild.vanityURLCode}"`);

        await punish(
            newGuild,
            executor,
            'Thay Đổi Cấu Hình Máy Chủ Trái Phép (Guild Update)',
            changes.join('\n')
        );

        // Revert name if changed
        if (nameChanged && newGuild.members.me?.permissions.has('ManageGuild')) {
            await newGuild.setName(oldGuild.name, '[Anti-Nuke] Khôi phục tên máy chủ ban đầu').catch(() => null);
        }
    }
};
