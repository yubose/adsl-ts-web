import * as u from '@jsmanifest/utils'
import GlobalRecord from './GlobalRecord'
import * as t from '../types'

class GlobalCssResourceRecord extends GlobalRecord<'resource'> {
  #id = ''
  cond: t.GlobalResourceObjectBase['cond'];

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(
    opts: string | (Partial<t.GlobalResourceObjectBase> & { href?: string }),
  ) {
    super()

    if (u.isStr(opts)) {
      this.#id = opts
    } else if (u.isObj(opts)) {
      this.cond = opts.cond
      this.#id = opts.href || ''
    }
  }

  get id() {
    return this.#id
  }

  get href() {
    return this.#id
  }

  get resourceType() {
    return 'css'
  }

  toJSON() {
    return {
      cond: this.cond,
      resourceType: this.resourceType,
      href: this.href,
    }
  }
}

export default GlobalCssResourceRecord
