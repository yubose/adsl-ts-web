import {
  NOODLActionObject,
  Component,
  ListComponent,
  ListItemComponent,
  IComponent,
  IListComponent,
  IListItemComponent,
} from 'noodl-ui'
import { isArr, isBool, isNum, isObj, isStr, isUnd } from './_internal'
import * as T from './types'

/**
 * Uses the value given to find a list corresponding to its relation
 * @param { Map } lists - List of lists
 * @param { any } value
 */
export function findList(
  lists: Map<IListComponent, IListComponent>,
  component: any,
) {
  let result: any[] | undefined
  let listCount = lists.size

  if (component) {
    if (component instanceof Component) {
      let iterations = 0

      if (listCount >= 1) {
        while (listCount) {

        }
      }
    }

    if (component instanceof ListComponent) {
      //  return component.getData()
    } else if (component instanceof ListItemComponent) {
      const parent = component.parent()
      if (parent) {
        if (!(parent instanceof ListComponent)) {
          // while
        } else {
          return parent.getData()
        }
      }
    }
  }

  if (component) {
    //
  }

  return result || null
}

export const findParent = (function() {
  const _isParent = <Parent extends IComponent = IComponent>(parent: Parent | string, child: IComponent | null) => {
    if (child && parent && child instanceof Component) {
      let parentId: string = ''
      let parentInst: IComponent | null = null
      if (isStr(parent)) parentId = parent
      else if (parent instanceof Component) parentInst = parent 
      else return false
      return parentInst ? child.parent() === parentInst : !!child.parent()?.
    }
  }
  const isParent = (component: IComponent, fn: (parent: IComponent | null) => IComponent | null) => {

  }


    return function(component: IComponent, fn: (parent: IComponent | null) => IComponent | null) {

    }
})()

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
