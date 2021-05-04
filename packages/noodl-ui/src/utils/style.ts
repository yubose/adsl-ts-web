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

export function handlePosition(
  styleObj: any,
  key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
  viewportSize: number,
) {
  const value = styleObj[key]
  // String
  if (typeof value === 'string') {
    if (value == '0') return { [key]: '0px' }
    if (value == '1') return { [key]: `${viewportSize}px` }
    if (!hasLetter(value))
      return { [key]: getViewportRatio(viewportSize, value) + 'px' }
  }
  // Number
  else if (hasDecimal(styleObj[key]))
    return { [key]: getViewportRatio(viewportSize, value) + 'px' }

  return undefined
}

/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
export function getSize(value: string | number, viewportSize: number) {
  if (value == '0') {
    return '0px'
  }
  if (value == '1') {
    return `${viewportSize}px`
  }
  if (typeof value === 'string') {
    if (!hasLetter(value)) {
      if (hasDecimal(value)) {
        return `${Number(value) * viewportSize}px`
      }
      return `${value}px`
    }
    // Assuming it already has a 'px' appended
    return value
  }
  if (isFinite(value)) {
    if (hasDecimal(value)) {
      return `${value * viewportSize}px`
    }
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
  if (typeof size === 'string') {
    if (hasDecimal(size)) return viewportSize * Number(size)
    return viewportSize / Number(size)
  }
  if (typeof size === 'number') {
    if (hasDecimal(size)) return viewportSize * Number(size)
    return viewportSize / Number(size)
  }
  return viewportSize
}
