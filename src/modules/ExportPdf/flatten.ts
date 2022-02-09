import * as u from '@jsmanifest/utils'
import isElement from '../../utils/isElement'
import getHeight from '../../utils/getHeight'
import type { ExportPdfFlattenOptions } from './exportPdfTypes'

export interface FlattenObject {
  baseId: string
  id: string
  children: FlattenObject[]
  parentId: string | null
  height: number
  scrollHeight: number
  tagName: string
  textContent: string
}

const createFlattener = (baseEl: Element | HTMLElement) => {
  const _baseElId = baseEl.id
  const _cache = {} as Record<string, FlattenObject>
  const _flattened = [] as FlattenObject[]

  const _get = (el: Element | HTMLElement | string) => {
    if (u.isStr(el)) return _cache[el]
    return _cache[el.id]
  }

  const o = {
    exists: (el: HTMLElement | Element | string | undefined | null) => {
      if (!el) return false
      if (u.isStr(el)) return el in _cache
      if (!el.id) return false
      return el.id in _cache
    },
    add: (obj: FlattenObject) => {
      if (!o.exists(obj.id)) _flattened.push(obj)
    },
    get: () => _flattened,
    toFlat(
      el: Element | HTMLElement,
      parent?: Element | HTMLElement,
    ): FlattenObject {
      if (o.exists(el)) return _get(el)

      let text = el?.textContent || ''
      let textStart = ''
      let textEnd = ''

      if (text.length > 50) {
        textStart = text.substring(0, 25).concat('...')
        textEnd = text.substring(40, 50)
      } else {
        textStart = text
      }

      const flattenedObject = {
        baseId: _baseElId,
        id: el?.id || '',
        children: [],
        parentId: parent?.id || null,
        height: getHeight(el),
        scrollHeight: el?.scrollHeight || 0,
        tagName: el?.tagName || '',
        textContent: textStart + textEnd,
      }

      return flattenedObject
    },
  }
  return o
}

export function flatten_next({
  container,
  el,
  flattened = [],
  flattener = createFlattener(container),
  accHeight = 0,
  pageHeight,
  offsetStart = accHeight,
  offsetEnd = offsetStart + pageHeight,
}: Omit<ExportPdfFlattenOptions, 'flattened'> & {
  container: HTMLElement
  flattened?: FlattenObject[]
  flattener?: ReturnType<typeof createFlattener>
}) {
  try {
    let currEl = el

    while (currEl) {
      flattener.add(flattener.toFlat(currEl))
      const elHeight = getHeight(currEl)
      const currHeight = offsetStart + elHeight

      if (currHeight > offsetEnd) {
        if (currEl.childElementCount) {
          for (let childNode of currEl.children) {
            if (childNode) {
              const innerCurrHeight = offsetStart + getHeight(childNode)

              // Child is the same height as parent and exceeds page height.
              // Check further children if any
              if (innerCurrHeight > offsetEnd) {
                flattener.add(flattener.toFlat(childNode, currEl))
                // currEl.removeChild(childNode)
                // flatten_next({
                //   el: childNode as HTMLElement,
                //   flattened,
                //   accHeight,
                //   pageHeight,
                //   offsetStart,
                //   offsetEnd,
                //   ratio,
                // })
              } else if (childNode?.id) {
                flattener.add(flattener.toFlat(childNode))
              }
            }
          }
        } else {
          // Reminder: Single element is bigger than page height here
          accHeight = currHeight
        }
      } else {
        accHeight += elHeight
        offsetStart = accHeight
      }

      currEl = currEl.nextElementSibling as HTMLElement
    }

    return flattener
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
