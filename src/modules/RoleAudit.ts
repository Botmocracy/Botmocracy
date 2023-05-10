import {
    AuditLogEvent,
    Collection,
    PermissionsString,
    Role,
    TextChannel,
} from "discord.js";
import timestring from "timestring";
import { config } from "..";
import Account from "../schema/Account";
import wait from "../util/wait";
import Module from "./abstract/Module";

// This is such a mess and I do not care
export default class RoleAudit extends Module {
    name = "RoleAudit";

    async onEnable() {
        this.logger.info("Enabled");
        await this.auditRoles();
        setInterval(
            () => void this.auditRoles(),
            timestring(config.role_audit_interval, "ms")
        );

        // Check for special roles being deleted

        this.client?.on("roleDelete", async (role) => {
            await wait(1000);

            const auditLogs = await role.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
            });

            const log = auditLogs.entries.first();

            if (
                !log?.executor ||
                !config.restricted_permissions_allowed_roles.includes(
                    role.id
                ) ||
                role.id != log.target!.id
            )
                return;

            const member = role.guild.members.resolve(log.executor);

            if (!member) return;

            await member.timeout(12 * 60 * 60 * 1000, "Deleted protected role");
            await (this.client?.channels.cache.get(
                config.logs_channel
            ) as TextChannel)!.send("@everyone a protected role was deleted.");
        });
    }

    async auditRoles(): Promise<void> {
        const guild = this.client?.guilds.cache.get(config.guild);

        // Audit role permissions
        const rolesCache: Collection<string, Role> = guild!.roles.cache;
        const roles: Role[] = Array.from(rolesCache.keys()).map(
            (k) => rolesCache.get(k)!
        );
        for (const role of roles) {
            if (config.restricted_permissions_allowed_roles.includes(role.id))
                continue;
            const permissions: PermissionsString[] = role.permissions.toArray();
            let modified = false;
            for (const permission of config.restricted_permissions) {
                if (role.permissions.has(permission, false)) {
                    permissions.splice(permissions.indexOf(permission), 1);
                    modified = true;
                }
            }
            if (modified)
                await role
                    .setPermissions(permissions, "Role Audit")
                    .catch(() => undefined);
        }

        // Audit individual members for role anomalies and also update the roles section in their account data if applicable
        await guild?.members.fetch();
        for (const member of guild!.members.cache.values()) {
            const account = await Account.findOne({
                discordId: member.id,
            }).exec();

            const hasVerifiedRole = member.roles.cache.has(
                config.verified_role
            );
            const hasCitizenRole = member.roles.cache.has(config.citizen_role);

            if (!account) {
                if (hasVerifiedRole)
                    await member.roles.remove(
                        config.verified_role,
                        "Role Audit"
                    );
                if (hasCitizenRole)
                    await member.roles.remove(
                        config.citizen_role,
                        "Role Audit"
                    );
                return;
            }

            if (!hasVerifiedRole)
                await member.roles.add(config.verified_role, "Role Audit");

            if (!account.citizen) {
                if (hasCitizenRole)
                    await member.roles.remove(
                        config.citizen_role,
                        "Role Audit"
                    );
            } else if (!hasCitizenRole)
                await member.roles.add(config.citizen_role, "Role Audit");

            const roles = member.roles.cache.map((r) => r.id);
            await Account.updateOne(
                { discordId: member.id },
                { roles: roles }
            ).exec();
        }
    }
}
