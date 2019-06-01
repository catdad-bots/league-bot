const mustache = require('mustache')
const fs = require('fs')

let overrides = {
  help: {
    "commands.LeaguebotCommand.configure": () => {
      return [ 
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
  },
  output: {}
}


function render (type, string, ...args) {
  let output;
  let hs = overrides[type][string]
  if (hs) { 
    output = overrides[type][string](...args)
  } else {
    try {
      output = mustache.render(fs.readFileSync(`./templates/${type}/${string}.mst`, 'utf-8'), ...args)
    } catch (e) {
      return "No helpfile found"
    }
  }
  if (typeof output == 'sting') {
    output = output.split('<hr />')
  }
  return output
}

module.exports = {
  renderHelp: (help_string, view) => {
    return render('help', help_string, view)
  },
  renderOutput: (string, view) => {
    return render('output', string, view)
  }
}