import _ from 'lodash'
import { Resolver } from '../types'
import { hasLetter } from '../utils/common'

/**
 * Returns an object representing the font attributes given from the NOODL
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getFontAttrs: Resolver = (component) => {
  const fontSize = component.getStyle('fontSize')
  const fontStyle = component.getStyle('fontStyle')
  const fontFamily = component.getStyle('fontFamily')

  // '10' --> '10px'
  if (_.isString(fontSize) && !hasLetter(fontSize)) {
    component.setStyle('fontSize', `${fontSize}px`)
  }
  // 10 --> '10px'
  else if (_.isFinite(fontSize)) {
    component.setStyle('fontSize', `${fontSize}px`)
  }
  if (_.isString(fontFamily)) {
    component.setStyle('fontFamily', fontFamily)
  }
  // { fontStyle } --> { fontWeight }
  if (fontStyle === 'bold') {
    component.setStyle('fontWeight', 'bold')
    component.removeStyle('fontStyle')
  }
}

export default getFontAttrs
