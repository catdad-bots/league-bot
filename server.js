const Discord = require('discord.js')
const client = new Discord.Client()
const commands = require('./commands.js')
const LeaguebotDb = require('./lib/db/leaguebot_db')
const GuildDb = require('./lib/db/guild_db.js')
const {renderHelp, renderOutput} = require('./help_strings.js')
const fs = require('fs')
const AWS = require('aws-sdk')

let S3
let leaguebotDb;
const guildDbs = {}
const persistInterval = 5*60*1000 // 5 minutes

function tryLoadEnv() {
  let exists = fs.existsSync('./.env.json')
  if (!exists) return false
  let env = require('./.env.json')
  for (let e in env) {
    process.env[e] = env[e]
  }
}

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
  console.log(`Logged in as ${client.user.tag}!`)
  client.user.setPresence({game: {name: '!leaguebot help'}, status: 'online'})
});

client.on('message', async msg => {
  let content_parts = msg.content.split('\n')
  
  for (let line of content_parts) {
    let cmdInfo = commands.parseToCommand(line)
    if (!cmdInfo) return false

    console.log(`Processing ${cmdInfo.command} in Guild ${msg.guild.id}`)

    let guildDb;
    if (cmdInfo.command == '!leaguebot' && (['help', 'configure', 'link'].indexOf(cmdInfo.arguments[0]) > -1)) {
      guildDb = {}
    } else {
      try {
        if (!guildDbs[msg.guild.id]) guildDbs[msg.guild.id] = await leaguebotDb.fetchSharedGuildDb(msg.guild)
        guildDb = guildDbs[msg.guild.id]
      } catch (e) {
        console.log('command failed:', cmdInfo)
        return await msg.channel.send(e) // tell people the DB needs to be setup !
      }
    }
    
    try {
      await cmdInfo.handler(cmdInfo, msg, guildDb)
    } catch (e) {
      // TODO: swap to msg.author.send?
      console.log(e, e.message)
      msg.channel.send(renderHelp('error', {error: e.message ? e.message : e, msg: msg}))
    }
  }
})

async function main() {
  tryLoadEnv()
  S3 = new AWS.S3({region: 'us-east-1', params: {Bucket: process.env.S3_BUCKET}})
  leaguebotDb = new LeaguebotDb('leaguebot', S3)
  await leaguebotDb.init()
  commands.init(leaguebotDb)
  await client.login(process.env.DISCORD_TOKEN)
  
  setInterval(() => {
    persistAllDbs(leaguebotDb, guildDbs)
  }, persistInterval)
}


main()