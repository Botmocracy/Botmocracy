import { Intents, Client } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module.js";

dotenv.config();

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES);
intents.add(Intents.FLAGS.GUILDS);
intents.add(Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({intents: intents});

client.login(process.env.TOKEN);

client.on('ready', async() => {
    console.log(`Bot is ready as ${client.user.tag}`);

    // Do module things
    console.log("Enabling modules");
    const moduleFiles = readdirSync("src/modules");
    moduleFiles.forEach(f => {
        if (!f.endsWith(".js")) return; // Ignore non-js files
        import(`./modules/${f}`).then(M => {
            const module = new M.default();
            if (!module instanceof Module) throw new Error(`Module ${f} does not extend "Module"`);
            module.initialise(client);
        });
    });
});