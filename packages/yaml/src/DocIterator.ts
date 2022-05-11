import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { AIterator, is, ARoot } from '@noodl/core'

export function isNode(value) {
  return y.isNode(value) || y.isDocument(value) || y.isPair(value)
}

class DocIterator extends AIterator {
  /**
   * @param { ARoot | Record<string, string | y.Document.Parsed | y.Node> } data
   * @returns { Iterator<[name: string, document: y.Document.Parsed]>}
   */
  getIterator(data) {
    if (is.root(data)) return data[Symbol.iterator]

    const items = Object.entries(data)
      .map(([name, value]) => [
        name,
        u.isStr(value) ? y.parseDocument(value) : value,
      ])
      .reverse()

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
}

export default DocIterator
