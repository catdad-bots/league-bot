function wrapcode(str, format='css') {
  return "```" + format + "\n" + str + "\n```"
}

let help_strings = {
   "error": (msg, err) => {
    return `
There was an error in the command you sent to LeagueBot in ${msg.guild.name} : 

${err}
`
  },
  "commands.LeaguebotCommand.help": wrapcode(`
hi
`),
  "commands.RostersCommand.request": wrapcode(`
[ !rosters request <team_shortcode> <player> <role> <discord_handle> <btag> ]

  Sends a request to staff to pick up a player.

  Takes 5 arguments:
    - Team shortcode
    - Player nickname
    - Player role (Support, DPS, Tank, Flex)
    - Player discord handle
    - Player battletag, with exact capitalization

  Example:
    !roster request 7S someguy Support someguys_discord#5555 SomeGuyBtag#11111
`),
  "commands.ScorereportCommand.add": wrapcode(`
[ !scorereport add <team_a_shortcode> <win>-<lose>-<draw> <team_b_shortcode> ]

  Adds a match score to the record.

  Takes 3 arguments:
    - A team's shortcode ("team A")
    - A dash-separated series of map scores in the order of: team A's wins, team B's wins, draws
    - A team's shortcode ("team B")

  Example:
    !scorereport add AA 3-0-1 BB
`),
  "commands.LeaguebotCommand.configure": [ 
`
Welcome to LeagueBot! Leaguebot will let you administer your Overwatch league all from the comfort of your Discord server. This command will guide you through setting up LeagueBot so you can play more and manage spreadsheets less.
`,
{files: ['https://cdn.glitch.com/d14e11f6-6722-4efb-a351-9ac9c8b13549%2Fleaguebot-linkings.png']}, 
`
LeagueBot assumes you have two servers, an "admin" server and a "player" server. If you run your league out of a single discord server, just run all the commands in your one server and you should be set!

First, ensure that LeagueBot has been added to BOTH servers. Use <${process.env.SHORT_BOT_ADD_URL}> to add LeagueBot to your server. Only server administrators are able to configure LeagueBot

In your **ADMIN** server, type: 
\`\`\`js
!leaguebot link admin
\`\`\`

This will return a link ID, like \`cjw9cr6hs0003kirwbj5u1hfa\`. Go to your **PLAYER** server and use the ID to confirm the link:
\`\`\`js
!leaguebot link cjw9cr6hs0003kirwbj5u1hfa
\`\`\`
`,
{files: ['https://cdn.glitch.com/d14e11f6-6722-4efb-a351-9ac9c8b13549%2Fleaguebot-scopes.png']},
`
Next you'll need to configure role connections. There are 4 main Scopes within LeagueBot: Admin, Management, Team Rep, and Everyone, which are used to control who can run which commands. Multiple Discord roles can be assigned to each of the LeagueBot Scopes

All Scope commands can accept multiple roles, separated by commas.

The Admin Scope indicates users who can run all LeagueBot commands, including those to change the bot's configuration or directly manipulate the league's database. By default, any administrator in your Discord server automatically can act as a LeagueBot Admin, so setting up  the Admin Scope is optional.

Configure this if you want to specify that other non-administrator users can control LeagueBot's configuration or manage its internal data.
\`\`\`
!leaugebot adminscope @BotLeaders, @Cool People Team
\`\`\`

The Management Scope indicates users who can do things like add scores to the database, create team records, and update rosters.
\`\`\`
!leaguebot managementscope @Staff, Role That Does Not Allow Direct Mentions
\`\`\`

The Team Rep Scope indicates users who are captains / representatives for their teams and are able to do things such as request roster transactions
\`\`\`
!leaguebot repscope @Team Reps
\`\`\`

The Everyone Scope indicates which roles (if any in specific are required) can interact with the basic commands of LeagueBot, such as viewing standings and team rosters. By default, no role is required, as every player in your server will be able to run the basic commands. 

Only set this if you want to require some basic role before server members can run commands. For example, if your player server already locks down channel access until users receive a role for accepting server rules, you would set the Everyone Scope in LeagueBot to point at the "rules accepted" role that you use to unlock channels.
\`\`\`
!leaguebot everyonescope @Players
\`\`\`
`]
}


module.exports = (help_string, ...args) =>{
  let hs = help_strings[help_string]
  
  if (!hs) return `Unknown Helpstring requested: ${help_string}`
    
  if (typeof hs != "function") return hs
  return hs.apply(hs, args)
}