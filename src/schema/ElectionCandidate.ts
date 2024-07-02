import { model, Schema } from "mongoose";

interface ElectionVote {
    discordId: string;
    runningMateDiscordId: string;
}

const electionCandidateSchema = new Schema<ElectionVote>({
    discordId: String,
    runningMateDiscordId: String
});

let name = "ElectionCandidate";
if (process.env.DEV) {
    name += "DEV";
}

export default model<ElectionVote>(name, electionCandidateSchema)