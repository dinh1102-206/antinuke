const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command) {
        commands.push(command.data.toJSON());
    }
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('❌ Vui lòng điền DISCORD_TOKEN và CLIENT_ID vào file .env trước khi đăng ký lệnh!');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`[SlashDeploy] 🔄 Bắt đầu nạp ${commands.length} lệnh (/) ứng dụng...`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`[SlashDeploy] ✅ Đã đăng ký thành công ${data.length} lệnh (/) toàn cầu!`);
    } catch (error) {
        console.error('[SlashDeploy] ❌ Lỗi khi đăng ký lệnh:', error);
    }
})();
