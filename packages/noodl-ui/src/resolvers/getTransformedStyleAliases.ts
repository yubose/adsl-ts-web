import { isBooleanFalse, isBooleanTrue } from 'noodl-utils'
import { ResolverFn } from '../types'

/**
 * Renames/transforms some keywords to align more with css styles
 *  ex: isHidden: true --> styleObj.visibility = 'hidden'
 */
const getTransformedStyleAliases: ResolverFn = (component) => {
  const isHidden = component.getStyle('isHidden')
  const shadow = component.getStyle('shadow')
  const required = component.getStyle('required')
  const margin = component.getStyle('margin')
  const marginTop = component.getStyle('marginTop')
  const marginRight = component.getStyle('marginRight')
  const marginBottom = component.getStyle('marginBottom')
  const marginLeft = component.getStyle('marginLeft')

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

  // for (let index = 0; index < numMarginKeys; index++) {
  //   const key = marginKeys[index]
  //   if (key in (component.style || {})) {
  //     console.log({
  //       [key]: component.getStyle(key),
  //       [`${key}...`]: component.style[key],
  //     })
  //   }
  // }
}

export default getTransformedStyleAliases
