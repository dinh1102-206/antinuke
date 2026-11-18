const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Quản lý danh sách người dùng được miễn trừ kiểm tra Anti-Nuke')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('add')
               .setDescription('Thêm người dùng vào danh sách Whitelist')
               .addUserOption(opt => 
                   opt.setName('nguoi_dung')
                      .setDescription('Chọn thành viên cần thêm vào danh sách tin cậy')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub => 
            sub.setName('remove')
               .setDescription('Xoá người dùng khỏi danh sách Whitelist')
               .addUserOption(opt => 
                   opt.setName('nguoi_dung')
                      .setDescription('Chọn thành viên cần xoá khỏi danh sách tin cậy')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub => 
            sub.setName('list')
               .setDescription('Xem toàn bộ danh sách thành viên Whitelist')
        ),

    async execute(interaction) {
        const isOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === config.botOwnerId;
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const guildConfig = db.getGuildConfig(interaction.guildId);
            const whitelist = guildConfig.whitelist || [];

            const embed = new EmbedBuilder()
                .setTitle(`📋 Danh Sách Whitelist - ${interaction.guild.name}`)
                .setColor(config.colors.primary)
                .setDescription(whitelist.length > 0 
                    ? whitelist.map((id, index) => `${index + 1}. <@${id}> (\`${id}\`)`).join('\n')
                    : 'Chưa có ai trong danh sách Whitelist ngoại trừ Chủ sở hữu máy chủ.')
                .addFields(
                    { name: '👑 Chủ sở hữu mặc định (Miễn trừ tuyệt đối)', value: `<@${interaction.guild.ownerId}>` }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // Add & Remove require Owner permission
        if (!isOwner) {
            return interaction.reply({
                content: '❌ Để đảm bảo an toàn tuyệt đối, chỉ **Chủ sở hữu máy chủ (Server Owner)** mới có quyền chỉnh sửa Whitelist!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('nguoi_dung');
        const guildConfig = db.getGuildConfig(interaction.guildId);
        let whitelist = [...(guildConfig.whitelist || [])];

        if (sub === 'add') {
            if (targetUser.id === interaction.guild.ownerId) {
                return interaction.reply({ content: 'ℹ️ Chủ sở hữu máy chủ mặc định luôn được miễn trừ!', ephemeral: true });
            }
            if (whitelist.includes(targetUser.id)) {
                return interaction.reply({ content: '⚠️ Người dùng này đã nằm trong Whitelist từ trước!', ephemeral: true });
            }

            whitelist.push(targetUser.id);
            db.updateGuildConfig(interaction.guildId, { whitelist });

            return interaction.reply({
                content: `✅ Đã thêm **${targetUser.tag}** (\`${targetUser.id}\`) vào danh sách Whitelist!`
            });
        }

        if (sub === 'remove') {
            if (!whitelist.includes(targetUser.id)) {
                return interaction.reply({ content: '⚠️ Người dùng này không có trong danh sách Whitelist!', ephemeral: true });
            }

            whitelist = whitelist.filter(id => id !== targetUser.id);
            db.updateGuildConfig(interaction.guildId, { whitelist });

            return interaction.reply({
                content: `✅ Đã xoá **${targetUser.tag}** (\`${targetUser.id}\`) khỏi danh sách Whitelist!`
            });
        }
    }
};
