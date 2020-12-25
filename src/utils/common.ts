import spread from 'lodash/spread'
import isPlainObject from 'lodash/isPlainObject'

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
  if (value && typeof value === 'object') {
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
    forEachEntries(value as Obj, (k, v: Obj[K]) => {
      callback(k, v, value as Obj)
      forEachDeepEntries(v, callback as any)
    })
  }
}

export function getAspectRatio(width: number, height: number) {
  /**
   * The binary Great Common Divisor calculator (fastest performance)
   * https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio
   * @param { number } u - Upper
   * @param { number } v - Lower
   */
  const getGCD = (u: number, v: number): any => {
    if (u === v) return u
    if (u === 0) return v
    if (v === 0) return u
    if (~u & 1)
      if (v & 1) return getGCD(u >> 1, v)
      else return getGCD(u >> 1, v >> 1) << 1
    if (~v & 1) return getGCD(u, v >> 1)
    if (u > v) return getGCD((u - v) >> 1, v)
    return getGCD((v - u) >> 1, u)
  }

  const getSizes = (w: number, h: number) => {
    var d = getGCD(w, h)
    return [w / d, h / d]
  }

  const [newWidth, newHeight] = getSizes(width, height)
  const aspectRatio = newWidth / newHeight
  return aspectRatio
}

/**
 * Returns whether the web app is running on a mobile browser.
 * @return { boolean }
 */
export function isMobile() {
  return typeof navigator?.userAgent === 'string'
    ? /Mobile/.test(navigator.userAgent)
    : false
}
/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}
