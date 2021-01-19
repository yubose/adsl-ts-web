import { ComponentObject } from 'noodl-types'
import isNaN from 'lodash/isNaN'
import isPlainObject from 'lodash/isPlainObject'
import { hasLetter } from '../../utils/common'
import { presets } from '../../constants'

/**
 * Returns border attributes according to the "border" property defined in the NOODL as well
 * as some native border attributes like "borderRadius"
 *    1) no border / no borderRadius/
 *    2) borderBottom / solid / no borderRadius/
 *    3) borderAll / solid / has borderRadius
 *    4) borderAll / dashed / no borderRadius
 *    5) no border / has borderRadius
 */
export default {
  name: 'getBorders',
  resolve({ component }: { component: ComponentObject }) {
    if (!component) return
    if (component?.style) {
      if (component.style.border !== undefined) {
        let borderStyle, color, width, line
        const { border } = component.style || {}

        if (border == '0' || border == 'none') {
          component.borderStyle = 'none'
        }

        if (border && isPlainObject(border)) {
          borderStyle = border.style
          color = border.color
          width = border.width
          line = border.line
        }

        if (color) {
          component.borderColor = String(color).replace('0x', '#')
        }
        if (line) {
          component.borderStyle = line
        }
        if (width) {
          component.borderWidth = width
        }

        // Analyizing border
        if (borderStyle == '1') {
          Object.assign(component.style, presets.border['1'])
        } else if (borderStyle == '2') {
          Object.assign(component.style, presets.border['2'])
        } else if (borderStyle == '3') {
          Object.assign(component.style, presets.border['3'])
          if (!width) component.style.borderWidth = 'thin'
        } else if (borderStyle == '4') {
          Object.assign(component.style, presets.border['4'])
          if (!width) component.style.borderWidth = 'thin'
        } else if (borderStyle == '5') {
          Object.assign(component.style, presets.border['5'])
        } else if (borderStyle == '6') {
          Object.assign(component.style, presets.border['6'])
        } else if (borderStyle == '7') {
          Object.assign(component.style, presets.border['7'])
        }
      }

      if (typeof component.style?.borderRadius === 'string') {
        if (!hasLetter(component.style.borderRadius)) {
          component.style.borderRadius = `${component.style.borderRadius}px`
        }
      } else if (typeof component.style.borderRadius === 'number') {
        component.style.borderRadius = `${component.style.borderRadius}px`
      }

      if (component.style.borderWidth) {
        if (typeof component.style.borderWidth === 'string') {
          if (!hasLetter(component.style.borderWidth)) {
            component.style.borderWidth = `${component.style.borderWidth}px`
          }
        } else if (typeof component.style.borderWidth === 'number') {
          component.style.borderWidth = `${component.style.borderWidth}px`
        }
      }

      // If a borderRadius effect is to be expected and there is no border
      // (since no border negates borderRadius), we need to add an invisible
      // border to simulate the effect
      if (component.style.borderRadius) {
        const regex = /[a-zA-Z]+$/
        const radius = Number(
          `${component.style.borderRadius}`.replace(regex, ''),
        )
        if (!isNaN(radius)) {
          component.style.borderRadius = `${radius}px`
          if (
            !component.style.borderWidth ||
            component.style.borderWidth === 'none' ||
            component.style.borderWidth === '0px'
          ) {
            // Make the border invisible
            component.style.borderWidth = '1px'
            component.style.borderColor = 'rgba(0, 0, 0, 0)'
          }
        }
      }
    }

    if ('border' in (component?.style || {})) delete component.style?.border
  },
}
