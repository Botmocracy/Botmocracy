import Module from "./abstract/Module";
import { config } from "..";
import { ButtonInteraction, Collection, GuildMemberRoleManager, InteractionReplyOptions, InteractionUpdateOptions, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction, User } from "discord.js";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";

export default class ElectionVoting extends Module {
    name = "ElectionVoting";
    modules!: Collection<string, Module>;
    draftBallots: Collection<string, Array<string | null>> = new Collection();

    async onEnable() {
        this.logger.info("Enabled");

        // Temp db stuff for testing
        await ElectionCandidate.deleteMany().exec();
        (await this.client?.guilds.cache.get("985425315889299466")?.members.fetch()!).forEach(m => {
            let entry = new ElectionCandidate({
                discordId: m.id,
                runningMateDiscordId: m.id
            })
            entry.save();
        })

        this.client?.on("interactionCreate", async (i) => {
            if (i.isButton()) {
                if (i.customId == "electionvote") this.startVote(i);
                else if (i.customId.startsWith("electionvotingpage")) i.update(await this.getVotingPage(parseInt(i.customId.split("-")[1]), i.user));
                else if (i.customId == "submitelectionvote") this.submitVote(i);
            } else if (i.isSelectMenu()) {
                if (i.customId.startsWith("electionpreference")) this.recordVotePreference(i);
            }
        });
    }

    onModulesLoaded(modules: Collection<string, Module>): void {
        this.modules = modules;
    }

    async startVote(i: ButtonInteraction) {
        if (i.member?.roles instanceof GuildMemberRoleManager
            ? !i.member?.roles.cache.has(config.citizen_role)
            : !i.member?.roles.includes(config.citizen_role))
            return i.reply({ content: "You must be a citizen to vote.", ephemeral: true });
        const electionPhase = await ElectionInfo.findOne().exec();
        if (electionPhase?.currentPhase != 2) return i.reply({ content: "Voting is not currently open.", ephemeral: true });

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("electionvotingpage-0")
                    .setLabel("I understand. Proceed.")
                    .setStyle("PRIMARY")
            );
        i.reply({
            content:
                [
                    `**Important information regarding voting:**`,
                    `- Votes are counted using the [Alternate Vote (AV) method](<https://www.youtube.com/watch?v=3Y3jE3B8HsE>).`,
                    `- You may rank as many or as few candidates as you like, as long as you select at least one.`,
                    `- You may change your vote at any time up until voting closes by clicking the vote button again, selecting your new preferences and saving.`,
                    `- Your vote will not be saved until you have navigated to the last page of the ballot, clicked on the save button and confirmed your preferences.`
                ].join("\n"),
            ephemeral: true,
            components: [row]
        });
    }

    async getVotingPage(page: number, user: User): Promise<InteractionUpdateOptions> {
        return new Promise(async (res) => {
            const electionPhase = await ElectionInfo.findOne().exec();
            if (electionPhase?.currentPhase != 2) res({ content: "Voting is not currently open." });

            const candidates = await ElectionCandidate.find().exec();
            const candidatesFormattedAsMenuOptions: MessageSelectOptionData[] = [];
            for (const candidate of candidates) {
                candidatesFormattedAsMenuOptions.push({
                    label: `${(await this.client?.users.fetch(candidate.discordId!)!).tag} (Pres), ${(await this.client?.users.fetch(candidate.runningMateDiscordId!)!).tag} (VP)`,
                    value: candidate.discordId!
                });
            }

            const votingMessageComponents = [];

            const pageStartPreference = page * 4;
            let pageEndPreference = pageStartPreference + 3;

            if (candidates.length < pageEndPreference) pageEndPreference = candidates.length - 1;

            const userDraftBallot = this.draftBallots.get(user.id);

            for (let j = pageStartPreference; j <= pageEndPreference; j++) {
                votingMessageComponents.push(
                    new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("electionpreference-" + j)
                            .setPlaceholder("Preference " + (j + 1) + (
                                userDraftBallot && userDraftBallot[j] != null 
                                ? ": " + candidatesFormattedAsMenuOptions.filter(c => c.value == userDraftBallot[j])[0].label
                                : ""
                                ))
                            .addOptions(candidatesFormattedAsMenuOptions)
                    )
                )
            }

            const buttonRowComponents = [];

            if (page > 0) buttonRowComponents.push(
                new MessageButton()
                    .setCustomId(`electionvotingpage-${page - 1}`)
                    .setLabel("Previous Page")
                    .setStyle("PRIMARY")
            );
            if (pageEndPreference != candidates.length - 1) buttonRowComponents.push(
                new MessageButton()
                    .setCustomId(`electionvotingpage-${page + 1}`)
                    .setLabel("Next Page")
                    .setStyle("PRIMARY")
            );
            else buttonRowComponents.push(
                new MessageButton()
                    .setCustomId(`submitelectionvote`)
                    .setLabel("Submit Vote")
                    .setStyle("SUCCESS")
            );

            const buttonRow = new MessageActionRow().addComponents(buttonRowComponents);
            votingMessageComponents.push(buttonRow);

            res({ content: `**Election ballot page ${page + 1}/${Math.ceil(candidates.length / 4)}**`, components: votingMessageComponents });
        })
    }

    async recordVotePreference(i: SelectMenuInteraction) {
        const preference = parseInt(i.customId.split("-")[1]);
        const numberOfCandidates = (await ElectionInfo.find().exec()).length;
        const ballot = this.draftBallots.get(i.user.id) ? this.draftBallots.get(i.user.id)! : Array(numberOfCandidates).fill(null);
        ballot[preference] = i.values[0];
        this.draftBallots.set(i.user.id, ballot);

        const ballotPage = Math.floor(preference / 4);
        i.update(await this.getVotingPage(ballotPage, i.user));
    }

    async submitVote(i: ButtonInteraction) {
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("electionvotingpage-0")
                .setLabel("This is Wrong")
                .setStyle("DANGER"),
            new MessageButton()
                .setCustomId("confirmsubmitelectionvote")
                .setLabel("This is Correct")
                .setStyle("SUCCESS")
        )

        let outputMessage = "**PLEASE CONFIRM THAT THE BELOW VOTE IS CORRECT:**";

        const draftBallot = this.draftBallots.get(i.user.id)?.filter(p => p != null);

        for (let i in draftBallot) {
            let iAsNumber = parseInt(i); // It's already a number but just so ts will stfu
            outputMessage += `\nPreference ${iAsNumber + 1}: <@${draftBallot[iAsNumber]}>`;
        }

        i.update({ content: outputMessage, components: [row] });
    }
}