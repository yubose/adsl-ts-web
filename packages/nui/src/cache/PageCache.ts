import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { ComponentObject } from 'noodl-types'
import type { OrArray } from '@jsmanifest/typefest'
import type NuiViewport from '../Viewport'
import NuiPage from '../Page'
import { pageCacheHooks } from '../constants'

const c = { ...pageCacheHooks }

export interface PageCacheHooks {
  [c.PAGE_CREATED](args: { component?: ComponentObject; page: NuiPage }): void
  [c.PAGE_REMOVED](page: NuiPage): void
}

export type PageId = LiteralUnion<'root', string>

export interface State {
  created: Map<number, StatePageObject>
  removed: Map<number, StatePageObject>
}

export interface StatePageObject {
  startPage: string
  endPage: string
}

class PageCache {
  #hooks = {
    [c.PAGE_CREATED]: [] as PageCacheHooks[typeof c.PAGE_CREATED][],
    [c.PAGE_REMOVED]: [] as PageCacheHooks[typeof c.PAGE_REMOVED][],
  }
  #pages = new Map() as Map<PageId, NuiPage>
  #state = {
    created: new Map(),
    removed: new Map(),
  } as State

  static _inst: PageCache;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  [Symbol.iterator]() {
    const pages = [...this.#pages].reverse()
    return {
      next() {
        return {
          value: pages.pop(),
          done: !pages.length,
        }
      },
    }
  }

  constructor() {
    if (PageCache._inst) return PageCache._inst
    PageCache._inst = this

    this.on(c.PAGE_CREATED, ({ page }) => {
      this.state.created.set(page.created, {
        startPage: page.page,
        endPage: '',
      })
    })

    this.on(c.PAGE_REMOVED, (page) => {
      this.state.removed.set(page.created, {
        ...this.state.created.get(page.created),
        endPage: page.page,
      } as StatePageObject)
      this.state.created.delete(page.created)
    })
  }

  get length() {
    return this.#pages.size
  }

  get hooks() {
    return this.#hooks
  }

  get state() {
    return this.#state
  }

  clear() {
    for (const [id, { page }] of this.#pages) {
      Array.isArray(page.components) && (page.components.length = 0)
      this.#pages.delete(id)
    }
    u.values(this.#hooks).forEach((fns) => (fns.length = 0))
    return this
  }

  // create(component: ComponentObject, page?: NuiPage): NuiPage
  create(
    args: {
      // If component is passed in it must be treated as a page component.
      component?: ComponentObject
      id?: string
      onChange?: (prev: string, next: string) => void
      viewport?: NuiViewport
    } = {},
  ) {
    let { id, viewport } = args
    id = id || (!this.#pages.size ? 'root' : undefined)
    const page = new NuiPage(viewport, { id })
    args.onChange && page.use({ onChange: args.onChange })
    this.#pages.set(page.id, { page })
    const emitArgs = { page } as {
      component?: ComponentObject
      page: NuiPage
    }
    if (isComponent(args.component)) emitArgs.component = args.component
    this.#emit(c.PAGE_CREATED, emitArgs)
    return this.#pages.get(page.id)?.page as NuiPage
  }

  #emit = <Evt extends keyof PageCacheHooks>(
    evt: Evt,
    page: NuiPage | { component?: ComponentObject; page: NuiPage },
  ) => {
    this.#hooks[evt]?.forEach?.((fn) => fn?.(page))
  }

  get(id: PageId): { page: NuiPage }
  get(id?: never): [{ page: NuiPage }]
  get(id?: PageId) {
    if (!id) return Array.from(this.#pages.values())
    return this.#pages.get(id)
  }

  has(id: PageId) {
    return this.#pages.has(id)
  }

  forEach(
    fn: (
      page: { page: NuiPage },
      index: PageId,
      collection: Map<PageId, { page: NuiPage }>,
    ) => void,
  ) {
    this.#pages.forEach((obj, key, collection) => {
      fn(obj, key, collection)
    })
  }

  on<Evt extends keyof PageCacheHooks>(evt: Evt, fn: PageCacheHooks[Evt]) {
    this.#hooks[evt]?.push?.(fn)
    return this
  }

  remove(page: NuiPage) {
    if (page === undefined || page === null) return this
    if (this.#pages.has(page.id)) {
      const isRemoved = this.#pages.delete(page.id)
      isRemoved && this.#emit(c.PAGE_REMOVED, page)
    }
    return this
  }

  toJSON() {
    return u.reduce(
      [...this.#pages.values()],
      (acc, obj) => {
        if (!obj) return acc
        const page = obj.page
        const pageName = page.page || 'unknown'
        if (!acc.ids.includes(page.id)) acc.ids.push(page.id)
        if (!acc.pageNames.includes(pageName)) acc.pageNames.push(pageName)
        return acc
      },
      {
        ids: [] as OrArray<string | number>[],
        length: this.length,
        pageNames: [] as string[],
      },
    )
  }
}

export default PageCache
