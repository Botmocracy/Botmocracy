import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, GuildMember, MessageActionRow, MessageButton } from "discord.js";
import { config } from "..";
import ElectionInfo from "../schema/ElectionInfo";
import Module from "./abstract/Module";

export default class Election extends Module {
    name = "Election";

    onEnable(): void {
        this.logger.info("Enabled");

        this.client?.on("interactionCreate", i => {
            if (i.isButton() && i.customId.startsWith("confirmcandidacy")) {
                this.confirmCandidacy(i);
            }
        })
    }

    slashCommands = { 
        enterelection: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("enterelection")
                .setDescription("Enter the Presidential election")
                .addUserOption(
                    o => o
                        .setName("runningmate")
                        .setDescription("The person who will be vice president if you are elected")
                        .setRequired(true)
                ),

            allowedRoles: [config.citizen_role],

            executor: async (i: CommandInteraction) => {
                if (!i.guild) {
                    i.reply({ content: "You can't use this in a DM", ephemeral: true });
                    return;
                }

                const runningMate = i.options.getMember("runningmate") as GuildMember;

                if (!runningMate) return i.reply({ content: "That person is not a member of this server.", ephemeral: true });
                if (!runningMate.roles.cache.has(config.citizen_role)) return i.reply({ content: "That person is not a citizen.", ephemeral: true });
                if (runningMate.id == i.user.id) return i.reply({ content: "Really? You want to run with yourself?", ephemeral: true });
                if (runningMate.id == this.client?.user.id) return i.reply({ content: "I don't want to run with you, I'm a bot!", ephemeral: true});

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`confirmcandidacy-${i.user.id}-${runningMate.id}`)
                            .setStyle("PRIMARY")
                            .setLabel("Confirm")
                    );

                i.reply({ content: `**Are you sure?**\n\nBy clicking the \`Confirm\` button, you agree to enter yourself into the election and that your running-mate is willing to enter also.`, components: [row], ephemeral: true });
            }
        }
    }

    confirmCandidacy(i: ButtonInteraction) {
        let userIds = i.customId.split("-");
        userIds.shift() // Remove "confirmcandidacy"

        // Make sure there's no sorcery going on
        if (i.user.id != userIds[0] || !i.guild || !i.guild.members.cache.has(userIds[1])) return i.reply({ content: "wtf is happening", ephemeral: true });

        const candidate = i.member;
        const runningMate = i.guild.members.cache.get(userIds[0]);

        ElectionInfo.findOne((err: any, data: any) => {
            if (err) return i.reply({ content: "Error retrieving election info: " + err.toString(), ephemeral: true });
            console.log(data);

            const updatesChannel = this.client?.channels.cache.get(config.election_updates_channel);
            if (!updatesChannel) return;
        })
    }
}