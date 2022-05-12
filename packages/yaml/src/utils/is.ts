import * as u from '@jsmanifest/utils'
import { Identify } from 'noodl-types'
import type { ReferenceString } from 'noodl-types'
import y, { YAMLMap } from 'yaml'
import { findPair } from 'yaml/util'
import unwrap from './unwrap'
import * as t from '../types'

function isMapNodeContaining<K extends string, V = any>(key: K, value: V) {
  return (node: y.YAMLMap): node is y.YAMLMap<K, V> => {
    return node.has(key) && node.get(key, false) === value
  }
}

function sameNodeType<N extends t.YAMLNode>(n1: unknown, n2: any): n2 is N {
  if (y.isNode(n1) && y.isNode(n2)) {
    if (y.isScalar(n1)) return y.isScalar(n2)
    if (y.isMap(n1)) return y.isMap(n2)
    if (y.isSeq(n1)) return y.isSeq(n2)
    if (y.isDocument(n1)) return y.isDocument(n2)
  }
  if (y.isPair(n1)) return y.isPair(n2)
  return false
}

function equalTo<N = any>(v1: unknown, v2: N): v1 is typeof v2 {
  if (y.isScalar(v1)) {
    if (y.isScalar(v2)) return unwrap(v1) === unwrap(v2)
    return unwrap(v1) === v2
  }

  if (y.isScalar(v2)) {
    if (y.isScalar(v1)) return unwrap(v2) === unwrap(v1)
    return unwrap(v2) === v1
  }

  if (y.isPair(v1) && y.isPair(v2)) {
    if (unwrap(v1.key) === unwrap(v2.key)) {
      if (sameNodeType(v1.value, v2.value)) {
        return equalTo(v1.value, v2.value)
      }
    }
    return false
  } else if (y.isMap(v1) && y.isMap(v2)) {
    if (v1.items.length === v2.items.length) {
      if (!v1.items.length) return true
      return v1.items.every((item) =>
        equalTo(item.value, findPair(v2.items, item.key)?.value),
      )
    }
  } else if (y.isSeq(v1) && y.isSeq(v2)) {
    if (v1.items.length !== v2.items.length) return false
    return v1.items.every((item, i) => equalTo(item, v2.items[i]))
  }

  return false
}

const is = {
  array: (node: unknown): node is y.YAMLSeq => y.isSeq(node),
  object: (node: unknown): node is y.YAMLMap =>
    y.isMap(node) || y.isDocument(node),
  string: (node: unknown): node is y.Scalar<string> => u.isStr(unwrap(node)),
  number: (node: unknown): node is y.Scalar<number> => u.isNum(unwrap(node)),
  nil: (node: unknown): node is y.Scalar<null | undefined> =>
    u.isNil(unwrap(node)),
  null: (node: unknown): node is y.Scalar<null> => u.isNull(unwrap(node)),
  undefined: (node: unknown): node is y.Scalar<undefined> =>
    u.isUnd(unwrap(node)),
  equalTo,
  reference: (node: unknown): node is y.Scalar<ReferenceString> =>
    Identify.reference(unwrap(node)),
  sameNodeType,
  builtInFn: (node: unknown): node is y.YAMLMap<`=.builtIn.${string}`> => {
    if (
      y.isMap(node) &&
      node.items.length === 1 &&
      y.isScalar(node.items[0].key)
    ) {
      const key = node.items[0].key.value
      return u.isStr(key) && key.startsWith(`=.builtIn`)
    }
    return false
  },
  button: isMapNodeContaining('type', 'button'),
  canvas: isMapNodeContaining('type', 'canvas'),
  chart: isMapNodeContaining('type', 'chart'),
  chatList: isMapNodeContaining('type', 'chatList'),
  ecosDoc: isMapNodeContaining('type', 'ecosDoc'),
  divider: isMapNodeContaining('type', 'divider'),
  footer: isMapNodeContaining('type', 'footer'),
  header: isMapNodeContaining('type', 'header'),
  image: isMapNodeContaining('type', 'image'),
  label: isMapNodeContaining('type', 'label'),
  list: isMapNodeContaining('type', 'list'),
  listItem: isMapNodeContaining('type', 'listItem'),
  map: isMapNodeContaining('type', 'map'),
  page: isMapNodeContaining('type', 'page'),
  plugin: isMapNodeContaining('type', 'plugin'),
  pluginHead: isMapNodeContaining('type', 'pluginHead'),
  pluginBodyTail: isMapNodeContaining('type', 'pluginBodyTail'),
  popUp: isMapNodeContaining('type', 'popUp'),
  register: isMapNodeContaining('type', 'register'),
  select: isMapNodeContaining('type', 'select'),
  scrollView: isMapNodeContaining('type', 'scrollView'),
  textField: isMapNodeContaining('type', 'textField'),
  textView: isMapNodeContaining('type', 'textView'),
  video: isMapNodeContaining('type', 'video'),
  view: isMapNodeContaining('type', 'view'),
}

export default is
