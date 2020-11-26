import Logger from 'logsnap'
import get from 'lodash/get'
import has from 'lodash/has'
import {
  ActionObject,
  Component,
  createComponent,
  EmitActionObject,
  IComponent,
  IComponentTypeInstance,
  IComponentTypeObject,
  IfObject,
  IList,
  IListItem,
  NOODLComponent,
  NOODLComponentType,
} from 'noodl-ui'
import { isArr, isBool, isFnc, isObj, isStr } from './_internal'
import * as T from './types'

const log = Logger.create('noodl-utils')

// TODO - move to noodl-building-blocks
/**
 * Deeply creates children until the depth is reached
 * @param { NOODLComponentType | IComponentTypeInstance } c - Component instance
 * @param { object } opts
 * @param { number | undefined } opts.depth - The maximum depth to deeply recurse to. Defaults to 1
 * @param { object | undefined } opts.injectProps - Props to inject to desired components during the recursion
 * @param { object | undefined } opts.injectProps.last - Props to inject into the last created child
 */
export function createDeepChildren(
  c: NOODLComponentType | IComponentTypeInstance,
  opts?: {
    depth?: number
    injectProps?: { last?: { [key: string]: any } }
    onCreate?(
      child: IComponentTypeInstance,
      depth: number,
    ): Partial<NOODLComponent>
  },
): IComponentTypeInstance {
  if (opts?.depth) {
    let count = 0
    let curr =
      typeof c === 'string'
        ? (c = createComponent({ type: c, children: [] }))
        : c
    while (count < opts.depth) {
      const child = curr.createChild(
        createComponent({ type: 'view', children: [] }),
      )
      let injectingProps = opts?.onCreate?.(child, count)
      if (typeof injectingProps === 'object') {
        Object.entries(injectingProps).forEach(([k, v]) => child.set(k, v))
      }
      curr = child
      count++
      if (count === opts.depth) {
        if (opts.injectProps?.last) {
          Object.entries(opts.injectProps?.last).forEach(([k, v]) => {
            if (k === 'style') curr.set('style', k, v)
            else curr.set(k, v)
          })
        }
      }
    }
  }
  return c as IComponentTypeInstance
}

interface CreateEmitDataKeyOptionsObject {
  component?: IComponentTypeInstance
  iteratorVar?: string
  objs?:
    | ({ [key: string]: any } | (() => { [key: string]: any }))
    | ({ [key: string]: any } | (() => { [key: string]: any }))[]
}

/**f
 * Transforms the dataKey of an emit object. If the dataKey is an object,
 * the values of each property will be replaced by the data value based on
 * the path described in its value. If the 2nd arg is an options object and
 * a component is provided, it will check to see if the the path value begins
 * with a component's iteratorVar. If it does, it will remove the iteratorVar
 * and treat the rest of the string as a path of the expected dataObject
 * @param { string | object } dataKey - Data key of an emit object
 * @param { object } dataObject - Data object or an options object
 * @param { object | undefined } dataObject.component
 * @param { object | undefined } dataObject.dataObject
 * @param { object | undefined } dataObject.iteratorVar
 * @param { object | undefined } dataObject.pageObject
 * @param { object | undefined } dataObject.root
 */
