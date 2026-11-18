const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

module.exports = (client) => {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[CommandHandler] ⚠️ Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute"!`);
        }
    }

    console.log(`[CommandHandler] ✅ Đã nạp thành công ${client.commands.size} lệnh slash.`);
};
