import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import timestring from "timestring";
import { config } from "..";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionInfo from "../schema/ElectionInfo";
import checkCitizenship from "../util/check-citizenship";
import Module from "./abstract/Module";
import Auth from "./Auth";
import ElectionManager from "./ElectionManager";

export default class ElectionRegistration extends Module {
  name = "ElectionRegistration";

  authModule!: Auth;
  electionManager!: ElectionManager;

  onEnable(): void {
    this.logger.info("Enabled");

    this.client?.on("interactionCreate", (i) => {
      if (i.guildId != config.guild) return;

      if (i.isButton()) {
        if (i.customId.startsWith("confirmcandidacy")) {
          this.confirmCandidacy(i);
        } else if (i.customId.startsWith("confirmwithdrawal")) {
          this.confirmWithdrawal(i);
        } else if (i.customId.startsWith("confirmcallelection"))
          this.confirmCallElection(i);
      }
    });
  }

  onModulesLoaded(modules: Map<string, Module>): void {
    this.authModule = modules.get("Auth") as Auth;
    this.electionManager = modules.get("ElectionManager") as ElectionManager;
  }

  confirmCandidacy(i: ButtonInteraction) {
    const userIds = i.customId.split("-");
    userIds.shift(); // Remove "confirmcandidacy"

    // Make sure there's no sorcery going on
    if (
      i.user.id != userIds[0] ||
      !i.guild ||
      !i.guild.members.cache.has(userIds[1])
    )
      return i.reply({ content: "wtf is happening", ephemeral: true });

    const candidate = i.member;
    const runningMate = i.guild.members.cache.get(userIds[1]);

    ElectionInfo.findOne()
      .then((data: any) => {
        if (data.currentPhase != 1)
          return i.update({
            content:
              "Election registration is not currently open. Please refer to <#" +
              config.election_updates_channel +
              "> for more information.",
            components: [],
          });

        ElectionCandidate.findOne({ discordId: candidate?.user.id }).then(
          (data) => {
            if (data)
              return i.update({
                content: "You have already entered this election.",
                components: [],
              });

            const candidateInfo = new ElectionCandidate({
              discordId: candidate?.user.id,
              runningMateDiscordId: runningMate?.user.id,
            });
            candidateInfo.save();

            i.update({ content: "Confirmed!", components: [] });

            const updatesChannel = this.client?.channels.cache.get(
              config.election_updates_channel,
            ) as TextChannel | null;
            if (!updatesChannel) return;

            updatesChannel.send(
              `${candidate} has entered the election! Their running-mate is ${runningMate}!`,
            );
          },
        );
      })
      .catch((err) => {
        i.reply({
          content: "Error retrieving election info: " + err.toString(),
          ephemeral: true,
        });
      });
  }

  async confirmWithdrawal(i: ButtonInteraction) {
    const userIds = i.customId.split("-");
    userIds.shift(); // Remove "confirmwithdrawal"

    // Make sure there's no sorcery going on
    if (i.user.id != userIds[0])
      return i.reply({ content: "wtf is happening", ephemeral: true });

    const runningAsPrimary = await ElectionCandidate.findOne({
      discordId: userIds[0],
      runningMateDiscordId: userIds[1],
    });
    const runningAsSecondary = await ElectionCandidate.findOne({
      discordId: userIds[1],
      runningMateDiscordId: userIds[0],
    });

    if (!runningAsPrimary && !runningAsSecondary)
      return i.reply({
        content: "Oops. Looks like something broke.",
        ephemeral: true,
      });
    if (runningAsPrimary) runningAsPrimary.deleteOne();
    if (runningAsSecondary) runningAsSecondary.deleteOne();

    i.update({ content: "Confirmed", components: [] });

    const updatesChannel = this.client?.channels.cache.get(
      config.election_updates_channel,
    ) as TextChannel | null;
    if (!updatesChannel) return;

    updatesChannel.send(
      `<@${userIds[0]}> has withdrawn <@${userIds[0]}> and <@${userIds[1]}> from the election.`,
    );
  }

  async confirmCallElection(i: ButtonInteraction) {
    await i.deferUpdate();

    const electionInfo = await ElectionInfo.findOne().exec();
    if (
      !electionInfo ||
      electionInfo.processStartTime == null ||
      electionInfo.currentPhase == null
    )
      return i.editReply({
        content: "Election info is invalid",
        components: [],
      });
    if (
      electionInfo?.processStartTime?.getTime() <
      Date.now() + timestring("1d", "ms")
    )
      return i.editReply({
        content: "The election is less than a day away (or already started)!",
        components: [],
      });

    const newElectionTime = new Date(Date.now() + timestring("1h", "ms"));
    newElectionTime.setMinutes(0);
    newElectionTime.setSeconds(0);
    newElectionTime.setMilliseconds(0);
    const newInfo = new ElectionInfo({
      currentPhase: electionInfo.currentPhase,
      processStartTime: newElectionTime,
    });

    await electionInfo.deleteOne();
    await newInfo.save();

    const updatesChannel = this.client?.channels.cache.get(
      config.election_updates_channel,
    ) as TextChannel | null;
    if (!updatesChannel) return;

    updatesChannel.send(
      `<@${i.user.id}> has called an early election. It will begin at the top of the hour.`,
    );
    this.electionManager.run(); // Restart election manager to load new times
    i.editReply({ content: "Done. It will begin soon:tm:", components: [] });
  }

