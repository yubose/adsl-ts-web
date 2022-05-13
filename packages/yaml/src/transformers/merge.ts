import type { ARoot } from '@noodl/core'
import { getRefProps } from '@noodl/core'
import * as u from '@jsmanifest/utils'
import y from 'yaml'
import deref from '../utils/deref'
import getNodeType from '../utils/getNodeType'
import getNodeKind from '../utils/getNodeKind'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import * as c from '../constants'
import * as t from '../types'

export interface MergeOptions {
  dataObject?: t.DataObject
  root?: ARoot
  rootKey?: t.StringNode
}

function _merge<S extends string>(
  node: t.YAMLNode,
  refOrRefNode: y.Scalar<`${'.' | '..'}${S}`> | `${'.' | '..'}${S}`,
  { dataObject, root, rootKey }: MergeOptions = {},
) {
  switch (getNodeKind(node)) {
    case c.Kind.Map:
    case c.Kind.Seq:
    case c.Kind.Pair:
    case c.Kind.Scalar: {
      const { isLocalKey, isLocalRef, path, paths, ref } = getRefProps(
        unwrap(refOrRefNode) as `${'.' | '..'}${S}`,
      )

      const refValue = deref({ node: ref, dataObject, root, rootKey })

      return node
    }
    default:
      return node
  }
}

export default _merge
