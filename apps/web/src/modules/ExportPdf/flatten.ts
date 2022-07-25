import * as u from '@jsmanifest/utils'
import getDeepTotalHeight from '../../utils/getDeepTotalHeight'
import type { FlatObject, FlattenOptions } from './exportPdfTypes'

export const createFlattener = (baseEl: Element | HTMLElement) => {
  const _cache = {} as Record<string, FlatObject>
  const _flattened = [] as FlatObject[]

  const _get = (el: Element | HTMLElement | string) => {
    if (u.isStr(el)) return _cache[el]
    return _cache[el.id]
  }

  const o = {
    clear() {
      u.keys(_cache).forEach((key) => delete _cache[key])
      _flattened.length = 0
    },
    exists: (el: HTMLElement | Element | string | undefined | null) => {
      if (!el) return false
      if (u.isStr(el)) return el in _cache
      if (!el.id) return false
      return el.id in _cache
    },
    add: (obj: FlatObject) => {
      if (!o.exists(obj.id)) _flattened.push(obj)
    },
    get: () => _flattened,
    has: (idOrEl: string | Element | HTMLElement) => {
      const id = u.isStr(idOrEl) ? idOrEl : idOrEl.id
      if (!id) return false
      return o.get().some((flat) => flat.id === id)
    },
    toFlat(
      el: Element | HTMLElement,
      parent?: Element | HTMLElement,
    ): FlatObject {
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
        id: el?.id || '',
        children: [],
        parentId: parent?.id || null,
        height: el.getBoundingClientRect().height,
        scrollHeight: el?.scrollHeight || 0,
        tagName: el?.tagName?.toLocaleLowerCase() || '',
        textContent: textStart + textEnd,
      }

      // if (isElement(el)) {
      //   el.scrollIntoView?.()
      //   el.style.border = '1px solid red'
      //   debugger
      //   el.style.border = ''
      // }

      return flattenedObject
    },
  }
  return o
}

export function flatten({
  baseEl,
  el = baseEl?.firstElementChild as HTMLElement,
  flattener = createFlattener(el as HTMLElement),
  currPageHeight = 0,
  pageHeight,
  offsetStart = currPageHeight,
  offsetEnd = offsetStart + pageHeight,
}: FlattenOptions) {
  try {
    let currEl = el

    while (currEl) {
      const totalHeight = getDeepTotalHeight(currEl)
      const lastPosFromOffsetStart = offsetStart + totalHeight
      const isWithinOffset = lastPosFromOffsetStart < offsetEnd
      const isWithinPageBoundaries = totalHeight < pageHeight

      if (!currEl.children.length) {
        flattener.add(flattener.toFlat(currEl))

        if (isWithinPageBoundaries) {
          currPageHeight += totalHeight
          offsetStart += totalHeight
        } else {
          currPageHeight = 0
          offsetStart = lastPosFromOffsetStart
          offsetEnd = offsetStart + pageHeight
        }
      } else {
        if (isWithinPageBoundaries) {
          if (isWithinOffset) {
            flattener.add(flattener.toFlat(currEl))
            currPageHeight += totalHeight
            offsetStart = lastPosFromOffsetStart
          } else {
            flatten({
              baseEl,
              el: currEl.firstChild as HTMLElement,
              currPageHeight,
              flattener,
              pageHeight,
              offsetStart,
              offsetEnd,
            })
            // debugger
            currPageHeight = 0
            offsetStart = lastPosFromOffsetStart
            offsetEnd = offsetStart + pageHeight
          }
        } else {
          currEl.style.border = ''
          // Skips currEl and recurses children instead
          flatten({
            baseEl,
            el: currEl.firstChild as HTMLElement,
            currPageHeight,
            flattener,
            pageHeight,
            offsetStart,
            offsetEnd,
          })
          currPageHeight = 0
          offsetStart = lastPosFromOffsetStart
          offsetEnd = offsetStart + pageHeight
        }
      }

      currEl = currEl.nextSibling as HTMLElement
    }

    return flattener
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

export default flatten
