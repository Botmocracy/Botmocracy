import { model, Schema } from "mongoose";
import { ElectionPhase } from "../util/ElectionPhase";

interface ElectionInfo {
    processStartTime: Date;
    currentPhase: ElectionPhase;
    winners: string[];
}

const electionInfoSchema = new Schema<ElectionInfo>({
    processStartTime: Date,
    currentPhase: { type: Number, enum: ElectionPhase },
    winners: Array<String>,
});

let name = "ElectionInfo";
if (process.env.DEV) {
    name += "DEV";
}

export default model<ElectionInfo>(name, electionInfoSchema)