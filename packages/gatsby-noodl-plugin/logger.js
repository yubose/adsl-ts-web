/**
 * @typedef GatsbyNoodlPluginLogLevel
 * @type { 'error' | 'info' | 'warn' | 'verbose' }
 */

const log = console.log

const _LEVELS_ = ['error', 'info', 'warn', 'verbose']
const _LOGLEVEL_ = {}

class GatsbyNoodlPluginLogger {
  #levels = [..._LEVELS_]
  #level = 'info'

  /**
   * @param { GatsbyNoodlPluginLogLevel } [level]
   */
  constructor(level) {
    if (level && _LEVELS_.includes(level) && level !== 'info') {
      this.level = level
    }
  }

  get level() {
    return this.#level
  }

  set level(level) {
    const index = _LEVELS_.indexOf(level)
    if (index > -1 && level !== this.level) {
      const currIndex = this.#levels.length ? this.#levels.length - 1 : 0
      if (currIndex < index) {
        for (const value of _LEVELS_.slice(index)) {
          this.#levels.push(value)
        }
      } else {
        while (this.#levels.length - 1 > index) {}
      }
    }
  }

  log(message) {}
}

module.exports = GatsbyNoodlPluginLogger
