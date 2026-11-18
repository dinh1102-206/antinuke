module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[CommandHandler] Lỗi khi thực thi lệnh /${interaction.commandName}:`, error);
            const errorMessage = {
                content: '❌ Đã có lỗi xảy ra khi thực thi lệnh này! Vui lòng thử lại sau.',
                ephemeral: true
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => null);
            } else {
                await interaction.reply(errorMessage).catch(() => null);
            }
        }
    }
};
