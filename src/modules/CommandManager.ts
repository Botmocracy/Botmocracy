import { Collection, Message } from "discord.js";
import CommandOptions from "../util/CommandOptions";
import Module from "./abstract/Module";

export default class CommandManager extends Module {
    name = "CommandManager";
    prefix = "-";
    commands = new Collection<string, CommandOptions>();

    onEnable() {
        this.logger.info("Enabled");
    }

    /*onMessage(message: Message) {
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
    }*/

    /*executeCommand(command: CommandOptions, message: Message, args: string[]) {
        try {
            command.executor(message, args);
        } catch (e: any) {
            this.logger.error(e.toString());
            message.channel.send(`An error occurred. \`\`\`\ ${e.toString()} \`\`\``)
        }
    }

    registerCommand(options: CommandOptions) {
        this.commands.set(options.name, options);
    }*/
    
    slashCommands = {

    }
}