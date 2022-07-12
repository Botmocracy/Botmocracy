import { SlashCommandBuilder } from "@discordjs/builders";
import axios from 'axios';
import { CommandInteraction, GuildMember, PartialGuildMember, Role, TextChannel } from "discord.js";
import { config } from "..";
import Account from "../schema/Account";
import Module from "./abstract/Module";


export default class Auth extends Module {
    name = "Auth";

    onEnable(): void {
        this.logger.info("Enabled");
        this.client?.on('guildMemberAdd', (member) => this.onMemberJoin(member));
        this.client?.on('guildMemberUpdate', this.onRoleAdd);
    }

    async onRoleAdd(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        if(oldMember.guild.id != config.guild) return;

        const roles = newMember.roles.cache.map(r => r.id);
        if(!(await Account.exists({discordId: newMember.id}))) return;

        await Account.updateOne({discordId: newMember.id}, {roles: roles});
    }

    async getMinecraftNameFromDiscordId(id: string) {
        try {
            const account = await Account.findOne({ discordId: id }).exec();

            if (!account || !account.minecraftUUID) return undefined;

            const MojangRes = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${account.minecraftUUID}`);

            if (MojangRes.data.name) return MojangRes.data.name;
            else return undefined;
        } catch (error) {
            return undefined;
        }    
    }

    async getMembers() {
        const { data } = await axios.get("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1Hhj_Cghfhfs8Xh5v5gt65kGc4mDW0sC5GWULKidOBW8&sheetName=Members");
        let res: string[] = [];
        data.forEach((player: any) => {
            res.push(player['Username']);
        });

        return res;
    }

    async getName(uuid: string) {
        const { data, status } = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
        if (status == 404) {
            return null;
        }

        return data['name'];
    }

    async onMemberJoin(member: GuildMember){
        const allowedGuilds = [config.guild]
        if(!allowedGuilds.includes(member.guild.id)) return;

        const account = await Account.findOne({discordId: member.id});
        if(!account) return;

        const roles = (account.roles as unknown as Array<string>);
        roles.forEach((value) => {
            const role = member.guild.roles.cache.get(value);
            member.roles.add(role!);
        });
    }

    slashCommands = {
        verify: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("verify")
                .setDescription("Verifies you"),

            executor: async (i: CommandInteraction) => {
                if (!i.guild) {
                    i.reply({ content: "You can't use this in a DM", ephemeral: true });
                    return;
                }

                i.deferReply({ ephemeral: true });

                const member = i.guild.members.cache.get(i.user.id);

                if (member?.roles.cache.has(config.verified_role)) {
                    i.editReply({ content: "You're already verified." });
                    return;
                }
                let req;

                try {
                    req = await axios.get(`https://minecraftauth.me/api/lookup?discord=${i.user.id}`);
                } catch (error) {
                    i.editReply({ content: "You need to verify with https://minecraftauth.me first." });
                    return;
                }
                
                const data = req.data;
                const uuid = data.minecraft.identifier;
                const members = await this.getMembers();
                const name = await this.getName(uuid);

                if (name == null) {
                    i.editReply({ content: "I couldn't get your username for some reason. Try again." });
                    return;
                }

                if (members.includes(name)) {
                    const role = i.guild.roles.cache.get(config.verified_role);
                    member?.roles.add((role as Role));

                    i.editReply({ content: "Verified!" });
                    (this.client?.channels.cache.get(config.welcome_channel)! as TextChannel).send(`${i.user} welcome! Check out <#995567687080091769> for information on joining.`);
                    if(await Account.exists({discordId: i.user.id}).exec()) await Account.deleteOne({discordId: i.user.id}).exec();

                    const acnt = new Account({discordId: i.user.id, minecraftUUID: uuid});
                    await acnt.save();
                } else i.editReply({ content: "You do not seem to be an MRT member." });
            }
        }
    }
}