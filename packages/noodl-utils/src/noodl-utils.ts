// @ts-nocheck
import Logger from 'logsnap'
import get from 'lodash/get'
import has from 'lodash/has'
import {
  ActionObject,
  Component,
  EmitActionObject,
  EmitObject,
  IfObject,
} from 'noodl-ui'
import { isArr, isBool, isObj, isStr, unwrapObj } from './_internal'
import * as T from './types'

const log = Logger.create('noodl-utils')

/**f
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
  } else {
    log.func('evalIf')
    log.red(
      `An "if" object was encountered but it was not an array. ` +
        `The evaluation operation was skipped`,
    )
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

/**
 * Returns true if the value is a NOODL boolean. A value is a NOODL boolean
 * if the value is truthy, true, "true", false, or "false"
 * @param { any } value
 */
export function isBoolean(value: unknown) {
  return isBool(value) || isBooleanTrue(value) || isBooleanFalse(value)
}

/**
 * Returns true if the value is a NOODL true type. A NOODL true type is any
 * value that is the boolean true or the string "true"
 * @param { any } value
 */
export function isBooleanTrue(value: unknown): value is true | 'true' {
  return value === true || value === 'true'
}

/**
 * Returns true if the value is a NOODL false type. A NOODL false type is any
 * value that is the boolean false or the string "false"
 */
export function isBooleanFalse(value: unknown): value is false | 'false' {
  return value === false || value === 'false'
}

export function isBreakLine(value: unknown): value is 'br' {
  return value === 'br'
}

export function isBreakLineObject<T extends { br: any } = { br: string }>(
  value: unknown,
): value is T {
  if (value && typeof value === 'object' && 'br' in value) return true
  return false
}

export function isBreakLineTextBoardItem<
  T extends { br: any } = { br: string }
>(value: unknown): value is 'br' | T {
  return isBreakLine(value) || isBreakLineObject(value)
}

export function isEmitObj(value: unknown): value is EmitObject {
  return !!(value && typeof value === 'object' && 'emit' in value)
}

export function isEmitActionObj(value: unknown): value is EmitActionObject {
  return !!(
    value &&
    typeof value === 'object' &&
    ('emit' in value || value['actionType'] === 'emit')
  )
}

export function isIfObj(value: any): value is IfObject {
  return value && typeof value === 'object' && 'if' in value
}

export function isListConsumer(component: any) {
  return !!(
    component?.get?.('iteratorVar') ||
    component?.get?.('listId') ||
    component?.get?.('listIndex') != undefined ||
    component?.noodlType === 'listItem' ||
    (component && findParent(component, (p) => p?.noodlType === 'listItem'))
  )
}

export function isPasswordInput(value: unknown) {
  return (
    isObj(value) &&
    value['type'] === 'textField' &&
    value['contentType'] === 'password'
  )
}

const pluginTypes = ['plugin', 'pluginHead', 'pluginBodyTop', 'pluginBodyTail']

export function isPluginComponent(value: any) {
  return !!(value && pluginTypes.includes(value?.noodlType || value?.type))
}

/**
 * Returns true if the value possibly leads to some data, which is possible
 * for strings that have at least a dot in them which can be some dataKey
 * @param { string } value
 */
export function isPossiblyDataKey(value: unknown) {
  return typeof value === 'string' ? !!value.match(/\./g)?.length : false
}

/** Returns true if value has a viewTag of "selfStream", false otherwise */
export function isSelfStreamComponent(value: unknown) {
  return isStr(value) && /selfStream/i.test(value)
}

/** Returns true if value is a date component, false otherwise */
export function isDateComponent(value: unknown): value is T.DateLike {
  return isObj(value) && 'text=func' in value
}

export function isTextBoardComponent<Component extends T.TextLike>(
  value: Component,
): value is Component {
  return isObj(value) && isStr(value['text'])
}

/* -------------------------------------------------------
  ---- Action identifiers
-------------------------------------------------------- */

/**
 * Recursively invokes the provided callback on each child
 * @param { Component } component
 * @param { function } cb
 */
// TODO - Depth option
export function publish(component: Component, cb: (child: Component) => void) {
  if (
    component &&
    typeof component === 'object' &&
    typeof component.function === 'function'
  ) {
    component.children().forEach((child: Component) => {
      cb(child)
      child?.children()?.forEach?.((c) => {
        cb(c)
        publish(c, cb)
      })
    })
  }
}
