import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import createNode from './utils/createNode'
import is from './utils/is'
import unwrap from './utils/unwrap'
import { nkey } from './constants'

class NoodlProperty<K extends string = string> extends NoodlBase {
  #key: NoodlString | undefined
  #value: undefined | NoodlValue<any>;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      nkey: nkey.property,
      value: this.build(),
    }
  }

  constructor(key?: K, parent?: NoodlBase) {
    super(parent)
    this.setKey(key)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.property,
    })
  }

  setKey(key: string | NoodlString | undefined) {
    if (
      typeof key !== 'string' &&
      typeof key !== 'number' &&
      key !== undefined
    ) {
      throw new Error(
        `Cannot set key of type "${typeof key}". Expect string, number, undefined, or NoodlString`,
      )
    }
    if (is.stringNode(key)) {
      this.#key = key
    } else if (typeof key === 'string' || is.node(key)) {
      this.#key = new NoodlString(key)
    } else {
      this.#key = undefined
    }
    return this
  }

  getKey() {
    return this.#key
  }

  setValue(value: any) {
    this.#value = createNode(value)
    if (this.parent) this.#value?.setParent(this.parent)
    return this
  }

  getValue(asNode = true) {
    if (is.node(this.#value)) {
      if (asNode) return this.#value
      return unwrap(this.#value)
    }
    return asNode ? new NoodlValue(this.#value) : this.#value
  }

  toJSON() {
    return {
      key: unwrap(this.getKey()),
      value: this.getValue(false),
    }
  }

  build() {
    return {
      [unwrap(this.getKey())]: unwrap(this.#value),
    }
  }
}

export default NoodlProperty
