import { Identify } from 'noodl-types'
import get from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import isComponent from './isComponent'
import { NUIComponent } from '../types'
import { isNum } from './internal'
import { isBrowser } from './common'

/**
 * Traverses the children hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned child
 * @param { NUIComponent.Instance } component
 * @param { function } fn - Comparator function
 */
export function findChild<C extends NUIComponent.Instance>(
  component: C,
  fn: (child: NUIComponent.Instance) => boolean,
): NUIComponent.Instance | null {
  let child: NUIComponent.Instance | null | undefined
  let children = component?.children?.slice?.() || []

  if (isComponent(component) && component.length) {
    child = children.shift()
    while (child) {
      if (fn(child)) return child
      child.children?.forEach((c: NUIComponent.Instance) => children.push(c))
      child = children.pop()
    }
  }
  return null
}

/**
 * Traverses the parent hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned parent
 * @param { NUIComponent.Instance } component
 * @param { function } fn
 */
export function findParent<C extends NUIComponent.Instance>(
  component: C | undefined,
  fn: (parent: NUIComponent.Instance | null) => boolean,
) {
  if (!component) return null
  let parent = component?.parent as NUIComponent.Instance
  if (fn(parent)) return parent
  while (parent) {
    if (fn(parent.parent)) return parent.parent
    parent = parent.parent as NUIComponent.Instance
  }
  return parent || null
}

export function findListDataObject(
  component: NUIComponent.Instance | undefined,
) {
  if (!isComponent(component) || !isListConsumer(component)) return null

  let dataObject
  let listItem: any
  let iteratorVar = findIteratorVar(component)

  if (Identify.component.listItem(component)) {
    listItem = component
  } else {
    listItem = findParent(component, Identify.component.listItem)
  }

  if (isComponent(listItem)) {
    if (iteratorVar && listItem.props[iteratorVar]) {
      // console.log(
      //   `%cFound dataObject in listItem.props[iteratorVar]`,
      //   `color:#00b406;`,
      //   listItem.props[iteratorVar],
      // )
      return listItem.props[iteratorVar]
    }

    let list = listItem.parent
    let listIndex = isNum(listItem.get('index'))
      ? listItem.get('index')
      : listItem.get('listIndex')

    if (isComponent(list)) {
      if (Identify.component.listItem(component)) {
        dataObject = listItem.get(iteratorVar)
      } else {
        dataObject = list.get('listObject')?.[listIndex]
      }
    }
    if (!dataObject && isNum(listIndex)) {
      const listObject = isComponent(list)
        ? list.blueprint?.listObject
        : undefined
      listObject?.length && (dataObject = listObject[listIndex])
    }
  }
  return dataObject || null
}

export function findIteratorVar(
  component: NUIComponent.Instance | undefined,
): string {
  if (isComponent(component)) {
    if (Identify.component.list(component)) {
      return component.blueprint?.iteratorVar || ''
    }
    return (
      findParent(component, (p) => Identify.component.list(p))?.blueprint
        ?.iteratorVar || ''
    )
  }
  return ''
}

export function flatten(
  component: NUIComponent.Instance | undefined,
): NUIComponent.Instance[] {
  if (!component) return []
  const children = [component] as NUIComponent.Instance[]
  publish(component, (child) => children.push(child))
  return children
}

/**
 * Returns the element nodes of data keys. If dataKeys is not provided it will
 *    return all of the matching nodes by default. If provided, it will return only
 *    the nodes of the data keys that were given
 * @param { string | string[] | undefined } dataKeys
 */
export function getDataFields(
  dataKeys?: string | string[],
): { [key: string]: HTMLElement | null } | undefined {
  if (isBrowser()) {
    if (dataKeys) {
      // Ensure that it is an array
      if (typeof dataKeys === 'string') dataKeys = [dataKeys]

      return Array.isArray(dataKeys)
        ? dataKeys.reduce((acc, dataKey) => {
            acc[dataKey] = document.querySelector(`[data-key="${dataKey}"]`)
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
          result[dataset.name] = document.querySelector(
            `[data-key="${dataset.key}"]`,
          )
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
      node = document.querySelector(`[data-key="${dataKey}"]`)
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

export function getRootParent(component: NUIComponent.Instance) {
  if (!component.parent) return component
  const temp = [] as NUIComponent.Instance[]
  findParent(component, (p) => {
    p && temp.push(p)
    return false
  })
  const rootParent = temp[0] || null
  temp.length = 0
  return rootParent
}

export function getLast(component: NUIComponent.Instance | undefined) {
  if (!component?.length) return component
  const temp = [] as NUIComponent.Instance[]
  publish(component, (c) => void temp.push(c))
  const last = temp.length ? temp[temp.length - 1] : null
  temp.length = 0
  return last
}

export function isListConsumer(
  component: unknown,
): component is NUIComponent.Instance {
  if (!isComponent(component)) return false
  return !!findIteratorVar(component)
}

export function isListLike(component: NUIComponent.Instance) {
  return component.type === 'chatList' || component.type === 'list'
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
 * Recursively invokes the provided callback on each child.
 * @param { NUIComponent.Instance } component
 * @param { function } cb
 */
export function publish(
  component: NUIComponent.Instance | undefined,
  cb: (child: NUIComponent.Instance) => void,
) {
  component?.children?.forEach?.((child: NUIComponent.Instance) => {
    cb(child)
    publish(child, cb)
  })
}

export function resolveAssetUrl(
  pathValue: string | undefined,
  assetsUrl: string,
) {
  if (!pathValue) return assetsUrl || ''
  let src = ''
  if (typeof pathValue === 'string') {
    if (/^(http|blob)/i.test(pathValue)) src = pathValue
    else if (pathValue.startsWith('~/')) {
      // Should be handled by an SDK
    } else src = assetsUrl + pathValue
  } else src = `${assetsUrl}${pathValue}`
  return src
}

export function unwrapObj(obj: any) {
  return typeof obj === 'function' ? obj() : obj
}
