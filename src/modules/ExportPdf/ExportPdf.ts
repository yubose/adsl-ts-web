/**
 * Exports a DOM tree to PDF document pages
 */
import * as u from '@jsmanifest/utils'
import jsPDF from 'jspdf'
import display from './display'
import isElement from '../../utils/isElement'
import flatten from './flatten'
import generateCanvas from './generateCanvas'
import sizes from './sizes'
import * as t from './exportPdfTypes'

export const ExportPdf = (function () {
  /**
   * Creates a jsPDF instance and generates the pages on it using dimensions from a DOM element
   *
   * @example
   * ```
   * const elem = document.getElementById('root')
   * const pdf = await create(elem, 'A4')
   * ```
   *
   * @param el DOM element
   * @param format PDF sizing format (Defaults to "A4")
   * @returns jsPDF instance
   */
  async function create(el: HTMLElement | null | undefined, format?: t.Format) {
    if (!isElement(el)) return

    let doc: jsPDF | undefined
    let { width: elWidth, height: elHeight } = el.getBoundingClientRect()

    let pdfDocOptions = {
      compress: true,
      format,
      orientation: 'portrait' as t.Orientation,
      unit: 'px',
    } as const

    let commonHtml2CanvasOptions = {
      async: true,
      allowTaint: true,
      logging: true,
      onclone,
      // Putting this to true will avoid blank page when they try to re-download
      removeContainer: true,
      svgRendering: false,
      useCORS: true,
      windowWidth: sizes.A4.width,
      windowHeight: sizes.A4.height,
      x: 0,
      y: 0,
    }

    /**
     * Callback called with the cloned element.
     * Optionally mutate this cloned element to modify the output if needed.
     * The first (immediate) child of the container argument is the cloned "el" argument passed above
     *
     * @param _ HTML Document
     * @param targetElem Cloned target element
     */
    function onclone(_: Document, targetElem: HTMLElement) {
      //
    }

    try {
      doc = new jsPDF(pdfDocOptions)
      doc.internal.pageSize.width = sizes.A4.width
      doc.internal.pageSize.height = sizes.A4.height

      try {
        const flattenedElements = await flatten({
          el: el.firstElementChild as HTMLElement,
          pageHeight: sizes.A4.height,
        })

        const pageElements = [] as HTMLElement[][]

        for (const flattenedElement of flattenedElements) {
          let currPageElements = pageElements[pageElements.length - 1] || []

          if (!pageElements.includes(currPageElements)) {
            pageElements.push(currPageElements)
          }

          currPageElements.push(flattenedElement)

          const currPageElementsSize = currPageElements.reduce(
            (acc, el) => (acc += el.getBoundingClientRect().height),
            0,
          )

          if (currPageElementsSize > sizes.A4.height) {
            const fragment = document.createDocumentFragment()
            pageElements.splice(pageElements.indexOf(currPageElements), 1)
            while (currPageElements.length) {
              fragment.appendChild(currPageElements.shift() as HTMLElement)
            }
            const canvas = await generateCanvas(fragment, {
              ...commonHtml2CanvasOptions,
            })
            doc.addImage(canvas, 'PNG', 0, 0, sizes.A4.width, sizes.A4.height)
            doc.addPage([sizes.A4.width, sizes.A4.height], 'portrait')
          }

          // await display(el, flattenedElement)
          // debugger
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.log(
          `[ExportPDF-${err.name}] Error occurred while creating a PDF using the addImage method. Using fallback HTML strategy now...`,
          err,
        )
        await doc?.html(el, {
          ...u.omit(commonHtml2CanvasOptions, ['onclone']),
          autoPaging: 'slice',
          width: elWidth,
          html2canvas: {
            ...u.omit(commonHtml2CanvasOptions, ['onclone']),
            width: elWidth,
            height: elHeight,
          },
        })
      }
    } catch (error) {
      console.error(error instanceof Error ? error : new Error(String(error)))
    }

    return doc
  }

  return {
    create,
    display,
    flatten,
    generateCanvas,
    sizes,
  }
})()

export default ExportPdf
