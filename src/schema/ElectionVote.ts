import { model, Schema } from "mongoose";

const electionVoteSchema = new Schema({
    discordId: String,
    preferences: Array<string>
});

let name = "ElectionVote";
if (process.env.DEV) {
    name += "DEV";
}

export default model(name, electionVoteSchema)