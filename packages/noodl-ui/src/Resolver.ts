import { ComponentInstance, ConsumerOptions, ResolverFn } from './types'
import NOODLUI from './noodl-ui'

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

export class InternalResolver {
  #isInternal: boolean = false
  #resolver: Parameters<InternalResolver['setResolver']>[0]

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

  setResolver(
    resolver: <C extends ComponentInstance>(
      component: C,
      consumerOptions: ConsumerOptions,
      ref: NOODLUI,
    ) => void,
  ) {
    this.#resolver = resolver
    return this
  }

  resolve(
    component: ComponentInstance,
    options: ConsumerOptions,
    ref: NOODLUI,
  ) {
    this.#resolver?.(component, options, ref)
    return this
  }
}

export default Resolver
