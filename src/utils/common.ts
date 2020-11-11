import _ from 'lodash'

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
export function forEachEntries<Obj>(
  value: Obj,
  callback: <K extends keyof Obj>(key: K, value: Obj[K]) => void,
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
export function forEachDeepEntries<Obj extends {}, K extends keyof Obj>(
  value: Obj | undefined,
  callback: (key: string, value: Obj[K], obj: Obj) => void,
) {
  if (_.isArray(value)) {
    _.forEach(value, (val) => forEachDeepEntries(val, callback))
  } else if (_.isPlainObject(value)) {
    forEachEntries(value as Obj, (k, v: Obj[K]) => {
      callback(k, v, value as Obj)
      forEachDeepEntries(v, callback as any)
    })
  }
}

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachEntriesOnObj<Obj>(
  value: Obj,
  callback: <K extends keyof Obj>(key: K, value: Obj[K]) => void,
) {
  if (value && _.isObject(value)) {
    _.forEach(_.entries(value), _.spread(callback))
    callback('', value)
  }
}

/**
 * Runs forEach on each key/value pair of the value, passing in the key as the first
 * argument and the value as the second argument on each iteration.
 * This is a recursion version of forEachEntries
 * @param { object } value
 * @param { function } callback - Callback function to run on each key/value entry
 */
export function forEachDeepEntriesOnObj<Obj extends {}, K extends keyof Obj>(
  value: Obj | undefined,
  callback: (key: string, value: Obj[K], obj: Obj) => void,
) {
  if (_.isArray(value)) {
    _.forEach(value, (val) => forEachDeepEntries(val, callback))
  } else if (_.isPlainObject(value)) {
    forEachEntries(value as Obj, (k, v: Obj[K]) => {
      callback(k, v, value as Obj)
      forEachDeepEntries(v, callback as any)
    })
  }
}

/**
 * Runs reduce on each key/value pair of the value, passing in the key and value as an
 * object like { key, value } on each iteration as the second argument
 * @param { object } value
 * @param { function } callback - Callback to invoke on the key/value object. This function should be in the form of a reducer callback
 * @param { any? } initialValue - An optional initial value to start the accumulator with
 */
export function reduceEntries<Obj>(
  value: Obj,
  callback: <K extends keyof Obj>(
    acc: any,
    { key, value }: { key: K; value: Obj[K] },
    index: number,
  ) => typeof acc,
  initialValue?: any,
) {
  if (value && _.isObject(value)) {
    return _.reduce(
      _.entries(value),
      (acc, [key, value], index) =>
        callback(acc, { key: key as keyof Obj, value }, index),
      initialValue,
    )
  }
  return value
}

/**
 * Returns whether the web app is running on a mobile browser.
 * @return { boolean }
 */
export function isMobile() {
  return _.isString(navigator?.userAgent)
    ? /Mobile/.test(navigator.userAgent)
    : false
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
    // const a = document.createElement('a')
    // a.href = url
    // a.setAttribute('target', '_blank')
    // a.setAttribute('rel', 'noopener noreferrer')
    // a.click()
    window.location.href = url
  }
}
