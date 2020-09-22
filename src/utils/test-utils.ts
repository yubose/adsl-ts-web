import _ from 'lodash'
import { queryHelpers } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
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
  NOODLActionTriggerType,
  Viewport,
} from 'noodl-ui'

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')

export function mapUserEvent(noodlEventType: NOODLActionTriggerType) {
  switch (noodlEventType) {
    case 'onClick':
      return userEvent.click
    case 'onHover':
    case 'onMouseEnter':
      return userEvent.hover
    case 'onMouseLeave':
    case 'onMouseOut':
      return userEvent.unhover
    default:
      break
  }
}

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
