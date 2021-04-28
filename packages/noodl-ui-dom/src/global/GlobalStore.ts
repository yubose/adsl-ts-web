import { isComponent, NUIComponent } from 'noodl-ui'
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

  has(component: NUIComponent.Instance): boolean
  has(node: HTMLElement | null): boolean
  has<NC extends NUIComponent.Instance | HTMLElement | null>(arg: NC) {
    if (arg) {
      if (isComponent(arg)) {
        const globalId = arg.get('data-globalid')
        if (globalId) {
          if (this.#store.components.has(globalId)) return true
          for (const record of this.#store.components.values()) {
            if (record.componentId === arg.id) return true
            else if (this.#store.components.has(globalId)) return true
          }
        }
      } else if (arg instanceof HTMLElement) {
        const globalId = arg.dataset.globalid || ''
        if (globalId) {
          if (this.#store.components.has(globalId)) return true
          for (const record of this.#store.components.values()) {
            if (record.nodeId === arg.id) {
              return true
            } else if (this.#store.components.has(globalId)) {
              return true
            }
          }
        }
      }
    }
    return false
  }
}

export default GlobalStore
