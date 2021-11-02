import * as u from '@jsmanifest/utils'
import html2canvas, { Options as Html2CanvasOptions } from 'html2canvas'
import isElement from '../../utils/isElement'
import { SnapObject } from './getSnapObjects'
import type { Item } from './types'

async function createCanvas(options: {
  container: HTMLElement
  width: number
  height: number
  items: SnapObject[]
  pageHeight: number
  options?: Partial<Html2CanvasOptions>
}) {
  try {
    let { container, width, height, items, pageHeight, ...rest } = options || {}
    let startPosition = items[0]?.start.position || 0
    let endPosition = items[items.length - 1]?.end.position || startPosition
    let hideIds = [] as string[]

    items[0]?.start?.node?.scrollIntoView?.()

    for (const snapObject of items) {
      if (snapObject.hide?.children) {
        hideIds.push(...u.array(snapObject.hide.children))
      }
    }

    let canvas = await html2canvas(container, {
      allowTaint: true,
      onclone: (doc: Document, el: HTMLElement) => {
        let position = 0

        for (const childNode of el.children) {
          const id = childNode.id
          const height = childNode.getBoundingClientRect().height
          const nextPosition = position + height

          if (isElement(childNode)) {
            if (nextPosition > startPosition + pageHeight) {
              childNode.style.visibility = 'hidden'
            } else {
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
            }
          }

          position += height
        }
      },
      width,
      height,
      ...rest,
    })

    return canvas
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default createCanvas
