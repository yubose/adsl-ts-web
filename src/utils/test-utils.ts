import _ from 'lodash'
import { queryHelpers } from '@testing-library/dom'
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
import NOODLUIDOM from 'noodl-ui-dom'

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')

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

export const noodluidom = (function () {
  let _inst: NOODLUIDOM = new NOODLUIDOM()

  Object.defineProperty(_inst, 'reset', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function () {
      _inst = new NOODLUIDOM()
    },
  })

  return _inst as NOODLUIDOM & { reset: () => any }
})()
