const cuid = require('cuid')
const BaseDb = require('./base_db')
const GuildDb = require('./guild_db')
const LRU = require('lru-cache')

/**
 * Central data store for leaguebot in general. Used mostly to maintain link information
 * between Admin/Player servers so they can share guildDbs.
 */
class LeagueBotDb extends BaseDb {
  
  constructor(id, s3) {
    super(id, s3)
    this._lru = new LRU({
      max: 50,
      length: (n, key) => 1,
      dispose: n => n.persist()
    })
  }
  
  static get LINK_FLAGS() {
    return {ADMIN: 'ADMIN', PLAYER: 'PLAYER'}
  }
  

  setDefaultState() {
    this.state = {
      "pending_links": {},
      "links": {}
    }
  }
  
  async requestLink(guild, type) {
    if (!(type in LeagueBotDb.LINK_FLAGS)) return Promise.reject(`Unknown link type ${guild.id}`)
    if (this.state.links[guild.id]) return Promise.reject(`A link already exists for ${guild.id}. Use \`!leaguebot unlink\` to destroy the existing link`)
    
    let link_id = cuid()
    this.state.pending_links[link_id] = {
      id: link_id,
      guild_id: guild.id,
      type: type
    }
    this.touch()
    return link_id
  }
  
  async acceptLink(guild, link_id) {  
    let link_request = this.state.pending_links[link_id]
    if (!link_request) return Promise.reject(`No link matching ${link_id}`)
    
    console.log('linking', link_request.guild_id, guild.id, 'type is', link_request.type)
    let admin = link_request.type == LeagueBotDb.LINK_FLAGS.ADMIN ? link_request.guild_id : guild.id
    let player = link_request.type == LeagueBotDb.LINK_FLAGS.PLAYER ? link_request.guild_id : guild.id
    let link = {admin, player}
    this.state.links[guild.id] = link
    this.state.links[link_request.guild_id] = link
    delete this.state.pending_links[link_id]
    
    await this.persist()
  }

  async isLinkType(guild, type) {
    if (!(type in LeagueBotDb.LINK_FLAGS)) return Promise.reject(`Unknown link type ${guild.id}`)
    let link = this.state.links[guild.id]
    if (!link) return Promise.reject("Guild is not linked yet! Follow the instructions in `!leaguebot configure` to set up LeagueBot")
    
    if (link[type.toLowerCase()] == guild.id) return true
    return false
  }
  
  async fetchSharedGuildDb(guild) {
    let link = this.state.links[guild.id]
    if (!link) return Promise.reject("Guild is not linked yet! Follow the instructions in `!leaguebot configure` to set up LeagueBot")
    
    let db = new GuildDb(`${link.admin}-${link.player}`, this._store)
    await db.init()
    return db
  }
}
  


module.exports = LeagueBotDb