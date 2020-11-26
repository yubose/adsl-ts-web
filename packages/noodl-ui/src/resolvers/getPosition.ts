import _ from 'lodash'
import { hasDecimal, hasLetter } from '../utils/common'
import { ResolverFn } from '../types'

/**
 * Returns attributes according to NOODL position properties like 'top', 'left'
 */
const getPosition: ResolverFn = (component, { context }) => {
  if (!context.viewport) return
  const { viewport } = context
  const { style } = component

  if (style) {
    if ('zIndex' in style) {
      component.setStyle('zIndex', Number(style.zIndex))
    }
    let styles
    if ('zIndex' in style) {
      component.setStyle('zIndex', Number(style.zIndex))
    }
    if (!_.isUndefined(style.top)) {
      styles = handlePosition(style, 'top', viewport.height as number)
      if (styles) {
        component.assignStyles(styles)
      }
    }
    if (!_.isUndefined(style.left)) {
      styles = handlePosition(style, 'left', viewport.width as number)
      if (styles) {
        component.assignStyles(styles)
      }
    }
  }
}

function handlePosition(styleObj: any, key: string, viewportSize: number) {
  const value = styleObj[key]
  // String
  if (_.isString(value)) {
    if (value == '0') {
      return { [key]: '0px' }
    } else if (value == '1') {
      return { [key]: `${viewportSize}px` }
    } else if (!hasLetter(value)) {
      return { [key]: getViewportRatio(viewportSize, value) + 'px' }
    }
  }
  // Number
  else if (hasDecimal(styleObj.top)) {
    return { [key]: getViewportRatio(viewportSize, value) + 'px' }
  }

  return undefined
}

/**
 * Returns a ratio (in pixels) computed from a total given viewport size
 * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
 * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
 */
function getViewportRatio(viewportSize: number, size: string | number) {
  if (typeof size === 'string') {
    if (hasDecimal(size)) {
      return viewportSize * Number(size)
    } else {
      return viewportSize / Number(size)
    }
  } else if (typeof size === 'number') {
    if (hasDecimal(size)) {
      return viewportSize * Number(size)
    } else {
      return viewportSize / Number(size)
    }
  }
  return viewportSize
}

export default getPosition
