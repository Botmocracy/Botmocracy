import { Client, Collection, Message } from "discord.js";
import Logger from "../../util/Logger";

export default class Module {
    name = "";

    logger : Logger = new Logger("");
    client: Client | null = null; // |null is required bcs of typescript

    initialise(client: Client): void {
        this.client = client;
        this.logger = new Logger(this.name);
        this.client.on("messageCreate", msg => this.onMessage(msg));
        this.onEnable();
    }

    onEnable(): void { }

    onModulesLoaded(modules: Collection<string, Module>): void { } // Runs when all modules are loaded

    onMessage(message: Message): void { }
}