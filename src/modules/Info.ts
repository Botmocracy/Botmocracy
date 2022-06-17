import { Collection, MessageEmbed } from "discord.js";
import { CallbackError } from "mongoose";
import { request } from 'undici';
import Town from "../schema/Town";
import Module from "./abstract/Module";
import CommandManager from "./CommandManager";


export default class Info extends Module {
    commandManager: CommandManager|null = null;
    name = "Info";
    
    onEnable(): void {
        this.logger.info("Enabled");
    }
    
            
    async getTownByName(name: string) {
        const result = await request("https://script.google.com/macros/s/AKfycbwde4vwt0l4_-qOFK_gL2KbVAdy7iag3BID8NWu2DQ1566kJlqyAS1Y/exec?spreadsheetId=1JSmJtYkYrEx6Am5drhSet17qwJzOKDI7tE7FxPx4YNI&sheetName=New%20World", {maxRedirections: 1});
        let fullBody = '';

        for await (const data of result.body) {
            fullBody += data.toString(); // ok but why doesn't it just send it as a string...
        }

        const towns: [{[key: string]: any}] = JSON.parse(fullBody);
        
        for(const townData of towns) {
            if(townData['Town Name'] == name) {
                return townData;
            }
        }

        return undefined;
    }

    onModulesLoaded(modules: Collection<string, Module>): void {
        const self = this;

        this.commandManager = (modules.get("CommandManager") as CommandManager);  
        this.commandManager.registerCommand({name: "gettown", executor(message, args) {
            if(args.length < 1) {
                message.channel.send("Syntax: `gettown <name>`")
                return;
            }
            Town.findOne({name: args.shift()}, (err: any, res: any) => {
                if(!res || err) {
                    message.channel.send("Invalid town");
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
                
                message.channel.send({embeds: [embed]});
            })
        }});

        this.commandManager.registerCommand({name: "addtown", executor(message, args) {
            if(args.length < 1) {
                message.channel.send("Syntax: `addtown <name`");
            }
            self.getTownByName(args[0]).then(result => {
                if(!result) {
                    message.channel.send("Invalid town");
                }
                result = (result as {[key: string]: any})
                const townName = result["Town Name"];

                const town = new Town({
                    name: result["Town Name"],
                    mayor: result['Mayor'], 
                    depMayor: result['Deputy Mayor'], 
                    coords: `${result['X']} ${result['Y']} ${result['Z']}`, 
                    rank: result['Town Rank']
                })

                Town.findOne({name: townName}, (err: CallbackError, res: any) => {
                    if(!err || res) {
                        Town.deleteOne({name: townName}, (err: CallbackError, res: any) => {
                            if(err) throw err;
                        })
                    }
                })

                town.save((err: CallbackError) => {if (err) throw err;});

                message.channel.send("Done.");
            })

        }})
    }

}