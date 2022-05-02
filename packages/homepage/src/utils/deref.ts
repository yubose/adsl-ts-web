import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { excludeIteratorVar, toDataPath, trimReference } from 'noodl-utils'
import get from 'lodash/get'
import is from './is'

export interface DerefOptions {
  dataObject?: Record<string, any>
  iteratorVar?: string
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
  ref,
  root,
  rootKey,
}: DerefOptions) {
  let value = ref

  if (value) {
    if (u.isStr(value)) {
      let datapath = toDataPath(trimReference(value))
      let isLocal = is.reference(value)

      if (iteratorVar) {
        if (u.isStr(value)) {
          if (u.isArr(dataObject) || u.isObj(dataObject)) {
            value = get(dataObject, excludeIteratorVar(value, iteratorVar))
          }
        }
      } else {
        while (is.reference(value)) {
          isLocal = is.localReference(value)

          if (isLocal) {
            if (rootKey && datapath[0] === rootKey) datapath.shift()
          } else {
            if (rootKey !== datapath[0]) rootKey = datapath.shift()
          }

          value = get(root, [rootKey, ...datapath])

          if (typeof value === 'string') {
            datapath = toDataPath(trimReference(value))
          }
        }
      }
    } else if (u.isArr(value)) {
      return value.map((val) =>
        deref({ dataObject, iteratorVar, ref: val, root, rootKey }),
      )
    } else if (u.isObj(value)) {
      for (const [key, val] of u.entries(value)) {
        if (is.reference(val)) {
          value[key] = deref({
            dataObject,
            iteratorVar,
            ref: val,
            root,
            rootKey,
          })
        }
        if (u.isObj(val)) {
          value[key] = deref({
            dataObject,
            iteratorVar,
            ref: val,
            root,
            rootKey,
          })
        }
      }
    }
  }

  return value
}

export default deref
