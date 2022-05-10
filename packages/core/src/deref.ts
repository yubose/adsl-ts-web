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
}

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
}: DerefOptions) {
  let value = ref as string

  if (value) {
    if (is.str(value)) {
      let datapath = toPath(trimReference(value))
      let isLocal = is.reference(value)

      if (is.str(value)) {
        while (is.reference(value)) {
          if (is.traverseReference(value)) {
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
                if (datapath.length && is.localKey(datapath[0])) {
                  // One more attempt
                  result = get(root, [rootKey, ...datapath])
                }
              }

              if (is.str(result)) {
                if (is.reference(result)) {
                  if (is.rootReference(result)) {
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
            isLocal = is.localReference(value)

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

        if (is.str(value)) {
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
    } else if (is.arr(value)) {
      return (value as any[]).map((val, index) =>
        deref({ ...arguments[0], path: path.concat(index), ref: val }),
      )
    } else if (is.obj(value)) {
      Object.entries(value).forEach(([key, val]) => {
        if ((is.str(val) && is.reference(val)) || is.obj(val)) {
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
