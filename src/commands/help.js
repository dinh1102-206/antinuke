const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem hướng dẫn sử dụng và bảng lệnh của Anti-Nuke Bot'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ HƯỚNG DẪN CẤU HÌNH BOT ANTI-NUKE')
            .setColor(config.colors.primary)
            .setDescription('Bot bảo vệ máy chủ Discord tự động ngăn chặn kẻ phá hoại, raid, bot độc hại và admin biến chất.')
            .addFields(
                {
                    name: '📜 Danh Sách Lệnh Chính',
                    value: [
                        '`/antinuke status` - Xem trạng thái tất cả các lớp bảo vệ',
                        '`/antinuke toggle` - Bật / Tắt hệ thống Anti-Nuke (Chỉ Server Owner)',
                        '`/antinuke restore` - Bật / Tắt tự động khôi phục kênh/role khi bị xoá',
                        '`/whitelist add|remove|list` - Quản lý danh sách người được tin tưởng',
                        '`/punishment [ban|kick|strip_roles]` - Cài đặt hình phạt khi phát hiện phá hoại',
                        '`/setlogs [kênh]` - Thiết lập kênh nhận thông báo bảo mật khẩn cấp',
                        '`/backup create|info` - Tạo hoặc xem thông tin sao lưu máy chủ'
                    ].join('\n')
                },
                {
                    name: '⚠️ QUY TẮC BẮT BUỘC ĐỂ BOT HOẠT ĐỘNG HIỆU QUẢ',
                    value: [
                        '1. **Kéo Role của Bot lên cao nhất**: Vào *Server Settings -> Roles*, kéo role của Bot lên trên tất cả role của Admin/Mod khác (Bot chỉ có thể phạt người có role thấp hơn nó).',
                        '2. **Cấp quyền Administrator**: Bot cần quyền Quản trị viên để có thể tự động ban, kick, tước role và khôi phục kênh.',
                        '3. **Chỉ tin tưởng người trong Whitelist**: Bất kỳ ai không có trong `/whitelist` nếu xoá kênh/ban người hàng loạt sẽ bị xử lý ngay lập tức.'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Phiên bản Anti-Nuke Bot v1.0.0 | discord.js v14' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
