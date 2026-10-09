import 'dotenv/config';
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  WebhookClient,
  type ChatInputCommandInteraction
} from 'discord.js';
import { db } from '@sentinel/db';

const token = process.env.DISCORD_TOKEN;
if (!token) throw Error('DISCORD_TOKEN missing');

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const joins = new Map<string, number[]>();
const alertCooldowns = new Map<string, number>();
const ALERT_COOLDOWN_MS = 60_000;

let securityWebhook: WebhookClient | null = null;

if (process.env.NT_SECURITY_WEBHOOK_URL) {
  try {
    securityWebhook = new WebhookClient({
      url: process.env.NT_SECURITY_WEBHOOK_URL
    });
  } catch (error) {
    console.error('NT Security webhook configuration error:', error);
  }
}

async function log(guildId: string, message: string) {
  const config = await db.guildSettings.findUnique({
    where: { guildId }
  });

  if (!config?.logChannelId) return;

  const guild = bot.guilds.cache.get(guildId);
  const channel = await guild?.channels
    .fetch(config.logChannelId)
    .catch(() => null);

  if (channel?.isTextBased() && 'send' in channel) {
    await channel.send({
      content: message,
      allowedMentions: { parse: [] }
    }).catch(console.error);
  }
}

async function sendSecurityAlert(
  guildId: string,
  joinsDetected: number,
  windowSeconds: number
) {
  const guild = bot.guilds.cache.get(guildId);
  const timestamp = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🚨 NT Security | Potential Raid Detected')
    .setDescription(
      'NT has detected an unusual number of members joining a server within a short period.'
    )
    .addFields(
      {
        name: '🏠 Server',
        value: guild?.name || guildId,
        inline: true
      },
      {
        name: '⚠️ Severity',
        value: 'HIGH',
        inline: true
      },
      {
        name: '👥 Members Joined',
        value: String(joinsDetected),
        inline: true
      },
      {
        name: '⏱️ Detection Window',
        value: `${windowSeconds} seconds`,
        inline: true
      },
      {
        name: '🛡️ Action Taken',
        value: 'Alert generated — manual review required',
        inline: false
      },
      {
        name: '🕒 Detected',
        value: `<t:${timestamp}:F>`,
        inline: false
      }
    )
    .setFooter({
      text: 'NT• Automated Threat Monitoring'
    })
    .setTimestamp();

  if (securityWebhook) {
    try {
      await securityWebhook.send({
        username: 'NT',
        embeds: [embed],
        allowedMentions: { parse: [] }
      });

      console.log(
        `[NT Security] Webhook alert sent for ${guildId}`
      );
      return;
    } catch (error) {
      console.error(
        '[NT Security] Webhook failed, using log channel:',
        error
      );
    }
  }

  await log(
    guildId,
    `🚨 NT SECURITY | Potential raid detected: ${joinsDetected} joins within ${windowSeconds}s. Manual review recommended.`
  );
}

