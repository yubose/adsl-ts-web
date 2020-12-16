import Component from '../components/Base'

const createComponentCache = function () {
  let cache = {}

  const o = {
    clear() {
      cache = {}
      return o
    },
    get(component: Component) {
      return cache[component.id]
    },
    set(component: Component) {
      cache[component.id] = component
      return o
    },
    remove(component: Component) {
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
