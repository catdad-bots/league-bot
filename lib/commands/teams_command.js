const BaseCommand = require('./base_command')

class TeamsCommand extends BaseCommand {
  
  async add(cmdInfo, msg, guildDb) {
    let args = cmdInfo.arguments
    let team = guildDb.addTeam(args[0], args[1], args.slice(2).join(" "))
    console.log(guildDb.state.teams)
  }
  
  async addplayer(cmdInfo, msg, guildDb) {
    let player = await guildDb.addPlayer.apply(guildDb, cmdInfo.arguments)
  }
}

module.exports = TeamsCommand