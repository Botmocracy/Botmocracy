const Discord = require("discord.js")

require('dotenv').config()

const intents = new Discord.Intents()
intents.add(Discord.Intents.FLAGS.GUILD_MESSAGES)
intents.add(Discord.Intents.FLAGS.GUILDS)
intents.add(Discord.Intents.FLAGS.GUILD_MEMBERS)

const client = new Discord.Client({intents: intents})

client.login(process.env.TOKEN)

client.on('ready', async() => {
    console.log(`Bot is ready as ${client.user.username}`)
})