  slashCommands = {
    election: {
      cmdBuilder: new SlashCommandBuilder()
        .setName("election")
        .setDescription(
          "Enter, withdraw or list candidates in the Presidential elections",
        )
        .addSubcommand((s) =>
          s
            .setName("enter")
            .setDescription("Enter the Presidential election")
            .addUserOption((o) =>
              o
                .setName("runningmate")
                .setDescription(
                  "The person who will be vice president if you are elected",
                )
                .setRequired(true),
            ),
        )
        .addSubcommand((s) =>
          s
            .setName("withdraw")
            .setDescription("Withdraw yourself from election candidacy")
            .addUserOption((o) =>
              o
                .setName("runningwith")
                .setDescription("The person you are running with")
                .setRequired(true),
            ),
        )
        .addSubcommand((s) =>
          s
            .setName("listrunning")
            .setDescription("List who's running in the Presidential election"),
        )
        .addSubcommand((s) =>
          s
            .setName("call")
            .setDescription("[President Only] Call an early election"),
        ),
      subcommands: {
        enter: {
          allowedRoles: [config.citizen_role],
          executor: async (i: ChatInputCommandInteraction) => {
            if (!i.guild) {
              i.reply({
                content: "You can't use this in a DM",
                ephemeral: true,
              });
              return;
            }

            const runningMate = i.options.getMember(
              "runningmate",
            ) as GuildMember;

            if (!runningMate)
              return i.reply({
                content: "That person is not a member of this server.",
                ephemeral: true,
              });
            if (!(await checkCitizenship(runningMate.id)))
              return i.reply({
                content: "That person is not a citizen.",
                ephemeral: true,
              });
            if (!process.env.DEV && runningMate.id == i.user.id)
              return i.reply({
                content: "Really? You want to run with yourself?",
                ephemeral: true,
              });
            if (runningMate.id == this.client?.user.id)
              return i.reply({
                content: "I don't want to run with you, I'm a bot!",
                ephemeral: true,
              });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`confirmcandidacy-${i.user.id}-${runningMate.id}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Confirm"),
            );

            i.reply({
              content: `**Are you sure?**\n\nBy clicking the \`Confirm\` button, you agree to enter yourself into the election and that your running-mate ${runningMate} is willing to enter also.`,
              components: [row],
              ephemeral: true,
            });
          },
        },
        withdraw: {
          allowedRoles: [config.citizen_role],
          executor: async (i: ChatInputCommandInteraction) => {
            const electionInfo = await ElectionInfo.findOne().exec();
            if (electionInfo?.currentPhase == 0)
              return i.reply({
                content: "There isn't currently an election running.",
                ephemeral: true,
              });

            const runningWith = i.options.getUser("runningwith");
            if (!runningWith)
              return i.reply({
                content: "That's not a valid Discord user.",
                ephemeral: true,
              });

            const runningAsPrimary = await ElectionCandidate.findOne({
              discordId: i.user.id,
              runningMateDiscordId: runningWith.id,
            });
            const runningAsSecondary = await ElectionCandidate.findOne({
              discordId: runningWith.id,
              runningMateDiscordId: i.user.id,
            });

            if (!runningAsPrimary && !runningAsSecondary)
              return i.reply({
                content: "You don't seem to be running with that person.",
                ephemeral: true,
              });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`confirmwithdrawal-${i.user.id}-${runningWith.id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Confirm"),
            );

            i.reply({
              content: `**Are you sure?**\nIf you click the \`Confirm\` button, this combination will be removed from the election`,
              components: [row],
              ephemeral: true,
            });
          },
        },
        listrunning: {
          executor: async (i: ChatInputCommandInteraction) => {
            const candidates = await ElectionCandidate.find().exec();

            if (!candidates) {
              await i.reply({
                content:
                  "Unable to fetch the candidates list. Please try again later.",
                ephemeral: true,
              });
              return;
            }

            let outputMessage = "**Candidates running in this election:**";

            for (const candidate of candidates) {
              outputMessage += `\n**${await this.authModule.getMinecraftOrDiscordName(candidate.discordId!, true)}** for President; **${await this.authModule.getMinecraftOrDiscordName(candidate.runningMateDiscordId!, true)}** for Vice President.`;
            }

            i.reply({ content: outputMessage, ephemeral: true });
          },
        },
        call: {
          allowedRoles: [config.president_role],
          executor: async (i: ChatInputCommandInteraction) => {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`confirmcallelection`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Confirm"),
            );

            i.reply({
              content:
                "Are you sure you want to call an early election? This cannot be undone.",
              ephemeral: true,
              components: [row],
            });
          },
        },
      },
    },
  };
}
