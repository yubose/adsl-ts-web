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
  IResolver,
  NOODL,
  Resolver,
  ResolverFn,
  Viewport,
} from 'noodl-ui'

export const noodl = new NOODL()
  .init({ viewport: new Viewport() })
  .setAssetsUrl('https://aitmed.com/assets/')
  .use(
    [
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
    ].reduce(
      (acc, r: ResolverFn) => acc.concat(new Resolver().setResolver(r)),
      [] as IResolver[],
    ),
  )
