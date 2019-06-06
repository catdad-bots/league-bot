const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class TeamsCommand extends BaseCommand {
  async handler_add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let args = cmdInfo.arguments
    let team = await guildDb.addTeam(args[0], args[1], args.slice(2).join(" "))
  }
  
//   async handler_delete(cmdInfo, msg, guildDb) {
//     await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
//     // byeeee team
//     await guildDb.deactivateTeam(cmdInfo.arguments[0])
//   }
  
  async handler_show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.EVERYONE, cmdInfo)
    
    let roster = await guildDb.getTeamRoster(cmdInfo.arguments[0])
    
    this.showOutput('show', cmdInfo, msg, roster)
  }
  
//   async handler_refreshsr(cmdInfo, msg, guildDb) {
//     await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
//     await guildDb.refreshAllPlayersSr()
//   }
  
  // async addplayer(cmdInfo, msg, guildDb) {
  //   let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  // }
}

module.exports = TeamsCommand