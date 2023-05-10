import {
    Client,
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
} from "discord.js";
import { CommandOptions, SubcommandOptions } from "../../util/CommandOptions";
import Logger from "../../util/Logger";
import { config } from "../..";
import checkCitizenship from "../../util/check-citizenship";

export default class Module {
    name = "";

    logger: Logger = new Logger("");
    client: Client<true> | null = null; // |null is required bcs of typescript

    async handleCommand(
        command: Omit<CommandOptions, "cmdBuilder">,
        i: ChatInputCommandInteraction
    ) {
        // If no permissions specified then we assume executable by everyone and run it
        if (!command.allowedPermissions && !command.allowedRoles)
            return await command.executor(i);
        if (command.allowedPermissions)
            for (const permission of command.allowedPermissions) {
                if (i.memberPermissions?.has(permission))
                    return await command.executor(i);
            }

        if (command.allowedRoles)
            for (const role of command.allowedRoles) {
                // Do the advanced citizen check here so it doesn't have to be done everywhere else
                if (role == config.citizen_role) {
                    if (await checkCitizenship(i.user.id)) {
                        return await command.executor(i);
                    }
                } else if (
                    i.member?.roles instanceof GuildMemberRoleManager
                        ? i.member.roles.cache.has(role.toString())
                        : i.member?.roles.includes(role.toString())
                )
                    return await command.executor(i);
            }
        await i.reply({
            content: "You do not have permission to execute this command.",
            ephemeral: true,
        });
    }

    initialise(client: Client<true>): void {
        this.client = client;
        this.logger = new Logger(this.name);
        this.client.on("interactionCreate", async (i) => {
            if (!i.isChatInputCommand()) return;
            if (i.guildId != config.guild) return;

            if (!Object.keys(this.slashCommands).includes(i.commandName))
                return;
            const command: CommandOptions | SubcommandOptions =
                this.slashCommands[i.commandName];

            const data = i.options.data[0] || i.options.data; // Maybe is subcommand
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/restrict-template-expressions
            this.logger.info(
                `Processing command ${i.commandName}${
                    i.options.getSubcommand(false)
                        ? " " + i.options.getSubcommand(false)
                        : ""
                } with arguments ${data.options
                    ?.map((o) => `${o.name}:${o.value}`)
                    .join(" ")} from ${i.user.tag}`
            );
            try {
                if ("subcommands" in command) {
                    const subcommandName = i.options.getSubcommand(false);
                    if (!subcommandName) {
                        if (command.executor) await command.executor(i);
                        return;
                    }
                    await this.handleCommand(
                        command.subcommands[subcommandName],
                        i
                    );
                } else await this.handleCommand(command, i);
            } catch (e) {
                this.logger.error((e as Error).stack ?? "");
                const errorMessage = `An error occurred. \`\`\`\n${(
                    e as Error
                ).toString()}\n\`\`\``;
                i.reply({ content: errorMessage, ephemeral: true }).catch(() =>
                    i.editReply({ content: errorMessage })
                );
            }
        });
        this.onEnable();
    }

    onEnable(): void {
        /* empty */
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onModulesLoaded(modules: Map<string, Module>): void {
        /* empty */
    } // Runs when all modules are loaded

    slashCommands: Record<string, CommandOptions | SubcommandOptions> = {};
}
