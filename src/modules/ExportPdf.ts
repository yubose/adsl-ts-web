/**
 * Exports a DOM tree to a PDF document
 */
import * as u from '@jsmanifest/utils'
import type { Viewport as NuiViewport } from 'noodl-ui'
import jsPDF, { Html2CanvasOptions } from 'jspdf'
import html2canvas from 'html2canvas'
import { isViewport } from 'noodl-ui'
import forEachSibling from '../utils/forEachSibling'
import isElement from '../utils/isElement'

const isNil = (v: unknown): v is null | undefined => v == null || v == undefined

export const ExportPdf = (function () {
  let _settings = {
    orientation: 'portrait',
    overallWidth: 0,
    overallHeight: 0,
    pageHeight: 0,
    pageWidth: 0,
    pdf: null as jsPDF | null,
  }

  let _viewport: NuiViewport | null = null

  /**
   * Creates a jsPDF instance and generates the pages on it using dimensions from a DOM element
   *
   * @example
   * ```
   * const elem = document.getElementById('root')
   * const pdf = await create(elem)
   * ```
   *
   * @param el DOM element
   * @returns jsPDF instance
   */
  async function create(el: HTMLElement | null | undefined) {
    if (!isElement(el)) return

    let doc: jsPDF | undefined
    let { width, height } = el.getBoundingClientRect()
    // let format = getFormat(el)
    let format = [o.sizes.A4.width, o.sizes.A4.height] as [number, number]
    let orientation = getOrientation(el) as 'portrait' | 'landscape'

    const pdfDocOptions = {
      compress: true,
      format,
      orientation,
      unit: 'px',
    } as const

    const commonHtml2CanvasOptions: Omit<
      Html2CanvasOptions,
      | 'ignoreElements'
      | 'onclone'
      | 'width'
      | 'height'
      | 'windowWidth'
      | 'windowHeight'
    > = {
      allowTaint: true,
      removeContainer: false,
      useCORS: true,
      scrollX: 0,
    }

    /**
     * Callback called with the cloned element.
     * Optionally mutate this cloned element to modify the output if needed.
     * The first (immediate) child of the container argument is the cloned "el" argument passed above
     *
     * @param _ HTML Document
     * @param container Container created by html2canvas
     */
    const onclone = (_: Document, container: HTMLElement) => {
      container.style.overflow = 'auto'
      container.style.height = 'auto'
      const style = (container.firstChild as HTMLElement)?.style

      if (u.isObj(style)) {
        style.overflow = 'auto'
        style.height = 'auto'
        style.width = `${width}px`
      }

      for (const el of [
        ...container.getElementsByClassName('scroll-view'),
      ] as HTMLElement[]) {
        el.classList.remove('scroll-view')
        el.style.height = 'auto'
        if (el.style.overflow === 'hidden') el.style.overflow = 'auto'
      }
    }

    try {
      doc = new jsPDF(pdfDocOptions)

      const totalHeight = setDocSizesFromElement(doc, el)[1]
      const totalWidth = getTotalWidthFromElement(el)

      doc.canvas.width = width
      doc.canvas.height = totalHeight
      doc.internal.pageSize.height = totalHeight + 150

      const image = await html2canvas(el, {
        ...commonHtml2CanvasOptions,
        onclone,
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
      })

      // prettier-ignore
      doc.addImage(
         image.toDataURL(), 'png', 0, 0, totalWidth, totalHeight, 'FAST', 'FAST'
      )
    } catch (error) {
      console.error(error instanceof Error ? error : new Error(String(error)))
      console.log(
        `[ExportPDF#create] Error occurred while creating a PDF using the addImage method. Using fallback using the HTML method now...`,
        error,
      )

      !doc && (doc = new jsPDF(pdfDocOptions))

      await doc?.html(el, {
        autoPaging: 'slice',
        width,
        windowWidth: getTotalWidthFromElement(el),
        html2canvas: {
          ...commonHtml2CanvasOptions,
          // @ts-expect-error
          onclone,
          width,
          height,
          windowWidth: getTotalWidthFromElement(el),
          windowHeight: getTotalHeightFromElement(el),
          svgRendering: false,
          taintTest: true,
        },
      })
    }
    return doc
  }

  /**
   * Calculates the total page height of a DOM node's tree including the height
   * inside scroll windows
   *
   * @param el
   */
  function getTotalHeightFromElement(el: HTMLElement | null | undefined) {
    let height = 0
    if (isElement(el)) {
      for (const childNode of [...el.children]) {
        if (childNode.children.length) {
          height += getTotalHeightFromElement(childNode as HTMLElement)
        } else {
          height += childNode.scrollHeight
        }
      }
    }
    return height
  }

  /**
   * Returns the width of an element using el.getBoundingClientRect.
   * This is mostly intended for pdf pages that are generated directly from a DOM element.
   * @param el DOM element
   * @returns width
   */
  function getTotalWidthFromElement(el: HTMLElement) {
    return el.getBoundingClientRect().width
  }

  /**
   * Returns the format for a pdf document in pixels.
   * - If a Viewport instance is passed it will use the viewport's width/height
   * - If a DOM element is passed it will use its width and total scrollHeight of all of its descendants
   * - Otherwise it will use the window's innerWidth and innerHeight
   *
   * @example
   * ```
   * const elem = document.getElementById('root')
   * const format = exporter.getFormat(elem)
   * ```
   * @param el DOM element or NuiViewport
   * @returns pdf page format which includes width and height
   */
  function getFormat(
    el?: NuiViewport | HTMLElement | null | undefined,
  ): [width: number, height: number] {
    if (isViewport(el)) {
      _viewport = el
      return [el.width, el.height]
    }
    if (isElement(el)) {
      return [getTotalWidthFromElement(el), getTotalHeightFromElement(el)]
    }
    return [window.innerWidth, window.innerHeight]
  }

  /**
   * Returns the computed orientation based from a DOM element's width/height
   * @param el DOM element
   * @returns 'portrait' or 'landscape'
   */
  function getOrientation(el: HTMLElement | null | undefined) {
    if (isElement(el)) {
      const { width, height } = el.getBoundingClientRect()
      return width > height ? 'landscape' : 'portrait'
    }
    return 'portrait'
  }

  /**
   * Sets the current page's height and width using computations based from a DOM element.
   * - The height is computed using the scrollHeight of all its descendants.
   * @param doc jsPDF instance
   * @param el DOM element
   * @returns [jsPDF instance, height]
   */
  function setDocSizesFromElement(doc: jsPDF, el: HTMLElement) {
    if (u.isObj(doc) && u.isObj(el)) {
      doc.internal.pageSize.height = getTotalHeightFromElement(el)
      doc.internal.pageSize.width = getTotalWidthFromElement(el)
    }
    return [doc, doc.internal.pageSize.height] as [
      doc: jsPDF,
      totalHeight: number,
    ]
  }

  const o = {
    create,
    getFormat,
    getOrientation,
    getTotalHeightFromElement,
    getTotalWidthFromElement,
    /**
     * - Presets for convential sizes in pixels (All representing 72 PPI)
     * - Use https://www.papersizes.org/a-sizes-in-pixels.htm for an online tool
     */
    sizes: {
      A1: { width: 1684, height: 2384 },
      A2: { width: 1191, height: 1684 },
      A3: { width: 842, height: 1191 },
      A4: { width: 595, height: 842 },
      A5: { width: 420, height: 595 },
      A6: { width: 298, height: 420 },
      A7: { width: 210, height: 298 },
      A8: { width: 147, height: 210 },
    },
    setDocSizesFromElement,
    settings: _settings,
    get viewport() {
      return _viewport
    },
  }

  return function makeExportPdf(
    settings?: Partial<typeof _settings> | NuiViewport,
  ) {
    if (isViewport(settings)) {
      _viewport = settings
      _settings.pageWidth = _settings.overallWidth = u.isNum(settings.width)
        ? settings.width
        : window.innerWidth
      _settings.pageHeight = _settings.overallHeight = u.isNum(settings.height)
        ? settings.height
        : window.innerHeight
    } else if (u.isObj(settings)) {
      if (!isNil(settings.pdf)) _settings.pdf = settings.pdf
      if (!isNil(settings.pageWidth)) _settings.pageWidth = settings.pageWidth
      if (!isNil(settings.pageHeight))
        _settings.pageHeight = settings.pageHeight
      if (!isNil(settings.orientation))
        _settings.orientation = settings.orientation
      if (!isNil(settings.overallWidth))
        _settings.overallWidth = settings.overallWidth
      if (!isNil(settings.overallHeight))
        _settings.overallHeight = settings.overallHeight

      if (typeof window !== 'undefined') {
        if (isNil(settings.pageWidth)) _settings.pageWidth = window.innerWidth
        if (isNil(settings.pageHeight))
          _settings.pageHeight = window.innerHeight
        if (isNil(settings.overallWidth))
          _settings.overallWidth = window.innerWidth
        if (isNil(settings.overallHeight))
          _settings.overallHeight = window.innerHeight
      }
    } else {
      _settings.pageWidth = window.innerWidth
      _settings.pageHeight = window.innerHeight
      _settings.overallWidth = window.innerWidth
      _settings.overallHeight = window.innerHeight
    }

    return o
  }
})()

export default ExportPdf
