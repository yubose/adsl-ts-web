// export function ensureArray(value: any, path: string) {
//   if (value && typeof value === 'object' && typeof path === 'string') {
//     let parts = path.split(' ')
//     let prev: any
//     let obj: any = value

import {
  eventTypes,
  Component,
  IComponentTypeInstance,
  IComponentTypeObject,
  NOODLComponent,
  NOODLComponentType,
} from 'noodl-ui'
import { publish, walkOriginalChildren } from 'noodl-utils'

//     while (parts.length) {
//       const part = parts.shift()
//       if (part) {
//         prev = obj
//         obj = obj?.[part]
//         if (!obj) {
//           prev = []
//         }
//       }
//     }
//   }
// }

export function createAsyncImageElement(
  container: HTMLElement,
  src?: (() => string) | string,
  opts?: { onLoad?(): void; timeout?: number },
) {
  let node = new Image()
  node.onload = () => {
    if (!container) container = document.body
    opts?.onLoad?.()
    container.insertBefore(node as HTMLImageElement, container.childNodes[0])
    node && (node.onload = undefined)
  }
  setTimeout(
    () => void (node.src = typeof src === 'function' ? src() : src || ''),
    typeof opts?.timeout === 'number' ? opts.timeout : 10,
  )
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

/**
 *
 * @param { IComponentTypeInstance | IComponentTypeObject | NOODLComponentType } component - NOODL component object, instance, or type
 */
export function getShape(
  component: IComponentTypeInstance,
  opts?: { parent?: IComponentTypeObject; shapeKeys?: string[] },
): IComponentTypeObject
export function getShape(
  noodlComponent: IComponentTypeObject,
  opts?: { parent?: IComponentTypeObject; shapeKeys?: string[] },
): IComponentTypeObject
export function getShape(
  componentType: NOODLComponentType,
  opts?: { parent?: IComponentTypeObject; shapeKeys?: string[] },
): IComponentTypeObject
export function getShape(
  components: (
    | IComponentTypeInstance
    | IComponentTypeObject
    | NOODLComponentType
  )[],
  opts?: { parent?: IComponentTypeObject; shapeKeys?: string[] },
): IComponentTypeObject
export function getShape(
  component: IComponentTypeInstance | IComponentTypeObject | NOODLComponentType,
  opts?: { parent?: IComponentTypeObject; shapeKeys?: string[] },
): IComponentTypeObject {
  const shape = {} as IComponentTypeObject
  let shapeKeys = getShapeKeys()
  if (opts?.parent) {
    shapeKeys = shapeKeys.concat(
      getDynamicShapeKeys(
        opts.parent,
        component instanceof Component
          ? component.original
          : (component as IComponentTypeObject),
      ),
    )
  }
  if (opts?.shapeKeys) {
    shapeKeys = shapeKeys.concat(opts.shapeKeys)
  }

  if (component instanceof Component) {
    return getShape(component.original, { ...opts, parent: component.original })
  } else if (typeof component === 'string') {
    return { type: component }
  } else if (Array.isArray(component)) {
    return component.map((c) => getShape(c, opts))
  } else if (component && typeof component === 'object') {
    const noodlComponent = component as IComponentTypeObject
    // The noodl yml may also place the value of iteratorVar as a property
    // as an empty string. So we include the value as a property to keep as well
    shapeKeys.forEach((key) => {
      if (key in noodlComponent) {
        if (key === 'children') {
          shape.children = Array.isArray(noodlComponent.children)
            ? (noodlComponent.children as IComponentTypeObject[])?.map(
                (noodlChild) => {
                  return getShape(noodlChild, {
                    ...opts,
                    parent: noodlComponent,
                  })
                },
              )
            : getShape(noodlComponent.children as any, {
                ...opts,
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
  noodlParent: IComponentTypeObject,
  noodlChild: IComponentTypeObject,
) {
  const shapeKeys = [] as string[]
  if (noodlParent?.iteratorVar) {
    if (noodlParent.iteratorVar in noodlChild) {
      shapeKeys.push(noodlParent.iteratorVar)
    }
  }
  return shapeKeys
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
