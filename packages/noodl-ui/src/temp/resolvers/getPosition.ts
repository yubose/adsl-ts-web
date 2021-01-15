import { ComponentObject } from 'noodl-types'
import { hasDecimal, hasLetter } from '../../utils/common'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getFonts',
  resolve(component: ComponentObject, { viewport }) {
    if (!component) return
    if (!component.style) component.style = {}

    if (!viewport) return

    if ('zIndex' in component.style) {
      component.style.zIndex = Number(component.style.zIndex)
    }
    if (typeof component.style.top !== 'undefined') {
      Object.assign(
        component.style,
        handlePosition(component.style, 'top', viewport.height as number),
      )
    }
    if (typeof component.style.left !== 'undefined') {
      Object.assign(
        component.style,
        handlePosition(component.style, 'left', viewport.width as number),
      )
    }
  },
}

function handlePosition(styleObj: any, key: string, viewportSize: number) {
  const value = styleObj[key]
  // String
  if (typeof value === 'string') {
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
