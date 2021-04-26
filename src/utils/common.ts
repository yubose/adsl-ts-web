import get from 'lodash/get'
import has from 'lodash/has'
import { ActionObject, UncommonActionObjectProps } from 'noodl-types'
import { Store } from 'noodl-ui'
import { LiteralUnion } from 'type-fest'
import util from 'util'

export const array = <O extends any[], P extends O[number]>(o: P | P[]): P[] =>
  isArr(o) ? o : [o]
export const assign = (
  v: Record<string, any>,
  ...rest: (Record<string, any> | undefined)[]
) => Object.assign(v, ...rest)
export const entries = (v: any) => (isObj(v) ? Object.entries(v) : [])
export const isArr = (v: any): v is any[] => Array.isArray(v)
export const isBool = (v: any): v is boolean => typeof v === 'boolean'
export const isObj = (v: any): v is { [key: string]: any } =>
  !!v && !isArr(v) && typeof v === 'object'
export const isNum = (v: any): v is number => typeof v === 'number'
export const isStr = (v: any): v is string => typeof v === 'string'
export const isUnd = (v: any): v is undefined => typeof v === 'undefined'
export const isNull = (v: any): v is null => v === null
export const isNil = (v: any): v is null | undefined => isNull(v) && isUnd(v)
export const isFnc = <V extends (...args: any[]) => any>(v: any): v is V =>
  typeof v === 'function'
export const keys = (v: any) => Object.keys(v)
export const values = <O extends Record<string, any>, K extends keyof O>(
  v: O,
): O[K][] => Object.values(v)

export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
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

export const inspect = util.inspect.custom

export function isUnitTestEnv() {
  return process.env.NODE_ENV === 'test'
}

export function isStable() {
  return process.env.ECOS_ENV === 'stable'
}

export function isTest() {
  return process.env.ECOS_ENV === 'test'
}

export function isOutboundLink(s: string | undefined = '') {
  return /https?:\/\//.test(s)
}

type ActionObjectArg =
  | Parameters<Store.BuiltInObject['fn']>[0]
  | Parameters<Store.ActionObject['fn']>[0]
  | Record<string, any>

export function pickActionKey<
  A extends ActionObjectArg = ActionObjectArg,
  K extends keyof (ActionObject | UncommonActionObjectProps) = keyof (
    | ActionObject
    | UncommonActionObjectProps
  )
>(action: A, key: LiteralUnion<K, string>) {
  if (!key) return
  const result = get(action.original, key)
  return isUnd(result) ? get(action, key) : result
}

export function pickHasActionKey<
  A extends ActionObjectArg = ActionObjectArg,
  K extends keyof (ActionObject | UncommonActionObjectProps) = keyof (
    | ActionObject
    | UncommonActionObjectProps
  )
>(action: A, key: LiteralUnion<K, string>) {
  if (!key || !(isObj(action) || isFnc(action))) return false
  return has(action, 'original') ? has(action.original, key) : has(action, key)
}

/**
 * Parses a NOODL destination, commonly received from goto
 * or pageJump actions as a string. The return value (for now) is
 * intended to be directly assigned to page.pageUrl (subject to change)
 * The target string to analyze here is the "destination" which might come
 * in various forms such as:
 *    GotoViewTag#redTag
 *
 * @param { string } pageUrl - Current page url (should be page.pageUrl from the Page instance)
 * @param { string } options.destination - Destination
 * @param { string } options.startPage
 */
export function resolvePageUrl({
  destination = '',
  pageUrl = '',
  startPage = '',
}: {
  destination: string
  pageUrl: string
  startPage?: string
}) {
  pageUrl = pageUrl?.startsWith?.('index.html?')
    ? pageUrl
    : pageUrl + 'index.html?'

  let separator = pageUrl.endsWith('?') ? '' : '-'

  if (destination !== startPage) {
    const questionMarkIndex = pageUrl.indexOf(`?${destination}`)
    const hyphenIndex = pageUrl.indexOf(`-${destination}`)
    if (questionMarkIndex !== -1) {
      pageUrl = pageUrl.substring(0, questionMarkIndex + 1)
      separator = pageUrl.endsWith('?') ? '' : '-'
      pageUrl += `${separator}${destination}`
    } else if (hyphenIndex !== -1) {
      pageUrl = pageUrl.substring(0, hyphenIndex)
      separator = pageUrl.endsWith('?') ? '' : '-'
      pageUrl += `${separator}${destination}`
    } else {
      pageUrl += `${separator}${destination}`
    }
  } else {
    pageUrl = 'index.html?'
  }
  return pageUrl
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
