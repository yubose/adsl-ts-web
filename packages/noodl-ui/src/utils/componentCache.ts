import { ComponentInstance } from '../types'

const createComponentCache = function () {
  let cache = {}

  const o = {
    clear() {
      cache = {}
      return o
    },
    has(component: ComponentInstance | string) {
      return cache[typeof component === 'string' ? component : component?.id]
    },
    get(component: ComponentInstance) {
      return component && cache[component.id]
    },
    get length() {
      return Object.keys(cache).length
    },
    set(component: ComponentInstance) {
      component && (cache[component.id] = component)
      return o
    },
    remove(component: ComponentInstance) {
      delete cache[component.id]
      return o
    },
    state() {
      return cache
    },
  }

  return o
}

export default createComponentCache
