let Discord = require('discord.js')
let helpstrings = require('../../help_strings')

class BaseCommand {
  constructor() {
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
    
  _showHelp(method, cmdInfo, msg) {
    let hs = `commands.${this.constructor.name}.${method}`
    if (!helpstrings[hs]) console.error(`Unknown Helpstring requested: ${hs}`)
    msg.channel.send(helpstrings[hs])
  }

  _registerSubAlias(alias, sub) {
    this._subaliases[alias] = this[sub]
  }
  
  _lookup(sub) {
    if (this[sub]) return this[sub]
    
    if (this._subaliases[sub]) return this._subaliases[sub]
    throw new Error(`Unknown sub-command ${sub}`)
  }
  
  async _requireAdministrator(msg) {
    if (!msg.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
      msg.channel.send('You must be an administrator to use this command')
      return Promise.reject('This command requires administrator privilege')
    }
    return true
  }
  
  async runSub(cmdInfo, msg, guildDb) {
    let sub = cmdInfo.arguments.shift()
    let handle = this._lookup(sub)
    return await handle.apply(this, [cmdInfo, msg, guildDb])
  }
  
  async run(cmdInfo, msg, guildDb) {
    // by default, route to subcommands
    return await this.runSub(cmdInfo, msg, guildDb)
  } 
}

module.exports = BaseCommand