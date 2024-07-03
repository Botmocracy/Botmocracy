import { TextChannel } from "discord.js";
import { config } from "..";
import ElectionCandidate from "../schema/ElectionCandidate";
import ElectionVote from "../schema/ElectionVote";
import {
  formatArrayValuesAsHumanReadableString,
  getNextNonEmptyIndex,
} from "../util/array-util";
import wait from "../util/wait";
import Module from "./abstract/Module";
import ElectionManager from "./ElectionManager";
import timestring from "timestring";

export default class ElectionCounter extends Module {
  name = "ElectionCounter";

  candidates!: string[];
  votes: Record<string, string[][]> = {};
  countNumber = 0;

  manager!: ElectionManager;

  onEnable(): void {
    this.logger.info("Enabled");
  }

  onModulesLoaded(modules: Map<string, Module>): void {
    this.manager = modules.get("ElectionManager") as ElectionManager;
  }

  async commenceCount() {
    this.countNumber = 0;
    this.votes = {};
    this.candidates = (await ElectionCandidate.find().exec()).map(
      (c) => c.discordId!,
    );

    const votesRaw = await ElectionVote.find().exec();
    for (const vote of votesRaw) {
      const ballot = vote.preferences.filter((p) =>
        this.candidates.includes(p),
      );
      if (ballot.length == 0) return;

      if (!this.votes[ballot[0]]) this.votes[ballot[0]] = [];
      this.votes[ballot[0]].push(ballot);
    }

    // Include people who got no first preference votes in the thing as well
    for (const candidate of this.candidates) {
      if (!this.votes[candidate]) this.votes[candidate] = [];
    }

    this.doCount();
  }

  async doCount(changes?: Record<string, number>, countName?: string) {
    await wait(timestring(config.time_between_counts, "ms"));

    // Calculate quota
    let numberOfVotes = 0;
    for (const c of Object.keys(this.votes))
      numberOfVotes += this.votes[c].length;

    const quota = Math.ceil(numberOfVotes / 2 + 0.1);

    this.countNumber++;

    const outputMessageBuilder = [];
    outputMessageBuilder.push(
      `**Count ${this.countNumber}: ${countName ? countName : "Initial Count"}**`,
    );
    outputMessageBuilder.push(
      `*Number of valid votes: ${numberOfVotes}. Quota for election: ${quota}.*\n`,
    );

    let winner = null;

    for (const c of Object.keys(this.votes)) {
      outputMessageBuilder.push(
        `<@${c}>: ${this.votes[c].length} votes. ${changes != undefined ? `(+${changes[c]})` : ""}`,
      );
      if (this.votes[c].length >= quota) winner = c;
    }

    outputMessageBuilder.push(""); // Skip a line

    if (winner) {
      outputMessageBuilder.push(
        `**<@${winner}> has reached the quota and is therefore declared elected.**`,
      );
      this.manager.elect(winner);
    } else {
      // Now we need to figure out who to eliminate. Put everyone into an array where their location is based on number of votes and work it out that way.
      const candidatesSortedByNumberOfVotes: string[][] = Array(numberOfVotes)
        .fill(null)
        .map(() => {
          return [];
        }); // Fucking fill using references instead of objects

      for (const c of Object.keys(this.votes)) {
        candidatesSortedByNumberOfVotes[this.votes[c].length].push(c);
      }

      const eliminating: string[] = [];
      let totalEliminatedVotes = 0;

      for (const i in candidatesSortedByNumberOfVotes) {
        const nextNumberOfVotes = getNextNonEmptyIndex(
          candidatesSortedByNumberOfVotes,
          i,
        );

        // If we can eliminate whoever has this many without reaching the next highest person (and there is a next highest person)
        if (
          nextNumberOfVotes != null &&
          totalEliminatedVotes +
            candidatesSortedByNumberOfVotes[i]!.length * parseInt(i) <
            nextNumberOfVotes
        ) {
          eliminating.push(...candidatesSortedByNumberOfVotes[i]);
          totalEliminatedVotes +=
            candidatesSortedByNumberOfVotes[i].length * parseInt(i);
        } else if (eliminating.length == 0) {
          // There isn't a next highest person || we can't eliminate everyone here (or both really) && we have to eliminate someone
          const candidatesReadable = formatArrayValuesAsHumanReadableString(
            candidatesSortedByNumberOfVotes[i].map((c) => "<@" + c + ">"),
          );
          outputMessageBuilder.push(
            `${candidatesReadable} are tied. One will be eliminated by random selection.`,
          );
          const toEliminate =
            candidatesSortedByNumberOfVotes[i][
              Math.floor(
                Math.random() * candidatesSortedByNumberOfVotes[i].length -
                  0.001,
              )
            ];
          eliminating.push(toEliminate);
          totalEliminatedVotes += parseInt(i);
          break; // Let's not do more than one random elimination in a count
        } else break; // Our work here is done
      }

      outputMessageBuilder.push(
        `**${formatArrayValuesAsHumanReadableString(eliminating.map((c) => "<@" + c + ">"))} ${eliminating.length > 1 ? "have" : "has"} been eliminated.**`,
      );

      this.doCount(
        this.distributeVotes(eliminating),
        `Distribution of votes belonging to ${formatArrayValuesAsHumanReadableString(eliminating.map((c) => "<@" + c + ">"))}`,
      );
    }

    (
      this.client!.channels.cache.get(
        config.election_updates_channel,
      )! as TextChannel
    ).send({
      content: outputMessageBuilder.join("\n"),
      allowedMentions: { parse: [] },
    });
  }

  distributeVotes(candidates: string[]): Record<string, number> {
    const resultObject: Record<string, number> = {};

    for (const candidate of Object.keys(this.votes))
      resultObject[candidate] = 0; // We need to do it here so that will definitely all be ready in the next loop

    for (const candidate of Object.keys(this.votes)) {
      if (!candidates.includes(candidate)) continue; // Only distribute this person's votes if they've been eliminated

      for (const ballot of this.votes[candidate]) {
        while (true) {
          ballot.shift();

          if (ballot.length == 0) break; // No more preferences listed

          if (this.votes[ballot[0]]) {
            // This preference is for a valid candidate
            this.votes[ballot[0]].push(ballot);
            resultObject[ballot[0]]++;
            break;
          }
        }
      }

      delete this.votes[candidate];
    }

    return resultObject;
  }
}
