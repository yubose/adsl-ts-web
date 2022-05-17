import type { ARoot } from '@noodl/core'
import y from 'yaml'

function _replace<N extends y.Scalar | y.Pair>(node: N, value: any): N

function _replace<N extends y.YAMLSeq>(node: N, index: number, value: any): N

function _replace<N extends y.YAMLMap | ARoot>(
  node: N,
  key: string,
  value: any,
): N

function _replace<N = any>(
  node: N,
  keyOrIndexOrValue: any,
  value?: any,
): N | null {
  // if (is.scalarNode(node)) {
  //   node.value = value
  // } else if (is.pairNode(node)) {
  //   node.value = value
  // } else if (is.mapNode(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // } else if (is.seqNode(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // } else if (is.root(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // }
  return node
}

export default _replace
