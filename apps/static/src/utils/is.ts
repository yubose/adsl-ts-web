import * as u from '@jsmanifest/utils'
import { Identify } from 'noodl-types'

export function componentByReference(value: unknown) {
  if (u.isObj(value)) {
    const keys = u.keys(value)
    return keys.length === 1 && keys.some((key) => Identify.reference(key))
  }
  return false
}

/**
 * Returns true if an object requires dynamic handling
 *
 * @example
 * ```js
 * import * as is from '@utils/is'
 *
 * is.dynamicAction({ '..imgData@': [] }) // true
 * is.dynamicAction({ '..imgData@': 'abc' }) // true
 * is.dynamicAction({ '=..imgData@': {} }) // true
 * is.dynamicAction({ if: [] }) // false
 * is.dynamicAction({ if: [true, '=..imgData', '..imgData'] }) // false
 * is.dynamicAction({ actionType: 'saveObject', object: {} }) // false
 * is.dynamicAction({ goto: 'SignIn' }) // false
 * is.dynamicAction({ emit: { dataKey:{}, actions: [] } }) // false
 * ```
 *
 * @param value An object value
 */
export function dynamicAction(value: Record<string, any>) {
  if (u.isObj(value)) {
    if (
      [
        Identify.folds.emit,
        Identify.folds.goto,
        Identify.folds.if,
        Identify.action.any,
      ].every((fn) => !fn(value))
    ) {
      for (const [key, val] of u.entries(value)) {
        if (u.isStr(key) && Identify.reference(key)) return true
        if (u.isStr(val) && Identify.reference(val)) return true
      }
    }
  }
  return false
}

// TODO - Implement this utility in noodl-types
export function varReference(value: string | null | undefined) {
  return u.isStr(value) && value.startsWith('$')
}

export default {
  ...Identify,
  componentByReference,
  dynamicAction,
  varReference,
}
