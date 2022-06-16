import { Intents, Client, Collection } from "discord.js";
import * as dotenv from "dotenv";
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module";
import * as mongoose from 'mongoose';
import { SlashCommandBuilder } from "@discordjs/builders";
import { Routes } from "discord-api-types/v10"
import { REST } from "@discordjs/rest"

dotenv.config();

mongoose.connect((process.env.MONGO_STRING as string))

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES);
intents.add(Intents.FLAGS.GUILDS);
intents.add(Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({ intents: intents });

export const modules = new Collection<string, Module>();

client.on('ready', async () => {
    // Do module things
    console.log("Enabling modules");
    const moduleFiles = readdirSync("src/modules");

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
    let slashCommands: SlashCommandBuilder[] = []

    moduleFiles.forEach((f, index) => {
        if (!f.endsWith(".ts")) return; // Ignore non-ts files
        import(`./modules/${f}`).then(M => {
            const module = new M.default();
            if (!(module instanceof Module)) throw new Error(`Module ${f} does not extend "Module"`);
            modules.set(module.name, module);
            module.initialise(client);
            slashCommands.push(...Object.values(module.slashCommands).map(c => c.cmd))

            if (index === moduleFiles.length - 1) { // Since this is an async function, we need to run the ready events when it ends
                modules.forEach((value, key) => {
                    value.onModulesLoaded(modules);
                });
            }
        });
    });

    await rest.put(
	Routes.applicationCommands(client!.user!.id),
	{ body: slashCommands },
    );
});


client.login(process.env.TOKEN);
