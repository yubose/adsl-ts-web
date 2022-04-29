import is from './is'
import typeOf from './typeOf'

function toString(value: unknown): string {
  if (is.node(value)) {
    if (is.stringNode(value)) {
      return value.getValue(false) as string
    }
    if (is.valueNode(value)) {
      return value.toString()
    }
  } else {
    switch (typeOf(value)) {
      case 'array':
        return '[object Array]'
      case 'function':
        return `[object Function]`
    }
  }

  return String(value)
}

export default toString
