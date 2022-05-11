import y from 'yaml'

/**
 * Unwraps a Scalar node if given a Scalar
 * @param node Scalar or value
 * @returns The unwrapped scalar or value
 */
function unwrap(node: any) {
  if (y.isScalar(node)) return node.value
  return node
}

export default unwrap
