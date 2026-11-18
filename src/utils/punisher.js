const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

/**
 * Checks if the bot can punish the target member based on hierarchy
 * @param {import('discord.js').Guild} guild 
 * @param {import('discord.js').GuildMember} targetMember 
 * @returns {boolean}
 */
function canPunish(guild, targetMember) {
    if (!targetMember) return false;
    if (targetMember.id === guild.ownerId) return false;
    if (targetMember.id === guild.client.user.id) return false;

    const botMember = guild.members.me;
    if (!botMember) return false;

    // Bot's highest role must be strictly higher than target's highest role
    return botMember.roles.highest.position > targetMember.roles.highest.position;
}

/**
 * Executes punishment on the unauthorized attacker and sends alert
 * @param {import('discord.js').Guild} guild 
 * @param {import('discord.js').User|import('discord.js').GuildMember} executor 
 * @param {string} actionName E.g. "Channel Delete", "Anti-Ban Trigger"
 * @param {string} details Extra info about what was affected
 */
async function punish(guild, executor, actionName, details = '') {
    if (!executor) return;

    const executorId = executor.id;

    // Double check immunity
    if (db.isImmune(guild, executorId)) {
        return;
    }

    const guildConfig = db.getGuildConfig(guild.id);
    const punishmentType = guildConfig.punishment || 'ban';
    let punishmentResult = 'None';

    try {
        const member = await guild.members.fetch(executorId).catch(() => null);

        if (member) {
            if (!canPunish(guild, member)) {
                punishmentResult = '⚠️ Thất bại: Vai trò của Bot thấp hơn kẻ tấn công (Cần kéo role Bot lên cao nhất!)';
            } else {
                if (punishmentType === 'ban') {
                    if (guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                        await guild.members.ban(executorId, {
                            reason: `[Anti-Nuke] Phát hiện hành vi phá hoại: ${actionName}`
                        });
                        punishmentResult = '🔨 Đã Ban (Cấm vĩnh viễn)';
                    } else {
                        punishmentResult = '⚠️ Thiếu quyền Ban Members';
                    }
                } else if (punishmentType === 'kick') {
                    if (guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
                        await member.kick(`[Anti-Nuke] Phát hiện hành vi phá hoại: ${actionName}`);
                        punishmentResult = '👢 Đã Kick khỏi máy chủ';
                    } else {
                        punishmentResult = '⚠️ Thiếu quyền Kick Members';
                    }
                } else if (punishmentType === 'strip_roles') {
                    if (guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                        // Remove all roles that can be removed (lower than bot)
                        const removableRoles = member.roles.cache.filter(r => 
                            r.id !== guild.id && r.position < guild.members.me.roles.highest.position
                        );
                        await member.roles.remove(removableRoles, `[Anti-Nuke] Tước toàn bộ quyền: ${actionName}`);
                        punishmentResult = '🔒 Đã tước toàn bộ Role (Quarantine)';
                    } else {
                        punishmentResult = '⚠️ Thiếu quyền Manage Roles';
                    }
                }
            }
        } else {
            // Member not in guild anymore (or already left), but if punishment is ban, we can still ban user by ID
            if (punishmentType === 'ban' && guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                await guild.members.ban(executorId, {
                    reason: `[Anti-Nuke] Phát hiện hành vi phá hoại (Hackban): ${actionName}`
                });
                punishmentResult = '🔨 Đã Ban (ID Ban)';
            }
        }
    } catch (err) {
        console.error(`[Punisher] Error executing punishment for ${executorId}:`, err);
        punishmentResult = `❌ Lỗi: ${err.message}`;
    }

    // Send Alert to Log Channel or Guild Owner
    await sendAlert(guild, executor, actionName, punishmentResult, details);
}

/**
 * Sends a security alert embed to the log channel or server owner
 */
async function sendAlert(guild, executor, actionName, punishmentResult, details) {
    const guildConfig = db.getGuildConfig(guild.id);
    const logChannelId = guildConfig.logChannelId;

    const embed = new EmbedBuilder()
        .setTitle('🛡️ [CẢNH BÁO BẢO MẬT] PHÁT HIỆN HÀNH VI NUKING!')
        .setColor(config.colors.danger)
        .addFields(
            { name: '👤 Kẻ tấn công', value: `<@${executor.id}> (${executor.tag || executor.username || executor.id})`, inline: true },
            { name: '🆔 ID Kẻ tấn công', value: `\`${executor.id}\``, inline: true },
            { name: '⚡ Hành vi phát hiện', value: `**${actionName}**`, inline: false },
            { name: '⚖️ Hình phạt áp dụng', value: punishmentResult, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Hệ thống Anti-Nuke Tự Động', iconURL: guild.iconURL() });

    if (details) {
        embed.addFields({ name: '📝 Chi tiết đối tượng', value: details });
    }

    let sent = false;

    if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] }).catch(() => null);
            sent = true;
        }
    }

    // If no log channel set or failed to send, DM server owner
    if (!sent) {
        try {
            const owner = await guild.fetchOwner().catch(() => null);
            if (owner) {
                await owner.send({
                    content: `⚠️ **[CẢNH BÁO MÁY CHỦ ${guild.name}]** Bạn chưa đặt kênh log anti-nuke hoặc bot không gửi được vào kênh log. Vui lòng kiểm tra ngay!`,
                    embeds: [embed]
                }).catch(() => null);
            }
        } catch (e) {
            // Ignore DM failure
        }
    }
}

module.exports = {
    canPunish,
    punish,
    sendAlert
};
