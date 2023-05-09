import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, SelectMenuComponentOptionData, SelectMenuInteraction, StringSelectMenuBuilder, User } from "discord.js";
import { config } from "..";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";
import ElectionVote from "../schema/ElectionVote";
import checkCitizenship from "../util/check-citizenship";
import Module from "./abstract/Module";
import Auth from "./Auth";

export default class ElectionVoting extends Module {
    name = "ElectionVoting";
    draftBallots: Map<string, (string | null)[]> = new Map();

    authModule!: Auth;

    async onEnable() {
        this.logger.info("Enabled");

        this.client?.on("interactionCreate", async (i) => {
            if(i.guildId != config.guild) return;
            if (i.isButton()) {
                if (i.customId == "electionvote") this.startVote(i);
                else if (i.customId.startsWith("electionvotingpage")) {
                    i.update(await this.getVotingPage(parseInt(i.customId.split("-")[1]), i.user))
                }
                else if (i.customId == "submitelectionvote") this.submitVote(i);
                else if (i.customId == "confirmsubmitelectionvote") this.confirmSubmitVote(i);
            } else if (i.isSelectMenu()) {
                if (i.customId.startsWith("electionpreference")) this.recordVotePreference(i);
            }
        });
    }

    onModulesLoaded(modules: Map<string, Module>): void {
        this.authModule = modules.get("Auth") as Auth;
    }

