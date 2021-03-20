import { ResolverFn } from '../types'
import { parseReference } from '../utils/noodl'
import isReference from '../utils/isReference'

/**
 * Initializes the querying for retrieving references from a NOODL
 * component object
 */
const getReferences: ResolverFn = (component, { context, getRoot }) => {
  let key: any, value: any

  const keys = Object.keys(component.original)
  const numKeys = keys.length

  for (let index = 0; index < numKeys; index++) {
    key = keys[index]
    value = component.get(key)

    if (isReference(key)) {
      component.assign(
        parseReference(key, { page: context.page, root: getRoot() }),
      )
    }

    // Also check the value if they are a string and are a reference
    if (isReference(value)) {
      if (key === 'style') {
        component.assignStyles(
          parseReference(value, { page: context.page, root: getRoot() }),
        )
      } else {
        component.assign(
          parseReference(value, { page: context.page, root: getRoot() }),
        )
      }
    }
  }
}

export default getReferences
