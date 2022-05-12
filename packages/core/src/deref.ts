/**
 * TODO - Not being used yet (copied from noodl-ui)
 */

import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { excludeStr, get, toPath } from './utils/fp'
import { trimReference } from './utils/noodl'
import * as is from './utils/is'

export interface DerefOptions {
  dataObject?: Record<string, any>
  iteratorVar?: string
  path?: (string | number)[]
  ref: LiteralUnion<ReferenceString, string> | Record<string, any> | any[]
  root: Record<string, any>
  rootKey?: string
  identifiers?: {
    arr: <A = any[]>(value: any) => value is A
    obj: <O = Record<string, any>>(value: any) => value is O
    str: <S = string>(value: any) => value is S
    num: <N = number>(value: any) => value is N
    ref: <R = ReferenceString>(value: any) => value is R
    localRef: (value: any) => boolean
    rootRef: (value: any) => boolean
    localKey: (value: any) => boolean
    traverseRef: (value: any) => boolean
  }
}

const defaultIdentifiers = {
  arr: is.arr,
  obj: is.obj,
  num: is.num,
  ref: is.reference,
  str: is.str,
  localKey: is.localKey,
  localRef: is.localReference,
  rootRef: is.rootReference,
  traverseRef: is.traverseReference,
}

const identifierKeys = Object.keys(defaultIdentifiers)

const cache = new Map()
cache.set('identifiers', [{ identifiers: defaultIdentifiers }])

/**
 * Deeply dereferences a reference string, an array of values, or an object that contains a reference within
 *
 * @param deref options
 * @returns The dereferenced value
 */
function deref({
  dataObject,
  iteratorVar = '',
  path = [],
  ref,
  root,
  rootKey = '',
  identifiers: idy,
}: DerefOptions) {
  let value = ref as string

  if (!idy) {
    idy = defaultIdentifiers as NonNullable<DerefOptions['identifiers']>
  }

  // const idyValidation = cache
  //   .get('identifiers')
  //   ?.find?.((o) => o.identifiers === idy)

  // console.log({ idyValidation })

  // if (idyValidation) {
  //   const implementedIdentifiers = identifierKeys.filter(
  //     (key) => key in (idy || {}),
  //   )

  //   if (implementedIdentifiers.length < identifierKeys.length) {
  //     throw new Error(
  //       `Missing ${
  //         identifierKeys.length - implementedIdentifiers.length
  //       } identifier implementations: ${identifierKeys
  //         .filter((key) => !implementedIdentifiers.includes(key))
  //         .join(', ')}`,
  //     )
  //   }
  // }

  if (value) {
    if (idy.str?.(value)) {
      let datapath = toPath(trimReference(value))
      let isLocal = idy.ref?.(value)

      if (idy.str?.(value)) {
        while (idy.ref?.(value)) {
          if (idy.traverseRef?.(value)) {
            let parts = value.trim().split('_')
            let index = parts.length - 1

            while (!parts[0].startsWith('.') && index >= 0) {
              parts.shift()
              index--
            }

            if (index < 0) {
              return
            }

            if (parts.length) {
              if (parts[0].startsWith('.')) parts[0] = parts[0].slice(1)

              datapath = parts

              let result = get(dataObject || root, parts)

              if (result == null) {
                if (datapath.length && idy.localKey?.(datapath[0])) {
                  // One more attempt
                  result = get(root, [rootKey, ...datapath])
                }
              }

              if (idy.str?.(result)) {
                if (idy.ref?.(result)) {
                  if (idy.rootRef?.(result)) {
                    datapath = toPath(trimReference(result))
                    if (datapath[0] === rootKey) {
                      datapath.shift()
                    }
                  } else {
                    datapath = toPath(trimReference(result))
                    datapath.unshift(rootKey)
                  }

                  return deref({ ...arguments[0], ref: get(root, datapath) })
                }
                return get(dataObject, datapath)
              }
              return result
            }
          } else {
            isLocal = idy.localRef?.(value)

            if (isLocal) {
              if (rootKey && datapath[0] === rootKey) datapath.shift()
            } else {
              if (rootKey !== datapath[0]) {
                rootKey = datapath.shift() || ''
              } else {
                datapath.shift()
              }
            }
          }

          value = get(root, [rootKey, ...datapath])

          if (typeof value === 'string') {
            datapath = toPath(trimReference(value))
          }
        }

        if (idy.str?.(value)) {
          if (iteratorVar && value.startsWith(iteratorVar) && dataObject) {
            // ref === 'itemObject'
            if (value === iteratorVar) return dataObject
            return deref({
              ...arguments[0],
              ref: get(dataObject, excludeStr(value, iteratorVar) || ''),
            })
          }
        }
      }
    } else if (idy.arr?.(value)) {
      return (value as any[]).map((val, index) =>
        deref({ ...arguments[0], path: path.concat(index), ref: val }),
      )
    } else if (idy.obj?.(value)) {
      Object.entries(value).forEach(([key, val]) => {
        if ((idy?.str?.(val) && idy?.ref?.(val)) || idy?.obj?.(val)) {
          return (value[key] = deref({
            ...arguments[0],
            path: path.concat(key),
            ref: val,
          }))
        }
      })
    }
  }

  return value
}

export default deref
