import is from './is'

function unwrap(value: unknown) {
  if (is.node(value)) {
    if (is.propertyNode(value)) {
      return value.getValue(false)
    }

    if (is.arrayNode(value)) {
      return value.length ? value.build() : []
    }

    if (is.objectNode(value)) {
      return value.length ? value.build() : {}
    }

    if (is.stringNode(value)) {
      return value.getValue(false)
    }

    if (is.valueNode(value)) {
      return value.getValue()
    }
  }

  return value
}

export default unwrap
