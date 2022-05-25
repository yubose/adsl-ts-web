import y from 'yaml'
import is from '../utils/is'
import type DocRoot from '../DocRoot'
import * as t from '../types'

function _replace<N extends y.Scalar | y.Pair>(node: N, value: any): N

function _replace<N extends y.YAMLSeq>(node: N, index: number, value: any): N

function _replace<N extends y.YAMLMap | DocRoot>(
  node: N,
  key: string,
  value: any,
): N

function _replace<N extends t.YAMLNode | DocRoot | y.Pair | y.YAMLMap>(
  node: N,
  keyOrIndexOrValue: any,
  value?: any,
): N | null {
  if (is.scalarNode(node)) {
    node.value = keyOrIndexOrValue
  } else if (is.pairNode(node)) {
    node.value = keyOrIndexOrValue
  } else if (is.mapNode(node)) {
    node.set(keyOrIndexOrValue, value)
  } else if (is.seqNode(node)) {
    node.set(keyOrIndexOrValue, value)
  } else if (is.root(node)) {
    node.set(keyOrIndexOrValue, value)
  }
  return node
}

export default _replace
