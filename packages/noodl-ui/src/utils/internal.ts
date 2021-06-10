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

interface Duration {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

function toInteger(number: number | undefined) {
  if (typeof number !== 'number') number = Number(number)
  return number < 0 ? Math.ceil(number) : Math.floor(number)
}

export function addDate(dirtyDate: Date, duration: Duration): Date {
  if (!duration || typeof duration !== 'object') return new Date(NaN)

  const years = 'years' in duration ? toInteger(duration.years) : 0
  const months = 'months' in duration ? toInteger(duration.months) : 0
  const weeks = 'weeks' in duration ? toInteger(duration.weeks) : 0
  const days = 'days' in duration ? toInteger(duration.days) : 0
  const hours = 'hours' in duration ? toInteger(duration.hours) : 0
  const minutes = 'minutes' in duration ? toInteger(duration.minutes) : 0
  const seconds = 'seconds' in duration ? toInteger(duration.seconds) : 0

  // Add years and months
  const date = new Date(dirtyDate.getTime())
  const dateWithMonths =
    months || years ? addMonths(date, months + years * 12) : date

  // Add weeks and days
  const dateWithDays =
    days || weeks ? addDays(dateWithMonths, days + weeks * 7) : dateWithMonths

  // Add days, hours, minutes and seconds
  const minutesToAdd = minutes + hours * 60
  const secondsToAdd = seconds + minutesToAdd * 60
  const msToAdd = secondsToAdd * 1000
  const finalDate = new Date(dateWithDays.getTime() + msToAdd)

  return finalDate
}

/**
 * Taken from https://github.com/date-fns/date-fns/blob/2005427a6c50967d7b50830fb33e753bb2df39a8/src/addDays/index.ts#L27
 */
export function addDays(dirtyDate: Date, dirtyAmount: number): Date {
  const date = new Date(dirtyDate.getTime())
  const amount = toInteger(dirtyAmount)
  if (isNaN(amount)) return new Date(NaN)
  // If 0 days, no-op to avoid changing times in the hour before end of DST
  if (!amount) return date
  date.setDate(date.getDate() + amount)
  return date
}

/**
 * Taken from https://github.com/date-fns/date-fns/blob/2005427a6c50967d7b50830fb33e753bb2df39a8/src/addMonths/index.ts#L27
 */
export default function addMonths(dirtyDate: Date, dirtyAmount: number): Date {
  const date = new Date(dirtyDate.getTime())
  const amount = toInteger(dirtyAmount)
  if (isNaN(amount)) return new Date(NaN)
  // If 0 months, no-op to avoid changing times in the hour before end of DST
  if (!amount) return date
  const dayOfMonth = date.getDate()
  const endOfDesiredMonth = new Date(date.getTime())
  endOfDesiredMonth.setMonth(date.getMonth() + amount + 1, 0)
  const daysInMonth = endOfDesiredMonth.getDate()
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth
  } else {
    date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth,
    )
    return date
  }
}

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

export function eachEntries<
  O extends Record<string, any> = Record<string, any>,
>(fn: (key: string, value: any) => void, obj: O | null | undefined): void

export function eachEntries<
  O extends Record<string, any> = Record<string, any>,
>(obj: O | null | undefined, fn: (key: string, value: any) => void): void

export function eachEntries<
  O extends Record<string, any> = Record<string, any>,
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

// Convert the date to the start of the day
// https://github.com/date-fns/date-fns/blob/master/src/startOfDay/index.ts
export function getStartOfDay(dirtyDate: Date) {
  const date = new Date(dirtyDate.getTime())
  date.setHours(0, 0, 0, 0)
  return date
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
