import y from 'yaml'
import createNode from './createNode'
import is from './is'
import getNodeKind from './getNodeKind'
import { Kind } from '../constants'

function set(
  node: unknown,
  key: number[] | y.Scalar | number | string | string,
  value: any,
) {
  if (y.isScalar(key) && typeof key.value === 'string') {
    key = key.value
  }
  if (node instanceof Map) {
    node.set(key, createNode(value))
  } else {
    if (is.ymlNode(node)) {
      switch (getNodeKind(node)) {
        case Kind.Seq:
        case Kind.Map:
        case Kind.Document: {
          return void (node as y.Document | y.YAMLMap | y.YAMLSeq).set(
            key,
            createNode(value),
          )
        }
        case Kind.Pair: {
          return void ((node as y.Pair).value = createNode(value))
        }
        case Kind.Scalar: {
          return void ((node as y.Scalar).value = value)
        }
      }
    }
  }
}

export default set
