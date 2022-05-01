import NoodlBase from './Base'
import NoodlString from './String'
import NoodlValue from './Value'
import NoodlProperty from './Property'
import createNode from './utils/createNode'
import is from './utils/is'
import typeOf from './utils/typeOf'
import unwrap from './utils/unwrap'
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

  [Symbol.iterator](): Iterator<NoodlProperty<any>> {
    const entries = [...this.#value.values()].reverse()
    return {
      next() {
        return {
          value: entries.pop(),
          done: !entries.length as true,
        }
      },
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

  get length() {
    return this.#value.size
  }

  createProperty(property: string | NoodlString, value?: any) {
    if (typeof property === 'string' && !property && property !== '') {
      throw new Error(`Cannot create property using a null or undefined value`)
    }
    if (is.propertyNode(property) && !property.getValue()) {
      throw new Error(`Cannot create property using an empty NoodlString`)
    }
    const key = unwrap(property)
    const prop = this.#value.get(key) || new NoodlProperty(key, this)
    prop.setParent(this)
    if (is.node(value)) value.setParent(this)
    if (arguments.length > 1) prop.setValue(value)
    this.#value.set(key, prop)
    return prop
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
    const node = createNode(value)
    node?.setParent?.(this)
    this.#value.set(key, node)
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
      const converted = unwrap(value)
      if (converted && typeof converted === 'object' && !is.node(converted)) {
        if (Array.isArray(converted)) {
          result[unwrap(property)] = converted.map(unwrap)
        } else {
          result[unwrap(property)] = converted
        }
      } else {
        result[property] = converted
      }
    }

    return result
  }

  toJSON() {
    return this.build()
  }
}

export default NoodlObject
