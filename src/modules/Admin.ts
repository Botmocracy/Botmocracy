import { Collection } from "discord.js";
import Module from "./abstract/Module";

export default class Admin extends Module {
    name = "Admin";

    onEnable(): void {
        this.logger.info("Enabled");
    }

    slashCommands = {}
}