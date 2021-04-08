import NUIPage from '../Page'
import Viewport from '../Viewport'
import { ICache, Cache } from '../types'

class PageCache implements ICache {
  #pages = new Map() as Map<Cache.PageId, Cache.PageEntry>

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
    for (const [id] of this.#pages) {
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

  get(id: Cache.PageId): Cache.PageEntry
  get(id?: never): [Cache.PageEntry]
  get(id?: Cache.PageId) {
    if (!id) return Array.from(this.#pages.values())
    else return this.#pages.get(id)
  }

  has(id: Cache.PageId) {
    return this.#pages.has(id)
  }

  forEach(
    fn: (
      page: Cache.PageEntry,
      index: Cache.PageId,
      collection: Cache.Pages,
    ) => void,
  ) {
    this.#pages.forEach((obj, key, collection) => {
      fn(obj, key, collection)
    })
  }
}

export default PageCache
