import type { ARoot } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import y from 'yaml'
import deref from '../utils/deref'
import getNodeKind from '../utils/getNodeKind'
import is from '../utils/is'
import type DocRoot from '../DocRoot'
import * as c from '../constants'
import * as t from '../types'

export interface MergeOptions {
  root?: ARoot
  rootKey?: t.StringNode
}

function isMergingRef<S extends string>(refOrNode: y.Scalar<S> | S) {
  return (
    (is.scalarNode(refOrNode) &&
      u.isStr(refOrNode.value) &&
      is.reference(refOrNode)) ||
    (u.isStr(refOrNode) && refOrNode.startsWith('.'))
  )
}

function _merge<N extends t.YAMLNode>(
  node: N,
  refOrNode: y.Scalar<ReferenceString> | ReferenceString | y.YAMLMap | DocRoot,
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
        mergingValue = deref({ node: ref, root, rootKey }).value

        switch (getNodeKind(mergingValue)) {
          case c.Kind.Unknown:
            return node
          case c.Kind.Seq:
          case c.Kind.Pair:
          case c.Kind.Scalar:
            break
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

            if (is.mapNode(nodeMerging)) {
              nodeMerging.items.forEach((pair) => {
                if (is.mapNode(node)) {
                  node.set(pair.key, pair.value)
                }
              })
            }
            break
          }
        }
      }

      return node
    }
    default:
      return node
  }
}

export default _merge
