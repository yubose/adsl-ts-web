import orderBy from 'lodash/orderBy'

// Sorts properties alphabetically  and returns the new object

function sortObjByProperties(obj: any) {
  if (typeof obj === 'object') {
    const sortedKeys = orderBy(Object.keys(obj), 'asc')
    const fn = (acc: any, key: string) =>
      Object.assign(acc, { [key]: obj[key] }, {})
    return sortedKeys.reduce(fn, {})
  }
  return obj
}

export default sortObjByProperties
