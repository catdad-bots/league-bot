const cuid = require('cuid')
const request = require('request-promise')
const BaseDb = require('./base_db')

/**
 * Guild DB is simple flat storage. It's not super efficient, but the size of data required for an entire league 
 * should be extremely reasonable, so we shouldn't be too concerned about the inefficiency of iterating full "tables"
 * instead of being able to join data in a RDBMS.
 *
 * If scaling ever becomes an issue, we can easily implement an access wrapper over a relational database and import
 * our existing data.
 */
class GuildDb extends BaseDb {
  
  static get SCOPES() {
    return {"ADMIN": "ADMIN", "MANAGEMENT":"MANAGEMENT", "REP": "REP", "EVERYONE": "EVERYONE"}
  }
  
  static get SCOPE_HIERARCHY() {
    return [GuildDb.SCOPES.ADMIN, GuildDb.SCOPES.MANAGEMENT, GuildDb.SCOPES.REP, GuildDb.SCOPES.EVERYONE]
  }
  
  setDefaultState() {
    this.state = {
      "divisions": [],
      "scores": [],
      "teams": [],
      "players": [],
      "roster_requests": [],
      "scopes": {"admin":[], "management": [], "rep": [], "everyone": []}
      // todo: delete_requests table?
    }
  }
  
  async addScope(scope, roles) {
    if (!(scope in GuildDb.SCOPES)) return Promise.reject(`Unknown scope: ${scope}`) // TODO: extract error
    let scope_lower = scope.toLowerCase()
    
    if (!Array.isArray(roles)) roles = [roles]
    
    // TODO: check for duplicate assignments?
    for (let role of roles) {
      this.state.scopes[scope_lower].push({role_id: role.id, guild_id: role.guild.id})
    }
    this.touch()
  }
  
  async getScope(scope) {
    if (!(scope in GuildDb.SCOPES)) return Promise.reject(`Unknown scope: ${scope}`) // TODO: extract error
    let scope_lower = scope.toLowerCase()
    return this.state.scopes[scope_lower]
  }
  
  async findScopeByRoles(roles) {
    let scope_found = null;
    for (let s = 0; s < GuildDb.SCOPE_HIERARCHY.length; s++) {
      let scopename = GuildDb.SCOPE_HIERARCHY[s]
      for (let role of this.state.scopes[scopename.toLowerCase()]) {
        let urole = roles.get(role.role_id)
        if (urole && (urole.guild.id == role.guild_id)) {
          scope_found = s
          break
        }
      }
      if (scope_found != null) break
    }
    
    if (scope_found == null) return []
    return GuildDb.SCOPE_HIERARCHY.slice(scope_found)
  }
  
  async getMinimumScope(scope) {
    if (!(scope in GuildDb.SCOPES)) return Promise.reject(`Unknown scope: ${scope}`) // TODO: extract error
    
    let all_roles = []
    for (let s of GuildDb.SCOPE_HIERARCHY) {
      all_roles = all_roles.concat(this.state.scopes[s.toLowerCase()])
      if (s == scope) return all_roles
    }
    return all_roles
  }
  
  async addDivision(div_name, sr_min, sr_max) {
    try {
      await this.getDivision(div_name, 'name')
      return Promise.reject('A Division with that name already exists')
    } catch (e) {

      let rec = {
        id: cuid(),
        name: div_name,
        min_sr: sr_min,
        max_sr: sr_max,
        active: true,
        created_at: +new Date
      }
      this.state.divisions.push(rec)
      this.touch()
      return rec
    }
  }
  
  async deleteDivision(div_name) {
    let div;
    for (let division of this.state.divisions) {
      if (division.name == div_name) {
        div = division
        
      }
    }
  }
  
  async getDivision(search, by='name') {
    for (let div of this.state.divisions) {
      if (div[by] == search) return div
    }
    return Promise.reject("no matching division")
  }
  
