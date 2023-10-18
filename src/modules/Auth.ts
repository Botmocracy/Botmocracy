/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from "axios";
import {
    ChatInputCommandInteraction,
    GuildMember,
    RoleResolvable,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { config } from "..";
import Account from "../schema/Account";
import Module from "./abstract/Module";

export default class Auth extends Module {
    name = "Auth";

    nameCache = new Map<string, string>();

    onEnable(): void {
        this.logger.info("Enabled");
        this.client?.on("guildMemberAdd", (member) =>
            this.onMemberJoin(member)
        );
    }

    async getMinecraftNameFromDiscordId(id: string) {
        try {
            if (this.nameCache.has(id)) return this.nameCache.get(id);

            const account = await Account.findOne({ discordId: id });

            if (!account?.minecraftUUID) return undefined;

            const MojangRes = await axios.get(
                `https://sessionserver.mojang.com/session/minecraft/profile/${account.minecraftUUID}`
            );

            if (MojangRes.data.name) {
                this.nameCache.set(id, MojangRes.data.name);
                return MojangRes.data.name as string;
            } else return undefined;
        } catch (error) {
            return undefined;
        }
    }

    async getMinecraftOrDiscordName(
        discordUserId: string,
        escapeMarkdown?: boolean
    ) {
        const minecraftUsername = await this.getMinecraftNameFromDiscordId(
            discordUserId
        );
        if (minecraftUsername)
            return escapeMarkdown
                ? minecraftUsername.replace("_", "\\_")
                : minecraftUsername;
        else {
            const discordUser = await this.client?.users.fetch(discordUserId);
            if (!discordUser) return "<unknown>";
            else return discordUser.username;
        }
    }

    async getMembers() {
        const { data } = await axios.get(
            "https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1Hhj_Cghfhfs8Xh5v5gt65kGc4mDW0sC5GWULKidOBW8&sheetName=Members"
        );
        const res: string[] = [];
        data.forEach((player: any) => {
            res.push(player["Username"]);
            res.push(
                ...player["Temporary Usernames"]
                    .split(",")
                    .map((n: string) => n.trim())
            );
            res.push(
                ...player["Former Usernames"]
                    .split(",")
                    .map((n: string) => n.trim())
            );
        });

        return res;
    }

    async getName(uuid: string) {
        const { data, status } = await axios.get(
            `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
        );
        if (status == 404) {
            return null;
        }

        return data["name"];
    }

    async onMemberJoin(member: GuildMember) {
        const allowedGuilds = [config.guild];
        if (!allowedGuilds.includes(member.guild.id)) return;

        const account = await Account.findOne({ discordId: member.id });
        if (!account) return;

        const roles = account.roles as unknown as string[];
        await member.guild.roles.fetch();
        const rolesToAdd: RoleResolvable[] = [];
        roles.forEach((value) => {
            const role = member.guild.roles.cache.get(value);
            if (role) rolesToAdd.push(role);
        });

        if (roles.length > 0) await member.roles.add(rolesToAdd);
    }

    slashCommands = {
        verify: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("verify")
                .setDescription("Verifies you"),

            executor: async (i: ChatInputCommandInteraction) => {
                if (!i.guild) {
                    await i.reply({
                        content: "You can't use this in a DM",
                        ephemeral: true,
                    });
                    return;
                }

                await i.deferReply({ ephemeral: true });

                const member = i.guild.members.cache.get(i.user.id);

                if (member?.roles.cache.has(config.verified_role)) {
                    await i.editReply({ content: "You're already verified." });
                    return;
                }
                let req;

                try {
                    req = await axios.get(
                        `https://minecraftauth.me/api/lookup?discord=${i.user.id}`
                    );
                } catch (error) {
                    await i.editReply({
                        content:
                            "You need to verify with https://minecraftauth.me first.",
                    });
                    return;
                }

                const data = req.data;
                const uuid = data.minecraft.identifier;
                const members = await this.getMembers();
                const name = await this.getName(uuid);

                if (name == null) {
                    await i.editReply({
                        content:
                            "I couldn't get your username for some reason. Try again.",
                    });
                    return;
                }

                if (members.includes(name)) {
                    const role = i.guild.roles.cache.get(config.verified_role);
                    await member?.roles.add(role!);

                    if (await Account.exists({ discordId: i.user.id }))
                        await Account.deleteOne({
                            discordId: i.user.id,
                        });
                    const acnt = new Account({
                        discordId: i.user.id,
                        minecraftUUID: uuid,
                    });
                    await acnt.save();

                    await i.editReply({ content: "Verified!" });
                    await (
                        this.client?.channels.cache.get(
                            config.welcome_channel
                        ) as TextChannel
                    ).send(
                        `${i.user} welcome! Check out <#995567687080091769> for information on joining.`
                    );
                } else
                    await i.editReply({
                        content: "You do not seem to be an MRT member.",
                    });
            },
        },
    };
}
