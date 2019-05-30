const Discord = require('discord.js')
const GuildDb = require('../db/guild_db.js')
const LeagueBotDb = require('../db/leaguebot_db.js')
const renderHelp = require('../../help_strings')

class BaseCommand {
  constructor(leaguebotDb) {
    this.leaguebotDb = leaguebotDb
    this._subaliases={}
  
    // some default aliases
    this._registerSubAlias('+', 'add')
    this._registerSubAlias('-', 'delete')
  }
  
  _outputJSON(json) {
    return '```json\n' + JSON.stringify(json, null, 2) + '\n```'
  }
  
  _needHelp(cmdInfo, emptyMeansHelp=true) {
    if (cmdInfo.arguments[0] == 'help') return true
    if (emptyMeansHelp && cmdInfo.arguments.length == 0) return true
    return false
  }
    
  async _showHelp(method, cmdInfo, msg) {
    let hs_output = renderHelp(`commands.${this.constructor.name}.${method}`)
    
    if (Array.isArray(hs_output)) {
      for (let line of hs_output) {
        await msg.channel.send(line)
      }
    } else {
      msg.channel.send(hs_output)
    }
  }

  _registerSubAlias(alias, sub) {
    this._subaliases[alias] = this[sub]
  }
  
  _lookup(sub) {
    if (this[sub]) return this[sub]
    
    if (this._subaliases[sub]) return this._subaliases[sub]
    throw new Error(`Unknown sub-command ${sub}`)
  }
  
  async _requireDiscordAdministrator(msg) {
    if (!msg.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
      // msg.channel.send('You must be an Discord administrator to use this command')
      return Promise.reject('You must be an Discord administrator to use this command')
    }
    return true
  }
  
  async hasScope(scope, cmdInfo) {
    return cmdInfo.user_scopes.indexOf(scope) > -1
  }
  
  async requireScope(scope, cmdInfo) {
    if (!this.hasScope(scope, cmdInfo)) {
      return Promise.reject(`You don't have the require permission (${scope}) to run this command`)
    }
    return true
  }
  
  async _find_user_scopes(msg, guildDb) {
    if (msg.author.id == process.env.SUPERUSER_ID || msg.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
      return GuildDb.SCOPE_HIERARCHY.slice()
    }
    // if (scope == GuildDb.SCOPES.EVERYONE && scopeRoles.length == 0) return true
    let scopesFound = await guildDb.findScopeByRoles(msg.member.roles)
    if (scopesFound.length == 0) {
      // check the EVERYONE scope...
      let everyone = await guildDb.getScope(GuildDb.SCOPES.EVERYONE)
      if (everyone.length == 0) return [GuildDb.SCOPES.EVERYONE]
    }
    return scopesFound
  }
  
  async exec(handle, cmdInfo, msg, guildDb) {
    // we'll stamp user scopes onto the command info object so we can do 
    // quick checks on what scopes a user has throughout the rest of the lifecycle.
    let scopes = await this._find_user_scopes(msg, guildDb)
    cmdInfo.user_scopes = scopes
    console.log(cmdInfo.user_scopes)
    console.log(await this.leaguebotDb.isLinkType(msg.guild, LeagueBotDb.LINK_FLAGS.ADMIN))
    return await handle.apply(this, [cmdInfo, msg, guildDb])
  }
  
  async runSub(cmdInfo, msg, guildDb) {
    let sub = cmdInfo.arguments.shift()
    let handle = this._lookup(sub)
    return await this.exec(handle, cmdInfo, msg, guildDb)
  }
  
  async run(cmdInfo, msg, guildDb) {
    // by default, route to subcommands
    return await this.runSub(cmdInfo, msg, guildDb)
  } 
}

module.exports = BaseCommand