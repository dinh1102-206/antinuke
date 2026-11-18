const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Hệ thống sao lưu và khôi phục cấu trúc máy chủ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('create')
               .setDescription('Tạo một bản sao lưu toàn bộ kênh và vai trò hiện tại của máy chủ')
        )
        .addSubcommand(sub => 
            sub.setName('info')
               .setDescription('Xem thông tin bản sao lưu gần nhất')
        ),

    async execute(interaction) {
        const isOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === config.botOwnerId;
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            if (!isOwner) {
                return interaction.reply({
                    content: '❌ Chỉ có **Chủ sở hữu máy chủ (Server Owner)** mới có quyền tạo bản sao lưu!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const guild = interaction.guild;
            
            // Backup Roles
            const rolesData = guild.roles.cache
                .filter(r => r.id !== guild.id && !r.managed)
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    color: r.color,
                    hoist: r.hoist,
                    position: r.position,
                    permissions: r.permissions.bitfield.toString(),
                    mentionable: r.mentionable
                }));

            // Backup Channels
            const channelsData = guild.channels.cache.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                position: c.position,
                parentId: c.parentId,
                topic: c.topic || null,
                nsfw: c.nsfw || false,
                permissionOverwrites: c.permissionOverwrites?.cache?.map(o => ({
                    id: o.id,
                    allow: o.allow.bitfield.toString(),
                    deny: o.deny.bitfield.toString(),
                    type: o.type
                })) || []
            }));

            const backupPayload = {
                guildId: guild.id,
                guildName: guild.name,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.tag,
                rolesCount: rolesData.length,
                channelsCount: channelsData.length,
                roles: rolesData,
                channels: channelsData
            };

            db.saveBackup(guild.id, backupPayload);

            const embed = new EmbedBuilder()
                .setTitle('📦 Tạo Bản Sao Lưu Thành Công')
                .setColor(config.colors.success)
                .addFields(
                    { name: 'Kênh đã lưu', value: `${channelsData.length} kênh`, inline: true },
                    { name: 'Vai trò đã lưu', value: `${rolesData.length} vai trò`, inline: true },
                    { name: 'Thời gian sao lưu', value: new Date().toLocaleString('vi-VN'), inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Dữ liệu được lưu trữ an toàn trong hệ thống JSON cục bộ' });

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'info') {
            const backup = db.getBackup(interaction.guildId);
            if (!backup) {
                return interaction.reply({
                    content: '⚠️ Máy chủ này chưa có bản sao lưu nào. Hãy dùng `/backup create` để tạo một bản!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Thông Tin Bản Sao Lưu - ${backup.guildName}`)
                .setColor(config.colors.primary)
                .addFields(
                    { name: 'Người tạo', value: backup.createdBy || 'Unknown', inline: true },
                    { name: 'Thời gian', value: new Date(backup.createdAt).toLocaleString('vi-VN'), inline: true },
                    { name: 'Số lượng kênh', value: `${backup.channelsCount} kênh`, inline: true },
                    { name: 'Số lượng vai trò', value: `${backup.rolesCount} vai trò`, inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
