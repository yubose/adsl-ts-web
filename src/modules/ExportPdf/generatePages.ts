import type { Options as Html2CanvasOptions } from 'html2canvas'
import type jsPDF from 'jspdf'
import { Viewport as VP } from 'noodl-ui'
import type { FlatObject, Orientation, SizeObject } from './exportPdfTypes'
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
      args: SizeObject & {
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

    pageHeight = w / ratio

    let pdfPageWidth =
      orientation === 'landscape' ? sizes.A4.height : sizes.A4.width
    let pdfPageHeight =
      orientation === 'landscape' ? sizes.A4.width : sizes.A4.height

    let currFlat: FlattenObject | undefined
    let currPageHeight = 0
    let flattened = [...flattener.get()]
    let nextPageHeight = 0
    let pending = [] as FlatObject[]

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
              let flat = pending[index] as FlatObject
              let clonedEl = d.getElementById(flat.id)
              clonedEl && pendingClonedElems.push(clonedEl)
            }

            const modifiedEl = use?.clonedContainer?.({
              htmlDocument: d,
              el: e,
              elements: pendingClonedElems,
            })

            if (!modifiedEl) e.replaceChildren(...pendingClonedElems)
          },
        })

        // {
        //   // FOR DEBUGGING
        //   const _els = pending.map((obj) => {
        //     const _el = document.getElementById(obj.id) as HTMLElement
        //     _el.style.border = '1px solid red'
        //     return _el
        //   })

        //   _els[0].scrollIntoView()

        //   debugger

        //   _els.forEach((_el) => (_el.style.border = ''))
        //   _els.length = 0
        // }

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
