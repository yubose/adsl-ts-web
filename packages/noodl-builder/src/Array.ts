import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import is from './utils/is'
import unwrap from './utils/unwrap'
import createNode from './utils/createNode'
import { nkey } from './constants'
import type { Path } from './types'
import * as fp from './utils'

class NoodlArray extends NoodlBase {
  #value = [] as any[];

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      nkey: nkey.array,
      value: this.build(),
    }
  }

  [Symbol.iterator](): Iterator<any> {
    const items = [...this.#value].reverse() as any[]
    return {
      next() {
        return {
          value: items.pop(),
          done: !items.length,
        }
      },
    }
  }

  constructor(parent?: NoodlArray['parent']) {
    super()
    if (parent !== undefined) this.setParent(parent)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.array,
    })
  }

  get length() {
    return this.#value.length
  }

  add(value: any) {
    this.#value.push(createNode(value).setParent(this))
    return this
  }

  getValue(
    index: Path[number] | NoodlString | NoodlValue<Path[number]>,
    asNode = true,
  ) {
    const key = this.toKey(index)
    const result = this.#value[key]
    return asNode ? result : unwrap(result)
  }

  setValue(
    index: Path[number] | NoodlString | NoodlValue<Path[number]>,
    value?: any,
  ) {
    const key = this.toKey(index)

    if (key === undefined) {
      throw new Error(`Cannot set property with an undefined index`)
    }

    while (this.#value.length < key) {
      this.#value.push(undefined)
    }

    this.#value[key] = createNode(value).setParent(this)
    return this
  }

  isEmpty() {
    return !this.#value?.length
  }

  remove(index: Path[number]) {
    const key = this.toKey(index)
    const len = this.#value?.length || 0
    if (key <= len) {
      this.#value.splice(key, 1)
    }
    return this
  }

  toKey(value: Path[number] | NoodlString | NoodlValue<Path[number]>) {
    if (typeof value === 'string') return Number(value)
    if (typeof value === 'number') return value
    if (is.node(value)) return Number(unwrap(value))
    return Number(value)
  }

  build() {
    return this.#value.map(unwrap)
  }

  toJSON() {
    return {
      value: this.build(),
    }
  }
}

export default NoodlArray
