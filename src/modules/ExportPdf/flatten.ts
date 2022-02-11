import * as u from '@jsmanifest/utils'
import getHeight from '../../utils/getHeight'
import getDeepTotalHeight from '../../utils/getDeepTotalHeight'
import isElement from '../../utils/isElement'
import type { FlattenOptions } from './exportPdfTypes'

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

export const createFlattener = (baseEl: Element | HTMLElement) => {
  const _baseElId = baseEl.id
  const _cache = {} as Record<string, FlattenObject>
  const _flattened = [] as FlattenObject[]

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

      if (isElement(el)) {
        el.scrollIntoView()
        el.style.border = '1px solid red'
        debugger
        el.style.border = ''
      }

      return flattenedObject
    },
  }
  return o
}

export function flatten({
  baseEl,
  el = baseEl.firstElementChild as HTMLElement,
  flattener = createFlattener(el as HTMLElement),
  accHeight = 0,
  pageHeight,
  offsetStart = accHeight,
  offsetEnd = offsetStart + pageHeight,
}: FlattenOptions) {
  try {
    let currEl = el

    while (currEl) {
      const elHeight = getHeight(currEl)
      const nextAccHeight = offsetStart + elHeight

      if (nextAccHeight > offsetEnd) {
        if (currEl.children.length) {
          // Skips currEl and recurses children instead
          flatten({
            baseEl,
            el: currEl.firstChild as HTMLElement,
            flattener,
            accHeight,
            pageHeight,
            offsetStart,
            offsetEnd: nextAccHeight,
          })
        } else {
          flattener.add(flattener.toFlat(currEl))
          // Reminder: Single element is bigger than page height here
          accHeight = nextAccHeight
          offsetStart = accHeight
          offsetEnd = accHeight + pageHeight
        }
      } else {
        flattener.add(flattener.toFlat(currEl))
        accHeight += elHeight
        offsetStart = accHeight
      }

      currEl = currEl.nextSibling as HTMLElement
    }

    return flattener
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

export default flatten
