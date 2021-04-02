import { NUIComponent, ConsumerOptions, ResolverFn } from './types'
import { isObj } from './utils/internal'

export interface IResolver<Func extends (...args: any[]) => any, Inst = any> {
  next: Inst | null
  resolver: Func
}

class Resolver<Func extends (...args: any[]) => any, Inst = any>
  implements IResolver<Func> {
  #resolve: IResolver<Func>['resolver']
  #next: Inst | null = null

  get next() {
    return this.#next
  }

  set next(node) {
    this.#next = node
  }

  get resolver() {
    return this.#resolve
  }

  set resolver(resolve) {
    this.#resolve = resolve
  }
}

class ComponentResolver<
  Func extends (...args: NUIComponent.ResolverArgs) => void = (
    ...args: NUIComponent.ResolverArgs
  ) => void
> extends Resolver<Func, ComponentResolver<Func>> {
  #isInternal: boolean = false
  #name: string

  constructor(name = '', resolver?: Func) {
    super()
    this.#name = name
    if (resolver) this.resolver = resolver
  }

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

  get name() {
    return this.#name
  }

  setResolver(resolver: ComponentResolver<Func>['resolver']) {
    super.resolver = resolver.bind(this)
    return this
  }

  resolve(component: NUIComponent.Instance, options: ConsumerOptions) {
    if (!component) {
      console.log(`Component is null or undefined`, {
        ...options,
        componentResolverId: this.name,
      })
      return
    }
    const resolveNext = function _resolveNext(
      this: ComponentResolver<Func>,
      opts?: Record<string, any>,
    ) {
      if (isObj(opts)) options = { ...options, ...opts }
      this.next?.resolve?.(component, options)
    }.bind(this)

    this.resolver?.(component, options, resolveNext)

    return this
  }

  toString() {
    return `Resolver [${this.#name}]`
  }
}

export class InternalComponentResolver {
  #isInternal: boolean = false
  #resolver: Parameters<InternalComponentResolver['setResolver']>[0]

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
    this.#resolver = resolver.bind(this)
    return this
  }

  resolve<C extends NUIComponent.Instance = NUIComponent.Instance>(
    component: C,
    options: ConsumerOptions,
    ref: any,
  ) {
    this.#resolver?.(component, options, ref)
    return this
  }

  toString() {
    return `Resolver [__internal__]`
  }
}

export default ComponentResolver
