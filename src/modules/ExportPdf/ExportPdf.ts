/**
 * Exports a DOM tree to PDF document pages
 */
import * as u from '@jsmanifest/utils'
import { Viewport as VP } from 'noodl-ui'
import jsPDF from 'jspdf'
import display from './display'
import isElement from '../../utils/isElement'
import flatten, { flatten_next } from './flatten'
import generatePages from './generatePages'
import type { GeneratePagesOptions } from './generatePages'
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
    el.setAttribute('data-html2canvas-debug', 'all')

    let doc: jsPDF | undefined
    let { width: elWidth, height: elHeight } = el.getBoundingClientRect()

    let pdfDocOptions = {
      compress: true,
      format,
      orientation: 'portrait' as t.Orientation,
      unit: 'px',
    } as const

    let commonHtml2CanvasOptions: GeneratePagesOptions['generateCanvasOptions'] =
      {
        allowTaint: true,
        logging: true,
        // Putting this to true will avoid blank page when they try to re-download
        removeContainer: true,
        scale: 1.5,
        width: sizes.A4.width,
        height: sizes.A4.height,
        useCORS: true,
        windowWidth: sizes.A4.width,
        windowHeight: sizes.A4.height,
      }

    try {
      const pageWidth = sizes.A4.width
      const pageHeight = sizes.A4.height

      doc = new jsPDF(pdfDocOptions)
      doc.internal.pageSize.width = pageWidth
      doc.internal.pageSize.height = pageHeight

      try {
        const w = el.getBoundingClientRect().width
        const h = el.getBoundingClientRect().height
        const ratio = VP.getAspectRatio(w, h)

        const flattenedElements = await flatten_next({
          container: el,
          el: el.firstElementChild as HTMLElement,
          pageHeight,
          ratio,
        })

        doc = await generatePages({
          pdf: doc,
          el,
          nodes: flattenedElements,
          pageWidth,
          pageHeight,
          generateCanvasOptions: commonHtml2CanvasOptions,
        })
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
    sizes,
  }
})()

export default ExportPdf
