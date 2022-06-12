export default class Module {
    logger = {
        info: message => console.log(`[${this.name} - INFO] ${message}`),
        warn: message => console.warn(`[${this.name} - WARN] ${message}`),
        error: message => console.error(`[${this.name} - ERROR] ${message}`),
        debug: message => console.log(`[${this.name} - DEBUG] ${message}`)
    }

    initialise(client) {
        this.client = client;
        this.client.on("messageCreate", msg => this._onMessage(msg));
        this.onEnable();
    }

    onEnable() { }

    messageCheck() { return true; }

    _onMessage(message) {
        if (this.messageCheck(message)) {
            this.onMessage(message);
        }
    }

    onMessage(message) { }
}