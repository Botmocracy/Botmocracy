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
        
    }

}