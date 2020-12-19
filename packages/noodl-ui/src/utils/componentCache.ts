import { ComponentInstance } from '../types'

const createComponentCache = function () {
  let cache = {}

  const o = {
    clear() {
      cache = {}
      return o
    },
    get(component: ComponentInstance) {
      return cache[component.id]
    },
    set(component: ComponentInstance) {
      cache[component.id] = component
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
