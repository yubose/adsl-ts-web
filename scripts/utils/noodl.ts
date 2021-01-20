// @ts-nocheck
// import {
//   getElementType,
//   getAlignAttrs,
//   getBorderAttrs,
//   getCustomDataAttrs,
//   getChildren,
//   getColors,
//   getEventHandlers,
//   getFontAttrs,
//   getPosition,
//   getReferences,
//   getStylesByElementType,
//   getSizes,
//   getTransformedAliases,
//   getTransformedStyleAliases,
//   NOODL as NOODLUI,
//   Viewport,
// } from 'noodl-ui'

export let viewport
export let noodlui
export let noodl

export const initializeSdk = async () => {
  const { default: NOODL } = await import('@aitmed/cadl')
  noodl = new NOODL({
    aspectRatio: 3,
    cadlVersion: 'test',
    configUrl: 'https://public.aitmed.com/config/meet.yml',
  })
  return noodl
}

if (typeof window !== 'undefined') {
  import('noodl-ui')
    .then(
      async ({
        getElementType,
        getAlignAttrs,
        getBorderAttrs,
        getCustomDataAttrs,
        getColors,
        getEventHandlers,
        getFontAttrs,
        getPosition,
        getReferences,
        getStylesByElementType,
        getSizes,
        getTransformedAliases,
        getTransformedStyleAliases,
        NOODL: NOODLUI,
        Viewport,
      }) => {
        viewport = new Viewport()
        noodlui = new NOODLUI()
        noodl = await initializeSdk()

        noodlui
          .init({ viewport })
          .setAssetsUrl(noodl?.assetsUrl || '')
          .setPage({ name: '', object: null })
          .setRoot(noodl.root)
          .setViewport({
            width: window.innerWidth,
            height: window.innerHeight,
          })
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
            getCustomDataAttrs,
            getEventHandlers,
          )
      },
    )
    .catch((err) => {
      throw err
    })
}
