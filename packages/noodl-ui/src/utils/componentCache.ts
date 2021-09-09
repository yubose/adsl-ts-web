import { ComponentInstance } from '../types'

const componentCache = (function _createComponentCache() {
  let observers = { clear: [], remove: [], set: [] }
  let store = {} as Record<string, ComponentInstance>

  function on(
    e: 'clear',
    fn: (store: { [id: string]: ComponentInstance }) => void,
  ): typeof cache
  function on(
    e: 'set',
    fn: (component: ComponentInstance, args: { store: typeof store }) => void,
  ): typeof cache
  function on(
    e: 'remove',
    fn: (component: ComponentInstance, args: { cache: typeof cache }) => void,
  ): typeof cache
  function on(e: 'clear' | 'remove' | 'set', fn: any) {
    const obs = observers[e] as any[]
    if (Array.isArray(obs) && !obs.includes(fn)) {
      obs.push(fn)
    }
    return cache
  }

  const emit = (e: 'clear' | 'remove' | 'set', ...args: any[]) => {
    observers[e]?.forEach?.((fn: any) => fn(...args))
  }

  const cache = {
    [Symbol.iterator]() {
      const components = Object.entries(store).reverse()
      return {
        next() {
          return {
            value: components.pop(),
            done: !components.length,
          }
        },
      }
    },
    on,
    clear() {
      const removed = {}
      Object.entries(store).forEach(([key, value]) => {
        // removed[key] = value
        delete store[key]
        // emit('clear', removed, { cache })
      })
      return cache
    },
    has(component: ComponentInstance | string) {
      return (
        (typeof component === 'string' ? component : component?.id || '') in
        store
      )
    },
    get(component: ComponentInstance) {
      if (component) return store[component.id]
    },
    get length() {
      return Object.keys(store).length
    },
    set(component: ComponentInstance) {
      if (component) {
        store[component.id] = component
        emit('set', component, { cache })
      }
      return cache
    },
    remove(component: ComponentInstance) {
      if (component && store[component.id]) {
        delete store[component.id]
        emit('remove', component, { cache })
      }
      return cache
    },
    state() {
      return store
    },
  }

  return cache
})()

export default componentCache
