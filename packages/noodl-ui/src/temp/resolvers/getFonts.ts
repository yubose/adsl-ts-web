import isFinite from 'lodash/isFinite'
import { ComponentObject } from 'noodl-types'
import { hasLetter } from '../../utils/common'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getFonts',
  resolve(component: ComponentObject) {
    if (!component) return
    if (!component.style) component.style = {}

    const { fontSize, fontStyle, fontFamily } = component.style
    // '10' --> '10px'
    if (typeof fontSize === 'string' && !hasLetter(fontSize)) {
      component.style.fontSize = `${fontSize}px`
    }
    // 10 --> '10px'
    else if (isFinite(fontSize)) {
      component.style.fontSize = `${fontSize}px`
    }
    if (typeof fontFamily === 'string') {
      component.style.fontFamily = fontFamily
    }
    // { fontStyle } --> { fontWeight }
    if (fontStyle === 'bold') {
      component.style.fontWeight = 'bold'
      delete component.style.fontStyle
    }
  },
}
