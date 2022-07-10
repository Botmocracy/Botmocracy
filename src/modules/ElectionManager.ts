import { Collection, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import timestring from 'timestring'; // Why can't they just do this like everyone else
import { config } from "..";
import Account from "../schema/Account";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";
import ElectionVote from "../schema/ElectionVote";
import { ElectionPhase } from "../util/ElectionPhase";
import Module from "./abstract/Module";
import ElectionCounter from "./ElectionCounter";
import ElectionVoting from "./ElectionVoting";

export default class ElectionManager extends Module {
    name = "ElectionManager";
    updatesChannel: TextChannel | undefined;

    registrationBegin: number | undefined;
    votingBegin: number | undefined;
    votingEnd: number | undefined;
    powerTransition: number | undefined;

    counter: ElectionCounter | undefined;
    votingHandler: ElectionVoting | undefined;

    timeouts: Array<NodeJS.Timeout> = [];

    async onEnable() {
        this.logger.info("Enabled");
        this.updatesChannel = this.client?.channels.cache.get(config.election_updates_channel) as TextChannel;
    }

    async run() {
        this.timeouts.forEach(t => clearTimeout(t));

        this.votingHandler!.draftBallots = new Map(); // Reset this

        const info = await ElectionInfo.findOne().exec();
        if (!info) return this.logger.error("Failed to get election info.");
        if (info.processStartTime == undefined || info.currentPhase == undefined) return this.logger.error("Election info is missing details");

        const currentPhase: number = info.currentPhase;
        this.registrationBegin = info.processStartTime.getTime();
        this.votingBegin = this.registrationBegin!! + timestring(config.election_registration_period, "ms");
        this.votingEnd = this.votingBegin + timestring(config.election_vote_period, "ms");
        this.powerTransition = this.votingEnd + timestring(config.power_transition_period, "ms");

        switch (currentPhase) {
            case 0:
                if (Date.now() > this.registrationBegin!!) this.beginRegistration();
                else this.timeouts.push(setTimeout(() => this.beginRegistration(), this.registrationBegin!! - Date.now()));
            case 1:
                if (Date.now() > this.votingBegin) this.beginVoting();
                else this.timeouts.push(setTimeout(() => this.beginVoting(), this.votingBegin - Date.now()));
            case 2:
                if (Date.now() > this.votingEnd) this.endVoting();
                else this.timeouts.push(setTimeout(() => this.endVoting(), this.votingEnd - Date.now()));
            case 3:
                if (Date.now() > this.powerTransition) this.transition();
                else this.timeouts.push(setTimeout(() => this.transition(), this.powerTransition - Date.now()));
        }
    }

    onModulesLoaded(modules: Collection<string, Module>): void {
        this.counter = modules.get("ElectionCounter") as ElectionCounter;
        this.votingHandler = modules.get("ElectionVoting") as ElectionVoting;

        this.run();
    }

    timestamp(time: number) {
        return `<t:${Math.floor(time / 1000)}:F>`;
    }

    async updateElectionPhase(phase: ElectionPhase) {
        const currentInfo = await ElectionInfo.findOne().exec();
        if (!currentInfo) throw new Error("Unable to update election phase: Info fetch failed");

        await currentInfo.remove();

        const newInfo = new ElectionInfo({
            currentPhase: phase,
            processStartTime: currentInfo.processStartTime
        });

        newInfo.save();
    }

    async beginRegistration() {
        this.updateElectionPhase(ElectionPhase.REGISTRATION);
        this.updatesChannel!.send([
            `<@&${config.citizen_role}> **Presidential Election registration is now open!**`,
            `Any citizen may run. To register, run \`/election enter\` and specify your running-mate, who will be vice president if elected.`,
            `Important times to take note of:`,
            `${this.timestamp(this.votingBegin!)} - Registration ends and voting begins.`,
            `${this.timestamp(this.votingEnd!)} - Voting ends and counting begins.`,
            `${this.timestamp(this.powerTransition!)} - Transition of power.`,
            ``,
            `You can use \`/election listrunning\` at any time to see who has entered.`
        ].join("\n"));
    }

    async beginVoting() {
        const candidates = await ElectionCandidate.find().exec();
        if (candidates.length == 0) return this.noElectionCandidatesOrVotes();

        this.updateElectionPhase(ElectionPhase.VOTING);
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("electionvote")
                    .setLabel("Vote")
                    .setStyle("PRIMARY")
            );
        this.updatesChannel!.send({
            content: [
                `<@&${config.citizen_role}> **Presidential Election voting is now open!**`,
                `Press the button below before ${this.timestamp(this.votingEnd!)} to have your say in choosing the next President!`,
                `You can use \`/election listrunning\` at any time to see who has entered.`
            ].join("\n"), components: [row]
        });
    }

    async endVoting() {
        const candidates = await ElectionCandidate.find().exec();
        if (candidates.length == 0) return this.noElectionCandidatesOrVotes();

        const votes = await ElectionVote.find().exec();
        if (votes.length == 0) return this.noElectionCandidatesOrVotes();

        this.updateElectionPhase(ElectionPhase.TRANSITION);
        this.updatesChannel!.send("**Election voting has closed.** Counting will commence shortly.");

        while (!this.counter) { } // Wait for the counter to become ready before doing anything

        this.counter.commenceCount();
    }

    async elect(elected: string) {
        const candidateInfo = await ElectionCandidate.findOne({ discordId: elected });
        if (!candidateInfo) throw new Error("Elected candidate isn't a candidate...???");

        const runningMate = candidateInfo.runningMateDiscordId;
        this.updatesChannel!.send(`**Congratulations to our President Elect <@${elected}> and Vice President Elect <@${runningMate}>!**\nRoles will be transferred at ${this.timestamp(this.powerTransition!)}`);

        const currentElectionInfo = await ElectionInfo.findOne().exec();

        const newElectionInfo = new ElectionInfo({
            processStartTime: currentElectionInfo?.processStartTime,
            currentPhase: currentElectionInfo?.currentPhase,
            winners: [elected, runningMate]
        });

        await currentElectionInfo?.delete();
        newElectionInfo.save();
    }

    async transition() {
        const electionInfo = await ElectionInfo.findOne().exec();

        if (!electionInfo) throw new Error("Failed to fetch election info");

        const guild = this.client?.guilds.cache.get(config.guild);

        const presidentRole = await guild?.roles.fetch(config.president_role)!;
        const vicePresidentRole = await guild?.roles.fetch(config.vice_president_role)!;
        const governmentRole = await guild?.roles.fetch(config.government_role)!;

        await guild?.members.fetch(); // Do the cache things

        for (const member of Array.from(governmentRole!.members.values())) {
            const account = await Account.findOne({discordId: member.id}).exec();
            if(account) {
                const newRoles = (account.roles as unknown as Array<string>).filter(role => role != governmentRole!.id);
                await Account.updateOne({discordId: member.id}, {roles: newRoles});
            }

            await member.roles.remove(governmentRole!.id);
        }

        for (const member of Array.from(presidentRole!.members.values())) {
            const account = await Account.findOne({discordId: member.id}).exec();
            if(account) {
                const newRoles = (account.roles as unknown as Array<string>).filter(role => role != presidentRole!.id);
                await Account.updateOne({discordId: member.id}, {roles: newRoles});
            }

            await member.roles.remove(presidentRole!.id);
        }

        for (const member of Array.from(vicePresidentRole!.members.values())) {
            const account = await Account.findOne({discordId: member.id}).exec();
            if(account) {
                const newRoles = (account.roles as unknown as Array<string>).filter(role => role != vicePresidentRole!.id);
                await Account.updateOne({discordId: member.id}, {roles: newRoles});
            }

            await member.roles.remove(vicePresidentRole!.id);
        }

        const winners = (electionInfo.winners! as unknown as string[]); // Already did this...fucking mongoose

        const presidentMember = await guild?.members.fetch(winners[0]);
        const vicePresidentMember = await guild?.members.fetch(winners[1]);

        // There is a possibility that they will have left the server
        if (presidentMember != undefined && presidentMember.roles != undefined) {
            presidentMember.roles.add([presidentRole!, governmentRole!]);
            
        }
        if (vicePresidentMember != undefined && vicePresidentMember.roles != undefined) {
            vicePresidentMember.roles.add([vicePresidentRole!, governmentRole!]);
        }

        const nextElectionTime = await this.scheduleNextElection();

        (this.client?.channels.cache.get(config.announcement_channel)! as TextChannel).send([
            `@everyone give a big hand to our new President and Vice President, <@${winners[0]}> and <@${winners[1]}>!`,
            `The next election process has been scheduled to begin at ${this.timestamp(nextElectionTime)}.`
        ].join("\n"))
    }

    async scheduleNextElection(): Promise<number> {
        return new Promise(async (res, rej) => {
            const currentInfo = await ElectionInfo.findOne().exec();

            if (currentInfo == null) return rej("Failed to fetch election info");

            const nextElectionTime = currentInfo.processStartTime!.getTime() + timestring(config.time_between_elections, "ms");

            const newElectionInfo = new ElectionInfo({
                processStartTime: new Date(nextElectionTime),
                currentPhase: ElectionPhase.INACTIVE
            });

            await currentInfo.delete();
            await newElectionInfo.save();

            this.run();

            ElectionCandidate.deleteMany().exec();
            ElectionVote.deleteMany().exec();

            res(nextElectionTime);
        });
    }

    async noElectionCandidatesOrVotes() {
        const nextElectionTime = await this.scheduleNextElection();
        this.updatesChannel!.send(`Well....this is awkward. No candidates are entered/have voted in the election. Roles will remain as are until the next scheduled one at ${this.timestamp(nextElectionTime)}`);
    }
}