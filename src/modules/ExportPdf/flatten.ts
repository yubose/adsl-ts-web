import isElement from '../../utils/isElement'
import type { ExportPdfFlattenOptions } from './exportPdfTypes'

export interface FlattenObject {
  id: string
  children: FlattenObject[]
  cssText?: string
  innerHTML?: string
  node: Element | HTMLElement | null | undefined
  scrollHeight: number
  styles: CSSStyleDeclaration | undefined
  tagName: string
  textContent: string
}

function toFlat(
  el: Element | HTMLElement | null | undefined,
  innerHTML?: string,
): FlattenObject {
  return {
    id: el?.id || '',
    children: [],
    cssText: (el as HTMLElement)?.style?.cssText || '',
    innerHTML: innerHTML || '',
    node: el,
    styles: (el as HTMLElement)?.style,
    scrollHeight: el?.scrollHeight || 0,
    tagName: el?.tagName || '',
    textContent: el?.textContent || '',
  }
}

export function flatten_next({
  container,
  el,
  flattened = [],
  ids = [],
  accHeight = 0,
  pageHeight,
  offsetStart = accHeight,
  offsetEnd = offsetStart + pageHeight,
  ratio,
}: Omit<ExportPdfFlattenOptions, 'flattened'> & {
  container: HTMLElement
  flattened?: FlattenObject[]
  ids?: string[]
}) {
  try {
    let currEl = el

    while (currEl) {
      let currHeight = offsetStart + currEl.scrollHeight

      if (!ids.includes(currEl.id)) {
        flattened.push(toFlat(currEl))
        ids.push(currEl.id)
      }

      if (currHeight > offsetEnd) {
        if (currEl.childElementCount) {
          for (let childNode of currEl.children) {
            if (isElement(childNode)) {
              let innerCurrHeight =
                offsetStart + childNode.getBoundingClientRect().height

              if (innerCurrHeight > offsetEnd) {
                if (childNode) {
                  if (!ids.includes(childNode.id)) {
                    const innerHTML = childNode.innerHTML
                    flattened.push(toFlat(childNode, innerHTML))
                    ids.push(childNode.id)
                  }
                  let sibling = currEl.nextElementSibling
                  const cloned = childNode.cloneNode(true)
                  currEl.removeChild(childNode)
                  if (container) {
                    container?.appendChild(cloned)
                    debugger
                  }

                  // flatten_next({
                  //   el: childNode as HTMLElement,
                  //   flattened,
                  //   accHeight,
                  //   pageHeight,
                  //   offsetStart,
                  //   offsetEnd,
                  //   ratio,
                  // })
                }
              } else if (childNode?.id) {
                if (!ids.includes(childNode.id)) {
                  flattened.push(toFlat(childNode))
                  ids.push(childNode.id)
                }
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
    throw error instanceof Error ? error : new Error(String(error))
  }
}

async function flatten({
  el,
  flattened = [],
  accHeight = 0,
  pageHeight,
  offsetStart = accHeight,
  offsetEnd = offsetStart + pageHeight,
  ratio,
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
            if (isElement(childNode) || 'getBoundingClientRect' in childNode) {
              let innerCurrHeight =
                offsetStart + childNode.getBoundingClientRect().height

              if (innerCurrHeight > offsetEnd) {
                flattened.push(childNode as HTMLElement)
                currEl.removeChild(childNode)
                flatten({
                  el: childNode as HTMLElement,
                  flattened,
                  accHeight,
                  pageHeight,
                  offsetStart,
                  offsetEnd,
                  ratio,
                })
              } else {
                flattened.push(childNode as HTMLElement)
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
