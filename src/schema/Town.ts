import { model, Schema } from 'mongoose';

const townSchema = new Schema({
    name: String,
    mayor: String,
    depMayor: {type: String, required: false, default: "None"},
    coords: String,
    rank: {type: String, required: false, default: "Unranked"}
})

let name = "Town";
if(process.env.DEV == "true") {
    name += "DEV";
}

export default model(name, townSchema)