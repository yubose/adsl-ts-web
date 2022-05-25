import NoodlValue from './Value'
import is from './utils/is'
import NoodlBase from './Base'
import toString from './utils/toString'
import type { INoodlValue } from './types'
import { nkey } from './constants'

class NoodlString extends NoodlBase implements INoodlValue<string> {
  #value: NoodlValue<string>;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      nkey: nkey.string,
      value: this.toJSON(),
    }
  }

  constructor(value?: any) {
    super()
    this.#value = is.valueNode(value) ? value : new NoodlValue(value)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.string,
    })
  }

  getValue(asNode: boolean): any
  getValue(): NoodlValue
  getValue(asNode = true) {
    return asNode ? this.#value : toString(this.#value)
  }

  setValue(value: any) {
    this.#value = is.node(value)
      ? (value as NoodlValue)
      : new NoodlValue(toString(value))
    return this
  }

  isEmpty() {
    const value = this.toJSON()
    return value === '' || value === 'null' || value === 'undefined'
  }

  isReference() {
    return is.reference(this)
  }

  snapshot() {
    return {
      isEmpty: this.isEmpty(),
      isReference: this.isReference(),
      value: this.toJSON(),
    }
  }

  toJSON() {
    return this.getValue(false)
  }
}

export default NoodlString
