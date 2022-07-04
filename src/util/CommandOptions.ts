import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionResolvable, RoleResolvable } from "discord.js";

export interface CommandOptions {
    cmdBuilder: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    executor: (i: CommandInteraction) => Promise<void>,
    allowedPermissions?: PermissionResolvable[],
    allowedRoles?: RoleResolvable[]
}
export interface SubcommandOptions {
    cmdBuilder: SlashCommandSubcommandsOnlyBuilder,
    executor?: (i: CommandInteraction) => Promise<void>
    subcommands: {[key: string]: Omit<CommandOptions, "cmdBuilder">}
}