/**
 * Converts 0x000000 to #000000 format
 * @param { string } value - Raw color value from NOODL
 */
export function formatColor(value: string) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value.replace('0x', '#')
  }
  return value || ''
}

export function isPromise(value: any): value is Promise<any> {
  return value && typeof value === 'object' && 'then' in value
}

/**
 * Returns true if there is a decimal in the number.
 * @param { number } value - Value to evaluate
 */
export function hasDecimal(value: any): boolean {
  return Number(value) % 1 !== 0
}

/**
 * Returns true if there is any letter in the string
 * @param { string } value - Value to evaluate
 */
export function hasLetter(value: any): boolean {
  return /[a-zA-Z]/i.test(String(value))
}

/**
 * Returns true if we are in the browser environment
 */
export function isBrowser() {
  return typeof window !== 'undefined'
}

export async function promiseAllSafely(
  promises: Promise<any>[],
  getResult?: <RT = any>(err: null | Error, result: any) => RT,
) {
  const results = [] as any[]

  for (let index = 0; index < promises.length; index++) {
    const promise = promises[index]
    try {
      const result = await promise
      results.push(getResult ? getResult(null, result) : result)
    } catch (error) {
      const err = new Error(error.message)
      results.push(getResult ? getResult(err, undefined) : err)
    }
  }

  return results
}

export function toNumber(str: string) {
  let value: any
  if (hasLetter(str)) {
    const results = str.match(/[a-zA-Z]/i)
    if (typeof results?.index === 'number' && results.index > -1) {
      value = Number(str.substring(0, results.index))
    }
  } else {
    value = Number(str)
  }
  return value
}
