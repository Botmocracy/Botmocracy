import Module from "./abstract/Module.js";

export default class ExampleModule extends Module {
    name = "Admin";

    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    onEnable() {
        this.logger.info("Enabled");
    }

    messageCheck(message) {
        return this.authorizedUsers.includes(message.author.id)
    }

    onMessage(message) {
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