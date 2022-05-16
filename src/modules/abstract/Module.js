export default class Module {
    logger = {
        info: message => console.log(`[${this.name} - INFO] ${message}`),
        warn: message => console.warn(`[${this.name} - WARN] ${message}`),
        error: message => console.error(`[${this.name} - ERROR] ${message}`),
        debug: message => console.log(`[${this.name} - DEBUG] ${message}`)
    }

    initialise(client) {
        this.client = client;
        this.client.on("messageCreate", msg => this.onMessage(msg));
    }

    onEnable() { }

    onMessage(message) { }
}