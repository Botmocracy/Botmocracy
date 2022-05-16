import { Intents, Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES);
intents.add(Intents.FLAGS.GUILDS);
intents.add(Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({intents: intents});

client.login(process.env.TOKEN);

client.on('ready', async() => {
    console.log(`Bot is ready as ${client.user.username}`);
});