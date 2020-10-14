import _ from 'lodash'
import {
  IComponent,
  IResolver,
  ResolverFn,
  ResolverConsumerOptions,
} from './types'

class Resolver implements IResolver {
  #resolver: ResolverFn | null = null

  setResolver(resolver: ResolverFn) {
    this.#resolver = resolver
    return this
  }

  resolve(component: IComponent, options: ResolverConsumerOptions) {
    this.#resolver?.(component, options)
    return this
  }
}

export default Resolver
