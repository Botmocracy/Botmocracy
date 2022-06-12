import { Client, Message } from "discord.js";
import Module from "./abstract/Module";

export default class Admin extends Module {
    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    onEnable() {
        this.name = "Admin";
        this.logger.info("Enabled");
    }

    messageCheck(message: Message) {
        return this.authorizedUsers.includes(message.author.id);
    }

    onMessage(message: Message) {
        const content = message.content;

        if (content.startsWith("?admin")) {
            const split = content.split(" ")
            const commandName = split[1]

            if(commandName == "doThing") {
                message.channel.send("Oui oui")
            }
        }
        
    }
}