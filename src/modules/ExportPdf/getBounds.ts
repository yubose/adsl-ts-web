/**
 * Isolated separately from utils.js to avoid circular dependency
 */

import isElement from '../../utils/isElement'
import type { Bounds } from './types'

/**
 *
 * @param el
 * @param pos
 * @returns
 */
function getBounds(el: HTMLElement | DOMRect, pos: number = 0) {
  const bounds = isElement(el) ? el?.getBoundingClientRect?.() : el || {}
  const { height } = bounds

  const meta: Bounds = {
    height,
    start: pos,
    end: pos + height,
    native: bounds,
  }

  return meta
}

export default getBounds
