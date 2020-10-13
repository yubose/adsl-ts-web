import _ from 'lodash'
import { isBooleanTrue } from 'noodl-utils'
import { Resolver } from '../types'

/**
 * Renames/transforms some keywords to align more with css styles
 * ex: isHidden: true --> styleObj.visibility = 'hidden'
 * @param { ProxiedDraftComponent } draft
 * @param { NOODLComponent } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getTransformedStyleAliases: Resolver = (component) => {
  const isHidden = component.getStyle('isHidden')
  const shadow = component.getStyle('shadow')
  const required = component.getStyle('required')

  if (isHidden) {
    component.setStyle('visibility', 'hidden')
  }

  if (isBooleanTrue(shadow)) {
    component.setStyle('boxShadow', '5px 5px 10px 3px rgba(0, 0, 0, 0.015)')
  }

  if (_.isString(required)) {
    if (required === 'true') {
      component.set('required', true)
    } else if (required === 'false') {
      component.set('required', false)
    }
  }
}

export default getTransformedStyleAliases
