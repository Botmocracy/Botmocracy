import { model, Schema } from 'mongoose';

const accountSchema = new Schema({
    discordId: String,
    minecraftUUID: String,
    roles: {type: Array<String>, default: ["992113680940531773", "987775509368811530"]}
})

let name = "Account";
if(process.env.DEV == "true") {
    name += "-dev";
}

export default model(name, accountSchema)