import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Interaction, Role } from "discord.js";
import axios from 'axios';
import Module from "./abstract/Module";


export default class Auth extends Module {
    name = "Auth";
    
    onEnable(): void {
        this.logger.info("Enabled");
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
        if(status == 404) {
            return null;
        }

        return data['name'];
    }

    slashCommands = {
        verify: {
            cmdBuilder: new SlashCommandBuilder()
                .setName("verify")
                .setDescription("Verifies you"),
            
            executor: async (i: CommandInteraction) => {
                if(!i.guild) {
                    i.reply({content: "You can't use this in a DM", ephemeral: true});
                    return;
                }

                const member = i.guild.members.cache.get(i.user.id);

                if (member?.roles.cache.has("987775509368811530")) {
                    i.reply({content: "You're already verified.", ephemeral: true});
                    return;
                }

                const req = await axios.get(`https://minecraftauth.me/api/lookup?discord=${i.user.id}`);

                if (req.status == 404) {
                    i.reply({content: "You need to verify with https://minecraftauth.me first."});
                    return;
                }

                const data = req.data;
                const uuid = data['minecraft']['identifier'];
                const members = await this.getMembers();
                const name = await this.getName(uuid);
                
                if(name == null) {
                    i.reply({content: "I couldn't get your username for some reason. Try again.", ephemeral: true});
                    return;
                }

                if (members.includes(name)) {
                    const role = i.guild.roles.cache.get("987775509368811530");
                    member?.roles.add((role as Role));

                    i.reply({content: "Verified!", ephemeral: true});
                }
                
            }
        }
    }
}