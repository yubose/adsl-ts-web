import { ComponentInstance } from '../types'

const createComponentCache = (function () {
  let cache = {}

  const o = {
    clear() {
      cache = {}
      return o
    },
    has(component: ComponentInstance | string) {
      return (
        (typeof component === 'string' ? component : component?.id || '') in
        cache
      )
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
      component && delete cache[component.id]
      return o
    },
    state() {
      return cache
    },
  }

  return function _createComponentCache() {
    return o
  }
})()

export default createComponentCache
