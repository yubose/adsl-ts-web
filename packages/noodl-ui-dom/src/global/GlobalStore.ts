import * as T from '../types'

interface ConstructorOptions {
  component?: T.GlobalMap['components']
  pages?: T.GlobalMap['pages']
}

class GlobalStore {
  #store: T.GlobalMap

  constructor(opts?: ConstructorOptions) {
    this.#store = {
      components: opts?.component || new Map(),
      pages: opts?.pages || {},
    }
  }

  get components() {
    return this.#store.components
  }

  get pages() {
    return this.#store.pages
  }
}

export default GlobalStore
