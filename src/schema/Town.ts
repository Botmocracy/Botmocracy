import { Schema, model } from 'mongoose';

const townSchema = new Schema({
    name: String,
    mayor: String,
    depMayor: {type: String, required: false},
    coords: String
})

export default model("Town", townSchema);
