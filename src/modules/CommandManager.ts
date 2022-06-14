import Module from "./abstract/Module";
import { Collection, Message } from "discord.js";
import CommandOptions from "../util/CommandOptions";

export default class CommandManager extends Module {
    name = "CommandManager";
    prefix = "-";
    commands = new Collection<string, CommandOptions>();

    onEnable() {
        this.registerCommand({ name: "ping", allowedRoles: ["985471668447219722"], executor: (message, args) => {
            message.reply("h")
        }});
    }

    onMessage(message: Message) {
        if (!message.content.startsWith(this.prefix)) return;

        const args = message.content.substring(this.prefix.length).split(" ");

        const commandName = args.shift();
        if (!commandName) return; 

        const command = this.commands.get(commandName);
        if (!command) return;

        // If no permissions specified then we assume executable by everyone and run it
        if (!command.allowedPermissions && !command.allowedRoles) return this.executeCommand(command, message, args);

        if (command.allowedPermissions)
        for (const permission of command.allowedPermissions) {
            if (message.member?.permissions.has(permission)) return this.executeCommand(command, message, args);
        }

        if (command.allowedRoles)
        for (const role of command.allowedRoles) {
            if (message.member?.roles.cache.has(role.toString())) return this.executeCommand(command, message, args);
        }

        message.reply("You do not have permission to execute this command.");
    }

    executeCommand(command: CommandOptions, message: Message, args: string[]) {
        command.executor(message, args);
    }

    registerCommand(options: CommandOptions) {
        this.commands.set(options.name, options);
    }
}