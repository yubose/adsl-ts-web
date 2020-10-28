import { isArr, isBool, isFnc, isObj, isStr, isUnd } from './_internal'
import * as T from './types'

export function findChild(component: any, fn: (child: any) => boolean): any {
  if (component) {
    let children = component.children?.().reverse?.()
    let child = children.pop()
    if (child) {
      if (fn(child)) return child
      if (child.length) return findChild(child, fn)
    }
  }
  return null
}

/**
 * Compares the predicate function to the component's parent. If the function
 * returns true it will return that parent, otherwise it will find the next parent
 * in the chain and so on
 * @param { any } component
 */
export function findParent(component: any, fn: (parent: any) => boolean) {
  let parent = component.parent()
  if (fn(parent)) return parent
  if (parent) {
    while (parent) {
      if (fn(parent)) return parent
      parent = parent.parent()
    }
  }
  return parent
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

export function getByDataKey(value: string) {
  return document.querySelector(`[data-key="${value}"]`)
}

export function getByDataListId(value: string) {
  return document.querySelector(`[data-listid="${value}"]`)
}

export function getByDataName(value: string) {
  return document.querySelector(`[data-name="${value}"]`)
}

/** Returns true if the value is an object. Like those with an actionType prop */
export function isAction(value: unknown): any {
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

export function isParent(parent: any, child: any | null) {
  if (
    child &&
    parent &&
    !isArr(child) &&
    !isArr(parent) &&
    !isFnc(child) &&
    !isFnc(child)
  ) {
    let parentId: string = ''
    let parentInst: any | null = null
    if (isStr(parent)) parentId = parent
    else if (parent) parentInst = parent
    else return false
    return parentInst
      ? child.parent() === parentInst
      : !!parentId && child.parent()?.id === parentId
  }
  return false
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
