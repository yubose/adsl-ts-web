import _ from 'lodash'
import { CreateLoggerOptions } from 'app/types'

/**
 * Runs a series of functions from left to right, passing in the argument of the
 *    invokee to each function
 * @param { function[] } fns - Arguments of functions
 */

export function callAll(...fns: any[]) {
  return (...args: any[]) =>
    fns.forEach((fn) => typeof fn === 'function' && fn(...args))
}

/**
 * Takes a string that is a unicode, decodes it and returns the result
 *    (Useful for rendering raw unicode because react sanitizes input)
 * @param { string } value
 */
export function decodeUnicode(value: string) {
  return value.replace(/\\u(\w\w\w\w)/g, (a, b) => {
    return String.fromCharCode(parseInt(b, 16))
  })
}

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachEntries<Obj, K extends keyof Obj>(
  value: Obj,
  callback: (key: K, value: Obj[K]) => void,
) {
  if (value && _.isObject(value)) {
    _.forEach(_.entries(value), _.spread(callback))
  }
}

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration.
 * This is a recursion version of forEachEntries
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachDeepEntries<Obj, K extends keyof Obj>(
  value: Obj,
  callback: (key: K, value: Obj[K]) => void,
) {
  if (value) {
    if (_.isArray(value)) {
      _.forEach(value, (val) => forEachDeepEntries(val, callback))
    } else if (_.isPlainObject(value)) {
      forEachEntries(value, (innerKey, innerValue: Obj[K]) => {
        if (_.isPlainObject(innerValue)) {
          forEachDeepEntries(innerValue, callback as any)
        } else {
          callback(innerKey, innerValue)
        }
      })
    }
  }
}

/**
 * Returns whether the web app is running on a mobile browser.
 * @return { boolean }
 */
export function isMobile() {
  if (typeof navigator?.userAgent !== 'string') {
    return false
  }
  return /Mobile/.test(navigator.userAgent)
}

/**
 * Returns true if process.env.REACT_APP_ECOS_ENV === 'stable', otherswise false
 */
export function isStableEnv() {
  return process.env.REACT_APP_ECOS_ENV === 'stable'
}

/** Returns true if the string is potentially a unicode string
 * @param { string } value
 */
export function isUnicode(value: unknown) {
  return _.isString(value) && value.startsWith('\\u')
}

/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    a.click()
  }
}

export interface SerializedError {
  name: string
  message: string
  code?: number
  source?: string
}

export function serializeError(
  error: Error & { code?: number; source?: string },
): SerializedError {
  if (!error) {
    return { name: '', message: '' }
  }
  const params: any = { name: error.name, message: error.message }
  if (typeof error.code !== 'undefined') {
    params.code = error.code
  }
  if (typeof error.source !== 'undefined') {
    params.source = error.source
  }
  return params
}
