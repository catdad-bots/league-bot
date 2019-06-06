const BaseCommand = require('./base_command')
const LeagueBotDb = require('../db/leaguebot_db')
const GuildDb = require('../db/guild_db')

/**
 * Command for manipulating LeagueBot internals. Currently includes data persistence and clearing behavior
 */

class LeaguebotCommand extends BaseCommand { 
  async handler_help(cmdInfo, msg, guildDb) {
    await this.showHelp('help', cmdInfo, msg)
    return await super.handler_help(cmdInfo, msg, guildDb)
  }
  
  
  /**
   * Forces the guildDb to be persisted. There should be a normal persistence
   * schedule, but manually forcing persistence is good when testing changes
   * to the bot
   */
  async handler_persist(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    if (msg.author.id == process.env.SUPERUSER_ID && cmdInfo.arguments.length > 0 && cmdInfo.arguments[0] == 'leaguebot') {
      return await this.leaguebotDb.persist()
    }
    return await guildDb.persist()
  }
  
  /**
   * Forces clearing the guildDb. If a "table" name is supplied, only that
   * table is cleared. This command should be used with EXTREME CAUTION,
   * deleted data is NOT recoverable, and the `db.clear()` action forces
   * persistence.
   */
  async handler_clear(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    
    if (msg.author.id == process.env.SUPERUSER_ID && cmdInfo.arguments.length > 0 && cmdInfo.arguments[0] == 'leaguebot') {
      if (cmdInfo.arguments.length == 1) {
        return await this.leaguebotDb.clear()
      } else {
        return await this.leaguebotDb.clear(cmdInfo.arguments[1])
      }
    }
    if (cmdInfo.arguments.length > 0) return await guildDb.clear(cmdInfo.arguments[0])
    return await guildDb.clear()
  }
  
  /**
   * Dumps the raw JSON contents of the guilbDb. Useful for debugging and 
   * developing new functionality. If a "table" name is supplied, only that 
   * table is displayed.
   */
  async handler_show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    
    let output = ''
    
    if (msg.author.id == process.env.SUPERUSER_ID && cmdInfo.arguments.length > 0 && cmdInfo.arguments[0] == 'leaguebot') {
      return await msg.channel.send(this.outputJSON(this.leaguebotDb.state, msg.channel))   
    }
    
    if (cmdInfo.arguments[0]) {
      return this.outputJSON(guildDb.state[cmdInfo.arguments[0]], msg.channel)
    } else {
      return this.outputJSON(guildDb.state, msg.channel)    
    }
  }
  
  /** 
   * Prints configuration instructions
   */
  async handler_configure(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    return await this.showHelp('configure', cmdInfo, msg)
  }
  
  /**
    * Configuration command to connect Admin server with Player server.
    * Once servers are connected, they will share data 
    */
  async handler_link(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    
    let link_type = cmdInfo.arguments[0].toUpperCase()
    console.log(link_type)
    if (link_type in LeagueBotDb.LINK_TYPES) {
      console.log("requesting link")
      let link_id = await this.leaguebotDb.requestLink(msg.guild, link_type)
      msg.reply(`Server link initiated! Use the command \`!leaguebot link ${link_id}\` in your **player** server to finalize linking`)
    } else {
      console.log("trying to accept link")
      await this.leaguebotDb.acceptLink(msg.guild, cmdInfo.arguments[0])
    }
    
    // TODO: 
    // - confirm there's not already a link (require deletion first to add a new link?)
  }
  
  _lookuproles(cmdInfo, msg) {
    let roles = cmdInfo.arguments.join(" ").split(',')
      .map(e => e.trim())
      .map(e => {
        let match = e.match(/\<\@\&(\d+)\>/)
        if (match && match[1]) return msg.mentions.roles.get(match[1])
        return msg.guild.roles.find(r => r.name.toLowerCase() == e.toLowerCase())
      })
      .filter(e => e)
    
    console.log(roles)
    return roles
  }
  
  async _addscope(cmdInfo, msg, guildDb, scope) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    console.log(cmdInfo.arguments)
    let roles = this._lookuproles(cmdInfo, msg)
    return await guildDb.addScope(scope, roles)
  }
  
  async handler_adminscope(cmdInfo, msg, guildDb) {
    return await this._addscope(cmdInfo, msg, guildDb, GuildDb.SCOPES.ADMIN)
  }
  
  async handler_managementscope(cmdInfo, msg, guildDb) {
    return await this._addscope(cmdInfo, msg, guildDb, GuildDb.SCOPES.MANAGEMENT)
  }
  
  async handler_repscope(cmdInfo, msg, guildDb) {
    return await this._addscope(cmdInfo, msg, guildDb, GuildDb.SCOPES.REP)
  }
  
  async handler_everyonescope(cmdInfo, msg, guildDb) {
    return await this._addscope(cmdInfo, msg, guildDb, GuildDb.SCOPES.EVERYONE)
  }
}

module.exports = LeaguebotCommand