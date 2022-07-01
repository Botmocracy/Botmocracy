import { model, Schema } from "mongoose";

const electionCandidateSchema = new Schema({
    discordId: String,
    runningMateDiscordId: String
});

export default model("ElectionCandidate", electionCandidateSchema);