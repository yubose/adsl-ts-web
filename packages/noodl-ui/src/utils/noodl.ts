import { ComponentObject } from 'noodl-types'
import get from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import {
  ActionChainEmitTrigger,
  ComponentCreationType,
  ComponentInstance,
  PluginLocation,
} from '../types'
import { isBrowser } from './common'
import { actionChainEmitTriggers } from '../constants'
import isComponent from './isComponent'

/**
 * Deeply traverses all children down the component's family tree
 * @param { ComponentInstance | NOODLComponent | ProxiedComponent | ProxiedComponent } component
 */
export function forEachDeepChildren<C extends ComponentInstance>(
  component: C,
  cb: (component: C, child: ComponentCreationType) => void,
): void
export function forEachDeepChildren<C extends ComponentObject>(
  component: C,
  cb: (component: C, child: ComponentCreationType) => void,
): void
export function forEachDeepChildren<
  C extends ComponentInstance | ComponentObject
>(
  component: C,
  cb: (
    parent: ComponentInstance | ComponentObject,
    child: ComponentCreationType,
  ) => void,
): void {
  if (component) {
    if (Array.isArray(component.children)) {
      component.children.forEach((child) => {
        cb(component, child)
        forEachDeepChildren(child, cb)
      })
    } else if (typeof component.children === 'function') {
      component.children().forEach((child) => {
        cb(component, child)
        forEachDeepChildren(child, cb)
      })
    } else if (component.children) {
      cb(component, component.children as ComponentCreationType)
    }
  }
}

export function isActionChainEmitTrigger(
  trigger: any,
): trigger is ActionChainEmitTrigger {
  return actionChainEmitTriggers.includes(trigger)
}

// function createRegexKeysOnProps(keys: string | string[]) {
//   const regex = new RegExp(Array.isArray(keys) ? )
// }
export const identify = (function () {
  const o = {
    stream: {
      video: {
        /** Returns true if value has a viewTag of "mainStream" */
        isMainStream: (value: any) => {
          const fn = (val: string) =>
            typeof val === 'string' && /mainStream/i.test(val)
          return (
            checkForNoodlProp(value, 'viewTag', fn) ||
            checkForNoodlProp(value, 'data-ux', fn)
          )
        },
        /** Returns true if value has a viewTag of "selfStream" */
        isSelfStream: (value: any) => {
          const fn = (val: string) =>
            typeof val === 'string' && /selfStream/i.test(val)
          return (
            checkForNoodlProp(value, 'viewTag', fn) ||
            checkForNoodlProp(value, 'data-ux', fn)
          )
        },
        /**
         * Returns true if value has a contentType of "videoSubStream",
         * false otherwise
         */
        isSubStreamsContainer(value: any) {
          return checkForNoodlProp(value, 'contentType', (val: string) => {
            return (
              typeof val === 'string' &&
              /(vidoeSubStream|videoSubStream)/i.test(val)
            )
          })
        },
        /** Returns true if value has a viewTag of "subStream", */
        isSubStream(value: any) {
          return checkForNoodlProp(value, 'viewTag', (val: string) => {
            return typeof val === 'string' && /(subStream)/i.test(val)
          })
        },
      },
    },
  }

  return o
})()

/**
 * Checks for a prop in the component object in the top level as well as the "noodl" property level
 * @param { object } component - NOODL component
 * @param { string } prop - Prop key
 * @param { function } predicate - The function to call to decide if the condition is truthy or not
 */
export function checkForNoodlProp(
  component: any,
  prop: string,
  predicate: (o: any) => boolean,
) {
  if (
    (component && typeof component === 'object') ||
    (typeof component === 'function' && typeof prop === 'string')
  ) {
    if (predicate(component[prop])) return true
  }
  return false
}

/**
 * Traverses the children hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned child
 * @param { ComponentInstance } component
 * @param { function } fn - Comparator function
 */
export function findChild<C extends ComponentInstance>(
  component: C,
  fn: (child: ComponentInstance) => boolean,
): ComponentInstance | null {
  let child: ComponentInstance | null | undefined
  let children = component?.children?.()?.slice?.() || []

  if (isComponent(component)) {
    child = children.shift() || null
    while (child) {
      if (fn(child)) return child
      child.children?.().forEach((c: ComponentInstance) => children.push(c))
      child = children.pop()
    }
  }
  return null
}

/**
 * Traverses the parent hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned parent
 * @param { ComponentInstance } component
 * @param { function } fn
 */
