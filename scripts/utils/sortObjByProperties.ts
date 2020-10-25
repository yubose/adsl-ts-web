// Sorts properties alphabetically  and returns the new object
import _ from 'lodash'

function sortObjByProperties(obj: any) {
  if (_.isObject(obj)) {
    const sortedKeys = _.orderBy(_.keys(obj), 'asc')
    const fn = (acc: any, key: string) => _.assign(acc, { [key]: obj[key] }, {})
    return _.reduce(sortedKeys, fn, {})
  }
  return obj
}

export default sortObjByProperties
