import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import NUIPage from '../Page'
import isComponent from '../utils/isComponent'
import type Viewport from '../Viewport'
import type { ICache, IPage, NUIComponent } from '../types'
import * as c from '../constants'

export interface PageCacheHooks {
  [c.cache.page.hooks.PAGE_CREATED](args: {
    component?: NUIComponent.Instance
    page: NUIPage
  }): void
  [c.cache.page.hooks.PAGE_REMOVED](page: NUIPage): void
}

export interface State {
  created: Map<number, StatePageObject>
  removed: Map<number, StatePageObject>
}

export interface StatePageObject {
  startPage: string
  endPage: string
}

class PageCache implements ICache {
  #hooks = {
    [c.cache.page.hooks.PAGE_CREATED]: [] as PageCacheHooks['PAGE_CREATED'][],
    [c.cache.page.hooks.PAGE_REMOVED]: [] as PageCacheHooks['PAGE_REMOVED'][],
  }
  #pages = new Map() as Map<IPage['id'], { page: NUIPage }>
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

    this.on('PAGE_CREATED', ({ page }) => {
      this.state.created.set(page.created, {
        startPage: page.page,
        endPage: '',
      })
    })

    this.on('PAGE_REMOVED', (page) => {
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

  // create(component: NUIComponent.Instance, page?: NUIPage): NUIPage
  create(
    args: {
      // If component is passed in it must be treated as a page component.
      component?: NUIComponent.Instance
      id?: string
      onChange?: (prev: string, next: string) => void
      viewport?: Viewport
    } = {},
  ) {
    let { id, viewport } = args
    id = id || (!this.#pages.size ? 'root' : undefined)
    const page = new NUIPage(viewport, { id })
    args.onChange && page.use({ onChange: args.onChange })
    this.#pages.set(page.id, { page })
    const emitArgs = { page } as {
      component?: NUIComponent.Instance
      page: NUIPage
    }
    if (isComponent(args.component)) emitArgs.component = args.component
    this.#emit(c.cache.page.hooks.PAGE_CREATED, emitArgs)
    return this.#pages.get(page.id)?.page as NUIPage
  }

  #emit = <Evt extends keyof PageCacheHooks>(
    evt: Evt,
    page: NUIPage | { component?: NUIComponent.Instance; page: NUIPage },
  ) => {
    this.#hooks[evt]?.forEach?.((fn) => fn?.(page))
  }

  get(id: IPage['id']): { page: NUIPage }
  get(id?: never): [{ page: NUIPage }]
  get(id?: IPage['id']) {
    if (!id) return Array.from(this.#pages.values())
    return this.#pages.get(id)
  }

  has(id: IPage['id']) {
    return this.#pages.has(id)
  }

  forEach(
    fn: (
      page: { page: NUIPage },
      index: IPage['id'],
      collection: Map<IPage['id'], { page: NUIPage }>,
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

  remove(page: NUIPage) {
    if (page === undefined || page === null) return this
    if (this.#pages.has(page.id)) {
      const isRemoved = this.#pages.delete(page.id)
      isRemoved && this.#emit(c.cache.page.hooks.PAGE_REMOVED, page)
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
