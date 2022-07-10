import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { config } from "..";
import Module from "./abstract/Module";

export default class Admin extends Module {
    name = "Admin";

    onEnable(): void {
        this.logger.info("Enabled");
    }

    slashCommands = {
        superuser: {
            cmdBuilder: new SlashCommandBuilder().setName("superuser").setDescription("Adds le admin role. Can only be used by binty, ain and fishe"),
            async executor(i: CommandInteraction) {
                if (!i.inGuild()) return;
                const allowedPeople = ["644052617500164097", "468534859611111436", "716779626759716914"];
                if (!allowedPeople.includes(i.user.id)) return i.reply({ content: "You cannot use this.", ephemeral: true });

                const role = i.guild!.roles.cache.get(config.admin_role);
                const member = i.guild!.members.cache.get(i.user.id);

                if (member?.roles.cache.has(config.admin_role)) {
                    member.roles.remove(role!);
                    return i.reply({ content: "Done.", ephemeral: true });
                }

                member?.roles.add(role!);
                return i.reply({ content: "Done.", ephemeral: true });
            }
        }

    }
}