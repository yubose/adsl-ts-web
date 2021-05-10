import { NUIComponent } from '../types'

export const isArr = (v: any): v is any[] => Array.isArray(v)
export const isBool = (v: any): v is boolean => typeof v === 'boolean'
export const isNum = (v: any): v is number => typeof v === 'number'
export const isFnc = (v: any): v is (...args: any[]) => any =>
  typeof v === 'function'
export const isStr = (v: any): v is string => typeof v === 'string'
export const isNull = (v: any): v is null => v === null
export const isUnd = (v: any): v is undefined => v === undefined
export const isNil = (v: any): v is null | undefined => isNull(v) || isUnd(v)
export const isObj = <V extends Record<string, any>>(v: any): v is V =>
  !!v && !isArr(v) && typeof v === 'object'

export const assign = (
  v: Record<string, any> = {},
  ...rest: (Record<string, any> | undefined)[]
) => Object.assign(v, ...rest)

export const array = <O extends any[], P extends O[number]>(o: P | P[]): P[] =>
  isArr(o) ? o : [o]

export const arrayEach = <O extends any[], P extends O[number]>(
  obj: P | P[],
  fn: (o: P) => void,
) => void (isFnc(fn) && array(obj).forEach(fn))

export function createGlobalComponentId(
  component: NUIComponent.Instance | string | undefined,
) {
  return !isUnd(component)
    ? isStr(component)
      ? component
      : component.blueprint?.popUpView ||
        component.blueprint?.viewTag ||
        component.get('popUpView') ||
        component.get('viewTag') ||
        component.id ||
        ''
    : ''
}

export const entries = (v: any) => (isObj(v) ? Object.entries(v) : [])

export const keys = (v: any) => Object.keys(v)

export const mapEntries = <O extends Record<string, any> | Map<string, any>>(
  fn: (key: string, value: any) => void,
  obj: O | null | undefined,
) => {
  if (obj instanceof Map) return Array.from(obj)
  return isObj(obj) ? entries(obj).map(([k, v]) => fn(k, v)) : obj
}

export function eachEntries<
  O extends Record<string, any> = Record<string, any>
>(fn: (key: string, value: any) => void, obj: O | null | undefined): void

export function eachEntries<
  O extends Record<string, any> = Record<string, any>
>(obj: O | null | undefined, fn: (key: string, value: any) => void): void

export function eachEntries<
  O extends Record<string, any> = Record<string, any>
>(
  fn: ((key: string, value: any) => void) | O | null | undefined,
  obj: O | null | undefined | ((key: string, value: any) => void),
) {
  if (isFnc(fn)) {
    isObj(obj) && entries(obj).forEach(([k, v]) => fn(k, v))
  } else if (isFnc(obj)) {
    isObj(fn) && entries(fn).forEach(([k, v]) => obj(k, v))
  }
}

export const values = <O extends Record<string, any>, K extends keyof O>(
  v: O,
): O[K][] => Object.values(v)

/**
 * Returns a random 7-character string
 */
export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

// Custom formatting output for NodeJS console
// https://nodejs.org/api/util.html#util_util_inspect_custom
export const inspect = Symbol.for('nodejs.util.inspect.custom')

export function mapKeysToOwnArrays<K extends string, A = any>(keys: K[]) {
  return keys.reduce(
    (acc, key) => assign(acc, { [key]: [] }),
    {} as Record<K, A[]>,
  )
}
