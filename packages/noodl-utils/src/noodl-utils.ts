import { NOODLActionObject } from 'noodl-ui'
import { isArr, isBool, isNum, isObj, isStr, isUnd } from './_internal'
import * as T from './types'

/** Returns true if the value is an object. Like those with an actionType prop */
export function isAction(value: unknown): value is NOODLActionObject {
  if (isObj(value)) {
    if ('actionType' in value) return true
    if ('goto' in value) return true
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

export function isPasswordInput(value: unknown) {
  return (
    isObj(value) &&
    value['type'] === 'textField' &&
    value['contentType'] === 'password'
  )
}

/** Returns true if value has a viewTag of "selfStream", false otherwise */
export function isSelfStreamComponent(value: unknown) {
  return isStr(value) && /selfStream/i.test(value)
}

/** Returns true if value is a date component, false otherwise */
export function isDateComponent(value: unknown): value is T.DateLike {
  return isObj(value) && 'text=func' in value
}

export function isTextBoardComponent(value: unknown): value is T.TextLike {
  return isObj(value) && isStr(value['text'])
}
