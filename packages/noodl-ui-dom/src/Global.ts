import Timers from './global/Timers'
import * as t from './types'

let _global: NDOMGlobal

export class NDOMGlobal {
  #components: t.GlobalMap['components'] = new Map()
  #pages = {} as t.GlobalMap['pages']
  #timers: t.GlobalMap['timers'] = new Timers();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      components: this.components,
      pags: this.pages,
      timers: this.timers,
    }
  }

  constructor() {
    if (!(_global instanceof NDOMGlobal)) _global = this
    return _global
  }

  get components() {
    return this.#components
  }

  get pages() {
    return this.#pages
  }

  get timers() {
    return this.#timers
  }
}

export default NDOMGlobal
