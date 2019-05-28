const BaseCommand = require('./base_command')

class RosterCommand extends BaseCommand {
 
  async add(cmdInfo, msg, guildDb) {
    // TODO: requires permission
    let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  }
  
  async delete(cmdInfo, msg, guildDb) {
    // TODO: implement
  }
  
  // self-service requests for a player to be added
  async request(cmdInfo, msg, guildDb) {
    if (this._needHelp(cmdInfo)) return this._showHelp('request', cmdInfo, msg)
 
    await guildDb.addRosterRequest.apply(guildDb, cmdInfo.arguments)
    // TODO: implement
    // the same as `addPlayer` except it adds to a list of roster requests
  }
  
  async approve(cmdInfo, msg, guildDb) {
    
  }
  
  async reject(cmdInfo, msg, guildDb) {
    
  }
  
  async show(cmdInfo, msg, guildDb) {
    let team = await guildDb.getTeam(cmdInfo.arguments[0])
    let roster = await guildDb.getTeamRoster(team)
    
    if (roster.members.length == 0) return msg.channel.send("Team has no members yet")
    roster.members.sort((a, b) => b.role.localeCompare(a.role))
    let output = "```js\n"
    for (let member of roster.members) {
      output += `${member.role.padEnd(7, " ")}  ${member.name.padEnd(16, " ")}  ${member.btag.padEnd(20, " ")}  ${member.current_sr} \n`
    }
    output += "\n"
    output += `Avg. Current SR: ${parseInt(roster.avg_current_sr)}\n`
    output += `Avg. Highest SR: ${parseInt(roster.avg_highest_sr)}`
    output += "```"
    
    
    msg.channel.send(output)
  }
}

module.exports = RosterCommand