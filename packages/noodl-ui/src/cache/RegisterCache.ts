import { Register } from '../types'

class RegisterCache {
  #cache: Register.Storage = new Map()

  static _inst: RegisterCache

  constructor() {
    if (RegisterCache._inst) return RegisterCache._inst
    RegisterCache._inst = this
  }

  clear() {
    this.#cache.clear()
    return this
  }

  get<P extends Register.Page, N extends string = string>(
    page: P,
    name: N,
  ): Register.Object
  get<P extends Register.Page>(page: P): Record<string, Register.Object>
  get(): Register.Storage
  get<P extends Register.Page, N extends string = string>(page?: P, name?: N) {
    if (page) {
      let pagesCache = this.#cache.get(page)

      if (!pagesCache) {
        pagesCache = {}
        this.#cache.set(page, pagesCache)
      }
      if (page && name) return pagesCache[name]
      return this.#cache.get(page)
    }

    return this.#cache
  }

  has<P extends Register.Page>(page: P | undefined): boolean
  has<N extends string>(
    page: Register.Page | undefined,
    name?: N | undefined,
  ): boolean
  has<P extends Register.Page, N extends string = string>(page: P, name?: N) {
    if (!name) return this.#cache.has(page)
    return !!this.#cache.get(page)?.[name]
  }

  set<P extends Register.Page, N extends string = string>(
    page: P,
    name: N,
    obj: Register.Object,
  ): Register.Object
  set<P extends Register.Page>(
    page: P,
    name?: string,
    obj?: Register.Object,
  ): {
    [name: string]: Register.Object
  }
  set<P extends Register.Page, N extends string = string>(
    page: P,
    name?: N,
    obj?: Register.Object,
  ) {
    let pagesCache = this.get(page) || {}

    if (page && name && obj) {
      pagesCache[name] = obj
      this.#cache.set(page, pagesCache)
      return obj
    }
    this.#cache.set(page, pagesCache)
    return pagesCache
  }
}

export default RegisterCache
