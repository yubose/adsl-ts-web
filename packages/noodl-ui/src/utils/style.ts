import * as u from '@jsmanifest/utils'
import type { StyleObject } from 'noodl-types'
import { hasDecimal, hasLetter } from './common'

export const xKeys = <const>['width', 'left']
export const yKeys = <const>['height', 'top', 'marginTop']
export const posKeys = <const>[...xKeys, ...yKeys]
// Style keys that map their values relative to the viewport's height
export const vpHeightKeys = <const>[
  ...yKeys,
  'borderRadius',
  'fontSize',
  'paddingTop',
  'paddingBottom',
  'marginBottom',
]
export const vpWidthKeys = <const>[
  ...xKeys,
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
]

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
    if (!hasLetter(value)) {
      return { [key]: getViewportRatio(viewportSize, value) + 'px' }
    }
  }
  // Number
  else if (hasDecimal(styleObj?.[key]))
    return { [key]: getViewportRatio(viewportSize, value) + 'px' }

  return undefined
}

// TODO - Deprecate this in favor of Viewport.getSize
/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
export function getSize(value: string | number, viewportSize: number) {
  if (value == '0') return '0px'
  if (value == '1') return `${viewportSize}px`
  if (u.isStr(value)) {
    if (!hasLetter(value)) return `${Number(value) * viewportSize}px`
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
 * @param { number | null } vpSize
 * @param { string | number } value
 * @returns { number }
 */
export function fromVpSize(vpSize: number | null, value: string | number) {
  if (vpSize == null) return value as number
  const num = toNum(value)
  return Number.isNaN(num) ? value : toNum(((num / 100) * vpSize).toFixed(2))
}

/**
 * @param { number | null } vpSize
 * @param { string | number } value
 * @param { 'vw' | 'vh' } unit
 * @returns { string }
 */
export function toVpSize(
  vpSize: number | null,
  value: string | number,
  unit: 'vw' | 'vh' | false,
) {
  if (vpSize == null) return value as number
  //
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

/**
 * If this returns true, the value is something like "0.2", "0.4", etc.
 * Whole numbers like "1" or "5" will return false, which is not what we want for positioning values like "marginTop" or "top" since we assume "1" means full screen, etc.
 */
export function isNoodlUnit(value: unknown): value is string {
  return u.isStr(value) && !/[a-zA-Z]/i.test(value) && (value as any) % 1 !== 0
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 */
export function toNum(value: unknown) {
  if (u.isNum(value)) return value
  else if (u.isStr(value)) return Number(value.replace(/[a-zA-Z]/gi, ''))
  return Number(value)
}
