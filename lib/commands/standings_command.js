const BaseCommand = require('./base_command')
const GuildDb = require('../db/guild_db')

class StandingsCommand extends BaseCommand {
  async handler_default(cmdInfo, msg, guildDb) {
    await this.requireScope(GuildDb.SCOPES.EVERYONE, cmdInfo)
    
    let division_standings =  await guildDb.getStandings()
    this.showOutput('default', cmdInfo, msg, {division_standings})
  }
}

module.exports = StandingsCommand