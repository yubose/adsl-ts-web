import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import NoodlProperty from './Property'
import is from './utils/is'
import typeOf from './utils/typeOf'
import { nkey } from './constants'
import type { INoodlValue } from './types'
import * as fp from './utils'

class NoodlObject
  extends NoodlBase
  implements INoodlValue<Record<string, any>>
{
  #value = new Map<string, NoodlProperty<any> | undefined>();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      nkey: nkey.object,
      value: this.build(),
    }
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

  createProperty(property: string | NoodlString, value?: any) {
    if (typeof property === 'string' && !property && property !== '') {
      throw new Error(`Cannot create property using a null or undefined value`)
    }
    if (is.propertyNode(property) && !property.getValue()) {
      throw new Error(`Cannot create property using an empty NoodlString`)
    }
    const key = this.unwrapProperty(property)
    const prop = key ? new NoodlProperty(key, this) : undefined
    if (value !== undefined) prop?.setValue(value)
    this.#value.set(key, prop)
    return this
  }

  getProperty(property: string | NoodlString) {
    return this.#value.get(this.unwrapProperty(property))
  }

  hasProperty(property: string | NoodlString) {
    const key = this.toKey(property)
    if (!key) return false
    return this.#value.has(key)
  }

  removeProperty(property: string | NoodlString) {
    const key = this.unwrapProperty(property)
    if (key) this.#value.delete(key)
    return this
  }

  unwrapProperty(
    property:
      | string
      | NoodlString
      | NoodlValue<any>
      | NoodlProperty<any>
      | undefined,
  ) {
    const type = typeOf(property)
    if (/boolean|null|number|string|undefined/.test(type)) {
      return property
    } else if (
      is.valueNode(property) ||
      is.stringNode(property) ||
      is.propertyNode(property)
    ) {
      return property.getValue(false)
    }
  }

  getValue(property: string | NoodlString, asNode = true) {
    const unwrappedProperty = this.unwrapProperty(property)
    if (unwrappedProperty === undefined) {
      throw new Error(`Cannot unwrap an undefined property`)
    }
    const result = this.#value.get(unwrappedProperty)
    return asNode ? result : result?.getValue?.(false)
  }

  setValue(property: string | NoodlString, value?: any) {
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

  toKey(value: string | NoodlString): string {
    if (typeof value === 'string') return value
    return (is.node(value) ? String(value.getValue()) : String(value)) as string
  }

  build() {
    const result = {} as Record<string, any>

    for (const [property, value] of this.#value) {
      const converted = value?.getValue?.()
      result[property] = converted
      console.log({ converted, property, value })
    }

    return result
  }

  toJSON() {
    return this.build()
  }
}

export default NoodlObject
