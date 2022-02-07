import isElement from '../../utils/isElement'
import type { ExportPdfFlattenOptions } from './exportPdfTypes'

async function flatten({
  el,
  flattened = [],
  accHeight = 0,
  pageHeight,
  offsetStart = accHeight,
  offsetEnd = offsetStart + pageHeight,
}: ExportPdfFlattenOptions) {
  try {
    if (!el) {
      throw new Error(`"el" is not an HTML element`)
    }

    let currEl = el

    while (currEl) {
      let currHeight = offsetStart + currEl.scrollHeight

      flattened.push(currEl)

      if (currHeight > offsetEnd) {
        if (currEl.childElementCount) {
          for (let childNode of currEl.children) {
            if (isElement(childNode)) {
              let innerCurrHeight = offsetStart + childNode.scrollHeight

              if (innerCurrHeight > offsetEnd) {
                childNode = currEl.removeChild(childNode)
                flatten({
                  el: childNode as HTMLElement,
                  flattened,
                  accHeight,
                  pageHeight,
                  offsetStart,
                  offsetEnd,
                })
              }
            }
          }
        } else {
          accHeight = currHeight
        }
      } else {
        accHeight += currEl.scrollHeight
        offsetStart = accHeight
      }

      currEl = currEl.nextElementSibling as HTMLElement
    }

    return flattened
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default flatten
