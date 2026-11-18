const { AuditLogEvent } = require('discord.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safely fetches recent audit log entry for a specific action and target
 * @param {import('discord.js').Guild} guild 
 * @param {AuditLogEvent} action 
 * @param {string|null} targetId 
 * @param {number} maxAgeSeconds Max entry age in seconds
 * @param {number} retries Number of retries if not found immediately
 * @returns {Promise<import('discord.js').GuildAuditLogsEntry|null>}
 */
async function getAuditEntry(guild, action, targetId = null, maxAgeSeconds = 10, retries = 2) {
    if (!guild.members.me?.permissions.has('ViewAuditLog')) {
        return null;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const logs = await guild.fetchAuditLogs({
                limit: 5,
                type: action
            });

            const now = Date.now();
            const entry = logs.entries.find((e) => {
                const age = (now - e.createdTimestamp) / 1000;
                if (age > maxAgeSeconds) return false;
                if (targetId && e.target && e.target.id !== targetId) return false;
                return true;
            });

            if (entry) return entry;
        } catch (err) {
            console.error(`[AuditHelper] Error fetching audit logs in ${guild.id}:`, err.message);
        }

        if (attempt < retries) {
            await sleep(250); // Small backoff for Discord API sync
        }
    }

    return null;
}

module.exports = {
    getAuditEntry,
    sleep
};
