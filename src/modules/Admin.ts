import { Collection, Message, MessageEmbed, User } from "discord.js";
import Module from "./abstract/Module";
import Town from "../schema/Town";
import CommandManager from "./CommandManager";
import { CallbackError } from "mongoose";

export default class Admin extends Module {
    authorizedUsers = ["468534859611111436", "716779626759716914", "644052617500164097"];

    commandManager: CommandManager | null = null;;

    onEnable(): void {
        this.name = "Admin";
        this.logger.info("Enabled");
    }

    onModulesLoaded(modules: Collection<string, Module>): void {
        this.commandManager = (modules.get("CommandManager") as CommandManager);
        this.commandManager.registerCommand({
            name: "addtown", allowedRoles: ["985426658922201158"], executor(message, args) {
                if (args.length < 6) {
                    message.channel.send("Syntax: `addtown <mayor> <depmayor> <x y z> <name>`");
                    return;
                }

                const mayor = args.shift(); // TODO: use dc account instead of username
                const depMayor = args.shift(); // same as above

                const x = args.shift();
                const y = args.shift();
                const z = args.shift();

                const name = args.join(' ');

                const coords = `${x} ${y} ${z}`;

                Town.findOne({ name: name }, (err: CallbackError, res: any) => {
                    if (res) {
                        Town.deleteOne({ name: name }, (err) => { if (err) message.channel.send(err.toString()) });
                    }
                });

                const town = new Town({ name: name, mayor: mayor, depMayor: depMayor, coords: coords });

                town.save(function (err: CallbackError) {
                    if (err) {
                        throw err;
                    }
                });
                message.channel.send("Done");
            }
        })
    }

}