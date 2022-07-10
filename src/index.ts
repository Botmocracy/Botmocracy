import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10";
import { Client, Intents } from "discord.js";
import * as dotenv from "dotenv";
import { readdirSync, readFileSync } from "fs";
import * as mongoose from 'mongoose';
import Module from "./modules/abstract/Module";
import Config from "./util/Config";
import Logger from "./util/Logger";

dotenv.config();

const configFile = process.env.DEV ? "./config-dev.json" : "./config-prod.json";

export const config: Config = JSON.parse(readFileSync(configFile).toString());

mongoose.connect((process.env.MONGO_STRING as string));

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES);
intents.add(Intents.FLAGS.GUILDS);
intents.add(Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({ intents: intents, allowedMentions: { parse: config.allowed_mentions } });
const logger = new Logger("Index");
const modules = new Map<string, Module>();

client.on('ready', async (client) => {
    // Do module things
    logger.info("Enabling modules");
    const moduleFiles = readdirSync("src/modules");

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
    let slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

    for (const f of moduleFiles) {
        if (!f.endsWith(".ts")) continue; // Ignore non-ts files
        const M = require(`./modules/${f}`);
        const module = new M.default();
        if (!(module instanceof Module)) throw new Error(`Module ${f} does not extend "Module"`);
        modules.set(module.name, module);
        module.initialise(client);
        slashCommands.push(...Object.values(module.slashCommands).map(c => c.cmdBuilder.toJSON()))
    }
    modules.forEach((value) => {
        value.onModulesLoaded(modules);
    });

    await rest.put(
	    Routes.applicationCommands(client!.user!.id),
	    { body: slashCommands },
    );
    logger.info(`${slashCommands.length} application commands reloaded`)
});

client.login(process.env.TOKEN);