export function findParent<C extends ComponentInstance>(
  component: C,
  fn: (parent: ComponentInstance | null) => boolean,
) {
  let parent = component?.parent?.()
  if (fn(parent)) return parent
  if (parent) {
    while (parent) {
      parent = parent.parent?.()
      if (fn(parent)) return parent
    }
  }
  return parent || null
}

export function findListDataObject(component: ComponentInstance) {
  let dataObject
  let listItem: any
  if (component?.noodlType === 'listItem') {
    listItem = component as any
  } else {
    listItem = findParent(component, (p) => p?.noodlType === 'listItem') as any
  }
  if (listItem) {
    dataObject = listItem.getDataObject?.()
    let listIndex = listItem.get('listIndex')
    if (typeof listIndex !== 'number') listIndex = component.get('listIndex')
    if (!dataObject && typeof listIndex === 'number') {
      const list = listItem?.parent?.() as any
      if (list) {
        let listObject = list.getData()
        if (listObject?.length) {
          dataObject = listObject[listIndex]
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
  return dataObject || null
}

export function findIteratorVar(component: ComponentInstance) {
  const listItem = findParent(component, (p) => {})
}

/**
 * Returns the node matching the data key
 * @param { string } dataKey - Data path leading to the value in the data model object
 */
function getDataField(dataKey: string) {
  return document.querySelector(`[data-key="${dataKey}"]`)
}

/**
 * Returns the element nodes of data keys. If dataKeys is not provided it will
 *    return all of the matching nodes by default. If provided, it will return only
 *    the nodes of the data keys that were given
 * @param { string | string[] | undefined } dataKeys
 */
export function getDataFields(
  dataKeys?: string | string[],
): { [key: string]: ReturnType<typeof getDataField> } | undefined {
  if (isBrowser()) {
    if (dataKeys) {
      // Ensure that it is an array
      if (typeof dataKeys === 'string') dataKeys = [dataKeys]

      return Array.isArray(dataKeys)
        ? dataKeys.reduce((acc, dataKey) => {
            acc[dataKey] = getDataField(dataKey)
            return acc
          }, {})
        : []
    }
    const result = {}
    const nodeList = document.querySelectorAll('[data-key]')
    if (nodeList) {
      nodeList.forEach((node) => {
        const dataset = node['dataset']
        if (dataset['key'] && dataset['name']) {
          result[dataset.name] = getDataField(dataset.key)
        } else {
          console.log(
            `%cInvalid data name and/or data key`,
            'color:#e74c3c;font-weight:bold;',
            { dataset, node },
          )
        }
      })
    }
    return result
  }
}

/**
 * Extracts the value from the node and returns it
 *    If node is a string, it will assume it is a data key and use it to retrieve the node
 * @param { string | Element } node - Data key or the element node
 */

function getDataValue(node: string | null | Element): string | number | null {
  if (node) {
    if (typeof node === 'string') {
      const dataKey = node
      node = getDataField(dataKey)
    }
    if (node instanceof Element) {
      switch (node.constructor.name) {
        case 'HTMLInputElement':
        case 'HTMLSelectElement':
        case 'HTMLTextAreaElement':
          return (node as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement).value
        case 'HTMLButtonElement':
          console.log(
            `%c[getDataValue] ` +
              `Tried to retrieve a data value from a button element but there ` +
              `is no implementation for it. Perhaps it needs to be supported?`,
            'color:#e74c3c;font-weight:bold;',
            { node },
          )
          break
        default:
          break
      }
    }
  }
  return ''
}

/**
 *
 * @param { string[] | object } nodes - String of data keys
 */
export function getDataValues<Fields, K extends keyof Fields>(
  nodes?: K[] | Fields,
) {
  const result = {} as { [P in keyof Fields]: Fields[P] }
  let fn

  // Array of field keys
  if (Array.isArray(nodes)) {
    fn = (name: K) => (result[name as string] = getDataValue(name as string))
    nodes.forEach(fn)
  }
  // Object of nodes where key is the data name and value is an HTMLElement
  else if (isPlainObject(nodes)) {
    fn = (name: string) => (result[name] = getDataValue(nodes?.[name] || ''))
    Object.keys(nodes || {}).forEach(fn)
  }
  // If they don't pass in any arguments, do a global query for all nodes
  // that are assigned a custom data-name attribute
  else if (!arguments.length) {
    const allNodes = getDataFields()
    if (allNodes) {
      fn = (key: string) => {
        const node = allNodes[key]
        if (node) {
          result[key] = getDataValue(node)
        } else {
          console.log(
            `%c[getDataValues] ` +
              `Attempted to find a node for key ${key} but received null or ` +
              `undefined. The program should not have gotten here`,
            'color:#e74c3c;font-weight:bold;',
            { allNodes, node, key },
          )
        }
      }
      Object.keys(allNodes).forEach(fn)
    }
  } else {
    console.log(
      `%c[getDataValues] ` + `nodes is not an array or object`,
      'color:#e74c3c;font-weight:bold;',
      nodes,
    )
    return result
  }

  return result
}

/**
 * A helper to extract a value from a dataObject using the dataKey and iteratorVar
 * @param { object } dataObject
 * @param { string } dataKey
 * @param { string } iteratorVar
 */
export function getDataObjectValue<T = any>({
  dataObject,
  dataKey,
  iteratorVar,
}: {
  dataObject: T
  dataKey: string
  iteratorVar: string
}) {
  if (typeof dataObject === 'string') return dataObject
  if (iteratorVar && dataKey.startsWith(iteratorVar)) {
    dataKey = dataKey.split('.').slice(1).join('.')
  }
  return get(dataObject, dataKey)
}

export function getPluginTypeLocation(value: string): PluginLocation | '' {
  switch (value) {
    case 'pluginHead':
      return 'head'
    case 'pluginBodyTop':
      return 'body-top'
    case 'pluginBodyTail':
      return 'body-bottom'
    default:
      return ''
  }
}

/**
 * Returns true if the dataKey begins with the value of iteratorVar
 * @param {  }  -
 */
export function isListKey(dataKey: string, iteratorVar: string): boolean
export function isListKey(
  dataKey: string,
  component: ComponentInstance,
): boolean
export function isListKey(dataKey: string, component: ComponentObject): boolean
export function isListKey(
  dataKey: string,
  component: string | ComponentInstance | ComponentObject,
) {
  if (arguments.length < 2) {
    throw new Error('Missing second argument')
  }
  if (typeof dataKey === 'string' && component) {
    if (typeof component === 'string') {
      return dataKey.startsWith(component)
    }
    if (isComponent(component)) {
      const iteratorVar =
        component.get('iteratorVar') ||
        component.original?.iteratorVar ||
        findParent(component, (p) => !!p?.get('iteratorVar')) ||
        ''
      return !!(iteratorVar && dataKey.startsWith(iteratorVar))
    }
    if ('iteratorVar' in component) {
      return dataKey.startsWith(component.iteratorVar || '')
    }
  }
  return false
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

// export function isPasswordInput(value: unknown) {
//   return (
//     _.isObjectLike(value) &&
//     value['type'] === 'textField' &&
//     value['contentType'] === 'password'
//   )
// }

/**
 * Returns true if value has a viewTag of "subStream", false otherwise
 * @param { any } value
 */
export function isSubStreamComponent(value: any) {
  return checkForNoodlProp(value, 'viewTag', (val: string) => {
    return typeof val === 'string' && /subStream/i.test(val)
  })
}

export function parseReference(
  ref: string,
  { page = '', root = {} }: { page?: string; root?: any },
) {
  let trimmedPath = ref.replace(/(\.\.|\.)/, '')
  // Local/private reference
  if (ref[0] === ref[0].toLowerCase()) {
    return get(root?.[page], trimmedPath)
  }
  // Global reference
  if (ref[0] === ref[0].toUpperCase()) {
    return get(root, trimmedPath)
  }
  return ''
}

/**
 * Recursively invokes the provided callback on each child
 * @param { ComponentInstance } component
 * @param { function } cb
 */
// TODO - Depth option
export function publish(
  component: ComponentInstance,
  cb: (child: ComponentInstance) => void,
) {
  if (
    component &&
    typeof component === 'object' &&
    typeof component['children'] === 'function'
  ) {
    component.children().forEach((child: ComponentInstance) => {
      cb(child)
      child?.children()?.forEach?.((c: ComponentInstance) => {
        cb(c)
        publish(c, cb)
      })
    })
  }
}

export function resolveAssetUrl(pathValue: string, assetsUrl: string) {
  let src = ''
  if (typeof pathValue === 'string') {
    if (/^(http|blob)/i.test(pathValue)) {
      src = pathValue
    } else if (pathValue.startsWith('~/')) {
      // Should be handled by an SDK
    } else {
      src = assetsUrl + pathValue
    }
  } else {
    src = `${assetsUrl}${pathValue}`
  }
  return src
}

export function unwrapObj(obj: any) {
  return typeof obj === 'function' ? obj() : obj
}
