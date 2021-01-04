import getAlignAttrs from '../resolvers/getAlignAttrs'
import getBorderAttrs from '../resolvers/getBorderAttrs'
import getColors from '../resolvers/getColors'
import getCustomDataAttrs from '../resolvers/getCustomDataAttrs'
import getElementType from '../resolvers/getElementType'
import getEventHandlers from '../resolvers/getEventHandlers'
import getFontAttrs from '../resolvers/getFontAttrs'
import getPlugins from '../resolvers/getPlugins'
import getPosition from '../resolvers/getPosition'
import getReferences from '../resolvers/getReferences'
import getSizes from '../resolvers/getSizes'
import getStylesByElementType from '../resolvers/getStylesByElementType'
import getTransformedAliases from '../resolvers/getTransformedAliases'
import getTransformedStyleAliases from '../resolvers/getTransformedStyleAliases'
import { ResolverFn } from '../types'

function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getCustomDataAttrs,
    getElementType,
    getEventHandlers,
    getFontAttrs,
    getPlugins,
    getPosition,
    getReferences,
    getSizes,
    getStylesByElementType,
    getTransformedAliases,
    getTransformedStyleAliases,
  ] as ResolverFn[]
}

export default getAllResolvers
