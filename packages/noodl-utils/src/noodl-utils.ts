import get from 'lodash/get'
import has from 'lodash/has'
import { ActionObject } from 'noodl-types'
import { isArr, isObj, isStr, unwrapObj } from './_internal'
import * as T from './types'

/**
 * Transforms the dataKey of an emit object. If the dataKey is an object,
 * the values of each property will be replaced by the data value based on
 * the path described in its value. The 2nd arg should be a data object or
 * an array of data objects that will be queried against. Data keys must
 * be stripped of their iteratorVar prior to this call
 * @param { string | object } dataKey - Data key of an emit object
 * @param { object | object[] } dataObject - Data object or an array of data objects
 */
export function createEmitDataKey(
  dataKey: string | T.PlainObject,
  dataObject: T.QueryObj | T.QueryObj[],
  opts?: { iteratorVar?: string },
): any {
  if (isStr(dataKey)) {
    return findDataValue(
      dataObject,
      excludeIteratorVar(dataKey, opts?.iteratorVar),
    )
  } else if (isObj(dataKey)) {
    return Object.keys(dataKey).reduce((acc, property) => {
      acc[property] = findDataValue(
        dataObject,
        excludeIteratorVar(dataKey[property], opts?.iteratorVar),
      )
      return acc
    }, {} as { [varProp: string]: any })
  }
  return dataKey
}

export function excludeIteratorVar(dataKey: string, iteratorVar: string = '') {
  if (!isStr(dataKey)) return dataKey
  if (iteratorVar && dataKey.startsWith(iteratorVar)) {
    return dataKey.split('.').slice(1).join('.')
  }
  return dataKey
}

/**
 * Takes a callback and an "if" object. The callback will receive the three
 * values that the "if" object contains. The first item will be the value that
 * should be evaluated, and the additional (item 2 and 3) arguments will be the values
 * deciding to be returned. If the callback returns true, item 2 is returned. If
 * false, item 3 is returned
 * @param { function } fn - Callback that receives the value being evaluated
 * @param { IfObject } ifObj - The object that contains the "if"
 */
export function evalIf<IfObj extends { if: [any, any, any] }>(
  fn: (
    val: IfObj['if'][0],
    onTrue: IfObj['if'][1],
    onFalse: IfObj['if'][2],
  ) => boolean,
  ifObj: IfObj,
): IfObj['if'][1] | IfObj['if'][2] {
  if (Array.isArray(ifObj.if)) {
    const [val, onTrue, onFalse] = ifObj.if
    return fn(val, onTrue, onFalse) ? onTrue : onFalse
  }
  return false
}

type FindDataValueItem =
  | ((...args: any[]) => any)
  | T.PlainObject
  | FindDataValueItem[]

/**
 * Runs through objs and returns the value at path if a dataObject is received
 * @param { function | object | array } objs - Data objects to iterate over
 * @param { string | string[] } path
 */
export const findDataValue = <O extends FindDataValueItem = any>(
  objs: O,
  path: string | string[],
) => {
  if (!path) return unwrapObj(isArr(objs) ? objs[0] : objs)
  return get(
    unwrapObj(
      (isArr(objs) ? objs : [objs]).find((o) => has(unwrapObj(o), path)),
    ),
    path,
  )
}

export function getActionType<A extends ActionObject = any>(
  obj: A | undefined,
) {
  if (obj && typeof obj === 'object') {
    if ('actionType' in obj) return obj.actionType
    if ('emit' in obj) return 'emit'
    if ('goto' in obj) return 'goto'
  }
  return 'anonymous'
}

export function getAllByDataKey<Elem extends HTMLElement = HTMLElement>(
  dataKey?: string,
) {
  return Array.from(
    document.querySelectorAll(`[data-key${dataKey ? `="${dataKey}"` : ''}]`),
  ) as Elem[]
}

export function getAllByDataListId<Elem extends HTMLElement = HTMLElement>() {
  return Array.from(document.querySelectorAll('[data-listid]')) as Elem[]
}

export function getAllByDataName<Elem extends HTMLElement = HTMLElement>() {
  return Array.from(document.querySelectorAll('[data-name]')) as Elem[]
}

export function getAllByDataViewTag(viewTag: string) {
  return typeof viewTag === 'string'
    ? Array.from(document.querySelectorAll(`[data-viewtag="${viewTag}"]`))
    : []
}

export function getByDataKey(value: string) {
  return document.querySelector(`[data-key="${value}"]`)
}

export function getByDataListId(value: string) {
  return document.querySelector(`[data-listid="${value}"]`)
}

export function getDataValue<T = any>(
  dataObject: T | undefined,
  dataKey: string | undefined,
  opts?: { iteratorVar?: string },
) {
  if (dataObject && typeof dataKey === 'string') {
    if (typeof dataObject === 'object') {
      let dataPath = ''
      if (opts?.iteratorVar && dataKey.startsWith(opts.iteratorVar)) {
        // Strip off the iteratorVar to make the path correctly point to the value
        dataPath = dataKey.split('.').slice(1).join('.')
      } else {
        dataPath = dataKey
      }
      return get(dataObject, dataPath)
    }
  }
}
