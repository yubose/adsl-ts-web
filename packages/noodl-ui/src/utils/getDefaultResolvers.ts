import getCustomDataAttrs from '../resolvers/getCustomDataAttrs'
import getEventHandlers from '../resolvers/getEventHandlers'
import getPlugins from '../resolvers/getPlugins'
import getReferences from '../resolvers/getReferences'
import getTransformedAliases from '../resolvers/getTransformedAliases'
import resolveStyles from '../resolvers/resolveStyles'
import ComponentResolver from '../Resolver'
import { ResolverFn } from '../types'

function getDefaultResolvers() {
  const o = {
    getCustomDataAttrs,
    getEventHandlers,
    getPlugins,
    getReferences,
    getTransformedAliases,
    resolveStyles,
  }
  return Object.entries(o).reduce(
    (acc, [name, resolver]) =>
      Object.assign(acc, {
        [name]:
          resolver instanceof ComponentResolver
            ? resolver
            : new ComponentResolver(name, resolver),
      }),
    {} as Record<string, ComponentResolver<ResolverFn>>,
  )
}

export default getDefaultResolvers
