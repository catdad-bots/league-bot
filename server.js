// server.js
// where your node app starts

// https://discordapp.com/oauth2/authorize?client_id=579382058816634880&scope=bot&permissions=268576768

const GuildDb = require('./lib/db/guild_db.js')
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js')

const AWS = require('aws-sdk')
const S3 = new AWS.S3({region: 'us-east-1', params: {Bucket: process.env.S3_BUCKET}})

const guildDbs = {}

async function initGuildDb(guild, s3) {
  let db = new GuildDb(guild.id, s3)
  return await db.init()
}

async function persistAllDbs(dbList) {
  console.log('persisting', Object.keys(dbList))
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({game: {name: 'league management'}, status: 'online'})
});

client.on('message', async msg => {
  let content_parts = msg.content.split('\n')
  
  for (let line of content_parts) {
    let cmdInfo = commands.parseToCommand(line)
    if (!cmdInfo) return false

    console.log(`Processing command in  Guild ${msg.guild.id}`)
    console.log("retrieving guild DB")
    // if the command is recognized, ensure we have the guild DB available
    if (!guildDbs[msg.guild.id]) guildDbs[msg.guild.id] = await initGuildDb(msg.guild, S3)
    console.log(`executing ${cmdInfo.command}`)
    await cmdInfo.handler(cmdInfo, msg, guildDbs[msg.guild.id])
  }
})

async function main() {
  await client.login(process.env.DISCORD_TOKEN)
  
//   setInterval(() => {
//     persistAllDbs(guildDbs)
//   }, (5*60*1000)) // sync every 5 minutes
}


main()