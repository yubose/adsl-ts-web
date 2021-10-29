import isElement from '../../utils/isElement'
import type { Item } from './types'

function getBounds(el: HTMLElement | DOMRect, position: number) {
  const { height } = (isElement(el) ? el.getBoundingClientRect() : el) || {}
  return {
    start: position,
    end: position + height,
    height,
  }
}

/**
 *
 * @param { HTMLElement } el - The first sibling element. This should always be the first element to be in the output (a.k.a position will always be at 0 at start)
 * @param pageHeight
 * @returns { Item[] }
 */
export function getPageElements(
  el: HTMLElement,
  pageHeight: number,
  startPosition = 0,
) {
  let items = [] as Item[]
  let position = startPosition
  let sibling: HTMLElement
  let first: Item | undefined
  let last: Item | undefined
  let scrollY = 0
  let totalHeight = 0

  if (isElement(el)) {
    sibling = el
    scrollY = getBounds(sibling, position).start

    while (sibling) {
      let { start, end, height } = getBounds(sibling, position)

      let item: Item = {
        start,
        end,
        height,
        id: sibling.id,
        text: sibling.textContent || '',
        node: sibling,
      }

      first === undefined && (first = item)

      totalHeight += height

      if (end <= pageHeight + startPosition) {
        debugger
        items.push(item)
        position = end
      } else if (end >= pageHeight) {
        debugger
        if (!items.length) {
          items.push(item)
        }
        return {
          items,
          first,
          last,
          scrollY,
          totalHeight,
        }
      }
      sibling = sibling.nextElementSibling as HTMLElement
    }
  }

  return {
    items,
    first,
    last,
    scrollY,
    totalHeight,
  }
}

export default getPageElements
