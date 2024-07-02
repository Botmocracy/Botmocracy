import { model, Schema } from "mongoose";

interface ElectionVote {
    discordId: string;
    preferences: string[];
}

const electionVoteSchema = new Schema<ElectionVote>({
    discordId: String,
    preferences: Array<string>
});

let name = "ElectionVote";
if (process.env.DEV) {
    name += "DEV";
}

export default model<ElectionVote>(name, electionVoteSchema)