import isComponent from '../utils/isComponent'
import { Cache, ComponentInstance } from '../types'
import { isArr, isStr } from '../utils/internal'

class ComponentCache {
  #cache = new Map<string, ComponentInstance>()
  #observers: Record<
    Cache.ComponentHookEvent,
    Cache.ComponentHook[Cache.ComponentHookEvent][]
  > = { add: [], clear: [], remove: [] }

  static _inst: ComponentCache

  constructor() {
    if (ComponentCache._inst) return ComponentCache._inst
    ComponentCache._inst = this
  }

  get length() {
    return this.#cache.size
  }

  on(e: 'add', fn: Cache.ComponentHook['add']): this
  on(e: 'clear', fn: Cache.ComponentHook['clear']): this
  on(e: 'remove', fn: Cache.ComponentHook['remove']): this
  on<Evt extends Cache.ComponentHookEvent>(
    e: Evt,
    fn: Cache.ComponentHook[Evt],
  ) {
    const obs = this.#observers[e]
    isArr(obs) && !obs.includes(fn) && obs.push(fn)
    return this
  }

  emit<Evt extends Cache.ComponentHookEvent>(
    evt: Evt,
    ...args: Parameters<Cache.ComponentHook[Evt]>
  ) {
    this.#observers[evt]?.forEach?.((fn: any) => fn(...args))
    return this
  }

  add(component: ComponentInstance) {
    this.#cache.set(component.id, component)
    this.emit('add', component)
    return this
  }

  clear() {
    const removed = {}
    this.#cache.forEach((component, id) => {
      removed[id] = component
      delete this.#cache[id]
      this.emit('clear', removed)
    })
    return this
  }

  get(component?: ComponentInstance | string): ComponentInstance
  get(value?: never): Map<string, ComponentInstance>
  get(component?: ComponentInstance | string) {
    if (isComponent(component)) return this.#cache.get(component.id)
    if (isStr(component)) return this.#cache.get(component)
    return this.#cache
  }

  has(component: ComponentInstance | string) {
    return (isStr(component) ? component : component?.id || '') in this.#cache
  }

  remove(component: ComponentInstance | string) {
    if (isStr(component)) {
      component = this.#cache[component]
    }
    if (isComponent(component)) {
      delete this.#cache[component.id]
      this.emit('remove', component.toJSON())
    }
    return this
  }
}

export default ComponentCache
