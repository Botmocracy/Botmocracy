import { Collection, Guild, PermissionString, Role } from "discord.js";
import timestring from "timestring";
import { config } from "..";
import Module from "./abstract/Module";

// This is such a mess and I do not care
export default class RoleAudit extends Module {
    onEnable(): void {
        setInterval(() => this.auditRoles(), timestring(config.role_audit_interval, "ms"));
    }

    auditRoles() {
        const rolesCache: Collection<string, Role> = this.client?.guilds.cache.get(config.guild)?.roles.cache!;
        const roles: Array<Role> = Array.from(rolesCache.keys()).map(k => rolesCache.get(k as string)) as Array<Role>;
        for (const role of roles) {
            if (config.restricted_permissions_allowed_roles.includes(role.id)) continue;
            let permissions: PermissionString[] = role.permissions.toArray();
            let modified: boolean = false;
            for (const permission of config.restricted_permissions) {
                if (role.permissions.has(permission, false)) {
                    permissions.splice(permissions.indexOf(permission), 1);
                    modified = true;
                }
            }
            if (modified) role.setPermissions(permissions, "Role Audit").catch(err => {});
        }
    }
}