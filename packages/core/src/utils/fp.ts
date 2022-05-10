/**
 * Functional programming utilities
 */
import type { Path } from '../types'
import { arr, num, obj, str, und } from './is'

export function entries<O extends Record<string, any>>(v: O) {
  return Object.entries(v !== null && typeof v === 'object' ? v : {}) as [
    key: keyof O,
    value: O[keyof O],
  ][]
}

/**
 * Removes a keyword from the string
 * @example
 * ```js
 * const iteratorVar = 'itemObject'
 * const dataKey = 'itemObject.color'
 * const result = excludeStr(dataKey, iteratorVar) // "color"
 * ```
 * @param value String to manipulate
 * @param strToExclude String to remove
 * @returns The string result
 */
export function excludeStr(value: string, strToExclude: string) {
  if (!str(value)) return value
  if (value === strToExclude) return ''
  if (strToExclude && str(strToExclude) && value.includes(strToExclude)) {
    const sep = `${strToExclude}.`
    return value.split(sep).join('').replace(strToExclude, '')
  }
  return value
}

/**
 * Retrieves a value in obj using path
 * @param { Record<string, any> | any[] } value
 * @param { Path[number] | Path } path
 * @returns { any }
 */
export function get(value: any, path: Path[number] | Path): any {
  let _index = 0
  let _path = toPath(path)
  let _len = _path.length

  while (value != null && _index < _len) {
    let nextKey = _path[_index++]
    let nextKeyPath = toPath(nextKey) || []
    let key = (nextKeyPath?.join?.('.') || '') as keyof typeof value
    value = value[key]
  }

  return _index && _index == _len ? value : undefined
}

/**
 * Returns true if there is a decimal in the number.
 * @param { number } value - Value to evaluate
 */
export function hasDecimal(value: any): boolean {
  return Number(value) % 1 !== 0
}

export function merge<O = any>(value: O, ...rest: any[]): any {
  if (obj(value)) {
    rest.forEach((o) => {
      if (obj(o)) {
        Object.entries(o).forEach(([k, v]) => {
          o[k] = obj(v) ? merge(o[k], v) : v
        })
      }
    })
  }
  return value
}

export function omit<O extends Record<string, any>>(
  value: O,
  keys: string | string[],
) {
  value = { ...value }
  keys = toArr(keys)
  if (obj(value)) for (const key of keys) delete value[key]
  return value
}

/**
 * @param value Object
 * @param key Key or keys to pick from value
 */
export function pick<O extends Record<string, any>, K extends keyof O>(
  value: O,
  key: K | K[],
) {
  const result = {} as O

  if (value !== null && typeof value === 'object') {
    key = toArr(key)

    for (const [k, v] of entries(value)) {
      if (key.includes(k as any)) result[k] = v
    }
  }

  return result
}

/**
 * @param v Value
 * @returns The value wrapped in an array (if it was not already wrapped)
 */
export function toArr(v: unknown) {
  return Array.isArray(v) ? v : [v]
}

function toFixed(value: number, fixNum?: number) {
  return num(fixNum) ? value.toFixed(fixNum) : value
}

export function toPath(key = '' as string | number | (string | number)[]) {
  return (
    arr(key)
      ? key
      : str(key)
      ? key.split('.')
      : toArr(key).filter((fn) => !und(fn))
  ) as string[]
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 */
export function toNum(value: unknown, fixedNum?: number) {
  if (num(value)) return Number(toFixed(Number(value), fixedNum))
  else if (str(value)) {
    return Number(toFixed(Number(value.replace(/[a-zA-Z]/gi, '')), fixedNum))
  }
  return Number(value)
}
