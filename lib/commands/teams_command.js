const BaseCommand = require('./base_command')

class TeamsCommand extends BaseCommand {
  async add(cmdInfo, msg, guildDb) {
    let args = cmdInfo.arguments
    let team = await guildDb.addTeam(args[0], args[1], args.slice(2).join(" "))
  }
  
  async show(cmdInfo, msg, guildDb) {
    let team = await guildDb.getTeam(cmdInfo.arguments[0])
    let roster = await guildDb.getTeamRoster(team)
    
    let output = "```md\n"
    output += `${team.division} Division [ ${team.shortname} ][ ${team.name} ]\n\n`
    output += `  ${roster.members.length} members\n`
    output += `  ${roster.avg_current_sr} average SR\n`
    output += "```"
    msg.channel.send(output)
  }
  
  async refreshsr(cmdInfo, msg, guildDb) {
    await guildDb.refreshAllPlayersSr()
  }
  
  // async addplayer(cmdInfo, msg, guildDb) {
  //   let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  // }
}

module.exports = TeamsCommand