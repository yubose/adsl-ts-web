import e from 'express'
import isPlainObject from 'lodash/isPlainObject'
import spread from 'lodash/spread'

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachEntries<Obj extends {}, K extends keyof Obj>(
  value: Obj,
  callback: (key: string, value: Obj[K]) => void,
) {
  if (isPlainObject(value)) {
    Object.entries(value).forEach(spread(callback))
  }
}

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration.
 * This is a recursion version of forEachEntries
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachDeepEntries<Obj extends {}, K extends keyof Obj>(
  value: Obj | undefined,
  callback: (key: string, value: Obj[K], obj: Obj) => void,
) {
  if (Array.isArray(value)) {
    value.forEach((val) => forEachDeepEntries(val, callback))
  } else if (isPlainObject(value)) {
    Object.entries(value as Obj).forEach(([k, v]: [string, Obj[K]]) => {
      callback(k, v, value as Obj)
      forEachDeepEntries(v, callback as any)
    })
  }
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

/**
 * Returns a random 7-character string
 */
export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function isPromise(value: unknown): value is Promise<any> {
  window.isPromise = isPromise
  return value && typeof value === 'object' && 'then' in value
}

/**
 * Returns true if there is a decimal in the number.
 * @param { number } value - Value to evaluate
 */
export function hasDecimal(value: any): boolean {
  return Number(value) % 1 !== 0
}

/**
 * Returns true if there is any letter in the string
 * @param { string } value - Value to evaluate
 */
export function hasLetter(value: any): boolean {
  return /[a-zA-Z]/i.test(String(value))
}

export function isAllString(values: unknown): values is string
export function isAllString(values: unknown[]): values is string[]
export function isAllString(
  values: unknown | unknown[],
): values is string | string[] {
  return Array.isArray(values)
    ? !values.some((v) => typeof v !== 'string')
    : typeof values === 'string'
}

/**
 * Returns true if we are in the browser environment
 */
export function isBrowser() {
  return typeof window !== 'undefined'
}

export function toNumber(str: string) {
  let value: any
  if (hasLetter(str)) {
    const results = str.match(/[a-zA-Z]/i)
    if (results && results.index > -1) {
      value = Number(str.substring(0, results.index))
    }
  } else {
    value = Number(str)
  }
  return value
}
