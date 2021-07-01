import * as u from '@jsmanifest/utils'
import GlobalRecord from './GlobalRecord'
import * as t from '../types'

class GlobalJsResourceRecord extends GlobalRecord<'resource'> {
  #id = ''
  cond: t.GlobalResourceObjectBase['cond'];

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(
    opts: string | (Partial<t.GlobalResourceObjectBase> & { src?: string }),
  ) {
    super()

    if (u.isStr(opts)) {
      this.#id = opts
    } else if (u.isObj(opts)) {
      this.cond = opts.cond
      this.#id = opts.src || ''
    }
  }

  get id() {
    return this.#id
  }

  get resourceType() {
    return 'js'
  }

  get src() {
    return this.#id
  }

  toJSON() {
    return {
      cond: this.cond,
      resourceType: this.resourceType,
      src: this.src,
    }
  }
}

export default GlobalJsResourceRecord
