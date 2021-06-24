import isComponent from '../utils/isComponent'
import { ComponentCacheObject, NUIComponent } from '../types'
import { isArr, isStr } from '../utils/internal'
import isNUIPage from '../utils/isPage'
import NUIPage from '../Page'

type ComponentCacheHookEvent = 'add' | 'clear' | 'remove'

interface ComponentCacheHook {
  add(component: NUIComponent.Instance): void
  clear(components: { [id: string]: NUIComponent.Instance }): void
  remove(component: ReturnType<NUIComponent.Instance['toJSON']>): void
}

class ComponentCache {
  #cache = new Map<string, ComponentCacheObject>()
  #observers: Record<
    ComponentCacheHookEvent,
    ComponentCacheHook[ComponentCacheHookEvent][]
  > = { add: [], clear: [], remove: [] }

  static _inst: ComponentCache;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      length: this.length,
    }
  }

  [Symbol.iterator]() {
    const components = [...this.#cache.values()]
    return {
      next() {
        return {
          value: components.pop(),
          done: !components.length,
        }
      },
    }
  }

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

  add(component: NUIComponent.Instance, page: NUIPage | string | undefined) {
    if (component) {
      this.#cache.set(component.id, {
        component,
        page: (isNUIPage(page) ? page.page : page) || '',
      })
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

  get(
    component: NUIComponent.Instance | string | undefined,
  ): ComponentCacheObject
  get(): Map<string, ComponentCacheObject>
  get(component?: NUIComponent.Instance | string | undefined) {
    if (isComponent(component)) return this.#cache.get(component.id)
    if (isStr(component)) return this.#cache.get(component)
    return this.#cache
  }

  has(component: NUIComponent.Instance | string | undefined) {
    if (!component) return false
    return this.#cache.has(isStr(component) ? component : component.id || '')
  }

  remove(component: NUIComponent.Instance | string) {
    if (isStr(component)) {
      component = this.#cache.get(component)?.component as NUIComponent.Instance
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
