const y = require('yaml')
const { ARoot } = require('@noodl/core')

class DocRoot extends ARoot {
  value = new Map();

  [Symbol.iterator]() {
    const entries = [...this.value.entries()].reverse()
    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length
          },
        }
      },
    }
  }

  constructor() {
    super()
  }

  /**
   * @param { string } key
   * @returns The retrieved value
   */
  get(key) {
    return this.value.get(key)
  }

  /**
   * @param { string } key
   * @param { any } value
   */
  set(key, value) {
    this.value.set(key, value)
    return this
  }

  toJSON() {
    return [...this].reduce((acc, [name, doc]) => {
      acc[name] = doc.toJSON()
      return acc
    }, {})
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }
}

module.exports = DocRoot
