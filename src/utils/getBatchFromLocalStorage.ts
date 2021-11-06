function getBatchFromLocalStorage<K extends string>(...keys: K[]) {
  return keys.reduce((acc, key) => {
    let value = localStorage.getItem(key)
    let result = value

    if (typeof value === 'string') {
      try {
        result = JSON.parse(value)
      } catch (error) {
        console.error(error)
      }
    }

    if (result != undefined) acc[key] = result

    return acc
  }, {} as Record<K, any>)
}

export default getBatchFromLocalStorage
