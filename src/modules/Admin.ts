import { Collection, Message, MessageEmbed } from "discord.js";
import Module from "./abstract/Module";
import Town from "../schema/Town";
import CommandManager from "./CommandManager";

export default class Admin extends Module {
    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    commandManager: CommandManager|null = null;;

    onEnable(): void {
        this.name = "Admin";
        this.logger.info("Enabled");
    }

    onReady(modules: Collection<string, Module>): void {
        this.commandManager = (modules.get("CommandManager") as CommandManager);
        this.logger.info("e");
        this.commandManager.registerCommand({name: "addtown", allowedRoles: ["985426658922201158"], executor(message, args) {
            if(args.length < 6) {
                message.channel.send("Syntax: `addtown mayor depmayor x y z name`");
                return;
            }

            const mayor = args.shift();
            const depMayor = args.shift();
            const x = args.shift();
            const y = args.shift();
            const z = args.shift();
            const name = args.join(' ');

            const coords = `${x} ${y} ${z}`;
            
            Town.findOne({name: name}, (err: any, res: any) => {
                if(!err) {
                    Town.deleteOne({name: name});
                    return;
                }
            });

            const town = new Town({name: name, mayor: mayor, depMayor: depMayor, coords: coords});

            town.save(function(err: any) {
                if(err) {
                    throw err;
                }
            });
            message.channel.send("Done");
        }})
    }

}