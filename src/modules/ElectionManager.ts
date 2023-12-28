/* eslint-disable no-fallthrough */
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    TextChannel,
} from "discord.js";
import lt from "long-timeout";
import timestring from "timestring"; // Why can't they just do this like everyone else
import { config } from "..";
import Account from "../schema/Account";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";
import ElectionVote from "../schema/ElectionVote";
import { ElectionPhase } from "../util/ElectionPhase";
import ElectionCounter from "./ElectionCounter";
import ElectionVoting from "./ElectionVoting";
import RoleAudit from "./RoleAudit";
import Module from "./abstract/Module";

export default class ElectionManager extends Module {
    name = "ElectionManager";
    updatesChannel: TextChannel | undefined;

    registrationBegin: number | undefined;
    votingBegin: number | undefined;
    votingEnd: number | undefined;
    powerTransition: number | undefined;

    counter: ElectionCounter | undefined;
    votingHandler: ElectionVoting | undefined;
    roleAuditor: RoleAudit | undefined;

    timeouts: lt.Timeout[] = [];

    onEnable() {
        this.logger.info("Enabled");
        this.updatesChannel = this.client?.channels.cache.get(
            config.election_updates_channel
        ) as TextChannel;
    }

    async run() {
        this.timeouts.forEach((t) => lt.clearTimeout(t));

        this.votingHandler!.draftBallots = new Map(); // Reset this

        const info = await ElectionInfo.findOne();
        if (!info) return this.logger.error("Failed to get election info.");
        if (
            info.processStartTime == undefined ||
            info.currentPhase == undefined
        )
            return this.logger.error("Election info is missing details");

        const currentPhase: number = info.currentPhase;
        this.registrationBegin = info.processStartTime.getTime();
        this.votingBegin =
            this.registrationBegin +
            timestring(config.election_registration_period, "ms");
        this.votingEnd =
            this.votingBegin + timestring(config.election_vote_period, "ms");
        this.powerTransition =
            this.votingEnd + timestring(config.power_transition_period, "ms");

        switch (currentPhase) {
            case 0:
                this.timeouts.push(
                    lt.setTimeout(
                        () => void this.beginRegistration(),
                        this.registrationBegin - Date.now()
                    )
                );
            case 1:
                this.timeouts.push(
                    lt.setTimeout(
                        () => void this.beginVoting(),
                        this.votingBegin - Date.now()
                    )
                );
            case 2:
                this.timeouts.push(
                    lt.setTimeout(
                        () => void this.endVoting(),
                        this.votingEnd - Date.now()
                    )
                );
            case 3:
                this.timeouts.push(
                    lt.setTimeout(
                        () => void this.transition(),
                        this.powerTransition - Date.now()
                    )
                );
        }
    }

    async onModulesLoaded(modules: Collection<string, Module>) {
        this.counter = modules.get("ElectionCounter") as ElectionCounter;
        this.votingHandler = modules.get("ElectionVoting") as ElectionVoting;
        this.roleAuditor = modules.get("RoleAudit") as RoleAudit;

        if (process.env.dev) {
            const electionInfo = new ElectionInfo({
                processStartTime: Date.now() + 3000,
                currentPhase: 0,
            });

            await ElectionInfo.deleteMany();
            await electionInfo.save();
        }

        await this.run();
    }

    timestamp(time: number) {
        return `<t:${Math.floor(time / 1000)}:F>`;
    }

    async updateElectionPhase(phase: ElectionPhase) {
        const currentInfo = await ElectionInfo.findOne();
        if (!currentInfo)
            throw new Error(
                "Unable to update election phase: Info fetch failed"
            );

        await currentInfo.deleteOne();

        const newInfo = new ElectionInfo({
            currentPhase: phase,
            processStartTime: currentInfo.processStartTime,
        });

        await newInfo.save();
    }

    async beginRegistration() {
        await this.updateElectionPhase(ElectionPhase.REGISTRATION);
        await this.updatesChannel!.send(
            [
                `<@&${config.citizen_role}> **Presidential Election registration is now open!**`,
                `Any citizen may run. To register, run \`/election enter\` and specify your running-mate, who will be vice president if elected.`,
                `Important times to take note of:`,
                `${this.timestamp(
                    this.votingBegin!
                )} - Registration ends and voting begins.`,
                `${this.timestamp(
                    this.votingEnd!
                )} - Voting ends and counting begins.`,
                `${this.timestamp(
                    this.powerTransition!
                )} - Transition of power.`,
                ``,
                `You can use \`/election listrunning\` at any time to see who has entered.`,
            ].join("\n")
        );
    }

