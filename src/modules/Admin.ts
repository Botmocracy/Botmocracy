import { Message, MessageEmbed } from "discord.js";
import Module from "./abstract/Module";
import Town from "../schema/Town";

export default class Admin extends Module {
    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    onEnable(): void {
        this.name = "Admin";
        this.logger.info("Enabled");
    }


    onMessage(message: Message): void {
        if(this.authorizedUsers.includes(message.author.id)) {
            if(message.content.startsWith("?eval")) {
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
            } else if(message.content.startsWith("?gettown")) {
                const split = message.content.split(" ");
                split.shift();

                if(split.length != 1) {
                    message.channel.send("Format: ?gettown <town name>");
                    return;
                }

                const townName = split[0];
                const result = Town.findOne({name: townName}, (err: any, object: any) => {
                    if(err) {
                        message.channel.send("Town does not exist.");
                        return;
                    }
                    const mayor = object['mayor'];
                    const depMayor = object['depMayor'];
                    const coords = object['coords'];
                    
                    const embed = new MessageEmbed()
                        .setColor("BLURPLE")
                        .setTitle(townName)
                        .setDescription(`**Mayor:** ${mayor}\n\n**Deputy Mayor**: ${depMayor}\n\n**Coords:** ${coords}`);
                    
                    message.channel.send({embeds: [embed]})
                });

            }
        }
    }
}