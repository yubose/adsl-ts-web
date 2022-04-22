import NoodlValue from './Value'
import toString from './utils/toString'
import is from './utils/is'
import { nkey } from './constants'

class NoodlString<S extends string> extends NoodlValue<S> {
  #value: NoodlValue<S> | undefined

  static is(value: any): value is NoodlString<string> {
    return !!value && value instanceof NoodlString
  }

  constructor(value?: string | NoodlValue<S>) {
    super(value as S)
    this.setValue(value)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.string,
    })
  }

  getValue() {
    return this.#value?.getValue()
  }

  setValue(value: any) {
    if (value === undefined) {
      this.#value = undefined
    } else {
      this.#value = NoodlString.is(value)
        ? new NoodlValue(value.getValue())
        : NoodlValue.is(value)
        ? value
        : new NoodlValue(toString(value))
    }
    return this
  }

  isReference() {
    return is.reference(this)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isReference: this.isReference(),
      value: this.getValue(),
    }
  }
}

export default NoodlString
