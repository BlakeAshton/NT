import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
const reason = (o: any) => o.addStringOption((x: any) => x.setName('reason').setDescription('Reason').setMaxLength(500));
const target = (o: any) => o.addUserOption((x: any) => x.setName('user').setDescription('Member to moderate').setRequired(true));
export const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot response time'),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a member').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o=>o.setName('user').setDescription('User to ban').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setMaxLength(500)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a member').setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o=>o.setName('user').setDescription('User to kick').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setMaxLength(500)),
  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('user').setDescription('User to timeout').setRequired(true)).addIntegerOption(o=>o.setName('minutes').setDescription('Duration (1–40320 minutes)').setMinValue(1).setMaxValue(40320).setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setMaxLength(500)),
  new SlashCommandBuilder().setName('warn').setDescription('Record a warning').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('user').setDescription('User to warn').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setMaxLength(500).setRequired(true)),
  new SlashCommandBuilder().setName('cases').setDescription('Recent moderation cases').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
].map(c=>c.toJSON());
