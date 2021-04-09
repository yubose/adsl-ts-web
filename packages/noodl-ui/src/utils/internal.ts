import {
  ComponentType,
  Identify,
  PluginComponentObject,
  PluginHeadComponentObject,
  PluginBodyTailComponentObject,
} from 'noodl-types'
import { actionTypes } from '../constants'
import {
  NUIActionType,
  NUIActionObjectInput,
  NUIComponent,
  Plugin,
} from '../types'

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
export const entries = (v: any) => (isObj(v) ? Object.entries(v) : [])
export const keys = (v: any) => Object.keys(v)
export const values = <O extends Record<string, any>, K extends keyof O>(
  v: O,
): O[K][] => Object.values(v)

export function createPluginId(
  location: Plugin.Location,
  component:
    | NUIComponent.Instance
    | PluginComponentObject
    | PluginHeadComponentObject
    | PluginBodyTailComponentObject
    | undefined,
) {
  let id = location + ':'
  if (component) {
    id +=
      'get' in component ? component?.blueprint?.path : component?.path || ''
  } else {
    id += 'head'
  }
  return id
}

export function getPluginLocation(
  component:
    | NUIComponent.Instance
    | PluginComponentObject
    | PluginHeadComponentObject
    | PluginBodyTailComponentObject
    | string
    | undefined,
): Plugin.Location {
  if (isStr(component)) {
    return component as Plugin.Location
  } else {
    switch ((component?.type as ComponentType) || '') {
      case 'pluginBodyTail':
        return 'body-bottom'
      default:
        return 'head'
    }
  }
}

/**
 * Returns a random 7-character string
 */
export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function isOutboundLink(s: string | undefined = '') {
  return /https?:\/\//.test(s)
}

// Custom formatting output for NodeJS console
// https://nodejs.org/api/util.html#util_util_inspect_custom
export const inspect = Symbol.for('nodejs.util.inspect.custom')

export function mapActionTypesToOwnArrays<V = any>(): Record<
  NUIActionType,
  V[]
> {
  return actionTypes.reduce(
    (acc, t: NUIActionType) => assign(acc, { [t]: [] }),
    {} as Record<NUIActionType, V[]>,
  )
}
