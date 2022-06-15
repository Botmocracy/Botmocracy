import { Schema, model } from 'mongoose';

const accountSchema = new Schema({
    discordId: String,
    minecraftUUID: String,
    lastKnownUsername: {type: String, required: false} // might be used in the future
})

export default model("Account", accountSchema)