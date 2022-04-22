import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import { nkey } from './constants'

class NoodlProperty<K extends string> extends NoodlBase {
  #key: NoodlString<K> | undefined
  #value: undefined | NoodlValue<any>

  static is(value: any): value is NoodlProperty<any> {
    return !!(value && value instanceof NoodlProperty)
  }

  constructor(key?: K) {
    super()
    this.setKey(key)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.property,
    })
  }

  setKey(key: string | NoodlString<string> | undefined) {
    if (typeof key !== 'string' && key !== undefined) {
      throw new Error(
        `Cannot set key of type "${typeof key}". Expect string, undefined, or NoodlString`,
      )
    }
    if (NoodlString.is(key)) {
      this.#key = key as NoodlString<K>
    } else if (typeof key === 'string' || NoodlValue.is(key)) {
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
    this.#value = NoodlValue.is(value) ? value : new NoodlValue(value)
    return this
  }

  getValue() {
    return this.#value
  }

  toJSON() {
    return {
      key: this.getKey()?.getValue(),
      value: this.getValue()?.getValue?.(),
    }
  }

  build() {
    return {
      [this.getKey()?.getValue() as string]: this.getValue()?.getValue(),
    }
  }
}

export default NoodlProperty
