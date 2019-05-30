const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class ScorereportCommand extends BaseCommand {

  async add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    if (this._needHelp(cmdInfo)) return this._showHelp('add', cmdInfo, msg)
 
    let scoreparts = cmdInfo.arguments
    if (scoreparts.length != 3) return msg.reply('Invalid score format. Should be `TEAMA SCOREA-SCOREB TEAMB`; eg `AA 3-2 BB`')
    
    let score = await guildDb.addScore(scoreparts[0], scoreparts[2], scoreparts[1])
    console.log(guildDb.state.scores)
    msg.channel.send(`Score added: ${score.id}`)
  }
  
  async show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let scores = await guildDb.getScores()
    msg.reply(JSON.stringify(scores))
  }
  
  async standings(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.EVERYONE, cmdInfo)
    
    let standings =  await guildDb.getStandings()
    console.log(standings)
    let output = "```css\n" 
      + "Team      W     L     MW-ML-MD  Diff\n"
    for (let rec of standings) {
      output += `${rec.team.padEnd(8, " ")}`
        + `  ${rec.w.toString().padEnd(4, " ")}  ${rec.l.toString().padEnd(4, " ")}`
        + `  ${rec.map_w.toString().padEnd(2, " ")} ${rec.map_l.toString().padEnd(2, " ")} ${rec.map_d.toString().padEnd(2, " ")}`
        + `  [${rec.diff > 0 ? ('+'+rec.diff) : rec.diff}]\n`
    }
    output += "\n```"
    msg.channel.send(output)
  }
  
  async import(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    
    guildDb.state.scores = JSON.parse(cmdInfo.arguments[0])
    return Promise.resolve()
  }
  
  async delete(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let id = cmdInfo.arguments[0]
    let score = await guildDb.deleteScore(id)
    msg.channel.send(`Deleted ${id}; ${score.team_a} ${score.score_a}-${score.score_b}-${score.draws} ${score.team_b}`)
  }
}

module.exports = ScorereportCommand