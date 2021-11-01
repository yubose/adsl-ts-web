import type { Bounds } from './getBounds'
import getBounds from './getBounds'
import isElement from '../../utils/isElement'

export interface SnapObject<N extends HTMLElement = HTMLElement> {
  start: {
    position: number
    node: N
  }
  end: {
    position: number
    node: N | null
  }
  height: number
  native: DOMRect | null
  hide?: {
    /** Element ids */
    children?: string[]
  }
}

export function getSnapObject(el: HTMLElement, pos: number) {
  const bounds = getBounds(el, pos)
  return {
    start: {
      position: pos,
      node: el,
    },
    end: {
      position: bounds.end,
      node: el,
    },
    height: bounds.height,
    native: bounds.native,
    text: el.textContent?.substring?.(0, 35) || '',
  } as SnapObject
}

const pageWidth = 363
const pageHeight = 676.7897338867188

export function getSnapObjectsBySibling(
  el: HTMLElement,
  pos = 0,
  type: 'previous' | 'next' = 'next',
) {
  let objs = [] as SnapObject[]
  let obj = getSnapObject(el, pos)
  let method =
    type === 'previous' ? 'previousElementSibling' : 'nextElementSibling'

  objs.push(obj)

  let currSibling = el[method] as HTMLElement

  while (currSibling) {
    const snapObject = getSnapObject(currSibling, pos)
    objs.push(snapObject)
    pos += snapObject.height
    currSibling = currSibling[method] as HTMLElement
  }

  return objs
}

function getSnapObjects(el: HTMLElement, position = 0) {
  let accumulatedHeight = 0
  let results = [] as SnapObject[]
  let result = getSnapObject(el, position)
  results.push(result)

  if (isElement(el)) {
    const { height, start, end } = getBounds(el, position)

    // Will overflow
    if (end > pageHeight) {
      /**
       * Find which element will overflow in two ways:
       *    1. Visit the children
       *    2. Visit the siblings
       */
      if (el.children.length) {
        for (const childNode of el.children) {
          if (isElement(childNode)) {
            const { start, end, height } = getBounds(childNode, position)
            const nextHeight = accumulatedHeight + height
            // This child node is the one that will overflow
            if (nextHeight > pageHeight) {
              if (!result.hide) result.hide = {}
              if (!result.hide.children) result.hide.children = []
              result.hide.children.push(childNode.id)
              // Take this childNode and all of its siblings and let them be the start of next entry
              results.push(getSnapObjectsBySibling(childNode, start))

              break
            }
            position = end
          }
        }
      } else {
        results.push(getSnapObject(el, position))
      }
    } else {
      results.push(getSnapObject(el, position))
    }
  }

  return results
}

export default getSnapObjects
