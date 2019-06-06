const Discord = require('discord.js')
const GuildDb = require('../db/guild_db.js')
const LeagueBotDb = require('../db/leaguebot_db.js')
const {renderHelp, renderOutput} = require('../../help_strings')

class BaseCommand {
  constructor(leaguebotDb) {
    this.leaguebotDb = leaguebotDb
    this._subaliases={}
  
    // some default aliases
    this._registerSubAlias('+', 'add')
    this._registerSubAlias('-', 'delete')
  }
  
  // Default help method will just list public methods
  async handler_help(cmdInfo, msg, guildDb) {
    if (cmdInfo.arguments.length > 0) {
      return this.showHelp(cmdInfo.arguments[0], cmdInfo, msg)
    }
    
    let handlers = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(name => {
      if (name.indexOf('handler_') === -1) return false
      if (['handler_help', 'handler_default'].indexOf(name) > -1) return false
      return true
    }).map(h => h.replace('handler_', ''))
    
    return msg.channel.send(renderHelp('commands.BaseCommand.help', {command: cmdInfo.command, handlers: handlers}))
    // msg.channel.send(handlers.join('\n'))
  }
  
  
  async output(output, channel) {
    let append_codeblock;
    let messages = []
    let ctr = 0
    let incr = 1980
    while (ctr < output.length) {
      messages.push(output.slice(ctr, ctr + incr))
      ctr += incr
    }
 
    messages = messages.map(m => {
      if (append_codeblock) {
        m = append_codeblock + '\n' + m
        append_codeblock = null
      }
      let codeblocks = m.match(/```(\w+)?/g)
      
      if (!codeblocks || codeblocks.length % 2 == 0) return m
      append_codeblock = codeblocks[codeblocks.length - 1]
      return m + '```'
    })
    
    for (let m of messages) {
      await channel.send(m)
    }
  }
  
  outputJSON(json, channel) {
    return this.output('```json\n' + JSON.stringify(json, null, 2) + '\n```', channel)
  }
  
  _needHelp(cmdInfo, emptyMeansHelp=true) {
    if (cmdInfo.arguments[0] == 'help') return true
    if (emptyMeansHelp && cmdInfo.arguments.length == 0) return true
    return false
  }
  
  async _send(msg, output) {
    if (Array.isArray(output)) {
      for (let line of output) {
        await msg.channel.send(line)
      }
    } else {
      msg.channel.send(output)
    }
  }
    
  async showOutput(method, cmdInfo, msg, ...args) {
    let hs_output = renderOutput(`commands.${this.constructor.name}.${method}`, ...args)
    this._send(msg, hs_output)
  }
  
  async showHelp(method, cmdInfo, msg, ...args) {
    let hs_output = renderHelp(`commands.${this.constructor.name}.${method}`, ...args)
    this._send(msg, hs_output)
  }

  _registerSubAlias(alias, sub) {
    this._subaliases['handler_' + alias] = this['handler_' + sub]
  }
  
  _lookup(sub) {
    if (this[sub]) return this[sub]
    
    if (this._subaliases[sub]) return this._subaliases[sub]
    return false
    // throw new Error(`Unknown sub-command ${sub}`)
  }
  
  async requireDiscordAdministrator(msg) {
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
    return await handle.apply(this, [cmdInfo, msg, guildDb])
  }
  
  async runSub(cmdInfo, msg, guildDb) {
    let sub = cmdInfo.arguments.length == 0 ? 'default' : cmdInfo.arguments.shift()
    // let sub = cmdInfo.arguments.shift()
    let handle = this._lookup(`handler_${sub}`)
    if (!handle) {
      msg.channel.send(`Unknown sub-command: \`${cmdInfo.command} ${sub}\``)
      return await this.handler_help(cmdInfo, msg, guildDb)
    }
    
    return await this.exec(handle, cmdInfo, msg, guildDb)
  }
  
  async run(cmdInfo, msg, guildDb) {
    // by default, route to subcommands
    return await this.runSub(cmdInfo, msg, guildDb)
  } 
}

module.exports = BaseCommand