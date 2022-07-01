import { model, Schema } from "mongoose";
import { ElectionPhase } from "../util/ElectionPhase";

const electionInfoSchema = new Schema({
    next: Number,
    currentPhase: ElectionPhase,
    candidates: Array<Array<String>>
});

export default model("ElectionInfo", electionInfoSchema);