function typeOf(value: any) {
  const type = typeof value

  if (Array.isArray(value)) {
    return 'array'
  }

  if (value === null) {
    return 'null'
  }

  return type
}

export default typeOf
