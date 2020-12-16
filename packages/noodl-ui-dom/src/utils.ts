import {
  eventTypes,
  Component,
  ComponentObject,
  ComponentType,
  NOODLComponent,
  SelectOption,
} from 'noodl-ui'
import { isComponent } from 'noodl-utils'
import { NodeResolverConfig } from './types'

/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 * @param { object } options
 * @param { function | undefined } options.onLoad
 * @param { number | undefined } options.timeout
 */
export function createAsyncImageElement(
  container: HTMLElement,
  opts?: { onLoad?(event: Event): void; timeout?: number },
) {
  let node = new Image()
  node.onload = (event) => {
    if (!container) container = document.body
    container.insertBefore(node as HTMLImageElement, container.childNodes[0])
    opts?.onLoad?.(event)
  }
  return node
}

export function ensureDatasetHandlingArr<N extends HTMLElement>(node: N) {
  if (node && node.dataset) {
    if (!Array.isArray(node.dataset.handling)) {
      node.dataset.handling = [] as any
    }
  }
}

export const get = <T = any>(o: T, k: string) => {
  if (typeof o !== 'object' || typeof k !== 'string') return

  let parts = k.split('.').reverse()
  let result: any = o
  let key = ''

  while (parts.length) {
    key = parts.pop() as string
    result = result[key]
  }

  return result
}

export function getDataAttribKeys() {
  return [
    'data-key',
    'data-listid',
    'data-name',
    'data-viewtag',
    'data-value',
    'data-ux',
  ] as (
    | 'data-key'
    | 'data-listid'
    | 'data-name'
    | 'data-viewtag'
    | 'data-value'
    | 'data-ux'
  )[]
}

/**
 *
 * @param { Component | ComponentObject | ComponentType } component - NOODL component object, instance, or type
 */
export function getShape(
  component: Component,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  noodlComponent: ComponentObject,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  componentType: ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  components: (Component | ComponentObject | ComponentType)[],
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  component: Component | ComponentObject | ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject {
  const shape = {} as ComponentObject
  let shapeKeys = getShapeKeys()
  if (opts?.parent) {
    shapeKeys = shapeKeys.concat(
      getDynamicShapeKeys(
        opts.parent,
        isComponent(component)
          ? component.original
          : (component as ComponentObject),
      ),
    )
  }
  if (opts?.shapeKeys) {
    shapeKeys = shapeKeys.concat(opts.shapeKeys)
  }

  if (isComponent(component)) {
    return getShape(component.original, { ...opts, parent: component.original })
  } else if (typeof component === 'string') {
    return { type: component }
  } else if (Array.isArray(component)) {
    return component.map((c) => getShape(c, opts))
  } else if (component && typeof component === 'object') {
    const noodlComponent = component as ComponentObject
    // The noodl yml may also place the value of iteratorVar as a property
    // as an empty string. So we include the value as a property to keep as well
    shapeKeys.forEach((key) => {
      if (key in noodlComponent) {
        if (key === 'children') {
          // @ts-expect-error
          shape.children = Array.isArray(noodlComponent.children)
            ? (noodlComponent.children as ComponentObject[])?.map(
                (noodlChild) =>
                  getShape(noodlChild, {
                    ...opts,
                    parent: noodlComponent,
                  }),
              )
            : getShape(noodlComponent.children as any, {
                ...opts,
                noodlType:
                  opts?.noodlType ||
                  (typeof noodlComponent.children === 'object'
                    ? noodlComponent.children.noodlType ||
                      noodlComponent.children.type
                    : typeof noodlComponent.children === 'string'
                    ? noodlComponent.children
                    : undefined) ||
                  opts?.type,
                parent: noodlComponent,
              })
        } else {
          shape[key] = noodlComponent[key]
        }
      }
    })
  }
  return shape
}

export function getShapeKeys<K extends keyof NOODLComponent>(...keys: K[]) {
  const regex = /(required?)\s*$/i
  return [
    'type',
    'style',
    'children',
    'controls',
    'dataKey',
    'contentType',
    'inputType',
    'isEditable',
    'iteratorVar',
    'listObject',
    'maxPresent',
    'noodlType',
    'options',
    'path',
    'pathSelected',
    'poster',
    'placeholder',
    'resource',
    'required',
    'selected',
    'text',
    'textSelectd',
    'textBoard',
    'text=func',
    'viewTag',
    'videoFormat',
    ...eventTypes,
    ...keys,
  ] as string[]
}

export function getDynamicShapeKeys(
  noodlParent: ComponentObject,
  noodlChild: ComponentObject,
) {
  const shapeKeys = [] as string[]
  if (noodlParent?.iteratorVar) {
    if (noodlParent.iteratorVar in noodlChild) {
      shapeKeys.push(noodlParent.iteratorVar)
    }
  }
  return shapeKeys
}

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || typeof value === 'string' || typeof value === 'number'
}

export function isHandlingEvent<N extends HTMLElement>(
  node: N,
  eventId: string,
) {
  if (node && eventId && Array.isArray(node.dataset.handling)) {
    return node.dataset.handling.includes(eventId)
  }
  return false
}

export const handlingDataset = (function () {
  function _get(node: any) {
    return node?.dataset?.handling
  }

  function _parse(node: any) {
    let result: any
    if (node) {
      try {
        result = JSON.parse(_get(node))
      } catch (error) {
        console.error(error)
      }
    }
    return result || null
  }

  function _insert(node: any, value: string) {
    let result: any
    const handling = _parse(node)
    return result
  }

  const o = {
    parse: _parse,
    insert: _insert,
  }

  return o
})()

export function normalizeEventName(eventName: string) {
  return typeof eventName === 'string'
    ? eventName.startsWith('on')
      ? eventName.replace('on', '').toLowerCase()
      : eventName.toLowerCase()
    : eventName
}

export function optionExists(node: HTMLSelectElement, option: any) {
  return (
    !!node &&
    !!option &&
    [...node.options].some((opt) => opt.value === toSelectOption(option).value)
  )
}

export function isTextFieldLike(
  node: unknown,
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return !!(
    node &&
    node instanceof HTMLElement &&
    (node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA')
  )
}

export function toSelectOption(value: any): SelectOption {
  if (typeof value !== 'object') {
    return { key: value, label: value, value }
  }
  return value
}

export function runResolvers(
  resolvers: NodeResolverConfig[],
  node,
  component,
) {}

export function withEnhancedGet(fn) {
  return function (node: HTMLElement, component: Component) {
    const enhancedComponent = Object.create(component)
    Object.defineProperty(enhancedComponent, 'get', {
      value: function (...args) {
        const key = args[0]
        console.info(`KEY IN CLOSURE: `, key)
        return component.get(...args)
      },
    })
    return fn(node, component)
  }
}
