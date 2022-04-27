import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { toDataPath, trimReference } from 'noodl-utils'
import get from 'lodash/get'
import is from './is'

export interface DerefOptions {
  ref: LiteralUnion<ReferenceString, string>
  root: Record<string, any>
  rootKey?: string
  paths?: string | number | (string | number)[]
}

function deref({ paths, ref, root, rootKey }: DerefOptions) {
  let value = ref as any

  if (typeof paths === 'string' || typeof paths === 'number') {
    paths = [paths]
  }

  if (!Array.isArray(paths)) paths = [paths]

  if (value) {
    let datapath = toDataPath(trimReference(value))
    let isLocal = false

    while (is.reference(value)) {
      isLocal = is.localReference(value)

      if (isLocal) {
        if (rootKey && datapath[0] === rootKey) {
          datapath.shift()
        }
      } else {
        if (rootKey !== datapath[0]) {
          rootKey = datapath.shift()
        }
      }

      value = get(root, [rootKey, ...datapath])
      if (typeof value === 'string') datapath = toDataPath(trimReference(value))

      //
    }
  }

  return value
}

export default deref
