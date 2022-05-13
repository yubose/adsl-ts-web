import type { LiteralUnion } from 'type-fest'
import type {
  ReferenceString,
  ReferenceSymbol,
  StyleObject,
  VpUnit,
  VpValue,
} from 'noodl-types'
import { Identify } from 'noodl-types'
import {
  nil,
  num,
  str,
  validViewport,
  vw,
  vh,
  vwVh,
  keyRelatedToHeight,
  keyRelatedToWidth,
  keyRelatedToWidthOrHeight,
} from './is'
import { hasDecimal, toArr, toPath } from './fp'
import type { IViewport } from '../types'
import * as c from '../constants'

export function ensureCssUnit(value: string | number, unit = 'px') {
  if (str(value) && hasLetter(value)) return value
  return `${value}${unit}`
}

/**
 * Converts 0x000000 to #000000 format
 * @param { string } value - Raw color value from NOODL
 */
export function formatColor(value: string) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value.replace('0x', '#')
  }
  return value || ''
}

export function getPositionProps(
  styleObj: StyleObject | undefined,
  key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
  viewportSize: number,
) {
  if (!styleObj) return
  const value = styleObj?.[key]
  // String
  if (str(value)) {
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

export function getRefProps(ref: ReferenceString) {
  const path = trimReference(ref)
  const paths = path.split('.')
  return {
    isLocalRef: Identify.localReference(ref),
    isLocalKey: Identify.localKey(path),
    paths,
    path,
    ref,
  }
}

export function getNextRootKeyProps(
  currentPaths: string | string[],
  currentRootKey?: string,
) {
  let paths = toPath(trimReference(toArr(currentPaths).join('.')))
  let rootKey = currentRootKey || ''

  if (paths.length) {
    if (rootKey) {
      if (paths[0] === rootKey) {
        paths.shift()
      }
    } else {
      //
    }
  }

  return { paths, path: paths.join('.'), rootKey }
}

/**
 * Returns the computed size.
 * @param { string | number } value - Size in decimals as written in NOODL
 * @param { number } vpSize - The maximum width (or height)
 */
export function getSize<U extends 'px' | 'noodl' = 'px' | 'noodl'>(
  value: string | number,
  vpSize: number,
  { toFixed = 2, unit }: { toFixed?: number; unit?: U } = {},
) {
  let result: any
  if (value == '0') {
    result = 0
  } else if (value == '1') {
    result = Number(vpSize)
  } else {
    if (str(value)) {
      if (!hasLetter(value)) {
        result = Number(value) * vpSize
      } else {
        result = value.replace(/[a-zA-Z]+/gi, '')
      }
    } else if (num(value)) {
      result = hasDecimal(value) ? value * vpSize : value
    }
  }
  if (nil(result)) return result
  switch (unit) {
    // NOODL
    case 'noodl':
      return (Number(result) / vpSize).toFixed(toFixed)
    // Transformed
    case 'px':
      return `${Number(result).toFixed(toFixed)}px`
    default:
      // TODO - Wrap to coerce to number type
      return Number(result).toFixed(toFixed)
  }
}

/**
 * Returns viewport.width or viewport.height, or null is viewport is invalid
 * @param viewport
 * @param value
 * @returns
 */
export function getViewportBound(
  viewport: IViewport | null | undefined,
  value: LiteralUnion<Parameters<typeof getVpKey>[0], string>,
) {
  const vpKey = getVpKey(value as any)
  if (vpKey !== null && validViewport(viewport)) return viewport[vpKey]
  return null
}

/**
 * Returns a ratio (in pixels) computed from a total given viewport size
 * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
 * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
 */
export function getViewportRatio(viewportSize: number, size: string | number) {
  if (str(size) || num(size)) {
    return viewportSize * Number(size)
  }
  return viewportSize
}

export function getVpKey(
  value:
    | VpValue
    | (
        | typeof c.vpHeightKeys[number]
        | typeof c.vpWidthKeys[number]
        | typeof c.textAlignStrings[number]
      ),
) {
  if (vw(value) || keyRelatedToWidth(value)) return 'width'
  if (vh(value) || keyRelatedToHeight(value)) return 'height'
  return 'height'
}

/**
 * Returns true if there is any letter in the string
 * @param { string } value - Value to evaluate
 */
export function hasLetter(value: any): boolean {
  return /[a-zA-Z]/i.test(String(value))
}

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
} as const

/**
 * Trims the reference prefix in the string
 * @param v Reference string
 * @param fixType 'prefix'
 */
export function trimReference(
  v: LiteralUnion<ReferenceString, string>,
  fixType: 'prefix',
): ReferenceString<Exclude<ReferenceSymbol, '@'>>

/**
 * Trims the reference suffix in the string
 * @param v Reference string
 * @param fixType 'suffix'
 */
export function trimReference(
  v: LiteralUnion<ReferenceString, string>,
  fixType: 'suffix',
): ReferenceString<Extract<ReferenceSymbol, '@'>>

/**
 * Trims the both prefix and the suffix symbol(s) in the reference string
 * @param v Reference string
 * @return { string }
 */
export function trimReference(v: LiteralUnion<ReferenceString, string>): string

/**
 * Trims the both prefix and the suffix symbol(s) in the reference string
 * Optionally provide a second parameter with "prefix" to trim only the prefix,
 * and vice versa for the suffix
 *
 * ex: "=.builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "=..builtIn.string.concat" --> "builtIn.string.concat"
 * ex: ".builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "..builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "____.builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "_.builtIn.string.concat" --> "builtIn.string.concat"
 *
 * @param v Reference string
 * @param fixType (Optional) Either "prefix" or "suffix"
 * @returns string
 */
export function trimReference<
  V extends LiteralUnion<ReferenceString, string>,
  F extends 'prefix' | 'suffix',
>(v: LiteralUnion<V, string>, fixType?: F) {
  if (fixType === 'prefix') {
    if (trimReference.regex.prefix.test(v)) {
      return v.replace(trimReference.regex.prefix, '')
    }
    return v
  }

  if (fixType === 'suffix') {
    if (trimReference.regex.suffix.test(v))
      "return v.replace(trimReference.regex.suffix, '')"
    return v
  }

  return (
    v
      .replace(trimReference.regex.prefix, '')
      .replace(trimReference.regex.suffix, '') || ''
  )
}

trimReference.regex = {
  prefix: /^[.=@]+/i,
  suffix: /[.=@]+$/i,
}
