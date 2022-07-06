import ElectionVote from "../schema/ElectionVote";
import Module from "./abstract/Module";
import ElectionScheduler from "./ElectionScheduler";

export default class ElectionCounter extends Module {
    name = "ElectionCounter";

    scheduler!: ElectionScheduler;

    votes: { [key: string]: Array<Array<string>> } = {};

    onEnable(): void {
        this.logger.info("Enabled");
    }

    onModulesLoaded(modules: Map<string, Module>): void {
        this.scheduler = modules.get("ElectionScheduler") as ElectionScheduler;
    }

    async commenceCount() {
        const votesRaw = await ElectionVote.find().exec();
        for (const vote of votesRaw) {
            let ballot = vote.preferences! as Array<string> /*I've already said this in the schema why do you need it a second time...?*/;
            if (!this.votes[ballot[0]]) this.votes[ballot[0]] = [];
            this.votes[ballot[0]].push(ballot);
        }

        this.doCount();
    }

    doCount() {

    }

    distributeVotes() {

    }
}