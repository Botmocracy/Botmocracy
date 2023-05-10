/* eslint-disable @typescript-eslint/ban-types */
import { model, Schema } from "mongoose";
import { ElectionPhase } from "../util/ElectionPhase";

const electionInfoSchema = new Schema({
    processStartTime: Date,
    currentPhase: { type: Number, enum: ElectionPhase },
    winners: { type: Array<String> }
});

let name = "ElectionInfo";
if (process.env.DEV) {
    name += "DEV";
}

export default model(name, electionInfoSchema)