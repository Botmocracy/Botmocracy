import { MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { config } from "..";
import ElectionInfo from "../schema/ElectionInfo";
import Module from "./abstract/Module";
import * as timestring from 'timestring'; // Why can't they just do this like everyone else
import { ElectionPhase } from "../util/ElectionPhase";
import ElectionCandidate from "../schema/ElectionCandidate";

export default class ElectionScheduler extends Module {
    name = "ElectionScheduler";
    updatesChannel: TextChannel | undefined;

    registrationBegin: number | undefined;
    votingBegin: number | undefined;
    votingEnd: number | undefined;
    powerTransition: number | undefined;

    async onEnable() {
        this.logger.info("Enabled");
        this.updatesChannel = this.client?.channels.cache.get(config.election_updates_channel) as TextChannel;

        const electionInfo = new ElectionInfo({
            processStartTime: Date.now() + 3000,
            currentPhase: ElectionPhase.INACTIVE
        });

        await ElectionInfo.deleteMany().exec();
        await electionInfo.save();

        const info = await ElectionInfo.findOne().exec();
        if (!info) return this.logger.error("Failed to get election info.");
        if (info.processStartTime == undefined || info.currentPhase == undefined) return this.logger.error("Election info is missing details");

        const currentPhase: number = info.currentPhase;
        this.registrationBegin = info.processStartTime.getTime();
        this.votingBegin = this.registrationBegin!! + timestring(config.election_registration_period, "ms");
        this.votingEnd = this.votingBegin + timestring(config.election_vote_period, "ms");
        this.powerTransition = this.votingEnd + timestring(config.power_transition_period);

        switch (currentPhase) {
            case 0:
                if (Date.now() > this.registrationBegin!!) this.beginRegistration();
                else setTimeout(() => this.beginRegistration(), this.registrationBegin!! - Date.now());
            case 1:
                if (Date.now() > this.votingBegin) this.beginVoting();
                else setTimeout(() => this.beginVoting(), this.votingBegin - Date.now());
            case 2:
                if (Date.now() > this.votingEnd) this.endVoting();
                else setTimeout(() => this.endVoting(), this.votingEnd - Date.now());
            case 3:
                if (Date.now() > this.powerTransition) this.transition();
                else setTimeout(() => this.transition(), this.powerTransition - Date.now());
        }
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

    beginVoting() {
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
                `Press the button below to vote before ${this.timestamp(this.votingEnd!)} to have your say in choosing the next President!`,
                `You can use \`/election listrunning\` at any time to see who has entered.`
            ].join("\n"), components: [row]
        });
    }

    endVoting() {

    }

    async transition() {
        await ElectionCandidate.deleteMany().exec();
    }
}