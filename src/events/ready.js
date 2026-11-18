const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[AntiNuke] ✅ Bot đã sẵn sàng và đang hoạt động dưới tên: ${client.user.tag}`);
        console.log(`[AntiNuke] 🛡️ Đang bảo vệ ${client.guilds.cache.size} máy chủ.`);

        client.user.setPresence({
            activities: [{ name: 'Bảo vệ máy chủ 24/7 | /help', type: ActivityType.Watching }],
            status: 'online'
        });
    }
};
