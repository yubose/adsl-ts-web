/**
 * Exports a DOM tree to a PDF document
 */
import * as u from '@jsmanifest/utils'
import type { Viewport as NuiViewport } from 'noodl-ui'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Options as Html2CanvasOptions } from 'html2canvas'
import { isViewport } from 'noodl-ui'
import getElementTreeDimensions, {
  ElementTreeDimensions,
} from '../utils/getElementTreeDimensions'
import isElement from '../utils/isElement'

export type Format =
  | [width: number, height: number]
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'A7'
  | 'A8'
export type Orientation = 'landscape' | 'portrait'

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

  function getDocumentSize(_document: Document) {
    if (typeof window !== 'undefined') {
      const { body, documentElement } = _document
      return {
        width: Math.max(
          Math.max(body.scrollWidth, documentElement.scrollWidth),
          Math.max(body.offsetWidth, documentElement.offsetWidth),
          Math.max(body.clientWidth, documentElement.clientWidth),
        ),
        height: Math.max(
          Math.max(body.scrollHeight, documentElement.scrollHeight),
          Math.max(body.offsetHeight, documentElement.offsetHeight),
          Math.max(body.clientHeight, documentElement.clientHeight),
        ),
      }
    }
    return { width: 0, height: 0 }
  }

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
  async function create(
    el: HTMLElement | null | undefined,
    opts?: {
      /**
       * Defaults to A4 (595x842) in 72 PPI
       */
      format?: Format
    },
  ) {
    if (!isElement(el)) return

    let doc: jsPDF | undefined
    let { width, y: startY } = el.getBoundingClientRect()
    let format = getFormat(opts?.format)
    let orientation = getOrientation(el) as Orientation

    let pdfDocOptions = {
      compress: true,
      format,
      orientation,
      unit: 'px',
    } as const

    let commonHtml2CanvasOptions: Partial<Html2CanvasOptions> = {
      allowTaint: true,
      logging: true,
      // Putting this to true will avoid blank page when they try to re-download
      removeContainer: true,
      useCORS: true,
      x: 0,
      y: 0,
    }

    const totalHeight = getTotalHeight(el)[0] - startY
    const totalWidth = getTotalWidthFromElement(el)

    /**
     * Callback called with the cloned element.
     * Optionally mutate this cloned element to modify the output if needed.
     * The first (immediate) child of the container argument is the cloned "el" argument passed above
     *
     * @param _ HTML Document
     * @param container Container created by html2canvas
     */
    const onclone = (_: Document, targetElem: HTMLElement) => {
      // Expand all elements to fit their contents in pdf pages

      // currElem = targetElem
      let currHeight = 0
      let maxPageHeight = format[0]

      // Since there is an issue with images being 0px height because of the "height: auto" in parent, we have to skip modifying parents that have them as children so the images can expand
      const setNonImagesToHeightAuto = (c: HTMLElement | null | undefined) => {
        if (c) {
          let hasImageChild = false

          // while (currElem) {
          const { height } = c.getBoundingClientRect()
          const nextHeight = currHeight + height
          if (nextHeight > maxPageHeight) {
            doc = doc?.addPage(format, orientation)
            currHeight = 0
          }
          currHeight += height
          // currElem =
          //   (currElem.nextElementSibling as HTMLElement) || currElem.firstChild
          // }

          for (const childNode of c.children) {
            if (childNode.tagName === 'IMG') {
              hasImageChild = true
              break
            }
          }

          !hasImageChild && (c.style.height = 'auto')
          c.style.overflow === 'hidden' && (c.style.overflow = 'auto')

          for (const childNode of c.children) {
            setNonImagesToHeightAuto(childNode as HTMLElement)
          }
        }
      }

      let currElem = targetElem

      // Expands all descendants so their content can be captured in pdf pages
      while (currElem) {
        setNonImagesToHeightAuto(currElem)
        currElem = currElem.nextElementSibling as HTMLElement
      }

      // currElem = targetElem
      // let currHeight = 0
      // let maxPageHeight = format[0]

      // while (currElem) {
      //   const { height } = currElem.getBoundingClientRect()
      //   const nextHeight = currHeight + height
      //   if (nextHeight > maxPageHeight) {
      //     debugger
      //     doc = doc?.addPage(format, orientation)
      //   }
      //   currElem =
      //     (currElem.nextElementSibling as HTMLElement) || currElem.firstChild
      // }
    }

    try {
      doc = new jsPDF(pdfDocOptions)

      doc.canvas.width = totalWidth
      doc.canvas.height = totalHeight
      doc.internal.pageSize.width = totalWidth
      doc.internal.pageSize.height = totalHeight

      // Canvas + image must share this same size to avoid stretches in fonts
      const imageSize = {
        width: totalWidth,
        height: totalHeight,
      }

      try {
        commonHtml2CanvasOptions = {
          ...commonHtml2CanvasOptions,
          onclone,
          width: totalWidth,
          // This height expands the VISIBLE content that is cropped off
          height: totalHeight,
          // This height expands the PDF PAGE
          windowHeight: totalHeight,
          windowWidth: totalWidth,
        }

        const image = await html2canvas(el, commonHtml2CanvasOptions)
        // prettier-ignore
        doc.addImage(
         image.toDataURL(), 'png', 0, 0,
         totalWidth, totalHeight,
         'FAST', 'FAST'
        )
        console.log({
          commonHtml2CanvasOptions,
          generatedCanvasSizes: { width: image.width, height: image.height },
          pdfPageSizes: {
            width: doc.internal.pageSize.width,
            height: doc.internal.pageSize.height,
          },
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.log(
          `[ExportPDF-${err.name}] Error occurred while creating a PDF using the addImage method. Using fallback HTML strategy now...`,
          err,
        )

        await doc?.html(el, {
          autoPaging: 'slice',
          // width: format[0],
          // windowWidth: format[0],
          width,
          // windowWidth: totalWidth,
          windowWidth: totalWidth,
          html2canvas: {
            ...commonHtml2CanvasOptions,
            svgRendering: false,
            taintTest: true,
          } as Parameters<jsPDF['html']>[1],
        })
      }
    } catch (error) {
      console.error(error instanceof Error ? error : new Error(String(error)))
    }
    return doc
  }

  function createBlueprint(
    size: string | [width: number, height: number],
    el: HTMLElement | null | undefined,
  ) {
    if (!el) return
    const [pageWidth, pageHeight] = (
      u.isStr(size) && o.sizes[size]
        ? [o.sizes[size].width, o.sizes[size].height]
        : u.isArr(size)
        ? size
        : [el.scrollWidth, el.scrollHeight]
    ) as [number, number]
    const [totalHeight, path] = getTotalHeight(el)
    const [totalPages, remainingHeight] = getTotalPages(pageHeight, [
      totalHeight,
      path,
    ])

    const blueprint = {
      pages: getPageBlueprints(getElementTreeDimensions(el), {
        pageHeight,
      }),
      pageWidth,
      pageHeight,
      path,
      remainingHeight,
      totalHeight,
      totalPages,
    }

    function getPageBlueprints(
      obj: ElementTreeDimensions,
      {
        currPage = 0,
        currPageHeight = 0,
        pageHeight,
        path = [],
      }: {
        currPage?: number
        currPageHeight?: number
        pageHeight: number
        path?: any[]
      },
    ) {
      const { bounds } = obj
      const results = [] as any[]
      const next = currPageHeight + bounds.height

      const result = {
        currPageHeight,
        id: obj.id,
        parent: obj.parent,
        path,
      } as Record<string, any>

      obj.viewTag && (result.viewTag = obj.viewTag)

      if (currPageHeight < pageHeight) {
        if (next >= pageHeight) {
          const remaining = next - pageHeight
          result.currPageHeight = currPageHeight
          result.page = ++currPage
          result.remaining = remaining
          currPageHeight = remaining
          results.push(result)
        }
      } else {
        currPageHeight = next
      }

      return obj?.children?.length
        ? results.concat(
            ...obj.children.map(
              (childObj, i) =>
                getPageBlueprints(childObj, {
                  currPage,
                  currPageHeight,
                  pageHeight,
                  path: path.concat('children', i),
                }),
              pageHeight,
            ),
          )
        : results
    }

    return blueprint
  }

  /**
   * Calculates the total page height of a DOM node's tree including the height
   * inside scroll windows
   *
   * @param el
   */
  function getTotalHeight(
    el: HTMLElement | null | undefined,
    path = [] as any[],
    cb?: (args: {
      el: HTMLElement
      bounds: DOMRect
      clientHeight: number
      offsetHeight: number
      scrollHeight: number
      path: any[]
    }) => void,
  ): [number, any[]] {
    let bounds = el?.getBoundingClientRect?.() as DOMRect
    let curr = bounds?.bottom || 0

    if (!el?.children) return [curr, path]

    cb?.({
      el,
      bounds,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      scrollHeight: el.scrollHeight,
      path,
    })

    for (const childNode of el.children) {
      if (isElement(childNode)) {
        const { top, bottom } = childNode.getBoundingClientRect()

        if (bottom > curr) curr = bottom

        const map = {
          current: top,
          bottom,
          id: childNode.id,
          tagName: childNode.tagName.toLowerCase(),
        } as Record<string, any>

        path.push(map)
        const next = getTotalHeight(childNode as HTMLElement, [], cb)
        path.push(...next[1])

        if (next[0] > curr) curr = next[0] as number
      }
    }

    return [curr, path]
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

  function getTotalPages(
    pageHeight = 0,
    [totalHeight = 0, path = [] as any[]],
  ): [total: number, remainingHeight: number] {
    let curr = 0
    let remaining = 0
    let total = 1

    while (curr <= totalHeight) {
      const next = curr + pageHeight
      if (next <= totalHeight) {
        curr += pageHeight
        total++
      } else {
        remaining = totalHeight - curr
        break
      }
    }

    return [total, remaining]
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
    el?: NuiViewport | HTMLElement | null | undefined | Format,
  ): [width: number, height: number] {
    if (u.isStr(el) && el in o.sizes) {
      return [o.sizes[el].width, o.sizes[el].height]
    }
    if (u.isArr(el)) {
      return el
    }
    if (isViewport(el)) {
      _viewport = el
      return [el.width, el.height]
    }
    if (isElement(el)) {
      return [getTotalWidthFromElement(el), getTotalHeight(el, [])[0]]
    }
    return [o.sizes.A4.width, o.sizes.A4.height]
  }

  /**
   * Returns the computed orientation based from a DOM element's width/height
   * @param el DOM element
   * @returns 'portrait' or 'landscape'
   */
  function getOrientation(el: HTMLElement | null | undefined): Orientation {
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
      doc.internal.pageSize.height = getTotalHeight(el, [])[0]
      doc.internal.pageSize.width = getTotalWidthFromElement(el)
    }
    return [doc, doc.internal.pageSize.height] as [
      doc: jsPDF,
      totalHeight: number,
    ]
  }

  const o = {
    create,
    createBlueprint,
    getFormat,
    getOrientation,
    getTotalHeight,
    getTotalWidthFromElement,
    getTotalPages,
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
      mobile: { width: 375, height: 667 },
      desktop: { width: 1024, height: 768 },
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
