import * as u from '@jsmanifest/utils'
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
    let hideIds = [] as string[]

    for (const item of items) {
      if (item.hide) {
        if (item.hide.self) hideIds.push(item.id)
        debugger
        hideIds.push(...u.array(item.hide.children))
      }
    }

    let canvas = await html2canvas(container, {
      // allowTaint: true,
      onclone: (doc: Document, el: HTMLElement) => {
        let position = 0

        for (const childNode of el.children) {
          const id = childNode.id

          if (isElement(childNode)) {
            if (
              hideIds.includes(id) ||
              hideIds.some((id) => childNode.querySelector(`#${id}`))
            ) {
              if (hideIds.includes(id)) childNode.style.visibility = 'hidden'
              for (const id of hideIds) {
                const innerChild = childNode.querySelector(
                  `#${id}`,
                ) as HTMLElement
                innerChild && (innerChild.style.visibility = 'hidden')
              }
            }
            if (position > endPosition) {
              childNode.style.visibility = 'hidden'
            }
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
