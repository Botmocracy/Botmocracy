import Account from "../schema/Account";

// Role check isn't quite enough in case fraud
export default async function checkCitizenship(id: string): Promise<boolean> {
  const account = await Account.findOne({ discordId: id }).exec();
  if (!account) return false;

  return account.citizen;
}
