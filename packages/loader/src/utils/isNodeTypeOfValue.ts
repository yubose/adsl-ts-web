import y from 'yaml'
import type typeOf from './typeOf'

export default function isNodeTypeOfValue(
  node: any,
  type: ReturnType<typeof typeOf>,
) {
  console.log({ node })
  console.log({ node })
  console.log({ node })

  if (node !== undefined) {
    if (y.isScalar(node)) {
      return ['boolean', 'number', 'null', 'string'].includes(type)
    }

    if (y.isMap(node)) {
      return type === 'object'
    }

    if (y.isSeq(node)) {
      return type === 'array'
    }
  }

  return false
}
