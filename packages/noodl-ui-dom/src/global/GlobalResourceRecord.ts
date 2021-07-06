import GlobalRecord from './GlobalRecord'
import * as t from '../types'

class GlobalResourceRecord<T extends string> extends GlobalRecord<'resource'> {
  #id = ''
  #resourceType = '' as T

  cond: t.GlobalResourceObjectBase['cond'];

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(type: T, id: string) {
    super()
    this.#id = id
    this.#resourceType = type
  }

  get id() {
    return this.#id
  }

  get resourceType(): T {
    return this.#resourceType
  }

  toJSON() {
    return {
      id: this.id,
      resourceType: this.resourceType,
    }
  }
}

export default GlobalResourceRecord
