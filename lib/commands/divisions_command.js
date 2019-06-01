const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')
const LeagueBotDb = require('../db/leaguebot_db')

class DivisionsCommand extends BaseCommand {
  async add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let [div_name, sr_min, sr_max] = cmdInfo.arguments
    return await guildDb.addDivision(div_name, parseInt(sr_min), parseInt(sr_max))
  }
  
  async delete(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    return await guildDb.deleteDivision(cmdInfo.arguments[0])
  }
  
  async show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.EVERYONE, cmdInfo)
  
    // IDs are only shown when we've got permission AND this is the Admin server (we don't want to leak to the player server)
    let show_ids = await this.hasScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo) && await this.leaguebotDb.isLinkType(msg.guild, LeagueBotDb.LINK_TYPES.ADMIN)
    
    let division = await guildDb.getDivision(cmdInfo.arguments[0])
    let teams = await guildDb.getTeams(division.id, 'division_id')
    
    let output = "```md\n"
    output += `${division.name} Division ${show_ids ? division.id: ''}\n\n`
    
    for (let team of teams) {
      output += `  ${team.shortname}  ${team.name}  ${show_ids ? team.id : ''}\n`
    }
    output += "```"
    msg.channel.send(output)
  }
}

module.exports = DivisionsCommand