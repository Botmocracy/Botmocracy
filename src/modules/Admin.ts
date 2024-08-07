import { exec } from 'child_process';
import { ActionRowBuilder, ChatInputCommandInteraction, CommandInteraction, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { config } from "..";
import Module from "./abstract/Module";

export default class Admin extends Module {
    name = "Admin";

    onEnable(): void {
        this.logger.info("Enabled");
        this.client?.on('interactionCreate', (i) => {
            if(!i.isModalSubmit()) return;
            this.onModalSubmit(i);
        })
    }

    async onModalSubmit(i: ModalSubmitInteraction) {
        if(!i.customId.startsWith("message")) return;
        const idSplit = i.customId.split("-");
        const channelId = idSplit[1];
        const channel = this.client?.channels.cache.get(channelId);
        if(!channel?.isTextBased()) return i.reply({ content: "Imagine", ephemeral: true });
        channel.send(i.fields.getTextInputValue("text"));
        i.reply({content: "Done", ephemeral: true});
    }

    slashCommands = {
        superuser: {
            cmdBuilder: new SlashCommandBuilder().setName("superuser").setDescription("Adds le admin role. Can only be used by binty, ain and fishe"),
            executor: async (i: ChatInputCommandInteraction) =>{
                if (!i.inGuild()) return;
                const allowedPeople = config.admins;
                if (!allowedPeople.includes(i.user.id)) return i.reply({ content: "You cannot use this.", ephemeral: true });

                const role = i.guild!.roles.cache.get(config.admin_role);
                const member = i.guild!.members.cache.get(i.user.id);

                if (member?.roles.cache.has(config.admin_role)) {
                    member.roles.remove(role!);
                    return i.reply({ content: "Done.", ephemeral: true });
                }

                member?.roles.add(role!);
                return i.reply({ content: "Done.", ephemeral: true });
            }
        },
        reloadandrestart: {
            cmdBuilder: new SlashCommandBuilder().setName("reloadandrestart").setDescription("Runs git pull & restarts the bot").setDefaultMemberPermissions(8),
            executor: async (i: CommandInteraction) => {
                if (!i.inGuild()) return;
                if (!config.admins.includes(i.user.id)) return i.reply({ content: "You cannot use this.", ephemeral: true });

                exec("git pull", (err, stdout, stderr) => {
                    if(err != null) {
                        i.reply({content: `Something went wrong when doing git pull: ${err.message}`, ephemeral: true});
                    }
                });
                exec("npm install", (err, stdout, stderr) => {
                    if(err != null) {
                        i.reply({content: `Something went wrong when doing npm install: ${err.message}`, ephemeral: true});
                    }
                });
                i.client.user?.setStatus("invisible"); // So we can see when it comes back online
                await i.reply({ content: "Restarting", ephemeral: true });
                process.exit(0);
            }
        },

        eval_code: {
            cmdBuilder: new SlashCommandBuilder().setName("eval_code").setDescription("Evaluates code").setDefaultMemberPermissions(8)
                .addStringOption(o => o.setName("code").setDescription("The code 2 run")),
            
            executor: async (i: ChatInputCommandInteraction) =>{
                if (!i.inGuild()) return;
                if (!config.admins.includes(i.user.id)) return i.reply({ content: "You cannot use this.", ephemeral: true });

                try {
                    const result = eval(i.options.getString("code", true));
                    if(result) i.reply({ content: `\`\`\`${result}\`\`\``, ephemeral: true });
                } catch (err : any) {
                    i.reply({ content: `\`\`\`${err}\`\`\``, ephemeral: true });
                }
            }
        },

        say: {
            cmdBuilder: new SlashCommandBuilder().setName("say").setDescription("Says shit").setDefaultMemberPermissions(8)
                .addChannelOption(o => o.setName("channel").setDescription("The channel to send")),

            executor: async (i: ChatInputCommandInteraction) =>{
                if (!i.inGuild()) return;
                const allowedPeople = ["644052617500164097", "468534859611111436", "716779626759716914"];
                if (!allowedPeople.includes(i.user.id)) return i.reply({ content: "You cannot use this.", ephemeral: true });

                const actionRow = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder().setCustomId("text").setLabel("Message").setMaxLength(2000).setStyle(TextInputStyle.Paragraph)
                );

                const channel = i.options.getChannel("channel", true);
                const modal = new ModalBuilder().addComponents(actionRow).setTitle("Message Modal").setCustomId(`message-${channel.id}`);

                i.showModal(modal);
            }
        }

    }
}