import { formatColor } from '../utils/common'
import { ResolverFn } from '../types'

/**
 * Returns a new object with some keywords changed to align more with html/css/etc
 * Also converts color values like 0x00000000 to #00000000
 * @param { Component } component
 */
const getColors: ResolverFn = (component) => {
  if (component?.style) {
    Object.entries(component.style).forEach((key: any, value) => {
      if (typeof value === 'string') {
        if (key === 'textColor') {
          // TODO: This shouldn't be disabled but enabling this makes some text white which
          //    becomes invisible on the page. Find out the solution to getting this right
          // result['textColor'] = value.replace('0x', '#')
          component.style.color = formatColor(value)
          delete component.style.textColor
        }
        if (value.startsWith('0x')) {
          // Rename textColor to color
          if (key !== 'textColor') {
            // Convert other keys if they aren't formatted as well just in case
            // textColor for "color" attr is handled above
            component.style[key] = formatColor(value)
          }
        }
      }
    })
  }
}

export default getColors
