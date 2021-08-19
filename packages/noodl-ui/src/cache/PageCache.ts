import NUIPage from '../Page'
// import VP from '../Viewport'
import type Viewport from '../Viewport'
import type { ICache, IPage } from '../types'
// import isComponent from '../utils/isComponent'

class PageCache implements ICache {
  // #cache = new WeakMap<NUIComponent.Instance, NUIPage>()
  #pages = new Map() as Map<IPage['id'], { page: NUIPage }>

  static _inst: PageCache;

  [Symbol.iterator]() {
    const pages = Array.from(this.#pages).reverse()
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
  }

  get length() {
    return this.#pages.size
  }

  clear() {
    for (const [id, { page }] of this.#pages) {
      Array.isArray(page.components) && (page.components.length = 0)
      this.#pages.delete(id)
    }
  }

  // create(component: NUIComponent.Instance, page?: NUIPage): NUIPage
  create(args: { id?: string; viewport?: Viewport }): NUIPage
  create(
    args: { id?: string; viewport?: Viewport } = {},
    // pageProp?: NUIPage,
  ) {
    // if (isComponent(args)) {
    //   // args is a Page component
    //   const page = pageProp || new NUIPage(new VP(), { id: args.id })
    //   this.#cache.set(args, page)
    //   args.set('page', page)
    //   return page
    // } else {
    let { id, viewport } = args
    id = id || (!this.#pages.size ? 'root' : undefined)
    const page = new NUIPage(viewport, { id })
    this.#pages.set(page.id, { page })
    return this.#pages.get(page.id)?.page as NUIPage
    // }
  }

  // get(component: NUIComponent.Instance): { page: NUIPage }
  get(id: IPage['id']): { page: NUIPage }
  get(id?: never): [{ page: NUIPage }]
  get(id?: IPage['id']) {
    if (!id) return Array.from(this.#pages.values())
    // if (isComponent(id)) return { page: this.#cache.get(id) }
    return this.#pages.get(id)
  }

  has(id: IPage['id']) {
    // if (isComponent(id)) return this.#cache.has(id)
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

  remove(page: NUIPage) {
    this.#pages.has(page.id) && this.#pages.delete(page.id)
  }
}

export default PageCache
