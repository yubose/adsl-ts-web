import isElement from '../../utils/isElement'

export interface Bounds {
  height: number
  start: number
  end: number
  native: DOMRect | null
}

function getBounds(el: HTMLElement | DOMRect, pos: number = 0) {
  const bounds = isElement(el) ? el.getBoundingClientRect() : el || {}
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