  async addTeam(division, shortname, name) {
    let div = await this.getDivision(division)
    
    try {
      await this.getTeam(shortname)
      return Promise.reject(`A team with the short name ${shortname} already exists`)
    } catch (e) {
      let rec = {
        id: cuid(),
        shortname: shortname,
        name: name,
        division_id: div.id,
        active: true,
        created_at: +new Date
      }
      this.state.teams.push(rec)
      this.touch()
      return rec
    }
  }
  
  async deactivateTeam(shortname) {
    let data = await this.getTeamData(shortname)
    data.team.active = false
    data.team.deactivated_at = +new Date
    for (let player of data.players) {
      if (player.active) {
        player.active = false
        player.deactivated_at = data.team.deactivated_at
      }
    }
    // TODO: a way to move players to free agent or something? 
    // TODO: clear match scores?
    
    this.touch()
    return data
  }
  
  async getTeam(search, by='shortname') {
    for (let team of this.state.teams) {
      if (team[by] == search && team.active) return team
    }
    return Promise.reject("no matching team")
  }
  
  
  async getTeams(search, by='division_id') {
    return this.state.teams.filter(t => t[by] == search && t.active)  
  }
  
  async getTeamData(search, by='shortname') {
    let team = await this.getTeam(search, by)
    let division = await this.getDivision(team.division_id, 'id')
    let players = this.state.players.filter(p => p.team_id = team.id)
    return {team, division, players}
  }
  
  async _addPlayer(addTo, team_shortname, playername, role, playerdiscord, playerbtag, playerregion='na', playerplatform='pc') {
    let sanitized_btag = playerbtag.replace('#', '-')
    let team = await this.getTeam(team_shortname)
    let rec = {
      id: cuid(),
      role: role,
      team_id: team.id,
      name: playername,
      discord: playerdiscord,
      btag: playerbtag,
      region: playerregion,
      platform: playerplatform,
      current_sr: 0,
      highest_sr: 0,
      active: true,
      created_at: +new Date
    }
    
    await this.refreshPlayerSr(rec)
    
    addTo.push(rec)
    this.touch()
    return rec
  }
  
  async deactivatePlayer(name, by='name') {
    
  }
  
  async addPlayer(...args) {
    args.unshift(this.state.players)
    return this._addPlayer.apply(this, args)
  }
  
  async addRosterRequest(...args) {
    args.unshift(this.state.roster_requests)
    let req = await this._addPlayer.apply(this, args)
    req.status = 'pending'
    return req
  }
  
  async getRosterRequest(request_id) {
    for (let request of this.state.roster_requests) {
      if (request.id == request_id) {
        return request
      }
    }
    return Promise.reject("no matching request " + request_id)
  }
  
  async approveRosterRequest(request_id) {
    let req = await this.getRosterRequest(request_id)
    this.state.players.push(req)
    req.status = 'approved'
    this.touch()
    return req
  }
  
  async rejectRosterRequest(request_id) {
    let req = await this.getRosterRequest(request_id)
    req.status = 'rejected'
    this.touch()
    return req
  }
  
  async getRosterRequests(status=null, team_shortname=null) {
    let list = this.state.roster_requests
    if (team_shortname) {
      let team = await this.getTeam(team_shortname)
      list = list.filter(r => r.team_id == team.id)
    }

    if (status) {
      list = list.filter(r => r.status == status)
    }
    
    let tlist = {}
    for (let t of this.state.teams) {
      tlist[t.id] = t
    }
    return list.map(r => {
      return {team: tlist[r.team_id], request: r}
    })
  }
  
  async refreshPlayerSr(player) {
    let sanitized_btag = player.btag.replace('#', '-')
    let owdata = await request.get(`https://ow-api.com/v1/stats/${player.platform}/${player.region}/${sanitized_btag}/profile`)
    console.log(owdata)
    let sr = parseInt(JSON.parse(owdata).rating)
    if (sr >  player.highest_sr) {
      player.highest_sr = sr
    }
    player.current_sr = sr
    this.touch()
    return player
  }
  
