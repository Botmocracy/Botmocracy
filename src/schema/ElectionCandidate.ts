import { model, Schema } from "mongoose";

const electionCandidateSchema = new Schema({
    discordId: String,
    runningMateDiscordId: String
});

let name = "ElectionCandidate";
if(process.env.DEV == "true") {
    name += "DEV";
}

export default model(name, electionCandidateSchema)