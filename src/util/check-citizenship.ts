import Account from "../schema/Account"

// Role check isn't quite enough in case fraud
export default function checkCitizenship(id: string) : Promise<boolean> {
    return new Promise(async (res, rej) => {
        const account = await Account.findOne({ discordId: id }).exec();
        if (!account) return res(false);

        if (account.citizen) return res(true);
        else res(false);
    })
}