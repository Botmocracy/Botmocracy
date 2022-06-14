import { Message, PermissionResolvable, RoleResolvable } from "discord.js";

export default interface Command {
    name: string,
    executor: (message: Message, args: string[]) => void,
    allowedPermissions?: PermissionResolvable[],
    allowedRoles?: RoleResolvable[]
}