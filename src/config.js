require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    botOwnerId: process.env.BOT_OWNER_ID || '',
    defaultPrefix: process.env.PREFIX || '!',
    
    // Default server configuration
    defaultGuildConfig: {
        enabled: true,
        punishment: 'ban', // 'ban' | 'kick' | 'strip_roles'
        logChannelId: null,
        autoRestore: true, // Auto restore deleted channels/roles
        whitelist: [], // Array of trusted user IDs
        extraOwners: [], // Array of extra owners
        
        // Limits: number of actions allowed within timeWindow (seconds)
        // 1 action within 10s -> trigger punishment on threshold
        modules: {
            antiBan: { enabled: true, limit: 1, timeWindow: 10 },
            antiKick: { enabled: true, limit: 1, timeWindow: 10 },
            antiChannelDelete: { enabled: true, limit: 1, timeWindow: 10 },
            antiChannelCreate: { enabled: true, limit: 2, timeWindow: 10 },
            antiChannelUpdate: { enabled: true, limit: 2, timeWindow: 10 },
            antiRoleDelete: { enabled: true, limit: 1, timeWindow: 10 },
            antiRoleCreate: { enabled: true, limit: 2, timeWindow: 10 },
            antiRoleUpdate: { enabled: true, limit: 2, timeWindow: 10 },
            antiBotAdd: { enabled: true }, // Always instant
            antiMemberRoleUpdate: { enabled: true }, // Dangerous admin role grants
            antiServerUpdate: { enabled: true }, // Server rename / icon wipe
            antiWebhook: { enabled: true, limit: 1, timeWindow: 10 }
        }
    },

    colors: {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        danger: 0xED4245,
        dark: 0x2B2D31
    }
};