    async startVote(i: ButtonInteraction) {
        if (!await checkCitizenship(i.user.id)) return i.reply({ content: "You must be a citizen to vote.", ephemeral: true });
            
        const electionPhase = await ElectionInfo.findOne().exec();
        if (electionPhase?.currentPhase != 2) return i.reply({ content: "Voting is not currently open.", ephemeral: true });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("electionvotingpage-0")
                    .setLabel("I understand. Proceed.")
                    .setStyle(ButtonStyle.Primary)
            );
        i.reply({
            content:
                [
                    `**Important information regarding voting:** (Please read)`,
                    `- Votes are counted using the [Alternate Vote (AV) method](<https://www.youtube.com/watch?v=3Y3jE3B8HsE>).`,
                    `- You may rank as many or as few candidates as you like, as long as you select at least one. It is, however, recommended to rank **all** candidates (except one, if you wish) as your vote will be more effective this way.`,
                    `- You may change your vote at any time up until voting closes by clicking the vote button again, selecting your new preferences and saving.`,
                    `- Your vote will not be saved until you have navigated to the last page of the ballot, clicked on the save button and confirmed your preferences.`
                ].join("\n"),
            ephemeral: true,
            components: [row]
        });
    }

    async getVotingPage(page: number, user: User): Promise<any> {
        return new Promise(async (res) => {
            // See if they've submitted a vote before and if so fill in the values
            if (page == 0 && !this.draftBallots.get(user.id)) {
                let previousVote = await ElectionVote.findOne({ discordId: user.id }).exec();
                if (previousVote) {
                    this.draftBallots.set(user.id, previousVote.preferences! as unknown as Array<string>);
                }
            }

            const electionPhase = await ElectionInfo.findOne().exec();
            if (electionPhase?.currentPhase != 2) res({ content: "Voting is not currently open.", components: [] });

            const candidates = await ElectionCandidate.find().exec();
            const candidatesFormattedAsMenuOptions: Array<SelectMenuComponentOptionData> = [];
            for (const candidate of candidates) {
                candidatesFormattedAsMenuOptions.push({
                    label: `${await this.authModule.getMinecraftOrDiscordName(candidate.discordId!)} (Pres), ${await this.authModule.getMinecraftOrDiscordName(candidate.runningMateDiscordId!)} (VP)`,
                    value: candidate.discordId!
                });
            }

            candidatesFormattedAsMenuOptions.push({
                label: "No preference",
                value: "no_preference"
            })

            const votingMessageComponents = [];

            const pageStartPreference = page * 4;
            let pageEndPreference = pageStartPreference + 3;

            if (candidates.length <= pageEndPreference) pageEndPreference = candidates.length - 1;

            let userDraftBallot: (string | null)[] = [];
            if (this.draftBallots.get(user.id)) userDraftBallot = this.draftBallots.get(user.id)!;

            for (let j = pageStartPreference; j <= pageEndPreference; j++) {
                votingMessageComponents.push(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("electionpreference-" + j)
                            .setPlaceholder("Preference " + (j + 1) + (
                                userDraftBallot && userDraftBallot[j]
                                    ? ": " + candidatesFormattedAsMenuOptions.filter(c => c.value == userDraftBallot[j])[0].label
                                    : ""
                            ))
                            .addOptions(candidatesFormattedAsMenuOptions)
                    )
                )
            }

            const buttonRowComponents = [];

            if (page > 0) buttonRowComponents.push(
                new ButtonBuilder()
                    .setCustomId(`electionvotingpage-${page - 1}`)
                    .setLabel("Previous Page")
                    .setStyle(ButtonStyle.Primary)
            );
            if (pageEndPreference != candidates.length - 1) buttonRowComponents.push(
                new ButtonBuilder()
                    .setCustomId(`electionvotingpage-${page + 1}`)
                    .setLabel("Next Page")
                    .setStyle(ButtonStyle.Primary)
            );
            else buttonRowComponents.push(
                new ButtonBuilder()
                    .setCustomId(`submitelectionvote`)
                    .setLabel("Submit Vote")
                    .setStyle(ButtonStyle.Success)
            );

            const buttonRow = new ActionRowBuilder().addComponents(buttonRowComponents);
            votingMessageComponents.push(buttonRow);

            res({ content: `**Election ballot page ${page + 1}/${Math.ceil(candidates.length / 4)}**`, components: votingMessageComponents, ephemeral: true });
        })
    }

    async recordVotePreference(i: SelectMenuInteraction) {
        const preference = parseInt(i.customId.split("-")[1]);
        const numberOfCandidates = (await ElectionInfo.find().exec()).length;
        const ballot = this.draftBallots.get(i.user.id) ? this.draftBallots.get(i.user.id)! : Array(numberOfCandidates).fill(null);
        ballot[preference] = (i.values[0] != "no_preference" ? i.values[0] : null);
        this.draftBallots.set(i.user.id, ballot);

        const ballotPage = Math.floor(preference / 4);
        i.update(await this.getVotingPage(ballotPage, i.user));
    }

    async submitVote(i: ButtonInteraction) {
        const candidates = await ElectionCandidate.find().exec();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("electionvotingpage-0")
                .setLabel("This is Wrong")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("confirmsubmitelectionvote")
                .setLabel("This is Correct")
                .setStyle(ButtonStyle.Success)
        )

        let outputMessage = "**PLEASE CONFIRM THAT THE BELOW VOTE IS CORRECT:**";

        const draftBallot = this.draftBallots.get(i.user.id)?.filter((pref, pos) => pref != null && this.draftBallots.get(i.user.id)!.indexOf(pref) == pos && candidates.map(c => c.discordId!).includes(pref));

        if (!draftBallot || draftBallot.length == 0) return i.reply({ content: "You must specify at least one preference before saving your ballot.", ephemeral: true });

        for (let i in draftBallot) {
            let iAsNumber = parseInt(i); // It's already a number but just so ts will stfu
            outputMessage += `\nPreference ${iAsNumber + 1}: **${await this.authModule.getMinecraftOrDiscordName(draftBallot[iAsNumber]!, true)}**`;
        }

        i.update({ content: outputMessage, components: [row] });
    }

    async confirmSubmitVote(i: ButtonInteraction) {
        // Just in case they're somehow decitizened after initiating their vote
        if (!await checkCitizenship(i.user.id)) return i.update({ content: "You must be a citizen to vote.", components: [] });

        const electionPhase = await ElectionInfo.findOne().exec();
        if (electionPhase?.currentPhase != 2) return i.update({ content: "Voting is not currently open.", components: [] });

        const preferences = this.draftBallots.get(i.user.id);
        if (!preferences) return i.update({ content: "Your draft preferences seem to have not been saved. You will need to re-enter them by clicking on the `Vote` button again." })

        const vote = new ElectionVote({
            discordId: i.user.id,
            preferences: preferences.filter((pref, pos) => pref != null && preferences.indexOf(pref) == pos)
        });

        await ElectionVote.deleteOne({ discordId: i.user.id }).exec();
        await vote.save();

        i.update({ content: "Saved! Thanks for voting!", components: [] });
        this.logger.info("Saved vote for " + i.user.tag);
    }
}