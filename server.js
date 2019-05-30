// server.js
// where your node app starts

// 

const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js')
const LeaguebotDb = require('./lib/db/leaguebot_db')
const GuildDb = require('./lib/db/guild_db.js')
const renderHelp = require('./help_strings.js')

const AWS = require('aws-sdk')
const S3 = new AWS.S3({region: 'us-east-1', params: {Bucket: process.env.S3_BUCKET}})


let leaguebotDb;
const guildDbs = {}
const persistInterval = 5*60*1000 // 5 minutes

async function initGuildDb(guild, s3) {
  let db = new GuildDb(guild.id, s3)
  return await db.init()
}

async function persistAllDbs(leaguebotDb, dbList) {
  console.log('persisting', Object.keys(dbList))
  await leaguebotDb.persist()
  for (let key in dbList) {
    await dbList[key].persist()
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({game: {name: '!leaguebot help'}, status: 'online'})
});

client.on('message', async msg => {
  let content_parts = msg.content.split('\n')
  
  for (let line of content_parts) {
    let cmdInfo = commands.parseToCommand(line)
    if (!cmdInfo) return false

    console.log(`Processing command in  Guild ${msg.guild.id}`)
    console.log("retrieving guild DB")
    // if the command is recognized, ensure we have the guild DB available
    // TODO: don't run this setup before we've figured out the command - Link Command, for example, 
    // Is required to even set up the guild DB link
    if (!guildDbs[msg.guild.id]) guildDbs[msg.guild.id] = await leaguebotDb.fetchSharedGuildDb(msg.guild)
    console.log(`executing ${cmdInfo.command}`)
    
    try {
      await cmdInfo.handler(cmdInfo, msg, guildDbs[msg.guild.id])
    } catch (e) {
      // TODO: swap to msg.author.send
      console.log(e, e.message)
      msg.channel.send(renderHelp('error', msg, e.message ? e.message : e))
    }
  }
})

async function main() {
  leaguebotDb = new LeaguebotDb('leaguebot', S3)
  await leaguebotDb.init()
  commands.init(leaguebotDb)
  await client.login(process.env.DISCORD_TOKEN)
  
  setInterval(() => {
    persistAllDbs(leaguebotDb, guildDbs)
  }, persistInterval)
}


main()