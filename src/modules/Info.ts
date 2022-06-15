import { Collection, MessageEmbed } from "discord.js";
import Town from "../schema/Town";
import Module from "./abstract/Module";
import CommandManager from "./CommandManager";


export default class Info extends Module {
    commandManager: CommandManager|null = null;
    name = "Info";
    
    onEnable(): void {
        this.logger.info("Enabled");
    }
  
    onReady(modules: Collection<string, Module>): void {
        this.commandManager = (modules.get("CommandManager") as CommandManager);  
        this.commandManager.registerCommand({name: "gettown", executor(message, args) {
            if(args.length < 1) {
                message.channel.send("Syntax: `gettown <name>`")
                return;
            }
            Town.findOne({name: args.shift()}, (err: any, res: any) => {
                if(!res || err) {
                    message.channel.send("Invalid town");
                    return;
                }
                const name = res['name'];
                const mayor = res['mayor'];
                const depMayor = res['depMayor'];
                const coords = res['coords'];

                const embed = new MessageEmbed()
                    .setTitle(name)
                    .addField("Mayor", mayor)
                    .addField("Deputy Mayor", depMayor)
                    .addField("Coords", coords)
                    .setColor("BLURPLE");
                
                message.channel.send({embeds: [embed]});
            })
        }})
    }
}