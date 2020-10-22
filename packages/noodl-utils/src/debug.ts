/** Utilities for debugging purposes */
import get from 'lodash/get'
import isPlo from 'lodash/isPlainObject'

/**
 * A utility used in development to automatically grab the path to a list data
 * in the local root
 * @param { object } pageObject - Page object like noodl.root["SignIn"]
 */
export function getLocalRootListData(pageObject: any) {
  return get(pageObject, getLocalRootListPath(pageObject), [])
}

export function getLocalRootListPath(
  pageObject: any,
  as: 'array' | 'string' = 'array',
) {
  const path = ['listData']
  if (pageObject && typeof pageObject === 'object') {
    if (Array.isArray(pageObject.listData)) {
      return as === 'array' ? path : path[0]
    } else if (isPlo(pageObject.listData)) {
      const entries = Object.entries(pageObject.listData)
      const numEntries = entries.length
      for (let index = 0; index < numEntries; index++) {
        const [key, value] = entries[index]
        if (Array.isArray(value)) {
          return as === 'array' ? path.concat(key) : path.concat(key).join('.')
        }
      }
    }
  }
  return []
}
