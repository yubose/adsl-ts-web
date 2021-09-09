import { ResolverFn } from '../types'
import Resolver from '../Resolver'

function createResolver(name: string, resolve: ResolverFn): Resolver<any>
function createResolver(args: {
  name: string
  resolve: ResolverFn
}): Resolver<any>
function createResolver(resolve: ResolverFn): Resolver<any>
function createResolver(
  name: string | { name: string; resolve: ResolverFn } | ResolverFn,
  args?: ResolverFn,
) {
  let resolve: ResolverFn | undefined

  if (typeof name === 'string') {
    resolve = args
  } else if (typeof name === 'function') {
    resolve = name
    name = ''
  } else if (name !== null && typeof name === 'object') {
    resolve = name.resolve
    name = name.name
  }

  const resolver = new Resolver(name).setResolver(resolve as ResolverFn)
  return resolver
}

export default createResolver
