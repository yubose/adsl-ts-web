import NoodlBase from './Base'
import { nkey } from './constants'
import type { INoodlValue } from './types'

class NoodlValue<T = any> extends NoodlBase implements INoodlValue<T> {
  #value: any

  static is(value: any): value is NoodlValue<any> {
    return value !== null && value instanceof NoodlValue
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      nkey: nkey.value,
      value: this.getValue(),
    }
  }

  constructor(value?: T) {
    super()
    this.#value = value

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.value,
    })
  }

  setValue(value: any) {
    this.#value = value
    return this
  }

  getValue() {
    return this.#value
  }

  toString() {
    return typeof this.#value === 'string' ? this.#value : String(this.#value)
  }
}

export default NoodlValue
