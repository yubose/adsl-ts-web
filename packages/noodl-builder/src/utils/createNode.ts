import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlArray from '../Array'
import NoodlObject from '../Object'
import typeOf from './typeOf'
import is from './is'

// V extends NoodlObject | Record<string, any>
//   ? NoodlObject
//   : V extends NoodlProperty<any>
//   ? NoodlProperty<any>
//   : V extends string | NoodlString<any>
//   ? NoodlString<any>
//   : V extends any[] | boolean | null | number
//   ? NoodlValue<any>
//   : V extends infer P
//   ? P
//   : NoodlBase | undefined

function createNode<V>(value: V) {
  if (is.node(value)) return value

  if (value !== undefined) {
    const type = typeOf(value)
    switch (type) {
      case 'array':
        const node = new NoodlArray()
        // @ts-expect-error
        const arr = value as any[]
        arr.forEach((item, index) => node.setValue(index, createNode(item)))
        return node
      case 'boolean':
      case 'null':
      case 'number':
        return new NoodlValue<any>(value)
      case 'object': {
        const obj = value as Record<string, any>
        const node = new NoodlObject()
        for (const [key, value] of Object.entries(obj)) {
          node.createProperty(key, createNode(value))
        }
        return node
      }
      case 'string':
        return new NoodlString<string>(value as any)
      default:
        break
    }
  }

  return undefined
}

export default createNode
