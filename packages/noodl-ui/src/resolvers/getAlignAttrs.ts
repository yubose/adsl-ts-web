import _ from 'lodash'
import { Resolver } from '../types'
import { noodlTextAlignStrings } from '../constants'

/**
 * Takes an object and resolves its align properties by returning a new object generated with
 *    corresponding html attributes
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getAlignAttrs: Resolver = (component) => {
  let value

  const style = component.get('style')

  if (style) {
    if (style.axis) {
      if (style.axis === 'horizontal') {
        component.assignStyles({
          display: 'flex',
          flexWrap: 'nowrap',
        })
      } else if (style.axis === 'vertical') {
        component.assignStyles({
          display: 'flex',
          flexDirection: 'column',
        })
      }
    }

    if (style.textAlign) {
      // "centerX", "centerY", "left", "center", "right"
      if (_.isString(style.textAlign)) {
        value = getTextAlign(style.textAlign)
        if (value) {
          component.removeStyle('textAlign')
          component.assignStyles(value)
        }
      }
      // { x, y }
      else if (_.isObjectLike(style.textAlign)) {
        const { x, y } = style.textAlign
        if (!_.isUndefined(x)) {
          value = getTextAlign(x)
          if (value) {
            component.assignStyles(value)
            if (!('textAlign' in value)) {
              component.removeStyle('textAlign')
            }
          }
        }
        if (!_.isUndefined(y)) {
          value = getTextAlign(y)
          if (value) {
            // The y value needs to be handled manually here since getTextAlign will
            //    return { textAlign } which is meant for x
            if (y === 'center') {
              component.assignStyles({
                display: 'flex',
                alignItems: 'center',
              })
            } else {
              component.assignStyles(value)
              component.removeStyle('textAlign')
            }
          }
        }
        // If it's still an object delete it since it is invalid (and that we forgot)
      }
    }

    if (style.align) {
      if (style.align === 'centerX') {
        component.assignStyles({
          display: 'flex',
          justifyContent: 'center',
        })
      } else if (style.align === 'centerY') {
        component.assignStyles({
          display: 'flex',
          alignItems: 'center',
        })
      }
    }

    if (style.display === 'inline') {
      component.setStyle('display', 'inline')
    }

    if (_.isPlainObject(component.getStyle('textAlign'))) {
      component.removeStyle('textAlign')
    }
  }
}

/**
 *  Returns an object transformed using the value of textAlign
 * @param { object } style
 * @param { string } textAlign - NOODL textAlign value
 */
function getTextAlign(textAlign: string): undefined | object {
  if (!noodlTextAlignStrings.includes(textAlign)) {
    return
  }

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
