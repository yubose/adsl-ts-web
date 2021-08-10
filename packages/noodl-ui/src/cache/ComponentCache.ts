import * as u from '@jsmanifest/utils'
import isComponent from '../utils/isComponent'
import isNUIPage from '../utils/isPage'
import type { ComponentCacheObject, NUIComponent } from '../types'
import type NUIPage from '../Page'

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
    const result = {
      length: this.length,
      components: {} as Record<string, { ids: string[]; total: number }>,
    }

    for (const obj of this) {
      if (obj) {
        if (!(obj.page in result.components)) {
          result.components[obj.page] = {} as typeof result.components[string]
        }

        const item = result.components[obj.page]

        !item.ids && (item.ids = [])
        !item.total && (item.total = 0)

        if (!item.ids.includes(obj.component.id)) {
          item.ids.push(obj.component.id)
          item.total++
        }
      }
    }

    return result
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
    u.isArr(obs) && !obs.includes(fn) && obs.push(fn)
    return this
  }

  emit<Evt extends ComponentCacheHookEvent>(
    evt: Evt,
    ...args: Parameters<ComponentCacheHook[Evt]>
  ) {
    this.#observers[evt]?.forEach?.((fn: any) => fn(...args))
    return this
  }

  add(
    component: NUIComponent.Instance,
    page: NUIPage | string | undefined,
  ): ComponentCacheObject {
    if (component) {
      this.#cache.set(component.id, {
        component,
        page:
          (isNUIPage(page)
            ? page.page
            : u.isObj(page)
            ? page.page || ''
            : page) || '',
      })
      this.emit('add', component)
    }
    return this.get(component)
  }

  clear(page?: string) {
    let removed = {} as any
    let remove = (obj: ComponentCacheObject) => {
      const id = obj?.component?.id || ''
      removed[id] = obj
      this.#cache.delete(id)
    }

    for (const obj of this.#cache.values()) {
      if (page) page === obj.page && remove(obj)
      else remove(obj)
    }

    this.emit('clear', removed)
    removed = null

    return this
  }

  get(
    component: NUIComponent.Instance | string | undefined,
  ): ComponentCacheObject
  get(): Map<string, ComponentCacheObject>
  get(component?: NUIComponent.Instance | string | undefined) {
    if (isComponent(component)) return this.#cache.get(component.id)
    if (u.isStr(component)) return this.#cache.get(component)
    return this.#cache
  }

  has(component: NUIComponent.Instance | string | undefined) {
    if (!component) return false
    return this.#cache.has(u.isStr(component) ? component : component.id || '')
  }

  remove(component: NUIComponent.Instance | string) {
    if (u.isStr(component)) {
      component = this.#cache.get(component)?.component as NUIComponent.Instance
    }
    if (isComponent(component)) {
      this.#cache.delete(component.id)
      this.emit('remove', component.toJSON())
    }
    return this
  }
}

export default ComponentCache
