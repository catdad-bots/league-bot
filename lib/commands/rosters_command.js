const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class RostersCommand extends BaseCommand {
 
  async add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    if (this._needHelp(cmdInfo)) return this._showHelp('add', cmdInfo, msg)
 
    let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  }
  
  async delete(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    // TODO: implement
  }
  
  // self-service requests for a player to be added
  async request(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.REP, cmdInfo)
    if (this._needHelp(cmdInfo)) return this._showHelp('request', cmdInfo, msg)
 
    await guildDb.addRosterRequest.apply(guildDb, cmdInfo.arguments)
  }
  
  async approve(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    await guildDb.approveRosterRequest(cmdInfo.arguments[0])
  }
  
  async reject(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    await guildDb.rejectRosterRequest(cmdInfo.arguments[0])
  }
  
  async simulate(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.REP, cmdInfo)
    
    let roster = await guildDb.getTeamRoster(cmdInfo.arguments[0])
    let pending = await guildDb.getRosterRequests('pending', roster.team.shortname)
    
    let requestfilter = cmdInfo.arguments.slice(1)
    let team_current_sr = 0
    let team_highest_sr = 0
    for (let member of roster.players) {
      team_current_sr += member.current_sr
      team_highest_sr += member.highest_sr
    }
    let pre_current_avg = team_current_sr / roster.players.length
    let pre_highest_avg = team_highest_sr / roster.players.length

    if (requestfilter.length > 0) {
      pending = pending.filter(p => {
        return requestfilter.indexOf(p.request.id) > -1
      })
    }
    
    for (let p of pending) {
      team_current_sr += p.request.current_sr
      team_highest_sr += p.request.highest_sr
    }
    
    let post_current_avg = team_current_sr / (roster.players.length + pending.length)
    let post_highest_avg = team_highest_sr / (roster.players.length + pending.length)
    
    let output = "```js\n"
      + "Team:\n"
      + `  Avg. Current SR: ${parseInt(pre_current_avg)}\n`
      + `  Avg. Highest SR: ${parseInt(pre_highest_avg)}\n\n`
      + "With new players:\n"
      + `  Avg. Current SR: ${parseInt(post_current_avg)}\n`
      + `  Avg. Highest SR: ${parseInt(post_highest_avg)}\n\n`
      + "```"
    
    msg.channel.send(output)
  }
  
  async pending(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.REP, cmdInfo)
    
    let requests = await guildDb.getRosterRequests('pending', cmdInfo.arguments.length > 0 ? cmdInfo.arguments[0]: null)
    let output = "```js\n"
    for (let req of requests) {
      output += `${req.team.shortname.padEnd(5, " ")}  ${req.request.role.padEnd(7, " ")}  ${req.request.name.padEnd(16, " ")}  ${req.request.btag.padEnd(20, " ")}  ${req.request.current_sr}  ${req.request.id}\n`
    }
    output += "```"
    msg.channel.send(output)
  }
  
  async show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.EVERYONE, cmdInfo)
    
    let roster = await guildDb.getTeamRoster(cmdInfo.arguments[0])
    
    if (roster.players.length == 0) return msg.channel.send("Team has no players yet")
    roster.players.sort((a, b) => b.role.localeCompare(a.role))
    let output = "```js\n"
    for (let member of roster.players) {
      output += `${member.role.padEnd(7, " ")}  ${member.name.padEnd(16, " ")}  ${member.btag.padEnd(20, " ")}  ${member.current_sr} \n`
    }
    output += "\n"
    output += `Avg. Current SR: ${parseInt(roster.avg_current_sr)}\n`
    output += `Avg. Highest SR: ${parseInt(roster.avg_highest_sr)}`
    output += "```"
    
    
    msg.channel.send(output)
  }
}

module.exports = RostersCommand