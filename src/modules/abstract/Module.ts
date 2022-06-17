import { Client, Collection, GuildMemberRoleManager, Message } from "discord.js";
import CommandOptions from "../../util/CommandOptions";
import Logger from "../../util/Logger";
export default class Module {
    name = "";

    logger : Logger = new Logger("");
    client: Client | null = null; // |null is required bcs of typescript

    initialise(client: Client): void {
        this.client = client;
        this.logger = new Logger(this.name);
        this.client.on("interactionCreate", async i => {
            if (!i.isCommand()) return;
            const command = this.slashCommands[i.commandName]
            if (!command) return;

            try {
                // If no permissions specified then we assume executable by everyone and run it
                if (!command.allowedPermissions && !command.allowedRoles) return await command.executor(i);
                if (command.allowedPermissions)
                    for (const permission of command.allowedPermissions) {
                        if (i.memberPermissions?.has(permission)) return await command.executor(i);
                    }

                if (command.allowedRoles)
                    for (const role of command.allowedRoles) {
                        if (i.member?.roles instanceof GuildMemberRoleManager 
                            ? i.member?.roles.cache.has(role.toString()) 
                            : i.member?.roles.includes(role.toString()))
                            return await command.executor(i);
                    }
                i.reply({content: "You do not have permission to execute this command.", ephemeral: true});
            } catch (e: any) {
                this.logger.error(e.toString());
                i.reply({content: `An error occurred. \`\`\`\ ${e.toString()} \`\`\``, ephemeral: true});
            }
        })
        this.onEnable();
    }

    onEnable(): void { }

    onModulesLoaded(modules: Collection<string, Module>): void { } // Runs when all modules are loaded
    
    slashCommands: {[key: string]: CommandOptions} = {}
}
