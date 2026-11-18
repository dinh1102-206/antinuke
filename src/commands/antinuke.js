const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Quản lý trạng thái hệ thống bảo vệ Anti-Nuke')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('toggle')
               .setDescription('Bật hoặc tắt hệ thống Anti-Nuke')
               .addBooleanOption(opt => 
                   opt.setName('trang_thai')
                      .setDescription('Chọn True để Bật, False để Tắt')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub => 
            sub.setName('restore')
               .setDescription('Bật hoặc tắt tính năng tự động khôi phục kênh/vai trò khi bị xoá')
               .addBooleanOption(opt => 
                   opt.setName('trang_thai')
                      .setDescription('Chọn True để Bật tự động khôi phục, False để Tắt')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub => 
            sub.setName('status')
               .setDescription('Xem trạng thái chi tiết của tất cả module bảo vệ')
        ),

    async execute(interaction) {
        // Only Guild Owner or Bot Owner can toggle the main antinuke
        const isOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === config.botOwnerId;
        const sub = interaction.options.getSubcommand();

        if (sub === 'toggle') {
            if (!isOwner) {
                return interaction.reply({
                    content: '❌ Chỉ có **Chủ sở hữu máy chủ (Server Owner)** mới có quyền bật/tắt Anti-Nuke toàn diện!',
                    ephemeral: true
                });
            }

            const state = interaction.options.getBoolean('trang_thai');
            db.updateGuildConfig(interaction.guildId, { enabled: state });

            const embed = new EmbedBuilder()
                .setTitle(state ? '🛡️ Hệ Thống Anti-Nuke ĐÃ KÍCH HOẠT' : '⚠️ Hệ Thống Anti-Nuke ĐÃ TẮT')
                .setDescription(state 
                    ? 'Máy chủ hiện đã được bảo vệ trước các cuộc tấn công nuking, raid và bot độc hại!' 
                    : 'Cảnh báo: Máy chủ đang không được bảo vệ tự động!')
                .setColor(state ? config.colors.success : config.colors.danger)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'restore') {
            if (!isOwner) {
                return interaction.reply({
                    content: '❌ Chỉ có **Chủ sở hữu máy chủ (Server Owner)** mới có quyền cấu hình tính năng này!',
                    ephemeral: true
                });
            }

            const state = interaction.options.getBoolean('trang_thai');
            db.updateGuildConfig(interaction.guildId, { autoRestore: state });

            return interaction.reply({
                content: `✅ Đã ${state ? '**BẬT**' : '**TẮT**'} tính năng tự động khôi phục kênh và vai trò khi bị xoá!`,
                ephemeral: true
            });
        }

        if (sub === 'status') {
            const guildConfig = db.getGuildConfig(interaction.guildId);
            const modules = guildConfig.modules || {};

            const embed = new EmbedBuilder()
                .setTitle(`🛡️ Bảng Điều Khiển Bảo Vệ - ${interaction.guild.name}`)
                .setColor(guildConfig.enabled ? config.colors.primary : config.colors.warning)
                .addFields(
                    { name: 'Trạng thái tổng thể', value: guildConfig.enabled ? '🟢 Đang Bật' : '🔴 Đang Tắt', inline: true },
                    { name: 'Hình phạt', value: `\`${guildConfig.punishment.toUpperCase()}\``, inline: true },
                    { name: 'Tự động khôi phục', value: guildConfig.autoRestore ? '🟢 Bật' : '🔴 Tắt', inline: true },
                    { name: 'Kênh Log Cảnh Báo', value: guildConfig.logChannelId ? `<#${guildConfig.logChannelId}>` : '⚠️ Chưa cấu hình', inline: true },
                    { name: 'Danh sách Whitelist', value: `${guildConfig.whitelist?.length || 0} người`, inline: true },
                    { 
                        name: 'Các Module Bảo Vệ', 
                        value: [
                            `• Anti Ban: ${modules.antiBan?.enabled ? '✅' : '❌'} (Tối đa ${modules.antiBan?.limit || 1} lần / ${modules.antiBan?.timeWindow || 10}s)`,
                            `• Anti Kick: ${modules.antiKick?.enabled ? '✅' : '❌'} (Tối đa ${modules.antiKick?.limit || 1} lần / ${modules.antiKick?.timeWindow || 10}s)`,
                            `• Anti Xoá Kênh: ${modules.antiChannelDelete?.enabled ? '✅' : '❌'}`,
                            `• Anti Tạo Kênh Spam: ${modules.antiChannelCreate?.enabled ? '✅' : '❌'}`,
                            `• Anti Sửa Kênh: ${modules.antiChannelUpdate?.enabled ? '✅' : '❌'}`,
                            `• Anti Xoá Role: ${modules.antiRoleDelete?.enabled ? '✅' : '❌'}`,
                            `• Anti Tạo Role Spam: ${modules.antiRoleCreate?.enabled ? '✅' : '❌'}`,
                            `• Anti Cấp Quyền Admin Lén: ${modules.antiMemberRoleUpdate?.enabled ? '✅' : '❌'}`,
                            `• Anti Bot Lạ: ${modules.antiBotAdd?.enabled ? '✅' : '❌'} (Tức thì)`,
                            `• Anti Đổi Tên Server: ${modules.antiServerUpdate?.enabled ? '✅' : '❌'}`,
                            `• Anti Webhook: ${modules.antiWebhook?.enabled ? '✅' : '❌'}`
                        ].join('\n'),
                        inline: false 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Discord Anti-Nuke Shield' });

            return interaction.reply({ embeds: [embed] });
        }
    }
};
