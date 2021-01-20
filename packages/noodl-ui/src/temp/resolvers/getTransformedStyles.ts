import { ComponentObject } from 'noodl-types'
import { isBoolean as isNOODLBoolean, isBooleanTrue } from 'noodl-utils'

/**
 * Renames/transforms some keywords to align more with css styles
 *  ex: isHidden: true --> styleObj.visibility = 'hidden'
 */
export default {
  name: 'getTransformedStyles',
  resolve({ component }: { component: ComponentObject }) {
    if (!component) return
    if (!component.style) component.style = {}

    const { isHidden, required, shadow } = component.style

    if (isHidden) {
      component.style.visibility = 'hidden'
    }

    if (isBooleanTrue(shadow)) {
      component.style.boxShadow = '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
    }

    if (isNOODLBoolean(required)) {
      component.required = isBooleanTrue(required)
    }
  },
}
