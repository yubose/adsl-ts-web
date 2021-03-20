import { LiteralUnion } from 'type-fest'
import { PlainObject } from '../types'

export const isArr = (v: any): v is any[] => Array.isArray(v)
export const isBool = (v: any): v is boolean => typeof v === 'boolean'
export const isNum = (v: any): v is number => typeof v === 'number'
export const isFnc = (v: any): v is (...args: any[]) => any =>
  typeof v === 'function'
export const isStr = (v: any): v is string => typeof v === 'string'
export const isNull = (v: any): v is null => v === null
export const isUnd = (v: any): v is undefined => v === undefined
export const isNil = (v: any): v is null | undefined => isNull(v) && isUnd(v)
export const isObj = <V extends PlainObject>(v: any): v is V =>
  !!v && !isArr(v) && typeof v === 'object'

export const assign = (v: PlainObject, ...rest: (PlainObject | undefined)[]) =>
  Object.assign(v, ...rest)
export const entries = (v: any) => (isObj(v) ? Object.entries(v) : [])
export const keys = (v: any) => Object.keys(v)
