import Timers from './global/Timers'
import NDOMPage from './Page'
import { ComponentPage } from './factory/componentFactory'
import * as t from './types'

let _global: NDOMGlobal

export class NDOMGlobal {
  #components: t.GlobalMap['components'] = new Map()
  #hooks: t.GlobalMap['hooks'] = new Map()
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

  get hooks() {
    return this.#hooks
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

  add(page: NDOMPage | ComponentPage) {
    this.pages[page.id] = page
  }
}

export default NDOMGlobal
