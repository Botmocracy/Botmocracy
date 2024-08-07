import Module from "./abstract/Module";
import capcon from "capture-console";
import { config } from "..";
import { TextChannel } from "discord.js";

export default class DiscordLogger extends Module {
    name = "DiscordLogger";
    messageBuffer: string[] = [];

    onEnable() {
        this.logger.info("Enabled");

        capcon.startCapture(process.stdout as any, s => this.messageBuffer.push(s));
        capcon.startCapture(process.stderr as any, s => this.messageBuffer.push(s));

        setInterval(() => {
            const builderStart = "```ansi\n";
            let logMessageBuilder = builderStart;
            while (this.messageBuffer.length > 0) {
                let message = this.messageBuffer[0];
                if (message.length > 1980) {
                    message = message.substring(0, 1980);
                }
                if (logMessageBuilder.length + message.length > 1995) {
                    logMessageBuilder += "```";
                    this.sendMessage(logMessageBuilder);
                    logMessageBuilder = builderStart;
                }
                logMessageBuilder += message;
                this.messageBuffer.shift();
            }

            if (logMessageBuilder != builderStart) {
                logMessageBuilder += "```";
                this.sendMessage(logMessageBuilder);
            }
        }, 10000)
    }

    sendMessage(message: string) {
        (this.client?.channels.cache.get(config.logs_channel) as TextChannel)!.send(message);
    }
}