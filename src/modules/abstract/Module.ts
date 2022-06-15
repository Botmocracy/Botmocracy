import { Client, Collection, Message } from "discord.js";

export default class Module {
    name = "";

    logger = {
        info: (message: String) => console.log(`[${this.name} - INFO] ${message}`),
        warn: (message: String) => console.warn(`[${this.name} - WARN] ${message}`),
        error: (message: String) => console.error(`[${this.name} - ERROR] ${message}`),
        debug: (message: String) => console.log(`[${this.name} - DEBUG] ${message}`)
    }

    client: Client | null = null; // |null is required bcs of typescript

    initialise(client: Client): void {
        this.client = client;
        this.client.on("messageCreate", msg => this.onMessage(msg));
        this.onEnable();
    }

    onEnable(): void { }

    onReady(modules: Collection<string, Module>): void { } // Runs when all modules are loaded

    onMessage(message: Message): void { }
}