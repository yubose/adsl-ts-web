import isFinite from 'lodash/isFinite'
import { ResolverFn } from '../types'
import { hasLetter } from '../utils/common'

/** Returns an object representing the font attributes given from the NOODL */
const getFontAttrs: ResolverFn = (component) => {
  const fontSize = component.getStyle('fontSize')
  const fontStyle = component.getStyle('fontStyle')
  const fontFamily = component.getStyle('fontFamily')

  // '10' --> '10px'
  if (typeof fontSize === 'string' && !hasLetter(fontSize)) {
    component.setStyle('fontSize', `${fontSize}px`)
  }
  // 10 --> '10px'
  else if (isFinite(fontSize)) {
    component.setStyle('fontSize', `${fontSize}px`)
  }
  if (typeof fontFamily === 'string') {
    component.setStyle('fontFamily', fontFamily)
  }
  // { fontStyle } --> { fontWeight }
  if (fontStyle === 'bold') {
    component.setStyle('fontWeight', 'bold').removeStyle('fontStyle')
  }
}

export default getFontAttrs
