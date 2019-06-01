const cuid = require('cuid')

/**
 * In-memory DB representing league data. Data is periodically persisted to S3, and upon initialization, 
 * the DB is restored from S3 (if it exists).
 *
 * Any methods that make changes to the `state` should call Db.touch() which updates an internal state id.
 * When Db.persist() is called, persistence to S3 will only happen if changes have been made (as detected 
 * by comparing the state id with a sync id).
 */
class BaseDb {
  // the meaning of `id` depends on the implementation. For GuildDb, it's the Guild's global discord server ID
  constructor (id, s3) {
    this.s3Prefix = process.env.S3_PREFIX // 'scores-bot'
    this._store = s3
    this.id = id
    this.touch(true)
    this.setDefaultState()
  }
  
  setDefaultState() {
    this.state = {} // Implementors should change this
  }
  
  touch(both = false) {
    this._stateId = cuid()
    if (both) this._syncId = this._stateId
  }
  
  needsSyncing() {
    if (this._stateId == this._syncId) return false
    return true
  }
  
  setState(new_state, full_override=false) {
    if (full_override) {
      this.state = new_state
    }  else {
      Object.assign(this.state, new_state)
    }
  }
  
  async init() {
    return this._store.getObject({
      Key: `${this.s3Prefix}/${this.id}.json`
    })
      .promise()
      .then(response => { this.setState(JSON.parse(response.Body.toString())) })
      .catch(err => { console.log(`No existing DB for ${this.id}`); console.error(err)})
      .then(() => {
        this.touch(true)
        return this
      })
  }
  
  async persist() {
    // skip syncing if no changes have been made
    if (!this.needsSyncing()) {
      console.log(`${this.id} Not syncing; no changes`)
      return false
    }

    await this._store.putObject({
      Key: `${this.s3Prefix}/${this.id}.json`,
      Body: JSON.stringify(this.state)
    }).promise()
    console.log(`${this.id} DB synced!`)
    // reset state and sync so we can detect new changes
    this.touch(true)
    return true
  }
  
  async clear(type) {
    if (type) {
      if (!this.state[type]) {
        return this;
      }
      if (Array.isArray(this.state[type])) {
        this.state[type] = []
      } else {
        this.state[type] = {}
      }
    } else {
      this.setDefaultState()
    }
    this.touch()
    await this.persist()
    return this
  }
}

module.exports = BaseDb