/* eslint-disable @typescript-eslint/ban-types */
import { model, Schema } from "mongoose";

const electionVoteSchema = new Schema({
  discordId: String,
  preferences: Array<String>,
});

let name = "ElectionVote";
if (process.env.DEV) {
  name += "DEV";
}

export default model(name, electionVoteSchema);
