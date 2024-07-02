import { model, Schema } from 'mongoose';

interface Account {
    discordId: string;
    minecraftUUID: string;
    roles?: string[];
    citizen: boolean;
}

const accountSchema = new Schema<Account>({
    discordId: String,
    minecraftUUID: String,
    roles: { type: Array<String>, default: [] },
    citizen: { type: Boolean, default: false }
})

let name = "Account";
if (process.env.DEV) {
    name += "DEV";
}

export default model<Account>(name, accountSchema)