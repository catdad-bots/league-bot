const Discord = require('discord.js');


const commands = {}

function registerCommand(leaguebot_db, path, as) {
  let cmd = new (require(path))(leaguebot_db)
  commands[as] = cmd.run.bind(cmd)
}

module.exports.init = (leaguebot_db) => {
  registerCommand(leaguebot_db, './lib/commands/scorereport_command', 'scorereport')
  registerCommand(leaguebot_db, './lib/commands/rosters_command', 'rosters')
  registerCommand(leaguebot_db, './lib/commands/leaguebot_command', 'leaguebot')
  registerCommand(leaguebot_db, './lib/commands/teams_command', 'teams')
  registerCommand(leaguebot_db, './lib/commands/divisions_command', 'divisions')
}

module.exports.getCommand = (cmd, args) => {
  if (!commands[cmd.slice(1)]) return false
  
  return {command: cmd, handler: commands[cmd.slice(1)], arguments: args}
}

module.exports.parseToCommand = content => {
  let parts = content.split(" ")
  let cmd = parts.shift()
  return module.exports.getCommand(cmd, parts)
} 

module.exports.applyUserScopes = async (cmdInfo, msg, guildDb) => {
  
}

// Some earlier tinkering around auto role setting stuff
// -----------------
// function addRole(member, rolename) {
//   let roles = member.guild.roles.filter(r => r.name == rolename)
//   if (roles.size == 0) {
//     console.error("no role matching", rolename) 
//     return Promise.reject("no role matching " + rolename)
//   } else {
//     return member.addRole(roles.first())
//   }
// }

// function removeRole(member, rolename) {
//   let roles = member.roles.filter(r => r.name == rolename)
//   if (roles.size == 0) {
//     return Promise.reject(`Member has no role matching "${rolename}"`)
//   } else {
//     return member.removeRole(roles.first())
//   }
// }

// module.exports.makecoach = async (cmd, msg, guildDb) => {
//   console.log("making coach!")
//   if (msg.mentions.members.size > 0) {
//      let promises = msg.mentions.members.map(u => addRole(u, 'testrole')) 
//      Promise.all(promises).then(() => {
//        msg.reply("Coach roles added")
//      }).catch(msg.reply.bind(msg))
//   } else {
//      msg.reply("Unknown user", {reply: null})
//   }
// }

// module.exports.removecoach = async (cmd, msg, guildDb) => {
//   if (msg.mentions.members.size > 0) {
//      let promises = msg.mentions.members.map(u => removeRole(u, 'testrole')) 
//      Promise.all(promises).then(() => {
//        msg.reply("Coach roles removed")
//      }).catch(msg.reply.bind(msg))
//   } else {
//      msg.reply("Unknown user", {reply: null})
//   }
// }
// -----------------