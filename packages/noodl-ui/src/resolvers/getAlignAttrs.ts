import isPlainObject from 'lodash/isPlainObject'
import cloneDeep from 'lodash/cloneDeep'
import { ResolverFn } from '../types'
import { textAlignStrings } from '../constants'

/**
 * Takes an object and resolves its align properties by returning a new object generated with
 *    corresponding html attributes
 */
const getAlignAttrs: ResolverFn = (component) => {
  let value

  if (component.original?.style) {
    if (component.original?.style?.axis) {
      if (component.original?.style?.axis === 'horizontal') {
        component.assignStyles({ display: 'flex', flexWrap: 'nowrap' })
      } else if (component.style.axis === 'vertical') {
        component.assignStyles({ display: 'flex', flexDirection: 'column' })
      }
    }

    if (component.original?.style?.textAlign) {
      // "centerX", "centerY", "left", "center", "right"
      if (
        typeof component.original?.style?.textAlign === 'string' ||
        typeof component.style?.textAlign === 'string'
      ) {
        const val =
          component.original?.style?.textAlign || component.style?.textAlign
        component.assignStyles({
          textAlign: val === 'centerX' ? 'center' : val,
        })
      }
      // { x, y }
      else if (isPlainObject(component.original?.style?.textAlign)) {
        if (
          ['center', 'centerX'].includes(
            component.original?.style?.textAlign?.x || '',
          )
        ) {
          component.assignStyles({ textAlign: 'center' })
        }

        if (component.original?.style.textAlign?.y !== undefined) {
          if (component.original?.style?.textAlign?.y === 'center') {
            component.assignStyles({ display: 'flex', alignItems: 'center' })
            if (component.original?.style?.textAlign?.x === 'center') {
              component.setStyle('justifyContent', 'center')
            }
          }
        }
        if (isPlainObject(component.style?.textAlign)) {
          component.removeStyle('textAlign')
        }
      }
    }

    if (component.original?.style?.align) {
      if (component.original?.style?.align === 'centerX') {
        component.assignStyles({ display: 'flex', justifyContent: 'center' })
      } else if (component.original?.style?.align === 'centerY') {
        component.assignStyles({ display: 'flex', alignItems: 'center' })
      }
    }

    if (component.original?.style?.display === 'inline') {
      component.setStyle('display', 'inline')
    }
  }
}

/**
 *  Returns an object transformed using the value of textAlign
 * @param { object } style
 * @param { string } textAlign - NOODL textAlign value
 */
function getTextAlign(textAlign: string): undefined | object {
  if (!textAlignStrings.includes(textAlign)) return
  if (textAlign === 'centerX') {
    return { textAlign: 'center' }
  } else if (textAlign === 'centerY') {
    return { display: 'flex', alignItems: 'center' }
  } else {
    // NOTE: careful about passing "y" into here
    switch (textAlign) {
      case 'left':
      case 'center':
      case 'right':
        return { textAlign }
      default:
        return
    }
  }
}

export default getAlignAttrs
