const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Cấu hình kênh nhận thông báo cảnh báo bảo mật khẩn cấp')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt => 
            opt.setName('kenh')
               .setDescription('Kênh văn bản dùng để gửi log cảnh báo')
               .addChannelTypes(ChannelType.GuildText)
               .setRequired(true)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('kenh');

        db.updateGuildConfig(interaction.guildId, { logChannelId: channel.id });

        return interaction.reply({
            content: `✅ Đã thiết lập kênh nhận cảnh báo bảo mật Anti-Nuke tại <#${channel.id}>!`
        });
    }
};
