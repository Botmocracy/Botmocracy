import {
  ChatInputCommandInteraction,
  PermissionResolvable,
  RoleResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface CommandOptions {
  cmdBuilder: Omit<
    SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    "addSubcommand" | "addSubcommandGroup"
  >;
  executor: (i: ChatInputCommandInteraction) => Promise<unknown>;
  allowedPermissions?: PermissionResolvable[];
  allowedRoles?: RoleResolvable[];
}
export interface SubcommandOptions {
  cmdBuilder:
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder;
  executor?: (i: ChatInputCommandInteraction) => Promise<unknown>;
  subcommands: Record<string, Omit<CommandOptions, "cmdBuilder">>;
}
