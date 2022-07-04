import Module from "./abstract/Module";
import { config } from "..";
import { ButtonInteraction, GuildMemberRoleManager, MessageActionRow, MessageButton } from "discord.js";

export default class ElectionVoting extends Module {
    name = "ElectionVoting";

    onEnable() {
        this.logger.info("Enabled");

        this.client?.on("interactionCreate", (i) => {
            if (i.isButton()) {
                if (i.customId == "vote") this.startVote(i);
                else if (i.customId.startsWith("votingpage")) this.goToVotingPage(i);
            }
        });
    }

    async startVote(i: ButtonInteraction) {
            if (i.member?.roles instanceof GuildMemberRoleManager 
                ? !i.member?.roles.cache.has(config.citizen_role) 
                : !i.member?.roles.includes(config.citizen_role))
                    i.reply({ })
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("votingpage-1")
                    .setLabel("I understand. Proceed.")
                    .setStyle("PRIMARY")
            );
        i.reply({
            content:
                [
                    `**Important information regarding voting:**`,
                    `- Votes are counted using the [Alternate Vote (AV) method](<https://www.youtube.com/watch?v=3Y3jE3B8HsE>).`,
                    `- You may rank as many or as few candidates as you like, as long as you select at least one.`,
                    `- You may change your vote at any time up until voting closes by clicking the vote button again.`
                ].join("\n"),
            ephemeral: true,
            components: [row]
        });
    }

    async goToVotingPage(i: ButtonInteraction) {
        const page = i.customId.split("-")[1];


    }
}