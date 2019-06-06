const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class ScoresCommand extends BaseCommand {

  async handler_add(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    if (this._needHelp(cmdInfo)) return this.showHelp('add', cmdInfo, msg)
 
    let scoreparts = cmdInfo.arguments
    if (scoreparts.length != 3) return msg.reply('Invalid score format. Should be `TEAM_A SCORE_A-SCORE_B TEAM_B`; eg `Upper AA 3-2 BB`')
    
    let score = await guildDb.addScore(scoreparts[0], scoreparts[2], scoreparts[1])
    console.log(guildDb.state.scores)
    msg.channel.send(`Score added: ${score.id}`)
  }
  
  async handler_show(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let scores = await guildDb.getScores()
    msg.reply(JSON.stringify(scores))
  }
  
  async handler_import(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.ADMIN, cmdInfo)
    
    guildDb.state.scores = JSON.parse(cmdInfo.arguments[0])
    return Promise.resolve()
  }
  
  async handler_delete(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.MANAGEMENT, cmdInfo)
    
    let id = cmdInfo.arguments[0]
    let score = await guildDb.deleteScore(id)
    msg.channel.send(`Deleted ${id}; ${score.team_a} ${score.score_a}-${score.score_b}-${score.draws} ${score.team_b}`)
  }
}

module.exports = ScoresCommand