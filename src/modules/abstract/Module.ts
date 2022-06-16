import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Collection, Message, Interaction } from "discord.js";
import Logger from "../../util/Logger";

interface SlashCmd {
    cmd: SlashCommandBuilder,
    handler: (i: Interaction) => void
}
export default class Module {
    name = "";

    logger : Logger = new Logger("");
    client: Client | null = null; // |null is required bcs of typescript

    initialise(client: Client): void {
        this.client = client;
        this.logger = new Logger(this.name);
        this.client.on("messageCreate", msg => this.onMessage(msg));
        this.client.on("interactionCreate", i => {
            if (!i.isCommand()) return;
            this.slashCommands[i.commandName]?.handler(i)
        })
        this.onEnable();
    }

    onEnable(): void { }

    onModulesLoaded(modules: Collection<string, Module>): void { } // Runs when all modules are loaded

    onMessage(message: Message): void { }
    
    slashCommands: {[key: string]: SlashCmd} = {}
}
