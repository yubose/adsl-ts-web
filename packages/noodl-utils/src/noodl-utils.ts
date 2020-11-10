import {
  IComponentTypeObject,
  IComponentTypeInstance,
  IComponentType,
  IComponent,
} from 'noodl-ui'
import { isArr, isBool, isFnc, isObj, isStr, isUnd } from './_internal'
import * as T from './types'

/**
 * Takes a callback and an "if" object. The callback will receive the three
 * values that the "if" object contains. The first item will be the value that
 * should be evaluated, and the additional (item 2 and 3) arguments will be the values
 * deciding to be returned. If the callback returns true, item 2 is returned. If
 * false, item 3 is returned
 * @param { function } fn - Callback that receives the value being evaluated
 * @param { NOODLIfObject } ifObj - The object that contains the "if"
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

/**
 * Traverses the children hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned child
 * @param { IComponentTypeInstance } component
 * @param { function } fn - Comparator function
 */
export function findChild<Component extends { children?: Function } = any>(
  component: Component,
  fn: (child: Component) => boolean,
): Component | null {
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
 * Loops through a Map of UIComponents, running the comparator function in each
 * iteration. If the function returns true, that node will become the returned result
 * @param { Map<IComponentTypeInstance, IComponentTypeInstance> } nodes - Nodes map
 * @param { function } fn - Comparator func
 */
export function findNodeInMap<Component extends {} = any>(
  nodes: Map<Component, Component>,
  fn: (component: Component | null) => boolean | void,
) {
  const nodesList = Array.from(nodes.values())
  const nodesListSize = nodesList.length

  for (let index = 0; index < nodesListSize; index++) {
    const node = nodesList[index]
    if (fn(node)) return node
  }
  return null
}

/**
 * Traverses the parent hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned parent
 * @param { IComponentTypeInstance } component
 * @param { function } fn
 */
export function findParent<C extends { parent?: Function } = any>(
  component: C,
  fn: (parent: C | null) => boolean,
) {
  let parent = component.parent?.()
  if (fn(parent)) return parent
  if (parent) {
    while (parent) {
      parent = parent.parent?.()
      if (fn(parent)) return parent
    }
  }
  return parent || null
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

export function isComponentInstance(
  component: any,
): component is IComponentTypeInstance {
  return (typeof component === 'object' &&
    typeof component?.children === 'function') as boolean
}

export function isTextFieldLike(
  node: unknown,
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    node &&
    node instanceof HTMLElement &&
    !!(
      node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA'
    )
  )
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
