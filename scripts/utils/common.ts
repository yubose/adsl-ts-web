import sortBy from 'lodash/sortBy'

/**
 * Creates a new object with the provides keys as properties, and optionally
 * assigning the initial value on each. If no value is provided, undefined is used
 * @param { string | string[] } keys - Properties of the created object
 * @param { any } initialValue - Value to set on each key value
 */
export function createObjWithKeys(keys: string | string[], initialValue: any) {
  return keys?.reduce((_, key) => ({ [key]: initialValue }), {})
}

/**
 * Creates a regexp using the keywords passed as arguments. The flags default to "i"
 * but can be overriden if an object of { keywords, flags } is passed in as arguments instead
 * @param { string | string[] | ...string[] } keywords - Properties to match for on objects
 */
export function createRegexpByKeywords(
  keywords: string[] | string | { keywords: string[]; flags?: string },
  ...args: any[]
) {
  let _keywords: string[] = []
  let flags = 'i' // default

  if (typeof keywords === 'string') {
    if (args.length) {
      _keywords = [keywords, ...args]
    } else {
      _keywords = [keywords]
    }
  } else if (Array.isArray(keywords)) {
    _keywords = keywords
  } else if (isObjectLike(keywords)) {
    _keywords = keywords.keywords
    flags = keywords.flags === undefined ? flags : keywords.flags
  }

  return new RegExp(
    _keywords.reduce((acc, keyword, index) => {
      if (index < _keywords.length - 1) acc += `${keyword}|`
      else acc += `${keyword})$`
      return acc
    }, '^('),
    flags,
  )
}

export function sortObjByProperties(obj: any) {
  if (isObjectLike(obj)) {
    return sortBy(Object.keys(obj)).reduce(
      (acc, key) => Object.assign(acc, { [key]: obj[key] }),
      {},
    )
  }
}
