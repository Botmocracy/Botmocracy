import { Client, Message } from "discord.js";

export default class Module {
    name = "";

    logger = {
        info: (message: String) => console.log(`[${this.name} - INFO] ${message}`),
        warn: (message: String) => console.warn(`[${this.name} - WARN] ${message}`),
        error: (message: String) => console.error(`[${this.name} - ERROR] ${message}`),
        debug: (message: String) => console.log(`[${this.name} - DEBUG] ${message}`)
    }

    client: Client;

    constructor(client: Client) {
        this.client = client;
        this.client.on("messageCreate", msg => this._onMessage(msg));
        this.onEnable();
    }

    onEnable() { }

    messageCheck(message: Message) { return true; }

    _onMessage(message: Message) {
        if (this.messageCheck(message)) {
            this.onMessage(message);
        }
    }

    onMessage(message: Message) { }
}