export function createEmitDataKey(
  dataKey: string,
  options: CreateEmitDataKeyOptionsObject,
): any
/** asfs */
export function createEmitDataKey(
  dataKey: { [key: string]: any },
  options: CreateEmitDataKeyOptionsObject,
): any
export function createEmitDataKey(
  dataKey: string | { [key: string]: any },
  { component, iteratorVar, objs }: CreateEmitDataKeyOptionsObject = {},
) {
  iteratorVar = iteratorVar || component?.get?.('iteratorVar')

  if (isStr(dataKey)) {
    if (iteratorVar) {
      if (dataKey === iteratorVar) return findDataValue(objs, dataKey)
      if (dataKey.startsWith(iteratorVar)) {
        dataKey = dataKey.split('.').slice(1).join('.')
      }
    }
    return findDataValue(objs, dataKey)
  } else if (isObj(dataKey)) {
    return Object.keys(dataKey).reduce((acc, key) => {
      let path = dataKey[key] || ''
      if (iteratorVar) {
        if (path === iteratorVar) {
          acc[key] = findDataValue(objs, path)
          return acc
        } else if (path.startsWith(iteratorVar)) {
          path = path.split('.').slice(1).join('.')
        }
      }
      acc[key] = findDataValue(objs, path)
      return acc
    }, {} as { [varProp: string]: any })
  }
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

/**
 * Traverses the children hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned child
 * @param { IComponentTypeInstance } component
 * @param { function } fn - Comparator function
 */
export function findChild<C extends IComponentTypeInstance>(
  component: C,
  fn: (child: IComponentTypeInstance) => boolean,
): IComponentTypeInstance | null {
  let child: IComponentTypeInstance | null | undefined
  let children = component?.children?.()?.slice?.() || []

  if (component) {
    child = children.shift() || null
    while (child) {
      if (fn(child)) return child
      if (child?.length) {
        child
          .children?.()
          .forEach((c: IComponentTypeInstance) => children.push(c))
        child = children.pop()
      } else {
        break
      }
    }
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
export function findParent<C extends IComponentTypeInstance>(
  component: C,
  fn: (parent: IComponentTypeInstance | null) => boolean,
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

export function findDataObject(
  objs: any,
  opts: {
    component?: IComponentTypeInstance
    iteratorVar?: string
    path: string
  },
) {
  let path = opts.path
  if (opts.iteratorVar || opts.component?.get?.('iteratorVar')) {
    const iteratorVar = opts.iteratorVar || opts.component?.get('iteratorVar')
    if (path === iteratorVar) return findDataValue(objs, path)
    else if (path.startsWith(iteratorVar || '')) {
      path = path.split('.').slice(1).join('.')
    }
  }
  return findDataValue(objs, path)
}

export function findDataValue(objs: any, path: string) {
  return get((Array.isArray(objs) ? objs : [objs]).find(Boolean), path)
}

// interface FindDataObjectOptions {
//   component?: any
//   dataKey?: string
//   pageObject?: { [key: string]: any }
//   root?: { [key: string]: any }
// }
// export function findDataObject(component: IComponentTypeInstance): any
// export function findDataObject(component: FindDataObjectOptions): any
// export function findDataObject<O>(
//   component: IComponentTypeInstance | FindDataObjectOptions,
// ): O | null {
//   let dataObject: O | undefined
//   let options: FindDataObjectOptions | undefined
//   if (component) {
//     if (component instanceof Component) {
//       if (isListConsumer(component)) dataObject = findListDataObject(component)
//       if (!dataObject && options) dataObject = findRootsDataObject(options)
//     } else if (typeof component === 'object') {
//       options = component as FindDataObjectOptions
//       if (isListConsumer(options.component)) {
//         dataObject = findListDataObject(options.component)
//       }
//       if (!dataObject) dataObject = findRootsDataObject(options)
//     }
//   }
//   return dataObject || null
// }

export function findRootsDataObject(opts: {
  dataKey?: string
  pageObject?: { [key: string]: any }
  root?: { [key: string]: any }
}) {
  let { dataKey = '', pageObject = {}, root = {} } = opts
  // TODO - handle component.component
  return get(pageObject, dataKey) || get(root, dataKey)
}

export function findListDataObject(component: IComponentTypeInstance) {
  let dataObject
  let listItem: IListItem | undefined
  if (isListConsumer(component)) {
    if (component?.noodlType === 'listItem') {
      listItem = component as IListItem
    } else {
      listItem = findParent(
        component,
        (p) => p?.noodlType === 'listItem',
      ) as IListItem
    }
    if (listItem) {
      dataObject = listItem.getDataObject?.()
      let listIndex = listItem.get('listIndex')
      if (typeof listIndex !== 'number') listIndex = component.get('listIndex')
      if (!dataObject && typeof listIndex === 'number') {
        const list = listItem?.parent?.() as IList
        if (list) {
          let listObject = list.getData()
          if (listObject?.length) {
            dataObject = listObject[listIndex] || listObject[listIndex]
          }
          if (!dataObject) {
            listObject = list.original?.listObject || []
            if (listObject?.length) {
              dataObject = listObject[listIndex] || listObject[listIndex]
            }
          }
        }
      }
    }
  }
  return dataObject || null
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

export function isComponentInstance<C extends IComponent = any>(
  component: unknown,
): component is C {
  return !!(component && component instanceof Component)
}

export function isEmitObj(value: any): value is EmitActionObject {
  return !!(
    value &&
    typeof value === 'object' &&
    ('emit' in value || value.actionType === 'emit')
  )
}

export function isIfObj(value: unknown): value is IfObject {
  return value && typeof value === 'object' && 'if' in value
}

export function isListConsumer(component: any) {
  return !!(
    component?.get?.('iteratorVar') ||
    component?.get?.('listId') ||
    component?.get?.('listIndex') ||
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

/**
 * Recursively invokes the provided callback on each child
 * @param { IComponentTypeInstance } component
 * @param { function } cb
 */
// TODO - Depth option
export function publish(
  component: IComponentTypeInstance,
  cb: (child: IComponentTypeInstance) => void,
) {
  if (component && component instanceof Component) {
    component.children().forEach((child) => {
      cb(child)
      publish(child, cb)
    })
  }
}

/**
 * Recursively invokes the provided callback on each NOODL child object starting from its instance
 * @param { IComponentTypeObject } noodlComponent - NOODL component object
 * @param { function } cb
 */
// export function (
//   noodlChildren: IComponentTypeObject | IComponentTypeObject[],
//   cb: (noodlChild: IComponentTypeObject) => void,
// ) {
//   if (typeof noodlChildren === 'string') {
//     cb({ type: noodlChildren })
//   } else if (Array.isArray(noodlChildren)) {
//     noodlChildren.forEach((nc) => walkOriginalChildren(nc, cb))
//   } else if (noodlChildren) {
//     cb(noodlChildren as IComponentTypeObject)
//   }
// }
