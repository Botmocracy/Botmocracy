import Module from "./abstract/Module";
import { config } from "..";
import { ButtonInteraction, MessageActionRow, MessageButton } from "discord.js";

export default class ElectionVoting extends Module {
    name = "ElectionVoting";

    onEnable() {
        this.logger.info("Enabled");

        this.client?.on("interactionCreate", (i) => {
            if (i.isButton()) {
                switch (i.customId) {
                    case "vote":
                        this.startVote(i);
                        break;
                }
            }
        })
    }

    startVote(i: ButtonInteraction) {
        // TODO check election phase, citizen role
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
}