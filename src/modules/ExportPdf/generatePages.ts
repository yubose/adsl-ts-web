import type { Options as Html2CanvasOptions } from 'html2canvas'
import type jsPDF from 'jspdf'
import { Viewport as VP } from 'noodl-ui'
import type { FlatObject, Orientation } from './exportPdfTypes'
import type { flatten } from './flatten'
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
  use?: {
    addImage?: (
      args: { width: number; height: number } & {
        ratio: number
        pageWidth: number
        pageHeight: number
        currFlat?: FlatObject
      },
    ) => { width: number; height: number }
    clonedContainer?: (args: {
      htmlDocument: Document
      el: Element | HTMLElement
      elements: HTMLElement[]
    }) => HTMLElement
  }
}

async function generatePages({
  pdf,
  el,
  flattener,
  generateCanvasOptions,
  orientation = 'portrait',
  pageWidth,
  pageHeight,
  use,
}: GeneratePagesOptions) {
  try {
    const w = el.getBoundingClientRect().width
    const h = el.getBoundingClientRect().height
    const ratio = VP.getAspectRatio(w, h)

    let flattened = [...flattener.get()]
    let pdfPageWidth =
      orientation === 'landscape' ? sizes.A4.height : sizes.A4.width
    let pdfPageHeight =
      orientation === 'landscape' ? sizes.A4.width : sizes.A4.height
    let pending = [] as FlatObject[]
    // flattenedElements.length === incoming pending elements
    // pending.length === elements already pending

    let currPageHeight = 0

    for (const currFlat of flattened) {
      let currFlatHeight = currFlat?.height || 0
      let isLast = flattened[flattened.length - 1] === currFlat

      if (currFlatHeight + currPageHeight > pageHeight || isLast) {
        if (isLast) pending.push(currFlat)

        const canvas = await generateCanvas(el, {
          ...generateCanvasOptions,
          onclone: (d: Document, e: HTMLElement) => {
            e.style.height = 'auto'

            const pendingClonedElems = [] as HTMLElement[]
            const numPending = pending.length

            for (let index = 0; index < numPending; index++) {
              const flat = pending[index] as FlatObject
              const clonedEl = d.getElementById(flat.id)
              if (clonedEl) pendingClonedElems.push(clonedEl)
            }

            const modifiedEl = use?.clonedContainer?.({
              htmlDocument: d,
              el: e,
              elements: pendingClonedElems,
            })

            if (!modifiedEl) e.replaceChildren(...pendingClonedElems)
          },
        })

        pdf.setDisplayMode(1)

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          pdfPageWidth,
          pdfPageHeight,
        )

        if (currFlatHeight + currPageHeight > pdfPageHeight) {
          pdf.addPage([pdfPageWidth, pdfPageHeight], orientation)
        }

        pending.length = 0
        pending[0] = currFlat
        currPageHeight = currFlatHeight
      } else {
        currPageHeight += currFlatHeight
        pending.push(currFlat)
      }
    }

    return pdf
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default generatePages
