import capcon from "capture-console";
import { TextChannel } from "discord.js";
import { config } from "..";
import Module from "./abstract/Module";

export default class DiscordLogger extends Module {
  name = "DiscordLogger";
  messageBuffer: string[] = [];

  onEnable() {
    this.logger.info("Enabled");

    capcon.startCapture(process.stdout, (s) => this.messageBuffer.push(s));
    capcon.startCapture(process.stderr, (s) => this.messageBuffer.push(s));

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
          void this.sendMessage(logMessageBuilder);
          logMessageBuilder = builderStart;
        }
        logMessageBuilder += message;
        this.messageBuffer.shift();
      }

      if (logMessageBuilder != builderStart) {
        logMessageBuilder += "```";
        void this.sendMessage(logMessageBuilder);
      }
    }, 10000);
  }

  async sendMessage(message: string) {
    await (this.client?.channels.cache.get(
      config.logs_channel,
    ) as TextChannel)!.send(message);
  }
}
