const BaseCommand = require('./base_command')

/**
 * Command for manipulating scorebot internals. Currently includes data persistence and clearing behavior
 */

class ScorebotCommand extends BaseCommand { 
 
  async persist(cmdInfo, msg, guildDb) {
    await this._requireAdministrator(msg)
    return await guildDb.persist()
  }
  
  async clear(cmdInfo, msg, guildDb) {
    await this._requireAdministrator(msg)
    if (cmdInfo.arguments.length > 0) return await guildDb.clear(cmdInfo.arguments[0])
    return await guildDb.clear()
  }
  
  async show(cmdInfo, msg, guildDb) {
    await this._requireAdministrator(msg)
    let output = ''
    if (cmdInfo.arguments[0]) {
      return msg.channel.send(this._outputJSON(guildDb.state[cmdInfo.arguments[0]]))
    } else {
      return msg.channel.send(this._outputJSON(guildDb.state))    
    }
  }
  
  async link(cmdInfo, msg, guildDb) {
    // TODO: 
    // - confirm that the user has admin capability in both servers
    // - confirm Bot is in both servers
    // - confirm there's not already a link (require deletion first to add a new link?)
    // - create bi-directional link in both guild DBs and force persistence on both
  }
}

module.exports = ScorebotCommand