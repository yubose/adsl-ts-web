import typeOf from './typeOf'

export default function isValueTypeOfNode(
  value: any,
  kind: 'scalar' | 'map' | 'seq',
) {
  const type = typeOf(value)

  switch (type) {
    case 'array':
      return kind === 'seq'
    case 'object':
      return kind === 'map'
    case 'boolean':
    case 'number':
    case 'null':
    case 'string':
      return kind === 'scalar'
    default:
      return false
  }
}
