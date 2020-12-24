import { queryHelpers } from '@testing-library/dom'
import { isEmitObj } from 'noodl-utils'
import { NOODLDOMElement } from 'noodl-ui-dom'
import {
  createComponent as createComponentInstance,
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPlugins,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  ResolverFn,
  EmitObject,
  ComponentType,
  ActionObject,
  ActionType,
  ComponentObject,
  Component,
  List,
  ListItem,
} from 'noodl-ui'
import noodlui from '../app/noodl-ui'
import noodluidom from '../app/noodl-ui-dom'
import Page from '../Page'
import createActions from '../handlers/actions'
import createBuiltInActions from '../handlers/builtIns'

export { noodlui, noodluidom }

export const page = new Page()
export const assetsUrl = 'https://aitmed.com/assets/'
export const root = {}
export const actions = createActions({ page })
export const builtIn = createBuiltInActions({ page })

export const deviceSize = {
  galaxys5: { width: 360, height: 640, aspectRatio: 0.5621345029239766 },
  iphone6: { width: 375, height: 667, aspectRatio: 0.562545720555962 },
  ipad: { width: 768, height: 1024, aspectRatio: 0.7495126705653021 },
  widescreen: { width: 1920, height: 1080, aspectRatio: 1.777777777777778 },
} as const

noodlui
  .use(
    Object.entries(actions).reduce(
      (arr, [actionType, actions]) =>
        arr.concat(
          actions.map((a) => ({
            actionType,
            ...a,
            ...(isEmitObj(a) ? { context: { noodl, noodlui } } : undefined),
          })),
        ),
      [] as any[],
    ),
  )
  .use(
    // @ts-expect-error
    Object.entries({ redraw: builtIn.redraw }).map(([funcName, fn]) => ({
      funcName,
      fn,
    })),
  )

export class MockNoodl {
  assetsUrl = assetsUrl
  emitCall = (arg: any) => Promise.resolve(arg)
  root = root
}

// Mock noodl SDK
export const noodl = new MockNoodl()

export function getByDataKey(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataListId(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataUx(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataValue(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getAllByDataKey(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataName(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataListId(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataUx(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataValue(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataListId = queryHelpers.queryByAttribute.bind(
  null,
  'data-listid',
)

export const queryByDataName = queryHelpers.queryByAttribute.bind(
  null,
  'data-name',
)

export const queryByDataValue = queryHelpers.queryByAttribute.bind(
  null,
  'data-value',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')

export const queryByDataViewtag = queryHelpers.queryByAttribute.bind(
  null,
  'data-viewtag',
)

export function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getCustomDataAttrs,
    getElementType,
    getEventHandlers,
    getFontAttrs,
    getPlugins,
    getPosition,
    getReferences,
    getSizes,
    getStylesByElementType,
    getTransformedAliases,
    getTransformedStyleAliases,
  ] as ResolverFn[]
}

export function toDOM(props: any): NOODLDOMElement | null {
  const node = noodluidom.parse(props)
  if (page.rootNode) page.rootNode?.appendChild(node as NOODLDOMElement)
  else throw new Error('No root node exists in Page')
  return node
}

/* -------------------------------------------------------
  ---- TEST UTILITIES 
-------------------------------------------------------- */

export type DataKeyType<K extends string = 'emit' | 'key'> = K
export type PathType = 'emit' | 'if' | 'url'
export type ActionSelection = ActionType | ActionObject
export type ActionsConfig =
  | ActionSelection[]
  | Record<ActionType, ActionObject>
  | { builtIn?: string[] }

export function createComponent(
  ...args: Parameters<typeof createNOODLComponent>
) {
  return createComponentInstance(createNOODLComponent(...args)) as
    | Component
    | List
    | ListItem
}

export function createNOODLComponent(
  noodlComponent: ComponentType | Partial<ComponentObject>,
  opts?: {
    dataKey?: DataKeyType
    iteratorVar?: string
    onClick?: ActionsConfig
    onChange?: ActionsConfig
    path?: boolean | PathType
  } & Partial<Omit<ComponentObject, 'path' | 'onClick' | 'dataKey'>>,
) {
  const props = {
    ...opts,
    type:
      typeof noodlComponent === 'string' ? noodlComponent : noodlComponent.type,
  } as ComponentObject

  const createActionObjs = (configs: ActionsConfig) => {
    const arr = Array.isArray(configs) ? configs : [configs]
    return arr.reduce((acc, obj) => {
      if (typeof obj === 'string') {
        const parts = obj.split(':')
        const [actionType] = parts
        switch (actionType) {
          case 'builtIn':
            const funcName = parts[1]
            const args = parts
              .slice(2)
              .reduce((acc, keyval) => {
                if (acc.length) {
                  if (!acc[acc.length - 1]) acc[acc.length - 1].push(keyval)
                  if (acc[acc.length - 1].length < 2) {
                    acc[acc.length - 1].push(keyval)
                  } else {
                    acc.push([keyval])
                  }
                } else {
                  acc.push([keyval])
                }
                return acc
              }, [])
              .reduce(
                (acc, [key, val]) => Object.assign(acc, { [key]: val }),
                {},
              )

            if (args && typeof args === 'string') {
              try {
                args = JSON.parse(args)
                console.info(args)
              } catch (error) {
                console.error(error.message)
              }
            }
            return acc.concat({
              actionType: 'builtIn',
              funcName,
              ...(typeof args === 'object' ? args : undefined),
            })
          case 'emit':
            return acc.concat(
              createEmitObj({
                keys: ['hello1', 'hello2'],
                iteratorVar: opts?.iteratorVar,
              }),
            )
          default:
            break
        }
      } else if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        // if 'emit' in obj
        // if 'actionType' in obj
        // etc
      }
      return acc
    }, [] as any[])
  }

  const createDataKey = (type: DataKeyType, opts) =>
    type === 'emit' ? createEmitObj(opts) : opts

  const createEmitObj = (
    opts?:
      | {
          actions?: [any, any, any]
          keys?: string | string[]
          iteratorVar?: string
        }
      | boolean,
  ) => {
    const getPrefilledEmitObj = () => {
      const iteratorVar = (typeof opts === 'object' && opts.iteratorVar) || ''
      return {
        emit: {
          dataKey: {
            var1: iteratorVar || 'itemObject',
            var2: `${iteratorVar || 'itemObject'}.value`,
          },
          actions: [{}, {}, {}],
        },
      }
    }
    if (typeof opts === 'boolean') {
      return getPrefilledEmitObj()
    } else if (!opts?.keys) {
      return getPrefilledEmitObj()
    } else {
      return {
        emit: {
          dataKey: Array.isArray(opts.keys)
            ? opts?.keys.reduce(
                (acc, key, index) =>
                  Object.assign(acc, { [`var${index + 1}`]: key }),
                {},
              )
            : opts?.keys,
        },
      } as EmitObject
    }
  }

  const createPath = (type: PathType | boolean, iteratorVar?: string = '') =>
    type === 'emit'
      ? createEmitObj({ iteratorVar })
      : path === 'if'
      ? { if: [] }
      : path

  if (opts) {
    if (opts.dataKey) props.dataKey = createDataKey(opts.dataKey, opts)
    if (opts.path) props.path = createPath(opts.path)
    if (opts.onClick) props.onClick = createActionObjs(opts.onClick)
    if (opts.onChange) props.onChange = createActionObjs(opts.onChange)
  }

  return props
}
