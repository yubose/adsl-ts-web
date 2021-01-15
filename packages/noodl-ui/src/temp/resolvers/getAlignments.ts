import isPlainObject from 'lodash/isPlainObject'
import { ComponentObject } from 'noodl-types'
import { textAlignStrings } from '../../constants'

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

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getAlignments',
  resolve(component: ComponentObject) {
    if (!component) return
    if (!component.style) component.style = {}
    let value
    if (component.style) {
      const { style } = component
      if (style.axis === 'horizontal') {
        component.style.display = 'flex'
        component.style.flexWrap = 'nowrap'
      } else if (style.axis === 'vertical') {
        component.style.display = 'flex'
        component.style.flexDirection = 'column'
      }

      if (style.textAlign) {
        // "centerX", "centerY", "left", "center", "right"
        if (typeof style.textAlign === 'string') {
          value = getTextAlign(style.textAlign)
          if (value) {
            delete component.style.textAlign
            Object.assign(component.style, value)
          }
        }
        // { x, y }
        else if (isPlainObject(style.textAlign)) {
          const { x, y } = style.textAlign
          if (x !== undefined) {
            value = getTextAlign(x)
            if (value) {
              Object.assign(component.style, value)
              if (!('textAlign' in value)) delete component.style.textAlign
            }
          }
          if (y !== undefined) {
            value = getTextAlign(y)
            if (value) {
              // The y value needs to be handled manually here since getTextAlign will
              //    return { textAlign } which is meant for x
              if (y === 'center') {
                component.style.display = 'flex'
                component.style.alignItems = 'center'
              } else {
                Object.assign(component, value)
                delete component.style.textAlign
              }
            }
          }
          // If it's still an object delete it since it is invalid (and that we forgot)
        }
      }

      if (style.align) {
        if (style.align === 'centerX') {
          component.style.display = 'flex'
          component.style.justifyContent = 'center'
        } else if (style.align === 'centerY') {
          component.style.display = 'flex'
          component.style.alignItems = 'center'
        }
      }
      if (style.display === 'inline') {
        component.style.display = 'inline'
      }
      if (isPlainObject(component.style.textAlign)) {
        delete component.style.textAlign
      }
    }
  },
}
