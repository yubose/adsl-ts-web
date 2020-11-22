// export function ensureArray(value: any, path: string) {
//   if (value && typeof value === 'object' && typeof path === 'string') {
//     let parts = path.split(' ')
//     let prev: any
//     let obj: any = value

import {
  Component,
  IComponentTypeInstance,
  IComponentTypeObject,
  NOODLComponent,
} from 'noodl-ui'
import { shapeKeys } from './constants'

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

export function getShape(
  component: IComponentTypeInstance,
): IComponentTypeObject {
  let shape = {}
  const shapeKeys = getShapeKeys()
  // TODO - Use the "iteratorVar"

  if (component instanceof Component) {
    if (component.get('iteratorVar')) {
      // The noodl yml may also place the value of iteratorVar as a property
      // as an empty string. So we include the value as a property to keep as well
      shapeKeys.push(component.get('iteratorVar'))
    }
    shapeKeys.forEach((key) => {
      if (component.original?.[key]) {
        shape[key] = component.original[key]
      }
    })
  }

  return shape
}

export function getShapeKeys<K extends keyof NOODLComponent>(...keys: K[]) {
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
    'onClick',
    'onHover',
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
    ...keys,
  ] as string[]
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
