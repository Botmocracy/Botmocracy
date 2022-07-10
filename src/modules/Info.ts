import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
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
                    executor: async (i: CommandInteraction) => {
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
                    executor: async (i: CommandInteraction) => {
                        await i.deferReply({ ephemeral: true });
                        const townName = i.options.getString("name", true);

                        let townData = await this.getTownByName(townName);
                        if (!townData) return i.reply({ content: "This town does not exist.", ephemeral: true });

                        if (await Town.findOne({ name: townName }).exec() != null) return i.reply({ content: "This town is already registered.", ephemeral: true });

                        const town = new Town({
                            name: townData['Town Name'],
                            mayor: townData['Mayor'],
                            depMayor: townData['Deputy Mayor'],
                            coords: `${townData['X']} ${townData['Y']} ${townData['Z']}`,
                            rank: townData['Town Rank']
                        });
                        /* Reason for no town verification: I tried for like 1:30 hours and failed. Also some names on the town list are outdated and implementing that is an entirely different question */

                        await town.save();
                        await i.editReply({ content: "Successfully added town!" })
                        const notificationChannel = this.client?.channels.cache.get(config.town_notifications_channel) as TextChannel;
                        notificationChannel.send(`${i.user} has joined with **${townName}**!`);
                    }
                }
            }
        }
    }
}