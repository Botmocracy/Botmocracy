import { model, Schema } from "mongoose";

const electionVoteSchema = new Schema({
    discordId: String,
    preferences: Array<string>
});

let name = "ElectionVote";
if(process.env.DEV == "true") {
    name += "-dev";
}

export default model(name, electionVoteSchema)