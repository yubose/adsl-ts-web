import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlArray from '../Array'
import NoodlObject from '../Object'
import typeOf from './typeOf'
import is from './is'

function createNode<V>(value: V) {
  if (is.node(value)) return value

  switch (typeOf(value)) {
    case 'array':
      const node = new NoodlArray()
      // @ts-expect-error
      const arr = value as any[]
      arr.forEach((item, index) => node.setValue(index, createNode(item)))
      return node
    case 'boolean':
    case 'null':
    case 'number':
      return new NoodlValue(value)
    case 'object': {
      const obj = value as Record<string, any>
      const node = new NoodlObject()
      for (const [key, value] of Object.entries(obj)) {
        node.createProperty(key, createNode(value))
      }
      return node
    }
    case 'string':
      return new NoodlString(value)
    default:
      break
  }

  return undefined
}

export default createNode
