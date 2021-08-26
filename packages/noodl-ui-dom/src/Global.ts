import Timers from './global/Timers'
import NDOMPage from './Page'
import * as t from './types'

let _global: NDOMGlobal

export class NDOMGlobal {
  #components: t.GlobalMap['components'] = new Map()
  #pages = {} as t.GlobalMap['pages']
  #timers: t.GlobalMap['timers'] = new Timers();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      components: this.components,
      pages: this.pages,
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

  get pageIds() {
    return Object.keys(this.#pages)
  }

  get pageNames() {
    return Object.values(this.#pages).reduce(
      (acc, page) =>
        typeof page.page === 'string' ? acc.concat(page.page) : acc,
      [] as string[],
    )
  }

  get timers() {
    return this.#timers
  }

  add(page: NDOMPage) {
    this.pages[page.id] = page
  }
}

export default NDOMGlobal
