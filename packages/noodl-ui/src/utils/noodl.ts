import _ from 'lodash'
import Logger from 'logsnap'
import { current } from 'immer'
import { findChild, findParent } from 'noodl-utils'
import {
  ComponentType,
  IComponent,
  IComponentConstructor,
  NOODLComponentProps,
  NOODLIfObject,
  NOODLTextBoardBreakLine,
  NOODLComponentType,
  IListComponent,
  IListItemComponent,
  UIComponent,
} from '../types'
import { isBrowser } from './common'
import ListComponent from '../ListComponent'
import ListItemComponent from '../ListItemComponent'
import Component from '../Component'

const log = Logger.create('noodl-ui/src/utils/noodl.ts')

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } props - NOODL component type, a component object, or a Component instance
 */
export function createNOODLComponent(
  noodlType: NOODLComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponent
export function createNOODLComponent(
  props: ComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponent
export function createNOODLComponent(
  props: ComponentType | NOODLComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
) {
  if (typeof props === 'string') {
    return new Component({ type: props, ...options })
  } else if (props instanceof Component) {
    return props
  } else {
    return new Component({ ...props, ...options })
  }
}

// function createRegexKeysOnProps(keys: string | string[]) {
//   const regex = new RegExp(_.isArray(keys) ? )
// }
export const identify = (function () {
  const o = {
    component: {
      /** Returns true if value is a date component, false otherwise */
      isDate: (value: any): boolean =>
        checkForNoodlProp(value, 'text=func', _.negate(_.isUndefined)),
      isPasswordInput: ({ contentType, noodlType }: NOODLComponentProps) =>
        noodlType === 'textField' && contentType === 'password',
    },
    textBoard: {
      item: {
        isTextObject: (component: IComponent): boolean =>
          _.isString(component.get('text')),
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
            return (
              _.isString(val) && /(vidoeSubStream|videoSubStream)/i.test(val)
            )
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

  return o
})()

/**
 * Takes a callback and an "if" object. The callback will receive the three
 * values that the "if" object contains. The first item will be the value that
 * should be evaluated, and the additional (item 2 and 3) arguments will be the values
 * deciding to be returned. If the callback returns true, item 2 is returned. If
 * false, item 3 is returned
 * @param { function } fn - Callback that receives the value being evaluated
 * @param { NOODLIfObject } ifObj - The object that contains the "if"
 */
export function evalIf(
  fn: (
    val: NOODLIfObject['if'][0],
    onTrue: NOODLIfObject['if'][1],
    onFalse: NOODLIfObject['if'][2],
  ) => NOODLIfObject['if'][1] | NOODLIfObject['if'][2],
  ifObj: NOODLIfObject,
): NOODLIfObject['if'][1] | NOODLIfObject['if'][2] {
  if (_.isArray(ifObj)) {
    const [val, onTrue, onFalse] = ifObj
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
 * Returns true if obj is represents something expecting to receive incoming data by
 * their dataKey reference.
 * @param { string } iteratorVar
 * @param { object } obj - NOODL component
 */
export function isIteratorVarConsumer(iteratorVar: string, obj: any) {
  return (
    !!iteratorVar &&
    _.isString(obj?.dataKey) &&
    obj.dataKey.startsWith(iteratorVar)
  )
}

/**
 * Returns true if the value possibly leads to some data, which is possible
 * for strings that have at least a dot in them which can be some dataKey
 * @param { string } value
 */
export function isPossiblyDataKey(value: unknown) {
  return _.isString(value) ? !!value.match(/\./g)?.length : false
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
 * Uses the value given to find a list corresponding to its relation.
 * Supports component id / instance
 * @param { Map } lists - Map of lists
 * @param { string | UIComponent } component - Component id or instance
 */
export function findList(
  lists: Map<IListComponent, IListComponent>,
  component: string | UIComponent,
): any[] | null {
  let result: any[] | null = null

  if (component) {
    let listComponent: IListComponent
    let listComponents: IListComponent[]
    let listSize = lists.size

    // Assuming it is a component's id, we will use this and traverse the whole list,
    // comparing the id to each of the list's tree
    if (_.isString(component)) {
      let child: any
      const componentId = component
      listComponents = Array.from(lists.values())
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
    // TODO - Unit tests were failing on this if condition below. Come back to this later
    // Directly return the data
    else if (component instanceof ListComponent) {
      result = component.getData()
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
      listComponents = Array.from(lists.values())
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

  return result
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
