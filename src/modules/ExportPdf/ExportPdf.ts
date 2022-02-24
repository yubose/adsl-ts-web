/**
 * Exports a DOM tree to PDF document pages
 */
import * as u from '@jsmanifest/utils'
import jsPDF from 'jspdf'
import isElement from '../../utils/isElement'
import flatten from './flatten'
import generateCanvas from './generateCanvas'
import generatePages from './generatePages'
import getDeepTotalHeight from '../../utils/getDeepTotalHeight'
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
      format: [pageWidth, pageHeight] as string | number[],
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
      pageWidth = sizes.A4.height
      pageHeight = sizes.A4.width
      pdfDocOptions.format = [pageWidth, pageHeight]
      pdfDocOptions.orientation = 'landscape'

      if (elWidth > pageWidth) {
        commonHtml2CanvasOptions.width = elWidth
        commonHtml2CanvasOptions.windowWidth = elWidth
      } else {
        commonHtml2CanvasOptions.width = pageWidth
        commonHtml2CanvasOptions.windowWidth = elWidth
        commonHtml2CanvasOptions.height = pageHeight * (elWidth / elHeight)
        commonHtml2CanvasOptions.windowHeight =
          pageHeight * (elWidth / elHeight)
      }
      // Correctly positions the form (Still needs testing)
      commonHtml2CanvasOptions.x = -100
    }
    commonHtml2CanvasOptions.y = -25

    try {
      doc = new jsPDF(pdfDocOptions)

      doc.internal.pageSize.width = pageWidth
      doc.internal.pageSize.height = pageHeight

      if (pdfDocOptions.orientation === 'landscape') {
        doc.deletePage(1)
        doc.addPage([pageWidth, pageHeight], 'landscape')
      }

      try {
        flattener = flatten({ baseEl: el, pageHeight })

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
