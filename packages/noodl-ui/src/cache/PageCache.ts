import NUIPage from '../Page'
import Viewport from '../Viewport'
import { ICache, IPage } from '../types'

class PageCache implements ICache {
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
      const pageObject = page.object()
      const components = pageObject.components
      if (pageObject !== null && typeof pageObject === 'object') {
        for (const [key, value] of Object.entries(pageObject)) {
          if (key === 'components') {
            components?.length && (components.length = 0)
          }
          delete pageObject[key]
        }
      }
      this.#pages.delete(id)
    }
  }

  create({ id, viewport }: { id?: string; viewport?: Viewport } = {}) {
    const page = new NUIPage(viewport, {
      id: id || (!this.#pages.size ? 'root' : undefined),
    })
    this.#pages.set(page.id, { page })
    return this.#pages.get(page.id)?.page as NUIPage
  }

  get(id: IPage['id']): { page: NUIPage }
  get(id?: never): [{ page: NUIPage }]
  get(id?: IPage['id']) {
    if (!id) return Array.from(this.#pages.values())
    else return this.#pages.get(id)
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
}

export default PageCache
