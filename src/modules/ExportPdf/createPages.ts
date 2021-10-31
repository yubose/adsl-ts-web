import jsPDF from 'jspdf'
import createCanvas from './createCanvas'
import getPageElements from './getPageElements'
import isElement from '../../utils/isElement'
import linkNodes from './linkNodes'
import type { Item } from './types'

export interface Options {
  format?: number[]
  orientation?: 'landscape' | 'portrait'
  pageWidth?: number
  pageHeight?: number
  overallWidth?: number
  overallHeight?: number
}

function getSiblings(node: HTMLElement) {
  const siblings = [] as HTMLElement[]
  let sibling = node
  while (sibling) {
    HTMLElement && siblings.push(sibling)
    sibling = node.nextElementSibling as HTMLElement
  }
  return siblings
}

async function createPages(
  pdf: jsPDF,
  el: HTMLElement | null | undefined,
  options?: Options,
) {
  try {
    if (!el) return pdf

    let { width, height } = el.getBoundingClientRect()
    let {
      format = [width, height],
      orientation = 'portrait',
      pageWidth = window.innerWidth,
      pageHeight = window.innerHeight,
      overallWidth = pageWidth,
      overallHeight = pageHeight,
    } = options || {}

    if (el.childElementCount) {
      let childNode = el.firstElementChild as HTMLElement | undefined
      let lastItem = { node: childNode as HTMLElement } as Item | undefined
      let startPosition = 0
      let linkedNode = linkNodes(lastItem?.node as HTMLElement)

      while ((lastItem && isElement(lastItem?.node)) || linkedNode.next) {
        let {
          items,
          first,
          last,
          linkedNode: linkedNodeProp,
        } = getPageElements(linkedNode, pageHeight, startPosition)

        linkedNodeProp && (linkedNode = linkedNodeProp)

        if (first?.node) first.node.scrollIntoView()

        let canvas = await createCanvas({
          container: el,
          items,
          start: first?.start as number,
          end: last?.end as number,
          width: pageWidth,
          height: pageHeight,
          pageHeight,
          options: {
            windowWidth: overallWidth,
            windowHeight: overallHeight,
          },
        })

        pdf.addPage(format, orientation)
        pdf.addImage(canvas, 'PNG', 0, 0, pageWidth, pageHeight)

        debugger

        lastItem = last
        startPosition = last?.start || last?.end || startPosition
      }
    } else {
      const canvas = await html2canvas(el, { width, height })
      pdf.addPage(format, orientation)
      pdf.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height)
    }

    return pdf
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

export default createPages
