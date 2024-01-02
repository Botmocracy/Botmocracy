import * as dotenv from "dotenv";

dotenv.config();

import {
  Client,
  IntentsBitField,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { readFileSync, readdirSync } from "fs";
import mongoose from "mongoose";
import Module from "./modules/abstract/Module";
import Config from "./util/Config";
import Logger from "./util/Logger";

const configFile = process.env.DEV ? "./config-dev.json" : "./config-prod.json";

export const config = JSON.parse(readFileSync(configFile).toString()) as Config;

void mongoose.connect(process.env.MONGO_STRING!);

const intents = new IntentsBitField();
intents.add(IntentsBitField.Flags.GuildMessages);
intents.add(IntentsBitField.Flags.Guilds);
intents.add(IntentsBitField.Flags.GuildMembers);

const client = new Client({
  intents: intents,
  allowedMentions: { parse: config.allowed_mentions },
});
const logger = new Logger("Index");
const modules = new Map<string, Module>();

client.on("ready", async (client) => {
  // Do module things
  logger.info("Enabling modules");
  const moduleFiles = readdirSync("src/modules");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);
  const slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

  for (const f of moduleFiles) {
    if (!f.endsWith(".ts")) continue; // Ignore non-ts files
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const M = require(`./modules/${f}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const module = new M.default();
    if (!(module instanceof Module))
      throw new Error(`Module ${f} does not extend "Module"`);
    modules.set(module.name, module);
    module.initialise(client);
    slashCommands.push(
      ...Object.values(module.slashCommands).map((c) => c.cmdBuilder.toJSON()),
    );
  }
  modules.forEach((value) => {
    value.onModulesLoaded(modules);
  });

  if (!process.env.DEV || process.env.RELOAD_CMDS) {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: slashCommands,
    });
    logger.info(`${slashCommands.length} application commands reloaded`);
  }
});

client.on("interactionCreate", (i) => {
  if (!i.guild) return;
  if (i.guild.id != config.guild) return;

  logger.info(
    `Interaction received with type ${i.type} and id ${
      (i as any).customId
    } from ${i.user.tag}`,
  );
});

void client.login(process.env.TOKEN);
