import _ from 'lodash'
import {
  IComponent,
  Resolver as ResolverFn,
  ResolverConsumerOptions,
} from 'types'

class Resolver {
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
