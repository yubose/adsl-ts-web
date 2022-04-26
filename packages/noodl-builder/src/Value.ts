import NoodlBase from './Base'
import is from './utils/is'
import { nkey } from './constants'

class NoodlValue<T> extends NoodlBase {
  #value: T | undefined

  static is(value: any): value is NoodlValue<any> {
    return value !== null && value instanceof NoodlValue
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
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

  toJSON() {
    const value = this.getValue()
    const isStr = typeof value === 'string'
    return {
      isReference: isStr && is.reference(value),
      value,
    }
  }
}

export default NoodlValue
