import { ComponentObject } from 'noodl-types'
import isNaN from 'lodash/isNaN'
import isPlainObject from 'lodash/isPlainObject'

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
}

export function hasLetter(value: any): boolean {
  return /[a-zA-Z]/i.test(String(value))
}

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
  resolve(component: ComponentObject) {
    const { style } = component

    console.log(`[getBorderAttrs] HELLO`)

    if (style) {
      if (style.border !== undefined) {
        let borderStyle, color, width, line
        const { border } = style

        if (border == '0' || border == 'none') {
          component.borderStyle = 'none'
        }

        if (isPlainObject(border)) {
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

      if (typeof style?.borderRadius === 'string') {
        if (!hasLetter(style.borderRadius)) {
          component.style.borderRadius = `${style.borderRadius}px`
        }
      } else if (typeof style.borderRadius === 'number') {
        component.style.borderRadius = `${style.borderRadius}px`
      }

      if (style.borderWidth) {
        if (typeof style.borderWidth === 'string') {
          if (!hasLetter(style.borderWidth)) {
            component.style.borderWidth = `${style.borderWidth}px`
          }
        } else if (typeof style.borderWidth === 'number') {
          component.style.borderWidth = `${style.borderWidth}px`
        }
      }

      // If a borderRadius effect is to be expected and there is no border
      // (since no border negates borderRadius), we need to add an invisible
      // border to simulate the effect
      if (style.borderRadius) {
        const regex = /[a-zA-Z]+$/
        const radius = Number(`${style.borderRadius}`.replace(regex, ''))
        if (!isNaN(radius)) {
          component.style.borderRadius = `${radius}px`
          if (
            !style.borderWidth ||
            style.borderWidth === 'none' ||
            style.borderWidth === '0px'
          ) {
            // Make the border invisible
            component.style.borderWidth = '1px'
            component.style.borderColor = 'rgba(0, 0, 0, 0)'
          }
        }
      }
    }
  },
}
