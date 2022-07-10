import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Interaction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageSelectMenuOptions, MessageSelectOptionData, Modal, TextInputComponent } from "discord.js";
import { request } from "undici";
import Town from "../schema/Town";
import Module from "./abstract/Module";
import Auth from "./Auth";


export default class Info extends Module {
    name = "Info";
    auth: Auth|undefined = undefined;

    onEnable(): void {
        this.logger.info("Enabled");
    }

    onModulesLoaded(modules: Map<string, Module>): void {
        this.client?.on("interactionCreate", (i) => this.onInteraction(i))

        this.auth = (modules.get('Auth') as Auth)
    }

    async onInteraction(i: Interaction) {
        if(!i.isModalSubmit()) return;
        if(i.customId != "town") return;

        const name = i.fields.getTextInputValue("townName");
        const mayor = await this.auth?.getMinecraftNameFromDiscordId(i.user.id);
        const depMayor = i.fields.getTextInputValue("townDeputy");
        const coords = i.fields.getTextInputValue("townCoords");

        if(await Town.exists({name: name})) await Town.deleteOne({name: name});
        const town = new Town({name: name, mayor: mayor, depMayor: depMayor, coords: coords});

        await town.save()
        i.reply({content: "Added.", ephemeral: true});
    }

    async getTownByName(name: string) {
        const result = await request("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1JSmJtYkYrEx6Am5drhSet17qwJzOKDI7tE7FxPx4YNI&sheetName=New%20World", {maxRedirections: 1});
        let fullBody = '';

        for await(const part of result.body){
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
            allowedRoles: ["992113680940531773"],
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
                add: {
                    executor: async (i: CommandInteraction) => {                        
                        const townName = i.options.getString("name", true);
                        
                        let townData = await this.getTownByName(townName);
                        if(!townData) return i.reply({content: "This town does not exist.", ephemeral: true});

                        const town = new Town({
                            name: townData['Town Name'],
                            mayor: townData['Mayor'],
                            depMayor: townData['Deputy Mayor'],
                            coords: `${townData['X']} ${townData['Y']} ${townData['Z']}}`,
                            rank: townData['Town Rank']
                        });
                        /* Reason for no town verification: I tried for like 1:30 hours and failed. Also some names on the town list are outdated and implementing that is an entirely different question */

                        await town.save();
                        await i.reply({content: "Successfully added town!", ephemeral: true})
                    }
                }
            }
        }
    }
}