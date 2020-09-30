import _ from 'lodash'

/**
 * Creates a new object with the provides keys as properties, and optionally
 * assigning the initial value on each. If no value is provided, undefined is used
 * @param { string | string[] } keys - Properties of the created object
 * @param { any } initialValue - Value to set on each key value
 */
export function createObjWithKeys(keys: string | string[], initialValue: any) {
  return _.reduce(keys, (_, key) => ({ [key]: initialValue }), {})
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

  if (_.isString(keywords)) {
    if (args.length) {
      _keywords = [keywords, ...args]
    } else {
      _keywords = [keywords]
    }
  } else if (_.isArray(keywords)) {
    _keywords = keywords
  } else if (_.isObjectLike(keywords)) {
    _keywords = keywords.keywords
    flags = _.isUndefined(keywords.flags) ? flags : keywords.flags
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
  if (_.isObjectLike(obj)) {
    return _.reduce(
      _.sortBy(_.keys(obj)),
      (acc, key) => _.assign(acc, { [key]: obj[key] }),
      {},
    )
  }
}
