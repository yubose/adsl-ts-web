import * as u from '@jsmanifest/utils'
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
    return this.#observers[evt]?.map?.((fn: any) => fn(...args)) || []
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
      this.remove(obj.component)
    }

    for (const obj of this.#cache.values()) {
      if (page !== undefined) page === obj.page && remove(obj)
      else remove(obj)
    }

    this.emit('clear', removed)
    removed = null

    return this
  }

  get(): Map<string, ComponentCacheObject>
  get(
    component: NUIComponent.Instance | string | undefined,
  ): ComponentCacheObject
  get(component?: NUIComponent.Instance | string | undefined) {
    if (u.isObj(component)) return this.#cache.get(component.id)
    if (component) return this.#cache.get(component)
    return this.#cache
  }

  has(component: NUIComponent.Instance | string | undefined) {
    if (u.isNil(component)) return false
    return this.#cache.has(!u.isObj(component) ? component : component.id || '')
  }

  remove(component: NUIComponent.Instance | string) {
    if (!u.isObj(component)) {
      if (this.#cache.has(component)) {
        const snapshot = this.#cache.get(component)?.component?.toJSON?.()
        this.#cache.delete(component)
        this.emit('remove', snapshot)
      }
    } else if (component) {
      if (this.#cache.has(component.id)) {
        const snapshot = component.toJSON?.()
        this.#cache.delete(component.id)
        this.emit('remove', snapshot)
      }
    }
    return this
  }

  filter(cb: string | ((obj: ComponentCacheObject) => boolean)) {
    if (u.isStr(cb)) {
      return this.reduce(
        (acc, obj) => (obj.page === cb ? acc.concat(obj) : acc),
        [] as ComponentCacheObject[],
      )
    }
    return this.reduce(
      (acc, obj) => (cb(obj) ? acc.concat(obj) : acc),
      [] as ComponentCacheObject[],
    )
  }

  forEach(cb: (obj: ComponentCacheObject) => void) {
    for (const obj of this.get().values()) cb(obj)
  }

  map(cb: <V>(obj: ComponentCacheObject) => V) {
    return [...this.get().values()].map(cb)
  }

  reduce<A>(cb: (acc: A, obj: ComponentCacheObject) => A, initialValue: A) {
    return u.reduce([...this.get().values()], cb, initialValue)
  }
}

export default ComponentCache
