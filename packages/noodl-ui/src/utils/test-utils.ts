import _ from 'lodash'
import getAlignAttrs from '../resolvers/getAlignAttrs'
import getBorderAttrs from '../resolvers/getBorderAttrs'
import getColors from '../resolvers/getColors'
import getChildren from '../resolvers/getChildren'
import getCustomDataAttrs from '../resolvers/getCustomDataAttrs'
import getElementType from '../resolvers/getElementType'
import getEventHandlers from '../resolvers/getEventHandlers'
import getFontAttrs from '../resolvers/getFontAttrs'
import getPosition from '../resolvers/getPosition'
import getReferences from '../resolvers/getReferences'
import getSizes from '../resolvers/getSizes'
import getStylesByElementType from '../resolvers/getStylesByElementType'
import getTransformedAliases from '../resolvers/getTransformedAliases'
import getTransformedStyleAliases from '../resolvers/getTransformedStyleAliases'
import makeComponentResolver from '../factories/makeComponentResolver'
import { ComponentResolver, Page, ProxiedComponent, Resolver } from '../types'

export interface MakeResolverTestOptions {
  roots?: { [key: string]: any }
  resolvers?: Resolver | Resolver[]
  page?: { name: string; object: null | { [key: string]: any } }
}

export interface GetComponentResolver {
  (componentResolver: ComponentResolver): any
}

export type ResolverTest = ReturnType<typeof makeResolverTest>

export const makeResolverTest = (function () {
  let componentResolver = makeComponentResolver({ roots: {} })

  function resolve(component: ProxiedComponent): ProxiedComponent
  function resolve(getComponentResolver: GetComponentResolver): any
  function resolve(component: ProxiedComponent | GetComponentResolver) {
    componentResolver
      .setAssetsUrl('https://something.com/assets/')
      .setPage({ name: '', object: null } as Page)
      .setRoot({})
      .setViewport({ width: 375, height: 667 })

    if (_.isPlainObject(component)) {
      return componentResolver.resolve(component as ProxiedComponent)
    } else if (_.isFunction(component)) {
      return component(componentResolver)
    }
  }

  return function makeResolverTest({
    roots,
    resolvers: resolversProp = getAllResolvers(),
    page,
  }: MakeResolverTestOptions = {}) {
    componentResolver.setResolvers(
      ...(!_.isArray(resolversProp) ? [resolversProp] : resolversProp),
    )
    if (page) componentResolver.setPage(page as Page)
    if (roots) componentResolver.setRoot(roots)
    return resolve
  }
})()

export function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getChildren,
    getCustomDataAttrs,
    getElementType,
    getEventHandlers,
    getFontAttrs,
    getPosition,
    getReferences,
    getSizes,
    getStylesByElementType,
    getTransformedAliases,
    getTransformedStyleAliases,
  ] as Resolver[]
}
