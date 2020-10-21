import _ from 'lodash'
import { Resolver } from '../types'
import isReference from '../utils/isReference'

/** Initializes the querying for retrieving references from a NOODL component object
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getReferences: Resolver = (component, { context, parser }) => {
  const { page, roots } = context

  if (roots) {
    let key: any, value: any

    for (let index = 0; index < component.keys.length; index++) {
      key = component.keys[index]
      value = component.get(key)

      if (isReference(key)) {
        if (page.name && parser.getLocalKey() !== page.name) {
          parser.setLocalKey(page.name)
        }
        component.assign(parser.get(key))
      }

      // Also check the value if they are a string and are a reference
      if (isReference(value)) {
        if (page.name && parser.getLocalKey() !== page.name) {
          parser.setLocalKey(page.name)
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
