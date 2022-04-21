import { is, toString } from './utils'
import NoodlValue from './Value'

class NoodlString<S extends string> extends NoodlValue<S> {
  #value: NoodlValue<S> | undefined

  static is(value: any): value is NoodlString<string> {
    return !!value && value instanceof NoodlString
  }

  constructor(value?: string | NoodlValue<S>) {
    super(value as S)
    this.setValue(value)
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
    const value = this.getValue()
    return typeof value === 'string' && is.reference(value)
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
