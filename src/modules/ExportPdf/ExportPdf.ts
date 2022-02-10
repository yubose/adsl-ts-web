/**
 * Exports a DOM tree to PDF document pages
 */
import * as u from '@jsmanifest/utils'
import { Viewport as VP } from 'noodl-ui'
import jsPDF from 'jspdf'
import isElement from '../../utils/isElement'
import flatten from './flatten'
import generateCanvas from './generateCanvas'
import generatePages from './generatePages'
import sizes from './sizes'
import type { GeneratePagesOptions } from './generatePages'
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

    let flattener: ReturnType<typeof flatten> | undefined
    let pageWidth = sizes.A4.width
    let pageHeight = sizes.A4.height
    let pdfDocOptions = {
      compress: true,
      format: [pageWidth, pageHeight],
      orientation: 'portrait' as t.Orientation,
      unit: 'px' as const,
    }

    let commonHtml2CanvasOptions: GeneratePagesOptions['generateCanvasOptions'] =
      {
        width: sizes.A4.width,
        height: sizes.A4.height,
        windowWidth: sizes.A4.width,
        windowHeight: sizes.A4.height,
      }

    if (elWidth > elHeight) {
      pdfDocOptions.orientation = 'landscape'
      pageWidth = sizes.A4.height
      pageHeight = sizes.A4.width
      commonHtml2CanvasOptions.width = pageWidth
      commonHtml2CanvasOptions.height = pageHeight
      commonHtml2CanvasOptions.windowWidth = pageWidth
      commonHtml2CanvasOptions.windowHeight = pageHeight
    }

    try {
      doc = new jsPDF(pdfDocOptions)

      doc.internal.pageSize.width = pageWidth
      doc.internal.pageSize.height = pageHeight

      if (pdfDocOptions.orientation === 'landscape') {
        doc.deletePage(1)
        doc.addPage([pageWidth, pageHeight], 'landscape')
      }

      try {
        const w = el.getBoundingClientRect().width
        const h = el.getBoundingClientRect().height
        const ratio = VP.getAspectRatio(w, h)

        flattener = flatten({
          container: el,
          el: el.firstElementChild as HTMLElement,
          pageHeight,
          ratio,
        })

        doc = await generatePages({
          el,
          flattener,
          generateCanvasOptions: commonHtml2CanvasOptions,
          orientation: pdfDocOptions.orientation,
          pageWidth,
          pageHeight,
          pdf: doc,
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
    } finally {
      flattener?.clear?.()
    }

    return doc
  }

  return {
    create,
    flatten,
    generatePages,
    generateCanvas,
    sizes,
  }
})()

export default ExportPdf
