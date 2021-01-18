import isFinite from 'lodash/isFinite'
import { ComponentObject } from 'noodl-types'
import { hasDecimal, hasLetter } from '../../utils/common'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getSizes',
  resolve(component: ComponentObject, { viewport } = {}) {
    if (!component) return
    if (!component.style) component.style = {}

    const { width, height } = component.style

    if (width !== undefined) {
      component.style.width = String(getSize(width, viewport.width as number))
    }
    if (height !== undefined) {
      component.style.height = String(
        getSize(height, viewport.height as number),
      )
    }
  },
}

/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
function getSize(value: string | number, viewportSize: number) {
  if (value == '0') {
    return '0px'
  } else if (value == '1') {
    return `${viewportSize}px`
  } else {
    if (typeof value === 'string') {
      if (!hasLetter(value)) {
        if (hasDecimal(value)) {
          return `${Number(value) * viewportSize}px`
        } else {
          return `${value}px`
        }
      } else {
        // Assuming it already has a 'px' appended
        return value
      }
    } else if (isFinite(value)) {
      if (hasDecimal(value)) {
        return `${value * viewportSize}px`
      } else {
        return `${value}px`
      }
    }
    return value
  }
}
