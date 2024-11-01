import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
const { TOKEN, DISCORD_GUILD_ID, DISCORD_ROLE_ID } = process.env;
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
bot.login(TOKEN);
bot.verifiedMembers = [];
const fetchVerifiedMembers = async () => {
    bot.verifiedMembers = await bot.guilds.fetch(DISCORD_GUILD_ID)
    .then(g => g.members.fetch())
    // .then(m => m.filter(m => m.roles.cache.has(DISCORD_ROLE_ID)));
    .then(members =>members.reduce(
       (acc, m)=>{if (m.roles.cache.has(DISCORD_ROLE_ID))acc[m.id]=m; return acc;}
        ,{}
    ))
    console.log('Verified Members', Object.values(bot.verifiedMembers).map(m=>m.user.username));
}
bot.once('ready',fetchVerifiedMembers)
bot.on('guildMemberUpdate',fetchVerifiedMembers)
bot.on('guildMemberRemove',fetchVerifiedMembers)
export default bot;