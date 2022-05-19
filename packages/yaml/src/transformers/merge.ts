import type { ARoot } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import y from 'yaml'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import getNodeKind from '../utils/getNodeKind'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import type DocRoot from '../DocRoot'
import * as c from '../constants'
import * as t from '../types'

export interface MergeOptions {
  root?: ARoot
  rootKey?: t.StringNode
}

function isMergingRef<S extends string>(refOrNode: S | y.Scalar<S>) {
  return (
    (is.scalarNode(refOrNode) &&
      u.isStr(refOrNode.value) &&
      is.reference(refOrNode)) ||
    (u.isStr(refOrNode) && refOrNode.startsWith('.'))
  )
}

function _merge<N extends t.YAMLNode>(
  node: N,
  refOrNode:
    | DocRoot
    | Record<string, any>
    | ReferenceString
    | y.Scalar<ReferenceString>
    | y.YAMLMap
    | null
    | undefined,
  { root, rootKey }: MergeOptions = {},
): N | null {
  let mergingValue: any
  let ref: string | undefined

  if (
    (u.isStr(refOrNode) || y.isScalar(refOrNode)) &&
    isMergingRef(refOrNode)
  ) {
    ref = u.isStr(refOrNode) ? refOrNode : refOrNode.value
  }

  if (is.nil(node)) {
    return ref ? deref({ node: ref, root, rootKey }).value : refOrNode
  }

  switch (getNodeKind(node)) {
    case c.Kind.Map:
    case c.Kind.Seq:
    case c.Kind.Pair:
    case c.Kind.Scalar:
    case c.Kind.Document: {
      if (ref) {
        mergingValue = createNode(deref({ node: ref, root, rootKey }).value)
      } else {
        mergingValue = createNode(refOrNode as any)
      }

      switch (getNodeKind(mergingValue)) {
        case c.Kind.Unknown:
        case c.Kind.Seq:
        case c.Kind.Pair:
        case c.Kind.Scalar: {
          if (is.seqNode(node)) {
            if (is.seqNode(mergingValue)) {
              mergingValue.items.forEach((item) =>
                node.add(createNode(item as any)),
              )
            } else if (is.pairNode(mergingValue)) {
              node.add(createNode(mergingValue.value as any))
            } else {
              node.add(createNode(mergingValue))
            }
          }
          break
        }
        case c.Kind.Map:
        case c.Kind.Document: {
          let nodeMerging: any

          if (is.mapNode(mergingValue)) {
            nodeMerging = mergingValue
          } else {
            const doc = mergingValue as y.Document
            if (is.mapNode(doc.contents)) {
              nodeMerging = doc.contents
            }
          }

          if (nodeMerging) {
            if (is.mapNode(nodeMerging)) {
              nodeMerging.items.forEach((pair) => {
                if (is.mapNode(node)) {
                  node.set(pair.key, pair.value)
                }
              })
            }
          } else {
            if (mergingValue != null) {
              if (Array.isArray(mergingValue)) {
                //
              } else if (typeof mergingValue === 'object') {
                Object.entries(mergingValue).forEach(([k, v]) =>
                  (node as y.YAMLMap).set(unwrap(k), createNode(v as any)),
                )
              }
            }
          }

          break
        }
      }

      return node
    }
    default:
      return node
  }
}

export default _merge
