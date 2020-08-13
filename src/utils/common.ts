import green from '@material-ui/core/colors/green'
import deepOrange from '@material-ui/core/colors/deepOrange'
import teal from '@material-ui/core/colors/teal'
import red from '@material-ui/core/colors/red'
import isString from 'lodash/isString'

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
 * Returns true if value is an html element, false otherwise
 * @param { any } value - Value to check
 */
export function isElement(value: any): value is Element | HTMLDocument {
  if (!value) return false
  return value instanceof Element || value instanceof HTMLDocument
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
  return isString(value) && value.startsWith('\\u')
}

/** Returns the last element in the array. Otherwise it will return undefined
 * @param { any[] } value
 */
export function last<T extends any[]>(value: T): T[number] | undefined {
  if (Array.isArray(value)) {
    if (value.length) return value[value.length - 1]
    return value[0]
  }
  return
}

/**
 * Prints data to the console (colors are supported)
 * @param { string } msg - Console message
 */
export function log(msg: any, style?: any, obj?: any) {
  let args = [`%c${msg}`]
  // Object
  if (msg && typeof msg === 'object') {
    const options = msg
    args = [`%c${options.msg}`]
    let str = 'font-weight:bold;'
    if (options.color) str += `color:${options.color};`
    args.push(str)
    if (options.data) args.push(options.data)
  }
  // String
  else {
    if (style) {
      if (typeof style === 'string') {
        args.push(style)
      } else {
        let styleStr = 'font-weight:bold;'
        if (style.color) styleStr += `color:${style.color};`
        args.push(styleStr)
      }
    }
    if (obj) args.push(obj)
  }
  console.log(...args)
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

/**
 * Convenience utility to abstract out the redundancy stuff when logging for success/info/error/warn purposes
 * @param { string | object } msg - A message as a string or an object of options
 */
function wrapLog(type: 'error' | 'info' | 'success' | 'warn') {
  return (msg: any, obj?: any) => {
    let options: { msg?: any; data?: any; color?: string } = { msg: '' }
    // logError('abc123', {...})
    if (isString(msg)) {
      options['msg'] = msg
      if (obj) options['data'] = obj
    }
    // logError({ msg: 'abc123', data: {...} } )
    else if (msg) options = msg
    if (type === 'error') options['color'] = red.A400
    if (type === 'info') options['color'] = teal.A700
    if (type === 'success') options['color'] = green.A400
    if (type === 'warn') options['color'] = deepOrange[400]
    log(options)
  }
}

export const logError = wrapLog('error')
export const logInfo = wrapLog('info')
export const logSuccess = wrapLog('success')
export const logWarn = wrapLog('warn')

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
