const y = require('yaml')
const u = require('@jsmanifest/utils')
const { AIterator } = require('@noodl/core')

function isNode(value) {
  return y.isNode(value) || y.isDocument(value) || y.isPair(value)
}

class DocIterator extends AIterator {
  /**
   *
   * @param { [name: string, doc: y.Document.Parsed][] } data
   * @returns
   */
  getIterator(data) {
    const items = data.reverse()
    return {
      next() {
        return {
          get value() {
            return items.pop()
          },
          done: !items.length,
        }
      },
    }
  }

  getItems(data) {
    return Object.entries(data).map(([name, value]) => [
      name,
      u.isStr(value) ? y.parseDocument(value) : value,
    ])
  }
}

module.exports = DocIterator
exports.isNode = isNode
