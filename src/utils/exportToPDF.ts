import * as u from '@jsmanifest/utils'
import type { Options as Html2CanvasOptions } from 'html2canvas'
import isElement from './isElement'

export interface Item {
  start: number
  end: number
  id: string
  height: number
  text?: string
  node: HTMLElement
}

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

  if (isElement(el)) {
    sibling = el

    while (sibling) {
      let { start, end, height } = getBounds(sibling, position)

      let item: Item = {
        start,
        end,
        height,
        id: sibling.id,
        text: sibling.textContent || '',
        node: el,
      }

      if (end <= pageHeight + startPosition) {
        items.push(item)
        sibling.scrollIntoView({ behavior: 'smooth' })
        sibling.style.border = '4px dashed #10AF69'
        debugger
        // sibling.style.border = 'none'
        position = end
      }
      if (end + height > pageHeight) {
        return items
      }
      sibling = sibling.nextElementSibling as HTMLElement
    }
  }

  debugger
  return items
}

export async function createCanvas(
  container: HTMLElement,
  items: Item[],
  options?: Html2CanvasOptions,
) {
  try {
    function onClone(doc: Document, el: HTMLElement) {
      let ids = items.map(({ id }) => id)

      // for (const { id, start, end } of items) {
      //
      // }

      for (const childNode of el.children) {
        if (isElement(childNode)) {
          if (!ids.includes(childNode.id)) {
            childNode.style.visibility = 'hidden'
          }
          childNode.style.border = '1px solid red'
        }
      }
    }

    let bounds = container.getBoundingClientRect()
    let firstChild = items[0]?.id || ''

    container.querySelector(`#${firstChild}`)?.scrollIntoView?.()

    const canvas = await html2canvas(container, {
      allowTaint: true,
      onclone: onClone,
      width: bounds.width,
      height: bounds.height,
      scrollY: bounds.top,
      ...options,
    })

    return canvas
  } catch (error) {
    console.error(error)
    throw error
  }
}
