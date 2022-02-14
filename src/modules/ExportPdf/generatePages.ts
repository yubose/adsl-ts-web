import type { Options as Html2CanvasOptions } from 'html2canvas'
import type jsPDF from 'jspdf'
import { Viewport as VP } from 'noodl-ui'
import type { Orientation } from './exportPdfTypes'
import type { flatten, FlattenObject } from './flatten'
import generateCanvas from './generateCanvas'
import sizes from './sizes'

export interface GeneratePagesOptions {
  pdf: jsPDF
  el: HTMLElement
  flattener: ReturnType<typeof flatten>
  orientation?: Orientation
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
  flattener,
  orientation = 'portrait',
  pageWidth,
  pageHeight,
  generateCanvasOptions,
}: GeneratePagesOptions) {
  try {
    const w = el.getBoundingClientRect().width
    const h = el.getBoundingClientRect().height
    const ratio = VP.getAspectRatio(w, h)

    pageHeight = el.getBoundingClientRect().width / ratio

    let pdfPageWidth =
      orientation === 'landscape' ? sizes.A4.height : sizes.A4.width
    let pdfPageHeight =
      orientation === 'landscape' ? sizes.A4.width : sizes.A4.height

    let currFlat: FlattenObject | undefined
    let currPageHeight = 0
    let nextPageHeight = 0
    let pending = [] as FlattenObject[]
    let flattened = [...flattener.get()]

    // flattenedElements.length === incoming pending elements
    // pending.length === elements already pending

    while (flattened.length || pending.length) {
      let currFlatHeight = 0
      const isLeftOver = !!(!flattened.length && pending.length)

      currFlat = flattened.shift()
      currFlatHeight = currFlat?.height || 0
      nextPageHeight = currFlatHeight + currPageHeight

      if (nextPageHeight > pdfPageHeight || isLeftOver) {
        const imageSize = { width: pageWidth, height: pageHeight }
        const canvas = await generateCanvas(el, {
          ...imageSize,
          ...generateCanvasOptions,
          onclone: (d: Document, e: HTMLElement) => {
            e.style.height = 'auto'

            const pendingClonedElems = [] as HTMLElement[]
            const numPending = pending.length

            for (let index = 0; index < numPending; index++) {
              let flat = pending[index] as FlattenObject
              let clonedEl = d.getElementById(flat.id)
              clonedEl && pendingClonedElems.push(clonedEl)
            }

            const modifiedEl = generateCanvasOptions?.onclone?.({
              htmlDocument: d,
              el: e,
              elements: pendingClonedElems,
            })

            if (!modifiedEl) e.replaceChildren(...pendingClonedElems)
          },
        })

        pdf.addImage(
          canvas.toDataURL(),
          'PNG',
          0,
          0,
          canvas.width,
          canvas.height,
        )

        if (nextPageHeight > pdfPageHeight) {
          pdf.addPage([pdfPageWidth, pdfPageHeight], orientation)
        } else {
        }

        pending.length = 0

        if (currFlat) {
          pending.push(currFlat)
          currPageHeight = currFlatHeight + (nextPageHeight - pdfPageHeight)
        }
      } else {
        currPageHeight += currFlatHeight
        const ee = document.getElementById(currFlat.id) as HTMLElement
        ee.style.border = '1px solid magenta'
        ee.scrollIntoView()
        if (currFlat) pending.push(currFlat)
        debugger
        ee.style.border = ''
      }
    }

    return pdf
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default generatePages
