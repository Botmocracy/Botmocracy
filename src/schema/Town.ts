import { Schema, model } from 'mongoose';

const townSchema = new Schema({
    name: String,
    mayor: String,
    depMayor: {type: String, required: false, default: "None"},
    coords: String,
    rank: {type: String, required: false, default: "Unranked"}
})

export default model("Town", townSchema);
