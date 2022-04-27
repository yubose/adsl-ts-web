import typeOf from './typeOf'

function toString(value: string) {
  const type = typeOf(value)

  switch (type) {
    case 'array':
      return '[object Array]'
    case 'function':
      return `[object Function]`
    default:
      return String(value)
  }
}

export default toString
