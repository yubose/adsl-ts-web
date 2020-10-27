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

// export function injectToTree(
//   component: IComponent,
//   injectProps: Partial<ProxiedComponent> & { [key: string]: any },
// ) {
//   const _entries = Object.entries(injectProps)

//   function _inject(child: IComponent | undefined) {
//     if (child && _entries.length) {
//       _entries.forEach(([propName, propValue]) => {
//         child.set?.(propName, propValue)
//       })
//     }
//     return child
//   }

//   function _createChild(c: IComponent) {
//     return function (...args: Parameters<IComponent['createChild']>) {
//       const child = _inject(c.createChild(...args))
//       if (child) child['createChild'] = _createChild(child)
//       return child
//     }
//   }

//   component['createChild'] = _createChild(component)

//   return component
// }

export function findChild(
  component: IComponent,
  fn: (child: IComponent | null) => boolean,
): IComponent | null {
  if (component) {
    let children = component.children().reverse()
    let child: IComponent | undefined = children.pop()
    if (child) {
      if (fn(child)) return child
      if (child.length) {
        return findChild(child, fn)
      }
    }
  }
  return null
}

/**
 * Compares the predicate function to the component's parent. If the function
 * returns true it will return that parent, otherwise it will find the next parent
 * in the chain and so on
 * @param { IComponent } component
 */
export function findParent(
  component: IComponent,
  fn: (parent: IComponent | null) => boolean,
) {
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

/**
 * Uses the value given to find a list corresponding to its relation
 * @param { Map } lists - List of lists
 * @param { any } value
 */
export function findList(
  lists: Map<IListComponent, IListComponent>,
  component: string | IComponent | IListComponent | IListItemComponent,
) {
  let result: any[] | null = null

  if (component) {
    let listComponent: IListComponent
    let listComponents = Array.from(lists.values())
    let listSize = lists.size

    // Assuming it is a component's id, we will use this and traverse the whole list,
    // comparing the id to each of the list's tree
    if (typeof component === 'string') {
      let child: any
      const componentId = component
      const fn = (c: IComponent) => !!c.id && c.id === componentId
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        if (listComponent.id === component) {
          result = listComponent.getData()
          break
        }
        child = findChild(listComponent, fn)
        if (child) {
          result = listComponent.getData?.()
          break
        }
      }
    }
    // Directly return the data
    else if (component instanceof ListComponent) {
      return component.getData()
    }
    // List item components should always be direct children of ListComponents
    else if (component instanceof ListItemComponent) {
      result = (component.parent() as IListComponent)?.getData?.()
    }
    // Regular components should not hold the list data or data objects, so we
    // will assume here that it is some nested child. We can get the list by
    // traversing parents
    else if (component instanceof Component) {
      let parent: any
      const fn = (c: IComponent) => c === listComponent
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        parent = findParent(component, fn)
        if (parent) {
          result = parent.getData?.()
          break
        }
      }
    }
  }

  return result || null
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

export function isParent<Parent extends IComponent = IComponent>(
  parent: Parent | string,
  child: IComponent | null,
) {
  if (child && parent && child instanceof Component) {
    let parentId: string = ''
    let parentInst: IComponent | null = null
    if (isStr(parent)) parentId = parent
    else if (parent instanceof Component) parentInst = parent
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
