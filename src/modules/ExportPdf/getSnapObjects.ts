import getBounds from './getBounds'
import isElement from '../../utils/isElement'
import * as t from './types'

const pageWidth = 363
const pageHeight = 676.7897338867188

function getSnapObjects(el: HTMLElement, position = 0) {
  let accumulatedHeight = 0
  let results = [] as t.SnapObject[]
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
