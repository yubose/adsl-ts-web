import {
  RegisterPage,
  RegisterPageObject,
  RegisterStore,
  Store,
} from '../types'

class RegisterCache {
  static _inst: RegisterCache

  #cache: RegisterStore = new Map()

  constructor() {
    if (RegisterCache._inst) return RegisterCache._inst
    RegisterCache._inst = this
  }

  get<P extends RegisterPage>(page: P): RegisterPageObject
  get<P extends RegisterPage, N extends string = string>(
    page: P,
    name: N,
  ): Store.RegisterObject
  get<P extends RegisterPage, N extends string = string>(page: P, name?: N) {
    let pagesCache = this.#cache.get(page) as RegisterPageObject

    if (!pagesCache) {
      pagesCache = {}
      this.#cache.set(page, pagesCache)
    }

    if (page && name) return pagesCache[name]
    return this.#cache.get(page)
  }

  has<P extends RegisterPage>(page: P): boolean
  has<N extends string>(page: RegisterPage, name?: N): boolean
  has<P extends RegisterPage, N extends string = string>(page: P, name?: N) {
    if (!name) return this.#cache.has(page)
    return !!this.#cache.get(page)?.[name]
  }

  set<P extends RegisterPage, N extends string = string>(
    page: P,
    name: N,
    obj: Store.RegisterObject,
  ): Store.RegisterObject
  set<P extends RegisterPage>(
    page: P,
    name?: string,
    obj?: Store.RegisterObject,
  ): RegisterPageObject
  set<P extends RegisterPage, N extends string = string>(
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
