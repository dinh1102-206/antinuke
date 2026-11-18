const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./src/config');
const eventHandler = require('./src/handlers/eventHandler');
const commandHandler = require('./src/handlers/commandHandler');

// Anti-crash prevention
process.on('unhandledRejection', (reason, promise) => {
    console.error('[AntiCrash] 🚨 Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error(`[AntiCrash] 🚨 Uncaught Exception: ${err.message}`, origin);
});

// Initialize Client with all necessary intents for Anti-Nuke
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Cần bật Server Members Intent trên Developer Portal
        GatewayIntentBits.GuildModeration, // Cho ban/kick logs
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// Load handlers
commandHandler(client);
eventHandler(client);

// Check Token
if (!config.token) {
    console.error('❌ DISCORD_TOKEN chưa được cấu hình!');
    console.error('👉 Vui lòng tạo file .env dựa trên .env.example và điền Token của bạn.');
    process.exit(1);
}

// Log in to Discord
client.login(config.token).catch(err => {
    console.error('❌ Đăng nhập thất bại:', err.message);
    if (err.message.includes('disallowed intents')) {
        console.error('👉 LƯU Ý QUAN TRỌNG: Bạn cần truy cập Discord Developer Portal -> Bot -> Kéo xuống phần "Privileged Gateway Intents" và BẬT "Server Members Intent"!');
    }
});
