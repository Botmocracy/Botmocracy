import { SlashCommandBuilder } from "@discordjs/builders";
import { Collection, CommandInteraction, Interaction, MessageEmbed } from "discord.js";
import { CallbackError } from "mongoose";
import { request } from 'undici';
import Town from "../schema/Town";
import Module from "./abstract/Module";


export default class Info extends Module {
    name = "Info";

    onEnable(): void {
        this.logger.info("Enabled");
    }


    async getTownByName(name: string) {
        const result = await request("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1JSmJtYkYrEx6Am5drhSet17qwJzOKDI7tE7FxPx4YNI&sheetName=New%20World", { maxRedirections: 1 });
        let fullBody = '';

        for await (const data of result.body) {
            fullBody += data.toString(); // ok but why doesn't it just send it as a string...
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
        gettown: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("gettown")
                .setDescription("Get info about a town")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Name of the town")
                        .setRequired(true)
                ),
            executor: async (i: CommandInteraction) => {
                await i.deferReply();
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
        addtown: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("addtown")
                .setDescription("Add a town")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Name of the town")
                        .setRequired(true)
                ),
            executor: async (i: CommandInteraction) => {
                await i.deferReply();
                let result = await this.getTownByName(i.options.getString("name") ?? "")
                if (!result) {
                    await i.editReply(`Invalid town \`${i.options.getString("name")}\``);
                    return;
                }
                result = (result as { [key: string]: any })
                const townName = result["Town Name"];

                const town = new Town({
                    name: result["Town Name"],
                    mayor: result['Mayor'],
                    depMayor: result['Deputy Mayor'],
                    coords: `${result['X']} ${result['Y']} ${result['Z']}`,
                    rank: result['Town Rank']
                })

                Town.findOne({ name: townName }, (err: CallbackError, res: any) => {
                    if (!err || res) {
                        Town.deleteOne({ name: townName }, (err: CallbackError, res: any) => {
                            if (err) throw err;
                        })
                    }
                })

                town.save((err: CallbackError) => { if (err) throw err; });

                await i.editReply(`Added town \`${i.options.getString("name")}\``);
            }
        }

    }
}