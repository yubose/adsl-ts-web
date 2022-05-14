import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { is as coreIs, toPath, trimReference } from '@noodl/core'
import is from './is'
import getNodeKind from './getNodeKind'
import { Kind } from '../constants'

function get(
  node: unknown,
  key: y.Scalar | string | number | (string | number)[],
) {
  let originalKey = key

  if (y.isScalar(key) && typeof key.value === 'string') {
    key = key.value
  }

  if (typeof key === 'string' && coreIs.reference(key)) {
    key = trimReference(key)
  }

  key = toPath(key as string)

  if (node instanceof Map) {
    const nextKey = key.shift()
    const nextValue = node.get(nextKey)
    if (key.length) return get(nextValue, key)
    return nextValue
  }

  if (is.ymlNode(node)) {
    switch (getNodeKind(node)) {
      case Kind.Map: {
        const nextKey = key.shift()
        const nextValue = (node as y.YAMLMap).get(nextKey)
        if (key.length) return get(nextValue, key)
        return nextValue
      }
      case Kind.Seq: {
        const nextKey = key.shift()
        const nextValue = (node as y.YAMLSeq).get(nextKey)
        return key.length ? get(nextValue, key) : nextValue
      }
      case Kind.Document: {
        return key.length ? get((node as y.Document).contents, key) : undefined
      }
    }
  }

  if (is.root(node)) {
    return get(node.value, key)
  }

  return key.length
    ? u.get(node as any, key)
    : key === originalKey
    ? undefined
    : node
}

export default get