    async beginVoting() {
        const candidates = await ElectionCandidate.find();
        if (candidates.length == 0) return this.noElectionCandidatesOrVotes();

        await this.updateElectionPhase(ElectionPhase.VOTING);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("electionvote")
                .setLabel("Vote")
                .setStyle(ButtonStyle.Primary)
        );
        await this.updatesChannel!.send({
            content: [
                `<@&${config.citizen_role}> **Presidential Election voting is now open!**`,
                `Press the button below before ${this.timestamp(this.votingEnd!)} to have your say in choosing the next President!`,
                `You can use \`/election listrunning\` at any time to see who has entered.`,
                `*PS: You have a better chance of winning if you get your friends to join and vote for you ;)*`
            ].join("\n"), components: [row]
        });
    }

    async endVoting() {
        const candidates = await ElectionCandidate.find();
        if (candidates.length == 0) return this.noElectionCandidatesOrVotes();

        const votes = await ElectionVote.find();
        if (votes.length == 0) return this.noElectionCandidatesOrVotes();

        await this.updateElectionPhase(ElectionPhase.TRANSITION);
        await this.updatesChannel!.send(
            "**Election voting has closed.** Counting will commence shortly."
        );

        while (!this.counter) {
            /* empty */
        } // Wait for the counter to become ready before doing anything

        await this.counter.commenceCount();
    }

    async elect(elected: string) {
        const candidateInfo = await ElectionCandidate.findOne({
            discordId: elected,
        });
        if (!candidateInfo)
            throw new Error("Elected candidate isn't a candidate...???");

        const runningMate = candidateInfo.runningMateDiscordId;
        await this.updatesChannel!.send(
            `**Congratulations to our President Elect <@${elected}> and Vice President Elect <@${runningMate}>!**\nRoles will be transferred at ${this.timestamp(
                this.powerTransition!
            )}`
        );

        const currentElectionInfo = await ElectionInfo.findOne();

        const newElectionInfo = new ElectionInfo({
            processStartTime: currentElectionInfo?.processStartTime,
            currentPhase: currentElectionInfo?.currentPhase,
            winners: [elected, runningMate],
        });

        await currentElectionInfo?.deleteOne();
        await newElectionInfo.save();
    }

    async transition() {
        const electionInfo = await ElectionInfo.findOne();

        if (!electionInfo) throw new Error("Failed to fetch election info");

        const guild = this.client?.guilds.cache.get(config.guild);

        const presidentRole = await guild!.roles.fetch(config.president_role);
        const vicePresidentRole = await guild!.roles.fetch(
            config.vice_president_role
        );
        const governmentRole = await guild!.roles.fetch(config.government_role);

        const electedRoleIds = [
            presidentRole!.id,
            vicePresidentRole!.id,
            governmentRole!.id,
        ];

        await guild?.members.fetch(); // Do the cache things

        for (const account of await Account.find()) {
            const newRoles = (account.roles as unknown as string[]).filter(
                (role) => !electedRoleIds.includes(role)
            );

            const member = guild?.members.cache.get(account.discordId!);
            if (member?.roles.cache.hasAny(...electedRoleIds)) {
                await member.roles.remove(electedRoleIds, "Transfer of power");
            }

            if ((account.roles as unknown as string[]) != newRoles)
                await Account.updateOne(
                    { discordId: account.discordId },
                    { roles: newRoles }
                );
        }

        for (const member of guild!.members.cache.values()!) {
            if (
                member.roles.cache.hasAny(...electedRoleIds) &&
                !member.user.bot
            )
                await member.roles.remove(electedRoleIds, "Transfer of power");
        }

        await this.roleAuditor?.auditRoles(); // In case anything sneaky was going on

        const winners = electionInfo.winners! as unknown as string[]; // Already did this...fucking mongoose

        const presidentMember = await guild?.members.fetch(winners[0]);
        const vicePresidentMember = await guild?.members.fetch(winners[1]);

        // There is a possibility that they will have left the server
        if (presidentMember?.roles != undefined) {
            await presidentMember.roles.add(
                [presidentRole!, governmentRole!],
                "Transfer of power"
            );
        }
        if (vicePresidentMember?.roles != undefined) {
            await vicePresidentMember.roles.add(
                [vicePresidentRole!, governmentRole!],
                "Transfer of power"
            );
        }

        this.scheduleNextElection()
            .then((nextElectionTime) => {
                void (
                    this.client!.channels.cache.get(
                        config.announcement_channel
                    )! as TextChannel
                ).send(
                    [
                        `@everyone give a big hand to our new President and Vice President, <@${winners[0]}> and <@${winners[1]}>!`,
                        `The next election process has been scheduled to begin at ${this.timestamp(
                            nextElectionTime
                        )}.`,
                    ].join("\n")
                );
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            .catch((err) => this.logger.error(err));

        const governmentChatChannel = this.client!.channels.cache.get(
            config.government_chat_channel
        ) as TextChannel | undefined;
        if (governmentChatChannel)
            await governmentChatChannel.send(
                `<@${winners[0]}> <@${winners[1]}> Welcome! You may want to check through the settings of each channel (and category) to ensure that the last government haven't given themselves any special permissions :wink:`
            );
    }

    async scheduleNextElection(): Promise<number> {
        const currentInfo = await ElectionInfo.findOne();

        if (currentInfo == null) throw Error("Failed to fetch election info");

        const nextElectionTime =
            currentInfo.processStartTime!.getTime() +
            timestring(config.time_between_elections, "ms");

        const newElectionInfo = new ElectionInfo({
            processStartTime: new Date(nextElectionTime),
            currentPhase: ElectionPhase.INACTIVE,
        });

        if (newElectionInfo.processStartTime!.getTime() < Date.now())
            throw Error(
                "Election is scheduled for the past. This will not end well."
            );

        await currentInfo.deleteOne();
        await newElectionInfo.save();

        await this.run();

        await ElectionCandidate.deleteMany();
        await ElectionVote.deleteMany();

        return nextElectionTime;
    }

    noElectionCandidatesOrVotes() {
        this.scheduleNextElection()
            .then((nextElectionTime) => {
                void this.updatesChannel!.send(
                    `Well....this is awkward. No candidates are entered/have voted in the election. Roles will remain as are until the next scheduled one at ${this.timestamp(
                        nextElectionTime
                    )}`
                );
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            .catch((err) => this.logger.error(err));
    }
}
