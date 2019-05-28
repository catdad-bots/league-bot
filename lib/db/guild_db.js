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
  
  setDefaultState() {
    this.state = {
      "scores": [],
      "teams": [],
      "players": [],
      "roster_requests": [],
    }
  }

  async addTeam(division, shortname, name) {
    let rec = {
      id: cuid(),
      shortname: shortname,
      name: name,
      division: division
    }
    this.state.teams.push(rec)
    this.touch()
    return rec
  }
  
  async getTeam(shortname) {
    for (let team of this.state.teams) {
      if (team.shortname == shortname) return team
    }
    return Promise.reject("no matching team")
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
      highest_sr: 0
    }
    
    await this.refreshPlayerSr(rec)

    addTo.push(rec)
    this.touch()
    return rec
  }
  
  async addPlayer(...args) {
    args.unshift(this.state.players)
    return this._addPlayer.apply(this, args)
  }
  
  async addRosterRequest(...args) {
    args.unshift(this.state.roster_requests)
    let req = await this._addPlayer.apply(this, args)
    req.status = 'pending'
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
  
  async getTeamRoster(team, calculate=true) {
    let roster = {avg_highest_sr: 0, avg_current_sr: 0, members: []}
    for (let player of this.state.players) {
      if (player.team_id == team.id) {
        roster.members.push(player)
        if (calculate) {
          roster.avg_highest_sr += player.highest_sr
          roster.avg_current_sr += player.current_sr
        }
      }
    }
    if (roster.members.length > 0 && calculate) {
      roster.avg_highest_sr /= roster.members.length
      roster.avg_current_sr /= roster.members.length
    }
    return roster
  }
  
  async addScore(team_a, team_b, scores) {
    let scoreparts = scores.split('-').map(a => parseInt(a))
    if (scoreparts.length == 2) scoreparts.push(0)
    
    let [score_a, score_b, draws] = scoreparts
    
    let rec = {
      id: cuid(),
      team_a: team_a,
      team_b: team_b,
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
    return Promise.resolve(this.state.scores)
  }
  
  
  _handleStanding(teams, side, score) {
    let opposition = (side == 'a') ? 'b' : 'a'
    
    if (!teams[score[`team_${side}`]]) {
      teams[score[`team_${side}`]] = {team: score[`team_${side}`], w: 0, l: 0, map_w:0, map_l: 0, map_d: 0, diff: 0} 
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
    let scores = await this.getScores()
    let team_data = {}

    for (let score of scores) {

      this._handleStanding(team_data, 'a', score)
      this._handleStanding(team_data, 'b', score)
    }

    let standings_arr = Object.values(team_data)

    standings_arr.sort((a, b) => {
      let d = b.w - a.w
      if (d !== 0) return d

      let d2 = b.diff - a.diff
      if (d2 !== 0) return d2

      return 0
    })

    return standings_arr
  }
}
  


module.exports = GuildDb