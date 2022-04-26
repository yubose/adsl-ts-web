import NoodlBase from '../Base'
import is from './is'

function unwrap(value: unknown) {
  if (is.node(value)) {
    if (is.stringNode(value)) {
      return value.getValue()
    }

    if (is.valueNode(value)) {
      return value.getValue()
    }

    if (is.propertyNode(value)) {
      return value.build()
    }

    if (is.arrayNode(value) || is.objectNode(value)) {
      return value.build()
    }
  }

  console.log({ value })

  return value === undefined ? value : String(value)
}

export default unwrap
