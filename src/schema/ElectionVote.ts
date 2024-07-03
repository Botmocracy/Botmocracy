import { model, Schema } from "mongoose";

interface ElectionVote {
  discordId: string;
  preferences: string[];
}

const electionVoteSchema = new Schema<ElectionVote>({
  discordId: String,
  preferences: [String],
});

let name = "ElectionVote";
if (process.env.DEV) {
  name += "DEV";
}

export default model<ElectionVote>(name, electionVoteSchema);
