import { nkey } from './constants'

let key = 0

class NoodlBase {
  #children: NoodlBase[] = []
  #parent: NoodlBase | null = null
  __key: number

  static is(value: any): value is NoodlBase {
    return !!value && value instanceof NoodlBase
  }

  constructor(parent?: NoodlBase) {
    this.__key = key++
    if (parent) this.setParent(parent)

    Object.defineProperties(this, {
      __key: {
        configurable: false,
        writable: false,
        enumerable: false,
        value: this.__key,
      },
      __ntype: {
        configurable: true,
        writable: false,
        enumerable: false,
        value: nkey.base,
      },
    })
  }

  setParent(parent: NoodlBase | null) {
    this.#parent = parent
    return this
  }

  get parent() {
    return this.#parent || null
  }

  get length() {
    return this.#children.length
  }

  append(node) {
    this.#children.push(node)
    return this
  }

  prepend(node) {
    this.#children.unshift(node)
    return this
  }

  removeChild(indexOrNode) {
    if (typeof indexOrNode === 'number') {
      if (this.length > indexOrNode) {
        this.#children.splice(indexOrNode, 1)
      }
    } else if (NoodlBase.is(indexOrNode)) {
      const index = this.#children.indexOf(indexOrNode)
      if (index > -1) this.#children.splice(index, 1)
    }
    return this
  }
}

export default NoodlBase
