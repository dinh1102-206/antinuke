const fs = require('fs');
const path = require('path');
const config = require('../config');

const CONFIG_DIR = path.join(__dirname, '../../data/configs');
const BACKUP_DIR = path.join(__dirname, '../../data/backups');

// Ensure directories exist
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// In-memory cache for speed and minimizing disk I/O
const configCache = new Map();

/**
 * Write file atomically to prevent JSON corruption
 */
function atomicWriteFileSync(filePath, data) {
    const tempPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
}

/**
 * Get guild configuration
 */
function getGuildConfig(guildId) {
    if (configCache.has(guildId)) {
        return configCache.get(guildId);
    }

    const filePath = path.join(CONFIG_DIR, `${guildId}.json`);
    let data;

    if (fs.existsSync(filePath)) {
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            // Deep merge with default to ensure any new config keys exist
            data = {
                ...config.defaultGuildConfig,
                ...data,
                modules: {
                    ...config.defaultGuildConfig.modules,
                    ...(data.modules || {})
                }
            };
        } catch (err) {
            console.error(`[DB] Error parsing config for guild ${guildId}, resetting to defaults:`, err);
            data = { ...config.defaultGuildConfig };
        }
    } else {
        data = { ...config.defaultGuildConfig };
        atomicWriteFileSync(filePath, data);
    }

    configCache.set(guildId, data);
    return data;
}

/**
 * Save guild configuration
 */
function saveGuildConfig(guildId, data) {
    configCache.set(guildId, data);
    const filePath = path.join(CONFIG_DIR, `${guildId}.json`);
    atomicWriteFileSync(filePath, data);
}

/**
 * Update partial guild configuration
 */
function updateGuildConfig(guildId, updates) {
    const current = getGuildConfig(guildId);
    const updated = { ...current, ...updates };
    saveGuildConfig(guildId, updated);
    return updated;
}

/**
 * Whitelist check: returns true if user is immune
 */
function isImmune(guild, userId) {
    // 1. Bot owner from .env is immune
    if (config.botOwnerId && userId === config.botOwnerId) return true;
    
    // 2. Guild owner is always immune
    if (guild && guild.ownerId === userId) return true;

    // 3. Bot itself is immune
    if (guild && guild.client.user.id === userId) return true;

    const guildData = getGuildConfig(guild.id);

    // 4. Extra owners
    if (guildData.extraOwners && guildData.extraOwners.includes(userId)) return true;

    // 5. Whitelisted users
    if (guildData.whitelist && guildData.whitelist.includes(userId)) return true;

    return false;
}

/**
 * Save Guild Backup
 */
function saveBackup(guildId, backupData) {
    const filePath = path.join(BACKUP_DIR, `${guildId}.json`);
    atomicWriteFileSync(filePath, backupData);
}

/**
 * Get Guild Backup
 */
function getBackup(guildId) {
    const filePath = path.join(BACKUP_DIR, `${guildId}.json`);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (err) {
            console.error(`[DB] Error loading backup for guild ${guildId}:`, err);
            return null;
        }
    }
    return null;
}

module.exports = {
    getGuildConfig,
    saveGuildConfig,
    updateGuildConfig,
    isImmune,
    saveBackup,
    getBackup
};
