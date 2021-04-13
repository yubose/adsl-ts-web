import isComponent from '../utils/isComponent'
import { NUIComponent } from '../types'
import { isArr, isStr } from '../utils/internal'

type ComponentCacheHookEvent = 'add' | 'clear' | 'remove'

interface ComponentCacheHook {
  add(component: NUIComponent.Instance): void
  clear(components: { [id: string]: NUIComponent.Instance }): void
  remove(component: ReturnType<NUIComponent.Instance['toJSON']>): void
}

class ComponentCache {
  #cache = new Map<string, NUIComponent.Instance>()
  #observers: Record<
    ComponentCacheHookEvent,
    ComponentCacheHook[ComponentCacheHookEvent][]
  > = { add: [], clear: [], remove: [] }

  static _inst: ComponentCache

  constructor() {
    if (ComponentCache._inst) return ComponentCache._inst
    ComponentCache._inst = this
  }

  get length() {
    return this.#cache.size
  }

  on(e: 'add', fn: ComponentCacheHook['add']): this
  on(e: 'clear', fn: ComponentCacheHook['clear']): this
  on(e: 'remove', fn: ComponentCacheHook['remove']): this
  on<Evt extends ComponentCacheHookEvent>(e: Evt, fn: ComponentCacheHook[Evt]) {
    const obs = this.#observers[e]
    isArr(obs) && !obs.includes(fn) && obs.push(fn)
    return this
  }

  emit<Evt extends ComponentCacheHookEvent>(
    evt: Evt,
    ...args: Parameters<ComponentCacheHook[Evt]>
  ) {
    this.#observers[evt]?.forEach?.((fn: any) => fn(...args))
    return this
  }

  add(component: NUIComponent.Instance) {
    if (component) {
      this.#cache.set(component.id, component)
      this.emit('add', component)
    }
    return this
  }

  clear() {
    const removed = {}
    this.#cache.forEach((component, id) => {
      removed[id] = component
      this.#cache.delete(id)
      this.emit('clear', removed)
    })
    return this
  }

  get(component: NUIComponent.Instance | string): NUIComponent.Instance
  get(): Map<string, NUIComponent.Instance>
  get(component?: NUIComponent.Instance | string) {
    if (isComponent(component)) return this.#cache.get(component.id)
    if (isStr(component)) return this.#cache.get(component)
    return this.#cache
  }

  has(component: NUIComponent.Instance | string) {
    return this.#cache.has(isStr(component) ? component : component?.id || '')
  }

  remove(component: NUIComponent.Instance | string) {
    if (isStr(component)) {
      component = this.#cache.get(component) as NUIComponent.Instance
    }
    if (isComponent(component)) {
      const json = component.toJSON()
      this.#cache.delete(component.id)
      this.emit('remove', json)
    }
    return this
  }
}

export default ComponentCache
