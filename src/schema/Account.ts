/* eslint-disable @typescript-eslint/ban-types */
import { model, Schema } from 'mongoose';

const accountSchema = new Schema({
    discordId: String,
    minecraftUUID: String,
    roles: { type: Array<String>, default: [] },
    citizen: { type: Boolean, default: false }
})

let name = "Account";
if (process.env.DEV) {
    name += "DEV";
}

export default model(name, accountSchema)