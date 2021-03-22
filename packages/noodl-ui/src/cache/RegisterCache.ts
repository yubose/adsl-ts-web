import { Register, Store } from '../types'

class RegisterCache {
  #cache: Register.Storage = new Map()

  static _inst: RegisterCache

  constructor() {
    if (RegisterCache._inst) return RegisterCache._inst
    RegisterCache._inst = this
  }

  get<P extends Register.Page>(
    page: P,
  ): {
    [name: string]: Store.RegisterObject
  }
  get<P extends Register.Page, N extends string = string>(
    page: P,
    name: N,
  ): Store.RegisterObject
  get<P extends Register.Page, N extends string = string>(page: P, name?: N) {
    let pagesCache = this.#cache.get(page) as {
      [name: string]: Store.RegisterObject
    }

    if (!pagesCache) {
      pagesCache = {}
      this.#cache.set(page, pagesCache)
    }

    if (page && name) return pagesCache[name]
    return this.#cache.get(page)
  }

  has<P extends Register.Page>(page: P): boolean
  has<N extends string>(page: Register.Page, name?: N): boolean
  has<P extends Register.Page, N extends string = string>(page: P, name?: N) {
    if (!name) return this.#cache.has(page)
    return !!this.#cache.get(page)?.[name]
  }

  set<P extends Register.Page, N extends string = string>(
    page: P,
    name: N,
    obj: Store.RegisterObject,
  ): Store.RegisterObject
  set<P extends Register.Page>(
    page: P,
    name?: string,
    obj?: Store.RegisterObject,
  ): {
    [name: string]: Store.RegisterObject
  }
  set<P extends Register.Page, N extends string = string>(
    page: P,
    name?: N,
    obj?: Store.RegisterObject,
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
