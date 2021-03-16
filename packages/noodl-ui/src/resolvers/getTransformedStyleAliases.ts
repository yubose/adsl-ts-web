import { isBooleanFalse, isBooleanTrue } from 'noodl-utils'
import { isObj } from '../utils/internal'
import { hasDecimal, hasLetter } from '../utils/common'
import { ResolverFn } from '../types'

/**
 * Renames/transforms some keywords to align more with css styles
 *  ex: isHidden: true --> styleObj.visibility = 'hidden'
 */
const getTransformedStyleAliases: ResolverFn = (component) => {
  const isHidden = component.getStyle('isHidden')
  const shadow = component.getStyle('shadow')
  const required = component.getStyle('required')

  if (isHidden) {
    component.setStyle('visibility', 'hidden')
  }

  if (isBooleanTrue(shadow)) {
    component.setStyle('boxShadow', '5px 5px 10px 3px rgba(0, 0, 0, 0.015)')
  }

  if (isBooleanTrue(required)) component.set('required', true)
  else if (isBooleanFalse(required)) component.set('required', false)

  const marginKeys = [
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
  ] as const

  const numMarginKeys = marginKeys.length

  if (isObj(component.style)) {
    // for (let index = 0; index < numMarginKeys; index++) {
    //   const key = marginKeys[index]
    //   if (key in (component.style || {})) {
    //     let value = component.getStyle(key)
    //     if (typeof value === 'string') {
    //       if (hasDecimal(value)) {
    //         value = Number(value) * 100
    //       }
    //     }
    //     component.setStyle(
    //       key,
    //       !hasLetter(String(value)) ? value + 'px' : value,
    //     )
    //   }
    // }
  } else {
    // If the code reaches this block it might be a string and most likely
    // a parsing / dereference error
  }
}

export default getTransformedStyleAliases
