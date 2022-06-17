import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionResolvable, RoleResolvable } from "discord.js";

export default interface Command {
    cmdBuilder: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    executor: (i: CommandInteraction) => Promise<void>,
    allowedPermissions?: PermissionResolvable[],
    allowedRoles?: RoleResolvable[]
}