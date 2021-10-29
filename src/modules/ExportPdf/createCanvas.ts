import { Options as Html2CanvasOptions } from 'html2canvas'
import isElement from '../../utils/isElement'
import type { Item } from './types'

async function createCanvas(options: {
  container: HTMLElement
  width: number
  height: number
  start: number
  items: Item[]
  end: number
  pageHeight: number
  options?: Partial<Html2CanvasOptions>
}) {
  try {
    let { container, width, height, items, start, end, pageHeight, ...rest } =
      options || {}
    let endPosition = items[items.length - 1]?.end || start + height

    let canvas = await html2canvas(container, {
      // allowTaint: true,
      onclone: (doc: Document, el: HTMLElement) => {
        let position = 0

        for (const childNode of el.children) {
          if (isElement(childNode)) {
            debugger
            if (position > endPosition) {
              childNode.style.visibility = 'hidden'
            }
            debugger
            position += childNode.getBoundingClientRect().height
          }
        }
      },
      width,
      height,
      scrollY: start,
      ...rest,
    })

    return canvas
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default createCanvas