async function handle(i: ChatInputCommandInteraction) {
  if (!i.guild || !i.guildId) {
    return i.reply({
      content: 'Server commands only.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (i.commandName === 'ping') {
    return i.reply({
      content: `Pong! Gateway ${Math.round(bot.ws.ping)}ms`,
      flags: MessageFlags.Ephemeral
    });
  }

  const required: Record<string, bigint> = {
    ban: PermissionFlagsBits.BanMembers,
    kick: PermissionFlagsBits.KickMembers,
    timeout: PermissionFlagsBits.ModerateMembers,
    warn: PermissionFlagsBits.ModerateMembers,
    cases: PermissionFlagsBits.ModerateMembers
  };

  const permission = required[i.commandName];

  if (!permission || !i.memberPermissions?.has(permission)) {
    return i.reply({
      content: 'Insufficient permissions.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (i.commandName === 'cases') {
    const cases = await db.moderationCase.findMany({
      where: { guildId: i.guildId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return i.reply({
      content: cases.map(c =>
        `${c.action.toUpperCase()} • <@${c.targetId}> • ${c.reason.slice(0, 100)} • ${c.id}`
      ).join('\n') || 'No cases yet.',
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] }
    });
  }

  const user = i.options.getUser('user', true);
  const reason = i.options.getString('reason') || 'No reason provided';

  if (
    user.id === i.user.id ||
    user.id === bot.user?.id ||
    user.id === i.guild.ownerId
  ) {
    return i.reply({
      content: 'That target cannot be moderated.',
      flags: MessageFlags.Ephemeral
    });
  }

  await i.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const member = await i.guild.members
    .fetch(user.id)
    .catch(() => null);

  const actor = await i.guild.members.fetch(i.user.id);

  if (
    member &&
    i.guild.ownerId !== i.user.id &&
    actor.roles.highest.comparePositionTo(member.roles.highest) <= 0
  ) {
    return i.editReply(
      'Your highest role must be above the target.'
    );
  }

  const action = i.commandName;

  if (action === 'ban') {
    if (member && !member.bannable) {
      return i.editReply(
        'I cannot ban this member. Check my role hierarchy and permissions.'
      );
    }

    await i.guild.members.ban(user.id, {
      reason: `${reason} | by ${i.user.id}`
    });

  } else if (action === 'kick') {
    if (!member?.kickable) {
      return i.editReply('I cannot kick this member.');
    }

    await member.kick(`${reason} | by ${i.user.id}`);

  } else if (action === 'timeout') {
    if (!member?.moderatable) {
      return i.editReply('I cannot timeout this member.');
    }

    await member.timeout(
      i.options.getInteger('minutes', true) * 60000,
      `${reason} | by ${i.user.id}`
    );

  } else if (action === 'warn') {
    if (!member) {
      return i.editReply('Member not found in this server.');
    }

  } else {
    return i.editReply('Unknown command.');
  }

  const record = await db.moderationCase.create({
    data: {
      guildId: i.guildId,
      targetId: user.id,
      moderatorId: i.user.id,
      action,
      reason
    }
  });

  await i.editReply(
    `${action.toUpperCase()} recorded for ${user.username}. Case: ${record.id}`
  );

  await log(
    i.guildId,
    `🛡️ ${action.toUpperCase()} | Target ${user.id} | Moderator ${i.user.id} | Case ${record.id} | ${reason}`
  );
}

bot.on(Events.InteractionCreate, async i => {
  if (!i.isChatInputCommand()) return;

  try {
    await handle(i);
  } catch (err) {
    console.error(err);

    const msg = 'Command failed. Check permissions and try again.';

    if (i.deferred || i.replied) {
      await i.editReply(msg).catch(console.error);
    } else {
      await i.reply({
        content: msg,
        flags: MessageFlags.Ephemeral
      }).catch(console.error);
    }
  }
});

bot.on(Events.GuildMemberAdd, async member => {
  try {
    const settings = await db.guildSettings.findUnique({
      where: { guildId: member.guild.id }
    });

    if (!settings?.antiRaidEnabled) return;

    const now = Date.now();
    const key = member.guild.id;

    const recent = (joins.get(key) || []).filter(
      t => now - t < settings.raidWindowSeconds * 1000
    );

    recent.push(now);
    joins.set(key, recent);

    if (recent.length >= settings.raidJoinLimit) {
      const lastAlert = alertCooldowns.get(key) || 0;

      if (now - lastAlert < ALERT_COOLDOWN_MS) return;

      alertCooldowns.set(key, now);

      await db.securityEvent.create({
        data: {
          guildId: key,
          type: 'RAID_THRESHOLD',
          details: {
            joins: recent.length,
            windowSeconds: settings.raidWindowSeconds,
            threshold: settings.raidJoinLimit
          }
        }
      });

      await sendSecurityAlert(
        key,
        recent.length,
        settings.raidWindowSeconds
      );
    }
  } catch (err) {
    console.error('[NT Security] Raid monitor:', err);
  }
});

bot.once(Events.ClientReady, c => {
  console.log(
    `NT online as ${c.user.tag} | ${c.guilds.cache.size} guilds`
  );

  console.log(
    `[NT Security] Webhook ${securityWebhook ? 'configured' : 'not configured'}`
  );
});

process.on('SIGTERM', () => {
  bot.destroy();
  securityWebhook?.destroy();
  void db.$disconnect().finally(() => process.exit(0));
});

await bot.login(token);
