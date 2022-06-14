import { Message } from "discord.js";
import { modules } from "..";
import Module from "./abstract/Module";

export default class Admin extends Module {
    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    onEnable(): void {
        this.name = "Admin";
        this.logger.info("Enabled");
    }


    onMessage(message: Message): void {
        if(this.authorizedUsers.includes(message.author.id) && message.content.startsWith("?eval")) {
            const split = message.content.split(" ");
            split.shift();

            const code = split.join(" ").replace("```js", "").replace("```ts", "").replace("```", "");

            try{
                const res = eval(code);
                if(res){
                    message.reply({content: res.toString(), allowedMentions: {repliedUser: false}});
                }

            } catch(e: any) {
                message.channel.send(e.message);
                return;
            }

            message.react("✅");
        }
    }
}