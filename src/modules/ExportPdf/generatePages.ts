import * as u from '@jsmanifest/utils'
import type { Options as Html2CanvasOptions } from 'html2canvas'
import type jsPDF from 'jspdf'
import { Viewport as VP } from 'noodl-ui'
import type { flatten_next, FlattenObject } from './flatten'
import generateCanvas from './generateCanvas'
import sizes from './sizes'
import getHeight from '../../utils/getHeight'
import * as t from './types'

export interface GeneratePagesOptions {
  pdf: jsPDF
  el: HTMLElement
  flattener: ReturnType<typeof flatten_next>
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
  pageWidth,
  pageHeight,
  generateCanvasOptions,
}: GeneratePagesOptions) {
  try {
    const w = el.getBoundingClientRect().width
    const h = el.getBoundingClientRect().height
    const ratio = VP.getAspectRatio(w, h)

    pageHeight = el.getBoundingClientRect().width / ratio

    let currFlat: FlattenObject | undefined
    let currPageHeight = 0
    let nextPageHeight = 0
    let pending = [] as FlattenObject[]
    let flattened = [...flattener.get()]
    let processedIds = [] as string[]

    // flattenedElements.length === incoming pending elements
    // pending.length === elements already pending

    while (flattened.length || pending.length) {
      currFlat = flattened.shift()

      nextPageHeight = (currFlat?.height || 0) + currPageHeight

      const isLeftOver = !!(!flattened.length && pending.length)

      if (nextPageHeight > pageHeight || isLeftOver) {
        const imageSize = { width: pageWidth, height: w / ratio }

        console.log(`%cElement width: ${w}, height: ${h}`, 'color:tomato')
        console.log(
          `%cPage width: ${pageWidth}, height: ${pageHeight}`,
          'color:magenta',
        )
        console.log(`%cAspect ratio: ${ratio}`, 'color:teal;font-weight:bold')
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
          windowWidth: sizes.A4.width,
          windowHeight: sizes.A4.height,
          onclone: (d: Document, e: HTMLElement) => {
            e.style.height = 'auto'
            const pendingClonedElems = [] as HTMLElement[]
            const numPending = pending.length
            let accHeight = 0

            for (let index = 0; index < numPending; index++) {
              let flat = pending[index] as FlattenObject
              let clonedEl = d.getElementById(flat.id)

              if (!clonedEl) continue

              if (clonedEl.id && processedIds.includes(clonedEl.id)) {
                console.log(
                  `%cSkipping ${clonedEl.id} because it was already processed`,
                  `color:#ec0000;`,
                  flat,
                )
                continue
              }

              accHeight += flat.height

              console.log(
                `[flat object] index: ${index} accHeight: ${accHeight}`,
                flat,
              )

              if (flat.parentId) {
                clonedEl.parentNode?.removeChild?.(clonedEl)
                pendingClonedElems.unshift(clonedEl)
              } else {
                // if (clonedEl?.id && !processedIds.includes(clonedEl.id)) {
                pendingClonedElems.push(clonedEl)
                // }
              }
            }

            const modifiedEl = generateCanvasOptions?.onclone?.({
              htmlDocument: d,
              el: e,
              elements: pendingClonedElems,
            })

            processedIds.push(
              ...pendingClonedElems.reduce(
                (acc, el) =>
                  el.id && !processedIds.includes(el.id)
                    ? acc.concat(el.id)
                    : acc,
                [] as string[],
              ),
            )
            if (!modifiedEl) e.replaceChildren(...pendingClonedElems)
          },
        })

        console.log(`%cCanvas dimensions`, `color:#c4a901;`, {
          width: canvas.width,
          height: canvas.height,
        })

        pdf.addImage(canvas.toDataURL(), 'PNG', 0, 0, pageWidth, pageHeight)

        // flattened.shift()

        if (nextPageHeight > pageHeight) {
          debugger
          pdf.addPage([sizes.A4.width, sizes.A4.height], 'portrait')
        }

        pending.length = 0
        // if (currFlat && !processedIds.includes(currFlat.id))
        //   pending[0] = currFlat
        currPageHeight = currFlat?.height || 0
      } else {
        // flattened.shift()
        currPageHeight += currFlat?.height || 0
        if (currFlat && !processedIds.includes(currFlat.id))
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