  async refreshAllPlayersSr() {
    for (let player of this.state.players) {
      await this.refreshPlayerSr(player)
    }
  }
  
  _clampValue(min, max, value) {
    return Math.min(max, Math.max(min, value))
  }
  
  async getTeamRoster(team, use_division_caps=true) {
    let roster = await this.getTeamData(team)
    roster.avg_highest_sr = 0
    roster.avg_current_sr = 0
    
    // roster only displays active players
    roster.players = roster.players.filter(r => r.active)
    
    roster.players.forEach(player => {
      roster.avg_highest_sr += use_division_caps ? this._clampValue(roster.division.min_sr, roster.division.max_sr, player.highest_sr) : player.highest_sr
      roster.avg_current_sr += use_division_caps ? this._clampValue(roster.division.min_sr, roster.division.max_sr, player.current_sr) : player.current_sr
    })
    
    if (roster.players.length > 0) {
      roster.avg_highest_sr /= roster.players.length
      roster.avg_current_sr /= roster.players.length
    }
    
    return roster
  }
  
  // TODO: refactor to look up actual teams instead of just using strings
  async addScore(team_a, team_b, scores) {
    let team_a_rec = await this.getTeam(team_a)
    let team_b_rec = await this.getTeam(team_b)
    
    let scoreparts = scores.split('-').map(a => parseInt(a))
    if (scoreparts.length == 2) scoreparts.push(0)
    
    let [score_a, score_b, draws] = scoreparts
    
    let rec = {
      id: cuid(),
      team_a: team_a_rec.id,
      team_b: team_b_rec.id,
      score_a: score_a,
      score_b: score_b,
      draws: draws,
      winner: (score_a > score_b) ? 'a' : 'b'
    }
    
    this.state.scores.push(rec)
    this.touch()
    return rec
  }
  
  async deleteScore(id) {
    let filt = this.state.scores.filter(s => s.id == id)
    if (filt.length == 0) return Promise.reject('Unknown record')
  
    let idx = this.state.scores.indexOf(filt[0])
    this.state.scores.splice(idx, 1)
    this.touch()
    return filt[0]
  }
  
  async getScores() {
    return this.state.scores
  }
  
  
  _handleStanding(teams, side, team, score) {
    let opposition = (side == 'a') ? 'b' : 'a'
    
    if (!teams[score[`team_${side}`]]) {
      teams[score[`team_${side}`]] = {team: team.shortname, w: 0, l: 0, map_w:0, map_l: 0, map_d: 0, diff: 0} 
    }
    
    let rec = teams[score[`team_${side}`]]
    rec.map_w += score[`score_${side}`]
    rec.map_l += score[`score_${opposition}`]
    rec.map_d += score.draws
    if (score.winner == side) {
      rec.w++
    } else {
      rec.l++
    }
    rec.diff = rec.map_w - rec.map_l
    return rec
  }
  
  async getStandings() {
    let scores = this.state.scores
    
    let divisions = {}

    for (let score of scores) {
      let a = await this.getTeam(score.team_a, 'id')
      let b = await this.getTeam(score.team_b, 'id')
      let div = await this.getDivision(a.division_id, 'id')
      if (!divisions[div.name]) divisions[div.name] = {division: div, team_data: {}}
      this._handleStanding(divisions[div.name].team_data, 'a', a, score)
      this._handleStanding(divisions[div.name].team_data, 'b', b, score)
    }
    
    let output = []

    for (let div in divisions) {
      let standings_arr = Object.values(divisions[div].team_data)

      standings_arr.sort((a, b) => {
        let d = b.w - a.w
        if (d !== 0) return d

        let d2 = b.diff - a.diff
        if (d2 !== 0) return d2

        return 0
      })
      
      output.push({division: divisions[div].division, standings: standings_arr})
    }
    return output
  }
}
  


module.exports = GuildDb