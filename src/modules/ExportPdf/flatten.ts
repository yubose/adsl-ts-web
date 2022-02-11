import * as u from '@jsmanifest/utils'
import getHeight from '../../utils/getHeight'
import isElement from '../../utils/isElement'
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
        height: getHeight(el),
        scrollHeight: el?.scrollHeight || 0,
        tagName: el?.tagName?.toLocaleLowerCase() || '',
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
  el = baseEl?.firstElementChild as HTMLElement,
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
      const currHeight = offsetStart + elHeight

      if (currHeight > offsetEnd) {
        debugger
        if (currEl.children.length) {
          debugger
          if (elHeight < pageHeight) {
            debugger
            flattener.add(flattener.toFlat(currEl))
            accHeight = currHeight
          } else {
            debugger
            // One of the children is exceeding the offsetEnd
            // Sent that children along with its next siblings to be flattened
            // debugger
            flatten({
              baseEl,
              el: currEl.firstChild as HTMLElement,
              flattener,
              accHeight,
              pageHeight,
              offsetStart,
              offsetEnd: currHeight,
            })
          }
        } else {
          debugger
          // Reminder: Single element is bigger than page height here
          // So they are being flattened
          flattener.add(flattener.toFlat(currEl))
          accHeight = currHeight
          offsetStart = accHeight
          offsetEnd += pageHeight - elHeight
        }
      } else {
        debugger
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
