import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import NoodlProperty from './Property'
import is from './utils/is'
import typeOf from './utils/typeOf'
import { nkey } from './constants'
import * as fp from './utils'

class NoodlObject extends NoodlBase {
  #value = new Map<string, NoodlProperty<any> | undefined>()

  static is(value: any): value is NoodlObject {
    return value && typeof value === 'object' && value instanceof NoodlObject
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(parent?: NoodlObject['parent']) {
    super()
    if (parent !== undefined) this.setParent(parent)

    Object.defineProperty(this, '__ntype', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: nkey.object,
    })
  }

  createProperty<S extends string = string>(
    property: S | NoodlString<S>,
    value?: any,
  ) {
    if (typeof property === 'string' && !property) {
      throw new Error(`Cannot create property using an empty string`)
    }
    if (NoodlString.is(property) && !property.getValue()) {
      throw new Error(`Cannot create property using an empty NoodlString`)
    }
    const key = this.unwrapProperty(property)
    const prop = key ? new NoodlProperty(key, this) : undefined
    if (value !== undefined) prop?.setValue(value)
    this.#value.set(key, prop)
    return this
  }

  getProperty(property: string | NoodlString<string>) {
    return this.#value.get(this.unwrapProperty(property))
  }

  hasProperty(property: string | NoodlString<string>) {
    const key = this.toKey(property)
    if (!key) return false
    return this.#value.has(key)
  }

  removeProperty(property: string | NoodlString<string>) {
    const key = this.unwrapProperty(property)
    if (key) this.#value.delete(key)
    return this
  }

  unwrapProperty(
    property:
      | string
      | NoodlString<string>
      | NoodlValue<any>
      | NoodlProperty<any>
      | undefined,
  ) {
    const type = typeOf(property)
    if (
      type === 'string' ||
      type === 'boolean' ||
      type === 'number' ||
      type === 'null' ||
      type === 'undefined'
    ) {
      return property
    } else if (
      is.valueNode(property) ||
      is.stringNode(property) ||
      is.propertyNode(property)
    ) {
      return (property as NoodlValue<any>).getValue()
    }
  }

  getValue(property: string | NoodlString<string>, asNode = true) {
    const unwrappedProperty = this.unwrapProperty(property)
    if (unwrappedProperty === undefined) {
      throw new Error(`Cannot unwrap an undefined property`)
    }
    const result = this.#value.get(unwrappedProperty)
    return asNode ? result : result?.getValue?.()
  }

  setValue(property: string | NoodlString<string>, value?: any) {
    const key = this.toKey(property)
    if (key === undefined) {
      throw new Error(`Cannot set value on undefined property`)
    }
    if (value !== undefined && !NoodlValue.is(value)) {
      value = new NoodlValue(value)
    }
    this.#value.set(key, value)
    return this
  }

  isEmpty() {
    return !!Object.keys(this.#value)?.length
  }

  toKey(value: string | NoodlString<string>) {
    if (typeof value === 'string') return value
    return is.node(value) ? value.getValue() : String(value)
  }

  build() {
    const result = {} as Record<string, any>

    for (const [property, value] of this.#value) {
      result[property] = value?.getValue?.()
    }

    return result
  }

  toJSON() {
    return {
      value: this.build(),
    }
  }
}

export default NoodlObject
