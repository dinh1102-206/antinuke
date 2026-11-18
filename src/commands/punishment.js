const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punishment')
        .setDescription('Thiết lập hình phạt khi phát hiện kẻ tấn công server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt => 
            opt.setName('hinh_phat')
               .setDescription('Chọn loại hình phạt áp dụng')
               .setRequired(true)
               .addChoices(
                   { name: '🔨 Ban (Cấm vĩnh viễn khỏi server)', value: 'ban' },
                   { name: '👢 Kick (Đuổi khỏi server)', value: 'kick' },
                   { name: '🔒 Strip Roles (Tước toàn bộ quyền hạn & Role)', value: 'strip_roles' }
               )
        ),

    async execute(interaction) {
        const isOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === config.botOwnerId;
        if (!isOwner) {
            return interaction.reply({
                content: '❌ Chỉ có **Chủ sở hữu máy chủ (Server Owner)** mới có quyền thay đổi hình phạt!',
                ephemeral: true
            });
        }

        const punishment = interaction.options.getString('hinh_phat');
        db.updateGuildConfig(interaction.guildId, { punishment });

        const punishmentMap = {
            ban: '🔨 **BAN** (Cấm vĩnh viễn)',
            kick: '👢 **KICK** (Đuổi khỏi server)',
            strip_roles: '🔒 **STRIP ROLES** (Tước toàn bộ vai trò / Quarantine)'
        };

        return interaction.reply({
            content: `✅ Đã cập nhật hình phạt xử lý kẻ phá hoại thành: ${punishmentMap[punishment]}`
        });
    }
};
