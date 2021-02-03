import isPlainObject from 'lodash/isPlainObject'
import get from 'lodash/get'
import { excludeIteratorVar } from 'noodl-utils'
import { formatColor } from '../utils/common'
import { ComponentInstance, ResolverFn } from '../types'
import { findListDataObject } from '../utils/noodl'

/**
 * Returns a new object with some keywords changed to align more with html/css/etc
 * Also converts color values like 0x00000000 to #00000000
 * @param { Component } component
 */
const getColors: ResolverFn = (component: ComponentInstance) => {
  if (component?.style) {
    const iteratorVar = component.get('iteratorVar') || ''
    Object.entries(component.style).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (key === 'textColor') {
          // TODO: This shouldn't be disabled but enabling this makes some text white which
          //    becomes invisible on the page. Find out the solution to getting this right
          // result['textColor'] = value.replace('0x', '#')
          component.setStyle('color', formatColor(value))
          delete component.style.textColor
        }
        if (value.startsWith('0x')) {
          // Rename textColor to color
          if (key !== 'textColor') {
            // Convert other keys if they aren't formatted as well just in case
            // textColor for "color" attr is handled above
            component.setStyle(key, formatColor(value))
          }
        }
        if (iteratorVar && String(value).startsWith(iteratorVar)) {
          const dataObject = findListDataObject(component)
          if (isPlainObject(dataObject)) {
            component.setStyle(
              key,
              formatColor(
                get(dataObject, excludeIteratorVar(value, iteratorVar), ''),
              ),
            )
          } else {
            component.setStyle(key, formatColor(dataObject))
          }
        }
      }
    })
  }
}

export default getColors
