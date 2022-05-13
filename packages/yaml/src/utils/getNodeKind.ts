import * as c from '../constants'
import getNodeType from './getNodeType'

function getNodeKind(node: unknown) {
  switch (getNodeType(node)) {
    case 'Scalar':
      return c.Kind.Scalar
    case 'Pair':
      return c.Kind.Pair
    case 'Map':
      return c.Kind.Map
    case 'Seq':
      return c.Kind.Seq
    default:
      return c.Kind.Unknown
  }
}

export default getNodeKind
