import _ from 'lodash'
import { IComponent, IResolver, ResolverFn, ConsumerOptions } from './types'

class Resolver implements IResolver {
  #resolver: ResolverFn | null = null

  setResolver(resolver: ResolverFn) {
    this.#resolver = resolver
    return this
  }

  resolve(component: IComponent, options: ConsumerOptions) {
    this.#resolver?.(component, options)
    return this
  }
}

export default Resolver
