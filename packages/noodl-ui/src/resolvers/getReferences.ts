import _ from 'lodash'
import { ResolverFn } from '../types'
import isReference from '../utils/isReference'

/**
 * Initializes the querying for retrieving references from a NOODL
 * component object
 */
const getReferences: ResolverFn = (component, { context, parser }) => {
  const { page, roots } = context

  if (roots) {
    let key: any, value: any

    for (let index = 0; index < component.keys.length; index++) {
      key = component.keys[index]
      value = component.get(key)

      if (isReference(key)) {
        if (page && parser.getLocalKey() !== page) {
          parser.setLocalKey(page)
        }
        component.assign(parser.get(key))
      }

      // Also check the value if they are a string and are a reference
      if (isReference(value)) {
        if (page && parser.getLocalKey() !== page) {
          parser.setLocalKey(page)
        }
        if (key === 'style') {
          component.assignStyles(parser.get(value))
        } else {
          component.assign(parser.get(value))
        }
      }
    }
  }
}

export default getReferences
