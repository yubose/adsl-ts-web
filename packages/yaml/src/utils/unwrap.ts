import y from 'yaml'
import { _symbol } from '../constants'

/**
 * Unwraps a Scalar node if given a Scalar
 * @param node Scalar or value
 * @returns The unwrapped scalar or value
 */
function unwrap(node: any) {
  if (y.isScalar(node)) return node.value
  if (node !== null && typeof node === 'object') {
    if (node['_id_'] === _symbol.root) {
      return node.value
    }
  }
  return node
}

export default unwrap
