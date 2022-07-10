import { SlashCommandBuilder } from "@discordjs/builders";
import axios from "axios";
import { CommandInteraction, GuildMemberRoleManager, MessageEmbed, TextChannel } from "discord.js";
import { request } from "undici";
import { config } from "..";
import Town from "../schema/Town";
import Module from "./abstract/Module";
import Auth from "./Auth";


export default class Info extends Module {
    name = "Info";
    auth: Auth | undefined = undefined;

    onEnable(): void {
        this.logger.info("Enabled");
    }

    onModulesLoaded(modules: Map<string, Module>): void {
        this.auth = (modules.get('Auth') as Auth)
    }

    async getTownByName(name: string) {
        const result = await request("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1JSmJtYkYrEx6Am5drhSet17qwJzOKDI7tE7FxPx4YNI&sheetName=New%20World", { maxRedirections: 1 });
        let fullBody = '';

        for await (const part of result.body) {
            fullBody += part
        }


        const towns: [{ [key: string]: any }] = JSON.parse(fullBody);
        for (const townData of towns) {
            if (townData['Town Name'] == name) {
                return townData;
            }
        }

        return undefined;
    }

    slashCommands = {
        town: {
            allowedRoles: [config.verified_role],
            cmdBuilder: new SlashCommandBuilder()
                .setName("town")
                .setDescription("Add or get info about a town")
                .addSubcommand(s => s
                    .setName("get")
                    .setDescription("Get info about a town")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("Name of the town")
                            .setRequired(true)
                    ))
                .addSubcommand(s => s
                    .setName("add")
                    .setDescription("Add a town")
                    .addStringOption(o => o.setName("name").setRequired(true).setDescription("The town name"))
                ),
            subcommands: {
                get: {
                    executor: async (i: CommandInteraction): Promise<any> => {
                        await i.deferReply({ ephemeral: true });
                        Town.findOne({ name: i.options.getString("name") }, async (err: any, res: any) => {
                            if (!res || err) {
                                await i.editReply(`Invalid town \`${i.options.getString("name")}\``);
                                return;
                            }
                            const name = res['name'];
                            const mayor = res['mayor'];
                            const depMayor = res['depMayor'];
                            const coords = res['coords'];

                            const embed = new MessageEmbed()
                                .setTitle(name)
                                .addField("Mayor", mayor)
                                .addField("Deputy Mayor", depMayor)
                                .addField("Coords", coords)
                                .setColor("BLURPLE");

                            await i.editReply({ embeds: [embed] });
                        })
                    }
                },
                add: {
                    executor: async (i: CommandInteraction): Promise<any> => {
                        await i.deferReply({ ephemeral: true });
                        const townName = i.options.getString("name", true);

                        let townData: { [key: string]: string } | undefined = await this.getTownByName(townName);
                        if (!townData) return i.editReply({ content: "This town does not exist." });

                        if (await Town.findOne({ name: townName }).exec() != null) return i.editReply({ content: "This town is already registered." });

                        const town = new Town({
                            name: townData['Town Name'],
                            mayor: townData['Mayor'],
                            depMayor: townData['Deputy Mayor'],
                            coords: `${townData['X']} ${townData['Y']} ${townData['Z']}`,
                            rank: townData['Town Rank']
                        });

                        const minecraftName = await this.auth?.getMinecraftNameFromDiscordId(i.user.id);

                        const { data: memberData } = await axios.get("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1Hhj_Cghfhfs8Xh5v5gt65kGc4mDW0sC5GWULKidOBW8&sheetName=Members");
                        const executorMemberData = memberData.filter((v: { [key: string]: string }) =>
                            v["Username"] == minecraftName ||
                            v["Temporary Usernames"].split(", ").includes(minecraftName) ||
                            v["Former Usernames"].split(", ").includes(minecraftName)
                        );

                        if (!minecraftName || executorMemberData.length == 0) return i.editReply({ content: "I wasn't able to find your member info." });

                        const usernames: string[] = [];
                        usernames.push(executorMemberData[0]["Username"]);
                        usernames.push(...executorMemberData[0]["Temporary Usernames"].split(", "));
                        usernames.push(...executorMemberData[0]["Former Usernames"].split(", "));

                        if (!usernames.includes(townData["Mayor"])) return i.editReply({ content: "You don't seem to own this town." });

                        await town.save();
                        await i.editReply({ content: "Successfully added town!" });
                        const member = await this.client?.guilds.cache.get(config.guild)?.members.fetch(i.user);
                        await member!.roles.add(config.citizen_role);
                        const notificationChannel = this.client?.channels.cache.get(config.town_notifications_channel) as TextChannel;
                        notificationChannel.send(`${i.user} has joined with **${townName}**!`);
                    }
                }
            }
        }
    }
}