const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class TeamsCommand extends BaseCommand {
  async add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let args = cmdInfo.arguments
    let team = await guildDb.addTeam(args[0], args[1], args.slice(2).join(" "))
  }
  
  async show(cmdInfo, msg, guildDb) {
    await this._requireScope(GuildDb.SCOPES.EVERYONE, msg, guildDb)
    
    let roster = await guildDb.getTeamRoster(cmdInfo.arguments[0])
    
    let output = "```md\n"
    output += `${roster.division.name} Division [ ${roster.team.shortname} ][ ${roster.team.name} ]\n\n`
    output += `  ${roster.players.length} members\n`
    output += `  ${roster.avg_current_sr} average SR\n`
    output += "```"
    msg.channel.send(output)
  }
  
  async refreshsr(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    await guildDb.refreshAllPlayersSr()
  }
  
  // async addplayer(cmdInfo, msg, guildDb) {
  //   let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  // }
}

module.exports = TeamsCommand