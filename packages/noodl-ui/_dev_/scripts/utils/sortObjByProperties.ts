// Sorts properties alphabetically  and returns the new object
import _ from 'lodash'

function sortObjByProperties(obj: any) {
  if (_.isObjectLike(obj)) {
    return _.reduce(
      _.sortBy(_.keys(obj)),
      (acc, key) => _.assign(acc, { [key]: obj[key] }),
      {},
    )
  }
}

export default sortObjByProperties
