class GatsbyPluginNoodlCache {
  /**
   * @param { import('gatsby').GatsbyCache } gatsbyCache
   */
  constructor(gatsbyCache) {
    /**
     * @private
     * */
    this._cache = gatsbyCache
    /** @private */
    // prettier-ignore
    // Simple hash used for validating cached pages
    this._hash = (str= '') => str.split('').map((s) => s.charCodeAt(0)).join('')
    /** @private */
    this._name = this._cache.name
  }

  /**
   * @param { string } key
   */
  get(key = '') {
    return this._cache.get(this._hash(key))
  }

  /**
   * @param { string } key
   * @param { any } value
   */
  async set(key, value) {
    await this._cache.set(this._hash(key), value)
  }

  /**
   * @param { string } key
   */
  async remove(key = '') {
    await this._cache.del(this._hash(key))
  }

  directory() {
    return this._cache.directory
  }
}

module.exports = GatsbyPluginNoodlCache
