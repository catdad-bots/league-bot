function wrapcode(str, format='css') {
  return "```" + format + "\n" + str + "\n```"
}


module.exports = {
  "commands.RosterCommand.request": wrapcode(`
[ !roster request <team_shortcode> <player> <role> <discord_handle> <btag> ]

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
`)
  
}