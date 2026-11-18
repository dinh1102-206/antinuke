/**
 * Sliding window action tracker to track user action rates
 */
class ActionLimiter {
    constructor() {
        // Map<guildId_actionType_userId, number[]> (timestamps of actions)
        this.records = new Map();

        // Clean up stale entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Records an action and checks if the user exceeded the limit within the timeWindow.
     * @param {string} guildId 
     * @param {string} actionType 
     * @param {string} userId 
     * @param {number} limit Maximum allowed actions
     * @param {number} timeWindow Time window in seconds
     * @returns {boolean} True if limit is exceeded (should punish), false otherwise
     */
    checkAndRecord(guildId, actionType, userId, limit = 1, timeWindow = 10) {
        const key = `${guildId}:${actionType}:${userId}`;
        const now = Date.now();
        const windowMs = timeWindow * 1000;

        let timestamps = this.records.get(key) || [];
        // Filter out actions outside the window
        timestamps = timestamps.filter(t => now - t <= windowMs);
        
        // Add current action
        timestamps.push(now);
        this.records.set(key, timestamps);

        // If number of actions is >= limit, trigger punishment
        return timestamps.length >= limit;
    }

    /**
     * Resets action history for a user
     */
    reset(guildId, actionType, userId) {
        const key = `${guildId}:${actionType}:${userId}`;
        this.records.delete(key);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, timestamps] of this.records.entries()) {
            const valid = timestamps.filter(t => now - t <= 60000);
            if (valid.length === 0) {
                this.records.delete(key);
            } else {
                this.records.set(key, valid);
            }
        }
    }
}

module.exports = new ActionLimiter();
