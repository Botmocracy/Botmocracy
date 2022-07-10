import { MessageMentionTypes } from "discord.js";

export default interface Config {
    guild: string,
    announcement_channel: string,
    allowed_mentions: MessageMentionTypes[],
    citizen_role: string,
    president_role: string,
    vice_president_role: string,
    government_role: string,
    time_between_elections: string,
    election_registration_period: string,
    election_vote_period: string,
    time_between_counts: string,
    power_transition_period: string,
    election_updates_channel: string,
    admin_role: string,
    verified_role: string,
    town_notifications_channel: string
}