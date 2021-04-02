import { Identify } from 'noodl-types'
import { ResolverFn } from '../types'
import { parseReference } from '../utils/noodl'

/**
 * Initializes the querying for retrieving references from a NOODL
 * component object
 */
const getReferences: ResolverFn = (component, { context, getRoot }) => {
  let key: any, value: any

  const keys = Object.keys(component.blueprint)
  const numKeys = keys.length

  for (let index = 0; index < numKeys; index++) {
    key = keys[index]
    value = component.get(key)

    if (Identify.reference(key)) {
      component.edit(
        parseReference(key, { page: context.page, root: getRoot() }),
      )
    }

    // Also check the value if they are a string and are a reference
    if (Identify.reference(value)) {
      if (key === 'style') {
        component.edit({
          style: parseReference(value, { page: context.page, root: getRoot() }),
        })
      } else {
        component.edit(
          parseReference(value, { page: context.page, root: getRoot() }),
        )
      }
    }
  }
}

export default getReferences
