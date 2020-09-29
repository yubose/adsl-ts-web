import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  NOODL,
  Viewport,
} from 'noodl-ui'

export const noodl = new NOODL()
  .init({ viewport: new Viewport() })
  .setAssetsUrl('https://aitmed.com/assets/')
  .setViewport({ width: 375, height: 667 })
  .setResolvers(
    getElementType,
    getTransformedAliases,
    getReferences,
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getFontAttrs,
    getPosition,
    getSizes,
    getStylesByElementType,
    getTransformedStyleAliases,
    getChildren as any,
    getCustomDataAttrs,
    getEventHandlers,
  )
