
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DEV_GUILD_ID;

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
}

const rest = new REST({ version: '10' }).setToken(token);

// Use --global to register commands across all servers.
// Otherwise, register commands in the development server.
const isGlobal = process.argv.includes('--global');

if (!isGlobal && !guildId) {
  throw new Error('Missing DEV_GUILD_ID for development registration');
}

const route = isGlobal
  ? Routes.applicationCommands(clientId)
  : Routes.applicationGuildCommands(clientId, guildId!);

await rest.put(route, {
  body: commands,
});

console.log(
  `Successfully registered ${commands.length} ${
    isGlobal ? 'global' : 'development guild'
  } commands`
);
