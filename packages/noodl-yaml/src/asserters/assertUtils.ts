import type { Document, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { consts, is as coreIs } from 'noodl-core'
import { Parser } from 'noodl-utils'
import type { ReferenceString } from 'noodl-types'
import type { ARoot, Markers } from 'noodl-core'
import type DocRoot from '../DocRoot'
import deref from '../utils/deref'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import { isScalar, isPair, isMap, isSeq, visit } from '../utils/yaml'
import * as t from '../types'

const { BREAK, REMOVE, SKIP } = visit

/**
 * Performs a binding check depending on the type of binding
 * @param type Type of binding check to perform
 * @param value The value of the binding key
 * @param page Page to perform the check on
 * @param root
 * @returns True if the binding exists
 */
export function hasBinding(
  type: 'popUpView' | 'viewTag',
  node: YAMLMap,
  page: string,
  root: ARoot | DocRoot,
) {
  switch (type) {
    case 'popUpView':
    case 'viewTag': {
      let hasPointer = false
      let pageDoc = root.get(page)
      let value = node.get(type, false) as string

      if (coreIs.reference(value)) {
        value = unwrap(
          deref({ node: value, root, rootKey: page }).value as string,
        )
      }

      if (pageDoc) {
        const components = pageDoc.get('components') as YAMLSeq
        if (components) {
          visit(components, {
            Map: (_, n) => {
              if (hasPointer) return BREAK
              if (has('type', type, n)) {
                const v = n.get(type, true)
                if (is.reference(v)) {
                  const derefed = deref({ node: v, root, rootKey: page })
                  if (!coreIs.und(derefed.value)) {
                    hasPointer = derefed.value === value
                    if (hasPointer) return BREAK
                  }
                } else if (unwrap(v as any) === value) {
                  hasPointer = true
                  return BREAK
                }
              }
            },
          })
        }
      }
      return hasPointer
    }
    default:
      return false
  }
}

// TODO - Narrow destination if it is a ref
export function hasPageInAppConfig(page: string, markers: Markers) {
  return markers?.pages?.includes?.(page)
}

export function refResolvesToAnyValue(
  node: Scalar | string | null | undefined,
  root: ARoot | DocRoot,
  page = '',
) {
  return !coreIs.und(
    deref({ node: unwrap(node) as string, root, rootKey: page }).value,
  )
}
