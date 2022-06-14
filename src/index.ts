import { Intents, Client, Collection } from "discord.js";
import * as dotenv from "dotenv";
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module";

dotenv.config();

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES);
intents.add(Intents.FLAGS.GUILDS);
intents.add(Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({intents: intents});

export const modules = new Collection();

client.on('ready', async() => {
    // Do module things
    console.log("Enabling modules");
    const moduleFiles = readdirSync("src/modules");
    moduleFiles.forEach(f => {
        if (!f.endsWith(".ts")) return; // Ignore non-ts files
        import(`./modules/${f}`).then(M => {
            const module = new M.default();
            if (!(module instanceof Module)) throw new Error(`Module ${f} does not extend "Module"`);
            modules.set(module.name, module);
            module.initialise(client)
        });
    });
});

client.login(process.env.TOKEN);
