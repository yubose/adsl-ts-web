import _ from 'lodash'
import { current } from 'immer'
import {
  IComponent,
  NOODLComponentType,
  NOODLTextBoardTextObject,
  NOODLTextBoardBreakLine,
  NOODLComponentProps,
  ProxiedComponent,
} from '../types'
import { isBrowser } from './common'
import Component from '../Component'

const testPropKeysByRegex = (obj: any, key: string) =>
  _.isString(key) && new RegExp(key, 'i').test(obj[key])

// function createRegexKeysOnProps(keys: string | string[]) {
//   const regex = new RegExp(_.isArray(keys) ? )
// }

export const identify = {
  component: {
    /** Returns true if value is a date component, false otherwise */
    isDate: (value: any): boolean =>
      checkForNoodlProp(value, 'text=func', _.negate(_.isUndefined)),
    isPasswordInput: ({ contentType, noodlType }: NOODLComponentProps) =>
      noodlType === 'textField' && contentType === 'password',
  },
  list: {
    /** Components that hold a dataKey starting with "itemObject." */
    itemObjectConsumer: (iteratorVar: string, obj: any) => {
      return (
        !!iteratorVar &&
        _.isString(obj?.dataKey) &&
        obj.dataKey.startsWith(iteratorVar)
      )
    },
  },
  textBoard: {
    item: {
      isTextObject: (value: any): value is NOODLTextBoardTextObject =>
        _.isObjectLike(value) && _.isString(value.text),
      isBreakLine: (value: unknown): value is NOODLTextBoardBreakLine =>
        value === 'br',
    },
  },
  stream: {
    video: {
      /** Returns true if value has a viewTag of "mainStream" */
      isMainStream: (value: any) => {
        const fn = (val: string) => _.isString(val) && /mainStream/i.test(val)
        return (
          checkForNoodlProp(value, 'viewTag', fn) ||
          checkForNoodlProp(value, 'data-ux', fn)
        )
      },
      /** Returns true if value has a viewTag of "selfStream" */
      isSelfStream: (value: any) => {
        const fn = (val: string) => _.isString(val) && /selfStream/i.test(val)
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
          return _.isString(val) && /(vidoeSubStream|videoSubStream)/i.test(val)
        })
      },
      /** Returns true if value has a viewTag of "subStream", */
      isSubStream(value: any) {
        return checkForNoodlProp(value, 'viewTag', (val: string) => {
          return _.isString(val) && /(subStream)/i.test(val)
        })
      },
    },
  },
}

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
  if (_.isObjectLike(component) && _.isString(prop)) {
    if (predicate(component[prop])) return true
    if (predicate(component.noodl?.[prop])) return true
  }
  return false
}

/**
 * Helper to create the minimally required props expected to safely run through all resolvers
 * @param { string } type - NOODL component type
 * @param { NOODLComponent } props
 */
export function createNOODLComponent<T extends Partial<ProxiedComponent>>(
  type: NOODLComponentType,
  props?: T,
) {
  return new Component({
    ...props,
    style: { ...props?.style },
    type,
  }) as IComponent
}

/**
 * Returns the HTML DOM node or an array of HTML DOM nodes using the data-ux,
 * otherwise returns null
 * @param { string } key - The value of a data-ux element
 */
export function getByDataUX(key: string) {
  if (typeof key === 'string') {
    const nodeList = document.querySelectorAll(`[data-ux="${key}"]`) || null
    if (nodeList.length) {
      const nodes = [] as HTMLElement[]
      nodeList.forEach((node: HTMLElement, key) => {
        nodes.push(node)
      })
      return nodes.length === 1 ? nodes[0] : nodes
    }
  }
  return null
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
      if (_.isString(dataKeys)) dataKeys = [dataKeys]
      console.log(current(dataKeys))

      return _.isArray(dataKeys)
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
    if (_.isString(node)) {
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
  if (_.isArray(nodes)) {
    fn = (name: K) => (result[name as string] = getDataValue(name as string))
    _.forEach(nodes, fn)
  }
  // Object of nodes where key is the data name and value is an HTMLElement
  else if (_.isPlainObject(nodes)) {
    fn = (name: string) => (result[name] = getDataValue(nodes?.[name] || ''))
    _.forEach(_.keys(nodes || {}), fn)
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
      _.forEach(_.keys(allNodes), fn)
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
 * Returns true if value has a viewTag of "selfStream", false otherwise
 * @param { any } value
 */
export function isSelfStreamComponent(value: any) {
  const fn = (val: string) => _.isString(val) && /selfStream/i.test(val)
  return checkForNoodlProp(value, 'viewTag', fn)
}

/**
 * Returns true if value has a viewTag of "subStream", false otherwise
 * @param { any } value
 */
export function isSubStreamComponent(value: any) {
  return checkForNoodlProp(value, 'viewTag', (val: string) => {
    return _.isString(val) && /subStream/i.test(val)
  })
}
