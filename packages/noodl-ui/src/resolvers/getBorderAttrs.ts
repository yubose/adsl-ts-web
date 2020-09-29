import _ from 'lodash'
import { Resolver } from '../types'
import { hasLetter } from '../utils/common'
import { presets } from '../constants'

/**
 * Returns border attributes according to the "border" property defined in the NOODL as well
 *    as some native border attributes like "borderRadius"
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 * 1) no border / no borderRadius/
 * 2) borderBottom / solid / no borderRadius/
 * 3) borderAll / solid / has borderRadius
 * 4) borderAll / dashed / no borderRadius
 * 5) no border / has borderRadius
 */
const getBorderAttrs: Resolver = (component) => {
  const style = component.get('style')

  if (style) {
    if (!_.isUndefined(style.border)) {
      let borderStyle, color, width, line
      const { border } = style

      if (border == '0') {
        component.setStyle('borderStyle', 'none')
      }

      if (_.isObjectLike(border)) {
        borderStyle = border.style
        color = border.color
        width = border.width
        line = border.line
      }

      if (color) {
        component.setStyle('borderColor', String(color).replace('0x', '#'))
      }
      if (line) {
        component.setStyle('borderStyle', line)
      }
      if (width) {
        component.setStyle('borderWidth', width)
      }

      // Analyizing border
      if (borderStyle == '1') {
        component.assignStyles(presets.border['1'])
      } else if (borderStyle == '2') {
        component.assignStyles(presets.border['2'])
      } else if (borderStyle == '3') {
        component.assignStyles(presets.border['3'])
        if (!width) component.setStyle('borderWidth', 'thin')
      } else if (borderStyle == '4') {
        component.assignStyles(presets.border['4'])
        if (!width) component.setStyle('borderWidth', 'thin')
      } else if (borderStyle == '5') {
        component.assignStyles(presets.border['5'])
      } else if (borderStyle == '6') {
        component.assignStyles(presets.border['6'])
      } else if (borderStyle == '7') {
        component.assignStyles(presets.border['7'])
      }
    }

    if (_.isString(style?.borderRadius)) {
      if (!hasLetter(style.borderRadius)) {
        component.setStyle('borderRadius', `${style.borderRadius}px`)
      }
    }

    if (style['borderWidth'] && _.isString(style['borderWidth'])) {
      if (!hasLetter(style['borderWidth'])) {
        component.setStyle('borderWidth', `${style.borderWidth}px`)
      }
    }
  }
}

export default getBorderAttrs
