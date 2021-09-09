import { ActionType, EmitObject, IfObject } from 'noodl-types'
import { componentTypes } from './constants'
import { isBool, isObj } from './_internal'

export function isAction(value: any, actionType?: ActionType) {
  if (arguments.length === 1) {
    return (
      isObj(value) &&
      ('actionType' in value || 'goto' in value || isEmitObj(value))
    )
  } else if (arguments.length > 1) {
    return !!(actionType && isObj(value) && actionType in value)
  }
  return false
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

export function isBreakLineObject<T extends { br: any } = { br: string }>(
  value: unknown,
): value is T {
  if (value && typeof value === 'object' && 'br' in value) return true
  return false
}

export function isBreakLineTextBoardItem<
  T extends { br: any } = { br: string }
>(value: unknown): value is 'br' | T {
  return value === 'br' || isBreakLineObject(value)
}

export function isComponent(value: unknown) {
  return (
    !!value &&
    isObj(value) &&
    'type' in value &&
    componentTypes.includes(value.type)
  )
}

export function isEmitObj(value: unknown): value is EmitObject {
  return !!(value && typeof value === 'object' && 'emit' in value)
}

export function isIfObj(value: any): value is IfObject {
  return value && typeof value === 'object' && 'if' in value
}

const pluginTypes = ['plugin', 'pluginHead', 'pluginBodyTop', 'pluginBodyTail']

export function isPluginComponent(value: any) {
  return !!(value && pluginTypes.includes(value?.type))
}

/**
 * Returns true if the value possibly leads to some data, which is possible
 * for strings that have at least a dot in them which can be some dataKey
 * @param { string } value
 */
export function isPossiblyDataKey(value: unknown) {
  return typeof value === 'string' ? !!value.match(/\./g)?.length : false
}
