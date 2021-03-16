import isFinite from 'lodash/isFinite'
import { ResolverFn } from '../types'
import { hasDecimal, hasLetter } from '../utils/common'

/**
 * Takes an object and returns a new object representing the NOODL
 *  attributes
 */
const getSizes: ResolverFn = (component, options) => {
  const { viewport } = options

  const width = component.getStyle('width')
  const height = component.getStyle('height')

  if (width !== undefined) {
    component.setStyle(
      'width',
      String(getSize(width, viewport.width as number)),
    )
  }

  if (height !== undefined) {
    component.setStyle(
      'height',
      String(getSize(height, viewport.height as number)),
    )
  }
}

/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
export function getSize(value: string | number, viewportSize: number) {
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

export default getSizes
