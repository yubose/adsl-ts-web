import { ComponentInstance, ConsumerOptions, ResolverFn } from './types'

class Resolver {
  #isInternal: boolean = false
  #resolver: ResolverFn | null = null

  get internal() {
    return this.#isInternal
  }

  set internal(internal: boolean) {
    if (!internal) {
      throw new Error(
        'An internal resolver cannot disable its internal behavior',
      )
    }
    this.#isInternal = internal
  }

  setResolver(resolver: ResolverFn) {
    this.#resolver = resolver
    return this
  }

  resolve(component: ComponentInstance, options: ConsumerOptions) {
    this.#resolver?.(component, options)
    return this
  }
}

export default Resolver
