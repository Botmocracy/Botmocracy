import { model, Schema } from "mongoose";

const electionVoteSchema = new Schema({
    discordId: String,
    preferences: Array<string>
});

export default model("ElectionVote", electionVoteSchema);