import isNaN from 'lodash/isNaN'
import isPlainObject from 'lodash/isPlainObject'
import { ResolverFn } from '../types'
import { hasLetter } from '../utils/common'
import { presets } from '../constants'

/**
 * Returns border attributes according to the "border" property defined in the NOODL as well
 * as some native border attributes like "borderRadius"
 *    1) no border / no borderRadius/
 *    2) borderBottom / solid / no borderRadius/
 *    3) borderAll / solid / has borderRadius
 *    4) borderAll / dashed / no borderRadius
 *    5) no border / has borderRadius
 */
const getBorderAttrs: ResolverFn = (component) => {
  const { style } = component

  if (style) {
    if (style.border !== undefined) {
      let borderStyle, color, width, line
      const { border } = style

      if (border == '0') {
        component.setStyle('borderStyle', 'none')
      }

      if (isPlainObject(border)) {
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

    if (typeof style?.borderRadius === 'string') {
      if (!hasLetter(style.borderRadius)) {
        component.setStyle('borderRadius', `${style.borderRadius}px`)
      }
    } else if (typeof style.borderRadius === 'number') {
      component.setStyle('borderRadius', `${style.borderRadius}px`)
    }

    if (style.borderWidth) {
      if (typeof style.borderWidth === 'string') {
        if (!hasLetter(style.borderWidth)) {
          component.setStyle('borderWidth', `${style.borderWidth}px`)
        }
      } else if (typeof style.borderWidth === 'number') {
        component.setStyle('borderWidth', `${style.borderWidth}px`)
      }
    }

    // If a borderRadius effect is to be expected and there is no border
    // (since no border negates borderRadius), we need to add an invisible
    // border to simulate the effect
    if (style.borderRadius) {
      const regex = /[a-zA-Z]+$/
      const radius = Number(`${style.borderRadius}`.replace(regex, ''))
      if (!isNaN(radius)) {
        component.setStyle('borderRadius', `${radius}px`)
        if (
          !style.borderWidth ||
          style.borderWidth === 'none' ||
          style.borderWidth === '0px'
        ) {
          // Make the border invisible
          component.setStyle('borderWidth', '1px')
          component.setStyle('borderColor', 'rgba(0, 0, 0, 0)')
        }
      }
    }
  }
}

export default getBorderAttrs
