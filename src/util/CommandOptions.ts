/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    ChatInputCommandInteraction,
    RoleResolvable,
    PermissionResolvable,
} from "discord.js";

export interface CommandOptions {
    cmdBuilder: Omit<
        SlashCommandBuilder,
        "addSubcommand" | "addSubcommandGroup"
    >;
    executor: (i: ChatInputCommandInteraction) => Promise<any>;
    allowedPermissions?: PermissionResolvable[];
    allowedRoles?: RoleResolvable[];
}
export interface SubcommandOptions {
    cmdBuilder: SlashCommandSubcommandsOnlyBuilder;
    executor?: (i: ChatInputCommandInteraction) => Promise<any>;
    subcommands: Record<string, Omit<CommandOptions, "cmdBuilder">>;
}
