import * as u from '@jsmanifest/utils'
import type { Options as Html2CanvasOptions } from 'html2canvas'
import type jsPDF from 'jspdf'
import { Viewport as VP } from 'noodl-ui'
import generateCanvas from './generateCanvas'
import display from './display'
import * as t from './types'

export interface GeneratePagesOptions {
  pdf: jsPDF
  el: HTMLElement
  nodes: HTMLElement | HTMLElement[]
  pageWidth: number
  pageHeight: number
  generateCanvasOptions?: Partial<Omit<Html2CanvasOptions, 'onclone'>> & {
    /**
     * Callback called with the cloned element.
     * Optionally mutate this cloned element to modify the output if needed.
     * The first (immediate) child of the container argument is the cloned "el" argument passed below
     */
    onclone?: (args: {
      htmlDocument: Document
      el: HTMLElement
      elements: HTMLElement[]
    }) => HTMLElement | undefined | null
  }
}

async function generatePages({
  pdf,
  el,
  nodes,
  pageWidth,
  pageHeight,
  generateCanvasOptions,
}: GeneratePagesOptions) {
  try {
    if (!u.isArr(nodes)) nodes = u.array(nodes)
    if (!nodes.length) return pdf

    let currEl: HTMLElement | undefined
    let currPageHeight = 0
    let pending = [] as HTMLElement[]
    let elHeight = 0
    let nextPageHeight = 0

    // nodes.length === incoming pending elements
    // pending.length === elements already pending

    while (nodes.length || pending.length) {
      currEl = nodes.shift()
      elHeight = currEl?.scrollHeight || 0
      nextPageHeight = elHeight + currPageHeight

      const isLeftOver = !!(!nodes.length && pending.length)

      if (nextPageHeight > pageHeight || isLeftOver) {
        const w = el.getBoundingClientRect().width
        const h = el.getBoundingClientRect().height
        const ratio = VP.getAspectRatio(w, h)
        const imageSize = { width: pageWidth, height: pageWidth / ratio }
        console.log(`El width: ${w}`)
        console.log(`El height: ${h}`)
        console.log(`Page width: ${pageWidth}`)
        console.log(`Page height: ${pageHeight}`)
        console.log(`Aspect ratio: ${ratio}`)
        console.log(
          `Computed image sizes: [${imageSize.width}/${imageSize.height}]`,
        )
        console.log(
          `Image size for PDF page no ${
            pdf.getCurrentPageInfo().pageNumber
          } ${pdf.getNumberOfPages()}`,
          imageSize,
        )

        const canvas = await generateCanvas(el, {
          ...generateCanvasOptions,
          ...imageSize,
          windowWidth: imageSize.width,
          windowHeight: imageSize.height,
          onclone: (d, e) => {
            e.style.height = 'auto'
            // document.body.style.width = `${pageWidth}px`
            // document.body.style.height = `${pageHeight}px`
            const pendingClonedElems = pending.reduce((acc, pe) => {
              if (pe?.id) {
                const queriedEl = d.getElementById(pe.id)
                if (queriedEl) acc.push(queriedEl)
              }
              return acc
            }, [] as HTMLElement[])

            const modifiedEl = generateCanvasOptions?.onclone?.({
              htmlDocument: d,
              el: e,
              elements: pendingClonedElems,
            })

            if (!modifiedEl) e.replaceChildren(...pendingClonedElems)
          },
        })

        // canvas.width = imageSize.width
        // canvas.height = imageSize.height

        pdf.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height)
        if (nodes.length || currEl) {
          pdf.addPage([pageWidth, pageHeight], 'portrait')
        }

        pending.length = 0
        if (currEl) pending[0] = currEl as HTMLElement
        currPageHeight = elHeight
      } else {
        currPageHeight += elHeight
        if (currEl) pending.push(currEl)
      }
    }

    return pdf
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default generatePages
