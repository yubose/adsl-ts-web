import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import createNode from './utils/createNode'
import is from './utils/is'
import { nkey } from './constants'

class NoodlProperty<K extends string> extends NoodlBase {
  #key: NoodlString<K> | undefined
  #value: undefined | NoodlValue<any>

  static is(value: any): value is NoodlProperty<any> {
    return !!(value && value instanceof NoodlProperty)
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

  setKey(key: string | NoodlString<string> | undefined) {
    if (
      typeof key !== 'string' &&
      typeof key !== 'number' &&
      key !== undefined
    ) {
      throw new Error(
        `Cannot set key of type "${typeof key}". Expect string, number, undefined, or NoodlString`,
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
    this.#value = createNode(value)
    return this
  }

  getValue() {
    return is.node(this.#value) ? this.#value.getValue() : this.#value
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
