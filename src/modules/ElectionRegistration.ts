import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, GuildMember, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { CallbackError } from "mongoose";
import { config } from "..";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";
import { ElectionPhase } from "../util/ElectionPhase";
import Module from "./abstract/Module";

export default class ElectionRegistration extends Module {
    name = "ElectionRegistration";

    onEnable(): void {
        this.logger.info("Enabled");

        this.client?.on("interactionCreate", i => {
            if (i.isButton()) {
                if (i.customId.startsWith("confirmcandidacy")) {
                    this.confirmCandidacy(i);
                } else if (i.customId.startsWith("confirmwithdrawal")) {
                    this.confirmWithdrawal(i);
                }
            }
        });
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
                if (runningMate.id == this.client?.user.id) return i.reply({ content: "I don't want to run with you, I'm a bot!", ephemeral: true });

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`confirmcandidacy-${i.user.id}-${runningMate.id}`)
                            .setStyle("PRIMARY")
                            .setLabel("Confirm")
                    );

                i.reply({
                    content: `**Are you sure?**\n\nBy clicking the \`Confirm\` button, you agree to enter yourself into the election and that your running-mate ${runningMate} is willing to enter also.`,
                    components: [row],
                    ephemeral: true
                });
            }
        },
        withdrawfromelection: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("withdrawfromelection")
                .setDescription("Withdraw yourself from election candidacy.")
                .addUserOption(
                    o => o
                        .setName("runningwith")
                        .setDescription("The person you are running with")
                        .setRequired(true)
                ),

            allowedRoles: [config.citizen_role],

            executor: async (i: CommandInteraction) => {
                const electionInfo = await ElectionInfo.findOne().exec();
                if (electionInfo?.currentPhase == 0) return i.reply({ content: "There isn't currently an election running.", ephemeral: true });

                const runningWith = i.options.getUser("runningwith");
                if (!runningWith) return i.reply({ content: "That's not a valid Discord user.", ephemeral: true });

                const runningAsPrimary = await ElectionCandidate.findOne({ discordId: i.user.id, runningMateDiscordId: runningWith.id });
                const runningAsSecondary = await ElectionCandidate.findOne({ discordId: runningWith.id, runningMateDiscordId: i.user.id });

                if (!runningAsPrimary && !runningAsSecondary) return i.reply({ content: "You don't seem to be running with that person.", ephemeral: true });

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`confirmwithdrawal-${i.user.id}-${runningWith.id}`)
                            .setStyle("DANGER")
                            .setLabel("Confirm")
                    );

                i.reply({
                    content: `**Are you sure?**\n\If you click the \`Confirm\` button, this combination will be removed from the election`,
                    components: [row],
                    ephemeral: true
                });
            }
        }
    }

    confirmCandidacy(i: ButtonInteraction) {
        let userIds = i.customId.split("-");
        userIds.shift() // Remove "confirmcandidacy"

        // Make sure there's no sorcery going on
        if (i.user.id != userIds[0] || !i.guild || !i.guild.members.cache.has(userIds[1])) return i.reply({ content: "wtf is happening", ephemeral: true });

        const candidate = i.member;
        const runningMate = i.guild.members.cache.get(userIds[1]);

        ElectionInfo.findOne((err: CallbackError, data: any) => {
            if (err) return i.reply({ content: "Error retrieving election info: " + err.toString(), ephemeral: true });

            if (data.currentPhase != 1) return i.reply({
                content: "Election registration is not currently open. Please refer to <#" + config.election_updates_channel + "> for more information.",
                ephemeral: true
            })

            ElectionCandidate.findOne({ discordId: candidate?.user.id }, (err: CallbackError, data: any) => {
                if (data) return i.reply({ content: "You have already entered this election.", ephemeral: true });

                const candidateInfo = new ElectionCandidate({
                    discordId: candidate?.user.id,
                    runningMateDiscordId: runningMate?.user.id
                });
                candidateInfo.save();

                i.reply({ content: "Confirmed!", ephemeral: true });

                const updatesChannel = (this.client?.channels.cache.get(config.election_updates_channel) as TextChannel | null);
                if (!updatesChannel) return;

                updatesChannel.send(`${candidate} has entered the election! Their running-mate is ${runningMate}!`);
            })


        })
    }

    async confirmWithdrawal(i: ButtonInteraction) {
        let userIds = i.customId.split("-");
        userIds.shift() // Remove "confirmwithdrawal"

        // Make sure there's no sorcery going on
        if (i.user.id != userIds[0]) return i.reply({ content: "wtf is happening", ephemeral: true });

        const runningAsPrimary = await ElectionCandidate.findOne({ discordId: userIds[0], runningMateDiscordId: userIds[1] });
        const runningAsSecondary = await ElectionCandidate.findOne({ discordId: userIds[1], runningMateDiscordId: userIds[0] });

        if (!runningAsPrimary && !runningAsSecondary) return i.reply({ content: "Oops. Looks like something broke.", ephemeral: true });
        if (runningAsPrimary) runningAsPrimary.remove();
        if (runningAsSecondary) runningAsSecondary.remove();

        i.reply({ content: "Confirmed", ephemeral: true });

        const updatesChannel = (this.client?.channels.cache.get(config.election_updates_channel) as TextChannel | null);
        if (!updatesChannel) return;

        updatesChannel.send(`<@${userIds[0]}> has withdrawn <@${userIds[0]}> and <@${userIds[1]}> from the election.`);
    }
}