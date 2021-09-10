import * as u from '@jsmanifest/utils'
import type { NuiComponent, ConsumerOptions } from './types'

export interface IResolver<
  Func extends (...args: any[]) => Promise<void>,
  Inst = any,
> {
  next: Inst | null
  resolver: Func
}

type ResolverArgs = [
  component: NuiComponent.Instance,
  options: ConsumerOptions,
  next: (opts?: Record<string, any>) => Promise<void>,
]

class Resolver<Func extends (...args: any[]) => Promise<void>, Inst = any>
  implements IResolver<Func>
{
  #resolve = {} as IResolver<Func>['resolver']
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
  Func extends (...args: ResolverArgs) => Promise<void> = (
    ...args: ResolverArgs
  ) => Promise<void>,
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
    this.resolver = resolver
    return this
  }

  async resolve(component: NuiComponent.Instance, options: ConsumerOptions) {
    if (!component) return
    const resolveNext = async function _resolveNext(
      this: ComponentResolver<Func>,
      opts?: Record<string, any>,
    ) {
      if (u.isObj(opts)) options = { ...options, ...opts }
      await this.next?.resolve?.(component, options)
    }.bind(this)

    await this.resolver?.(component, options, resolveNext)
  }

  toString() {
    return `Resolver [${this.#name}]`
  }
}

export class InternalComponentResolver {
  #isInternal: boolean = false
  #resolver = {} as Parameters<InternalComponentResolver['setResolver']>[0]

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
    resolver: (
      component: NuiComponent.Instance,
      consumerOptions: ConsumerOptions,
      next?: () => Promise<void>,
    ) => Promise<void>,
  ) {
    this.#resolver = resolver.bind(this)
    return this
  }

  async resolve(component: NuiComponent.Instance, options: ConsumerOptions) {
    await this.#resolver?.(component, options)
    return this
  }

  toString() {
    return `Resolver [__internal__]`
  }
}

export default ComponentResolver
