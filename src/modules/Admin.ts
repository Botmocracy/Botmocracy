import { Collection } from "discord.js";
import Module from "./abstract/Module";
import CommandManager from "./CommandManager";

export default class Admin extends Module {
    name = "Admin";

    commandManager: CommandManager | null = null;;

    onEnable(): void {
        this.logger.info("Enabled");
    }

    onModulesLoaded(modules: Collection<string, Module>): void {
        this.commandManager = (modules.get("CommandManager") as CommandManager);
        
    }

    slashCommands = {}
}