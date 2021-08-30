import * as u from '@jsmanifest/utils'

/**
 * Converts 0x000000 to #000000 format
 * @param { string } value - Raw color value from NOODL
 */
export const formatColor = (v = '') =>
  v.startsWith('0x') ? v.replace('0x', '#') : v || ''

export const hasDecimal = (v = '') => Number(v) % 1 !== 0

export const hasLetter = (v = '') => /[a-zA-Z]/i.test(String(v))

export const isPromise = (v: any): v is Promise<any> =>
  u.isObj(v) && 'then' in v

export const promiseAllSafely = async (
  promises: Promise<any>[],
  getResult?: <RT = any>(err: null | Error, result: any) => RT,
) => {
  const results = [] as any[]

  for (let index = 0; index < promises.length; index++) {
    try {
      let result = await promises[index]
      result = getResult ? getResult(null, result) : result
      results.push(result)
    } catch (error) {
      const err = new Error(error.message)
      const result = getResult ? getResult(err, undefined) : err
      results.push(result)
    }
  }

  return results
}

export const toNumber = (v = '') => {
  let value: any
  if (hasLetter(v)) {
    const results = v.match(/[a-zA-Z]/i)
    if (u.isNum(results?.index) && results != null && results.index > -1) {
      value = Number(v.substring(0, results.index))
    }
  } else {
    value = Number(v)
  }
  return value
}
