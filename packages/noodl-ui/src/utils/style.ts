import * as u from '@jsmanifest/utils'
import { StyleObject } from 'noodl-types'
import { hasDecimal, hasLetter } from './common'

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top', 'marginTop']
export const posKeys = [...xKeys, ...yKeys]

export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
] as const

export function getPositionProps(
  styleObj: StyleObject | undefined,
  key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
  viewportSize: number,
) {
  
  
  if (!styleObj) return
  const value = styleObj?.[key]
  // String
  if (u.isStr(value)) {
    if (value == '0') return { [key]: '0px' }
    if (value == '1') return { [key]: `${viewportSize}px` }
    if (!hasLetter(value)){
      return { [key]: getViewportRatio(viewportSize, value) + 'px' }
    }
  }
  // Number
  else if (hasDecimal(styleObj?.[key]))
    return { [key]: getViewportRatio(viewportSize, value) + 'px' }

  return undefined
}

/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
export function getSize(value: string | number, viewportSize: number) {
  if (value == '0') return '0px'
  if (value == '1') return `${viewportSize}px`
  if (u.isStr(value)) {
    if (!hasLetter(value)) {
      return `${Number(value) * viewportSize}px`
    }
    // Assuming it already has a 'px' appended
    return value
  }
  if (isFinite(value)) {
    if (hasDecimal(value)) return `${value * viewportSize}px`
    return `${value}px`
  }
  return value
}

/**
 *  Returns an object transformed using the value of textAlign
 * @param { object } style
 * @param { string } textAlign - NOODL textAlign value
 */
export function getTextAlign(
  textAlign: string,
): undefined | Record<string, any> {
  if (
    !textAlignStrings.includes(textAlign as typeof textAlignStrings[number])
  ) {
    return
  }
  if (textAlign === 'centerX') return { textAlign: 'center' }
  if (textAlign === 'centerY') return { display: 'flex', alignItems: 'center' }
  // NOTE: careful about passing "y" into here
  switch (textAlign) {
    case 'left':
    case 'center':
    case 'right':
      return { textAlign }
  }
}

/**
 * Returns a ratio (in pixels) computed from a total given viewport size
 * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
 * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
 */
export function getViewportRatio(viewportSize: number, size: string | number) {
  if (u.isStr(size) || u.isNum(size)) {
    return viewportSize * Number(size)
  }
  return viewportSize
}
