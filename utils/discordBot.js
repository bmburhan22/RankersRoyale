import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
const { TOKEN,DISCORD_GUILD_ID, DISCORD_ROLE_ID} = process.env;
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
bot.login(TOKEN);
bot.fetchVerifiedMembers = async () =>
    await bot.guilds.fetch(DISCORD_GUILD_ID)
        .then(g => g.members.fetch())
        .then(m => m.filter(m => m.roles.cache.has(DISCORD_ROLE_ID)));
export default bot;