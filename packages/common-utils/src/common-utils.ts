export function array<O extends any[], P extends O[number]>(o: P | P[]): P[] {
  return isArr(o) ? o : [o]
}

export function arrayEach<O extends any[], P extends O[number]>(
  obj: P | P[],
  fn: (o: P) => void,
) {
  array(obj).forEach(fn)
}

export function assign(
  v: Record<string, any>,
  ...rest: (Record<string, any> | undefined)[]
) {
  return Object.assign(v, ...rest)
}

export function entries(v: any) {
  return isObj(v) ? Object.entries(v) : []
}

export function isArr(v: any): v is any[] {
  return Array.isArray(v)
}

export function isBool(v: any): v is boolean {
  return typeof v === 'boolean'
}

export function isObj(v: any): v is { [key: string]: any } {
  return !!v && !isArr(v) && typeof v === 'object'
}

export function isNum(v: any): v is number {
  return typeof v === 'number'
}

export function isStr(v: any): v is string {
  return typeof v === 'string'
}

export function isUnd(v: any): v is undefined {
  return typeof v === 'undefined'
}

export function isNull(v: any): v is null {
  return v === null
}

export function isNil(v: any): v is null | undefined {
  return isNull(v) && isUnd(v)
}

export function isFnc<V extends (...args: any[]) => any>(v: any): v is V {
  return typeof v === 'function'
}

export function keys(v: any) {
  return Object.keys(v)
}

export function eachEntries<O extends Record<string, any> | Map<string, any>>(
  fn: (key: string, value: any) => void,
  obj: O | null | undefined,
) {
  if (obj) {
    if (obj instanceof Map) {
      for (const [key, value] of obj) fn(key, value)
    } else if (isObj(obj)) {
      entries(obj).forEach(([k, v]) => fn(k, v))
    }
  }
}

export function values<O extends Record<string, any>, K extends keyof O>(
  v: O,
): O[K][] {
  return Object.values(v)
}

export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export const inspect = Symbol.for('nodejs.util.inspect.custom')

export function isStable() {
  return process.env.ECOS_ENV === 'stable'
}

export function isTest() {
  return process.env.ECOS_ENV === 'test'
}

export function isOutboundLink(s: string | undefined = '') {
  return /https?:\/\//.test(s)
}

export function mapEntries<
  Obj extends Record<string, any>,
  Key extends keyof Obj = keyof Obj,
  RT = any
>(fn: (key: Key, value: Obj[Key]) => RT, obj: Obj): RT[] {
  return entries(obj).map(([k, v]) => fn(k as Key, v))
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
