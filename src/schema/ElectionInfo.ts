import { model, Schema } from "mongoose";
import { ElectionPhase } from "../util/ElectionPhase";

const electionInfoSchema = new Schema({
    processStartTime: Date,
    currentPhase: {type: Number, enum: ElectionPhase},
});

export default model("ElectionInfo", electionInfoSchema);