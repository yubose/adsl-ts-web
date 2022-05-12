import y from 'yaml'
import { ARoot } from '@noodl/core'
import { trimReference } from '@noodl/core'
import unwrap from './utils/unwrap'

class DocRoot extends ARoot {
  value = new Map();

  [Symbol.iterator](): Iterator<[name: string, doc: y.Node | y.Document]> {
    const entries = [...this.value.entries()].reverse()
    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length as true
          },
        }
      },
    }
  }

  constructor() {
    super()
  }

  /**
   * @param key Root key
   * @returns The retrieved value
   */
  get(key: y.Scalar | string) {
    key = unwrap(key) as string
    if (!this.value.has(key)) {
      // Second attempt is to transition to retrieving deeply
      const datapathStr = trimReference(key)
      const datapath = datapathStr.split('.')
    }

    return this.value.get(key)
  }

  has(key: y.Scalar | string) {
    key = unwrap(key) as string
    return this.value.has(key)
  }

  /**
   * @param key Root key
   * @param value Root value
   */
  set(key: string, value: any) {
    this.value.set(key, value)
    return this
  }

  remove(key: string): this {
    this.value.delete(key)
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

export default DocRoot
