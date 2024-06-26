import { CacheType, ChatInputCommandInteraction, Client, CommandInteraction, GuildMemberRoleManager } from "discord.js";
import { CommandOptions, SubcommandOptions } from "../../util/CommandOptions";
import Logger from "../../util/Logger";
import { config } from "../..";
import checkCitizenship from "../../util/check-citizenship";

export default class Module {
    name = "";

    logger : Logger = new Logger("");
    client: Client<true> | null = null; // |null is required bcs of typescript
    
    async handleCommand(command: Omit<CommandOptions, "cmdBuilder">, i: ChatInputCommandInteraction) {
        // If no permissions specified then we assume executable by everyone and run it
        if (!command.allowedPermissions && !command.allowedRoles) return await command.executor(i);
        if (command.allowedPermissions)
            for (const permission of command.allowedPermissions) {
                if (i.memberPermissions?.has(permission)) return await command.executor(i);
            }

        if (command.allowedRoles)
            for (const role of command.allowedRoles) {
                // Do the advanced citizen check here so it doesn't have to be done everywhere else
                if (role == config.citizen_role) {
                    if (await checkCitizenship(i.user.id)) {
                        return await command.executor(i);
                    }
                } else if (i.member?.roles instanceof GuildMemberRoleManager 
                    ? i.member?.roles.cache.has(role.toString()) 
                    : i.member?.roles.includes(role.toString()))
                    return await command.executor(i);
            }
        i.reply({content: "You do not have permission to execute this command.", ephemeral: true});
    }

    initialise(client: Client<true>): void {
        this.client = client;
        this.logger = new Logger(this.name);
        this.client.on("interactionCreate", async i => {
            if (!i.isChatInputCommand()) return;
            if (i.guildId != config.guild) return;
            
            const command = this.slashCommands[i.commandName]
            if (!command) return;

            const data = i.options.data[0] || i.options.data; // Maybe is subcommand
            this.logger.info(`Processing command ${i.commandName}${i.options.getSubcommand(false) ? " " + i.options.getSubcommand(false) : ""} with arguments ${data.options?.map(o => `${o.name}:${o.value}`).join(" ")} from ${i.user.tag}`);

            try {
                if ('subcommands' in command) {
                    const subcommandName = i.options.getSubcommand(false);
                    if (!subcommandName) {
                        if (command.executor) await command.executor(i);
                        return;
                    }
                    await this.handleCommand(command.subcommands[subcommandName], i);
                } else await this.handleCommand(command, i)
            } catch (e: any) {
                this.logger.error(e.stack);
                const errorMessage = `An error occurred. \`\`\`\ ${e.toString()} \`\`\``;
                i.reply({ content: errorMessage, ephemeral: true }).catch(err => i.editReply({ content: errorMessage }));
            }
        })
        this.onEnable();
    }

    onEnable(): void { }

    onModulesLoaded(modules: Map<string, Module>): void { } // Runs when all modules are loaded
    
    slashCommands: {[key: string]: CommandOptions | SubcommandOptions } = {}
}
