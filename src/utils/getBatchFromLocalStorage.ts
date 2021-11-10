/**
 * Returns an object where the keys are the provided keys in arguments and their values were their stored values in local storage. If a value was returned as a JSON string it will be parsed into a JSON object
 * @param { ...string[] } keys
 * @returns { Record<string, any> }
 */
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
