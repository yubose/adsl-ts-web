/**
 * Exports a DOM tree to a PDF document
 */
import * as u from '@jsmanifest/utils'
import type { Viewport as NuiViewport } from 'noodl-ui'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Options as Html2CanvasOptions } from 'html2canvas'
import { isViewport } from 'noodl-ui'
import isElement from '../utils/isElement'
import { doc } from 'prettier'

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
    let {
      width: elWidth,
      height: elHeight,
      bottom: elBottom,
      y: startY,
    } = el.getBoundingClientRect()
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

    const totalHeight = getTotalHeightFromElement(el) - startY
    const totalWidth = getTotalWidthFromElement(el)

    /**
     * Callback called with the cloned element.
     * Optionally mutate this cloned element to modify the output if needed.
     * The first (immediate) child of the container argument is the cloned "el" argument passed above
     *
     * @param _ HTML Document
     * @param targetElem Cloned target element
     */
    function onclone(_: Document, targetElem: HTMLElement) {
      // Expand all elements to fit their contents in pdf pages
      debugger
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
            // debugger
            // doc = doc?.addPage(format, orientation)
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

      doc.internal.pageSize.width = o.sizes.A4.width
      doc.internal.pageSize.height = o.sizes.A4.height

      // Canvas + image must share this same size to avoid stretches in fonts
      doc.canvas.width = o.sizes.A4.width
      doc.canvas.height = o.sizes.A4.height

      await generatePage({
        pdf: doc,
        container: el,
        el,
        pageHeight: o.sizes.A4.height,
        totalHeight,
      })

      try {
        commonHtml2CanvasOptions = {
          ...commonHtml2CanvasOptions,
          onclone,
          // width: format[0],
          // height: format[1],
          windowWidth: totalWidth,
          // windowWidth: format[0],
          windowHeight: totalHeight,
          // windowHeight: format[1],
          width: elWidth,
          // This height expands the VISIBLE content that is cropped off
          height: elHeight,
          // windowWidth: imageSize.width,
          // This height expands the PDF PAGE
          // windowHeight: imageSize.height,
        }

        let accHeight = 0
        let currHeight = 0

        // while (accHeight < totalHeight) {
        //   el.scrollTo({ top: accHeight })

        //   const image = await html2canvas(el, {
        //     ...commonHtml2CanvasOptions,
        //     onclone: (d, e) => {
        //       let _y = e.getBoundingClientRect().y

        //       const scrollToLatestHeight = (_el: HTMLElement) => {
        //         if (_el) {
        //           const { y } = _el.getBoundingClientRect()
        //           if (y >= _y) {
        //             _y = y
        //             if (_y < accHeight) {
        //               el.querySelector(`#${_el.id}`)?.scrollIntoView()
        //               e.querySelector(`#${_el.id}`)?.scrollIntoView()
        //             }
        //           }
        //           for (const childNode of _el.children) {
        //             scrollToLatestHeight(childNode as HTMLElement)
        //           }
        //         }
        //       }

        //       for (const childNode of e.children) {
        //         scrollToLatestHeight(childNode as HTMLElement)
        //       }
        //     },
        //   })

        //   // prettier-ignore
        //   doc.addImage(
        //    image.toDataURL(), 'png', 0, 0,
        //    elWidth, elHeight,
        //    'FAST', 'FAST'
        //   )
        //   // doc.addPage([o.sizes.A4.width, o.sizes.A4.height], orientation)
        //   console.log({
        //     commonHtml2CanvasOptions,
        //     generatedCanvasSizes: { width: image.width, height: image.height },
        //     pdfPageSizes: {
        //       width: doc.internal.pageSize.width,
        //       height: doc.internal.pageSize.height,
        //     },
        //   })

        //   if (currHeight > o.sizes.A4.height) {
        //     currHeight = currHeight - o.sizes.A4.height
        //     doc.addPage([o.sizes.A4.width, o.sizes.A4.height], orientation)
        //   }

        //   accHeight += elHeight
        //   currHeight += elHeight
        // }
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
          width: elWidth,
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

  /**
   * Calculates the total page height of a DOM node's tree including the height
   * inside scroll windows
   *
   * @param el
   */
  function getTotalHeightFromElement(el: HTMLElement | null | undefined) {
    let y = 0
    let currEl = el

    while (currEl) {
      y = Math.max(y, currEl.getBoundingClientRect().y)

      for (const childNode of currEl.children) {
        y = Math.max(y, getTotalHeightFromElement(childNode as HTMLElement))
      }

      currEl = currEl.nextElementSibling as HTMLElement
    }

    return y
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
      return [getTotalWidthFromElement(el), getTotalHeightFromElement(el)]
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
    display,
    generatePage,
    generateCanvas,
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

function getTreeBounds(el) {
  const obj = {}

  if (!el) return obj

  function getProps(obj, el) {
    const result = {
      ...obj,
      bounds: el.getBoundingClientRect(),
      id: el.id,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      scrollHeight: el.scrollHeight,
      style: {
        position: el.style.position,
        display: el.style.display,
        marginTop: el.style.marginTop,
        top: el.style.top,
        left: el.style.left,
        width: el.style.width,
        height: el.style.height,
      },
    }
    return result
  }

  Object.assign(obj, getProps(obj, el), {
    children: [],
    path: [],
    parent: null,
  })

  function collect(obj = {}, node) {
    Object.assign(obj, getProps(obj, node))
    const numChildren = node.children.length
    numChildren && !obj.children && (obj.children = [])
    for (let index = 0; index < numChildren; index++) {
      const childNode = node.children[index]
      obj.children[index] = collect(
        { parent: node.id, path: obj.path.concat('children', index) },
        childNode,
      )
    }

    return obj
  }

  const numChildren = el.children.length
  numChildren && !obj.children && (obj.children = [])
  for (let index = 0; index < numChildren; index++) {
    const childNode = el.children[index]
    obj.children[index] = collect(
      { parent: el.id, path: obj.path.concat(`children`, index) },
      childNode,
    )
  }

  return obj
}

function findBottomPageChild(
  el: Element | HTMLElement | null | undefined,
  bottom: number,
): HTMLElement | null {
  let result: HTMLElement | null = null
  if (isElement(el)) {
    let prevSibling: HTMLElement | null = el
    let nextSibling = el.nextElementSibling as HTMLElement | null
    let lastBottom = prevSibling.getBoundingClientRect().bottom

    while (nextSibling) {
      let nextBottom = nextSibling.getBoundingClientRect().bottom

      if (nextBottom < bottom) {
        lastBottom = nextBottom
        prevSibling = nextSibling
        nextSibling = nextSibling.nextElementSibling as HTMLElement
        debugger
      } else {
        if (
          prevSibling &&
          prevSibling?.getBoundingClientRect().bottom < bottom
        ) {
          debugger
          return prevSibling
        }
        if (nextSibling.childElementCount) {
          let prevChild: HTMLElement | null = null
          let currChild = nextSibling.firstElementChild as HTMLElement

          while (currChild) {
            const childBottom = currChild.getBoundingClientRect().bottom
            if (childBottom < bottom) {
              debugger
              prevChild = currChild
              currChild = currChild.firstElementChild as HTMLElement
            } else {
              debugger
              return prevChild || currChild
            }
          }
        }

        nextSibling = nextSibling.nextElementSibling as HTMLElement
      }
    }

    result = prevSibling || nextSibling

    if (el.childElementCount) {
      let prevChild: HTMLElement | null = null
      let currChild = el.firstElementChild as HTMLElement | null

      // for (let i = 0; i < el.childElementCount; i++) {
      //   const childNode = el.children[i] as HTMLElement
      //   const childBottom = childNode.getBoundingClientRect().bottom
      //   debugger
      //   if (childBottom > bottom) {
      //     debugger
      //     return childNode.previousElementSibling || childNode
      //   }
      //   const lastChild = (result = findBottomPageChild(
      //     container,
      //     bottom,
      //     childNode,
      //   ))
      //   const lastChildBottom = lastChild?.getBoundingClientRect?.()?.bottom
      //   debugger
      //   if (u.isNum(lastChildBottom)) {
      //     if (lastChildBottom > bottom) return lastChild
      //     debugger
      //     return lastChild?.previousElementSibling || lastChild
      //   }
      // }
    }
  }
  debugger
  return result
}

async function generatePage({
  pdf,
  container,
  el = container,
  pageHeight,
  totalHeight,
  offsetStart = 0,
  offsetEnd = 0,
  lastScrolledChildId = el?.id || '',
  scrolledTimes = 0,
}: {
  pdf: jsPDF
  container: Element | HTMLElement | null | undefined
  el: Element | HTMLElement | null | undefined
  pageHeight: number
  offsetStart?: number
  offsetEnd?: number
  totalHeight: number
  lastScrolledChildId?: string
  scrolledTimes?: number
}) {
  offsetEnd = offsetStart + pageHeight

  const bounds = el?.getBoundingClientRect?.()
  const bottom = bounds?.bottom as number
  const width = bounds?.width as number
  const height = bounds?.height as number
  const scrollHeight = el?.scrollHeight as number
  const format = [ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height]

  let lastChild: HTMLElement | null = null
  let currPageCount = 0

  function isWithinPage(
    elOrBottom: Element | number | null,
    offsetEnd: number,
  ) {
    if (u.isNum(elOrBottom)) return elOrBottom > offsetEnd
    const bottom = elOrBottom?.getBoundingClientRect()?.bottom
    if (u.isNum(bottom)) return isWithinPage(bottom, offsetEnd)
    return false
  }

  if (isElement(el) && isElement(container)) {
    if (isWithinPage(bottom, offsetEnd)) {
      lastChild = findBottomPageChild(el.firstElementChild, offsetEnd)
      const lastChildText = lastChild?.textContent?.trim() || ''
      const lastChildBounds = lastChild?.getBoundingClientRect?.()
      debugger
      if (lastChild) {
        // lastChild.scrollIntoView()

        {
          const canvas = await generateCanvas(
            container,
            {
              scrollY: offsetStart,
            },
            lastScrolledChildId,
          )
          currPageCount++

          const div = await display(canvas)
          debugger
          div.click()

          // prettier-ignore
          pdf.addImage(
            canvas.toDataURL(), 'png', 0, 0,
            ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height,
            'FAST', 'FAST'
            )

          container.scrollTo({ top: offsetStart })

          if (
            lastChild.getBoundingClientRect().bottom < totalHeight &&
            lastChild.childElementCount
          ) {
            const nextOffsetStart = lastChild.getBoundingClientRect().bottom
            const nextOffsetEnd = nextOffsetStart + pageHeight
            const nextElementText =
              lastChild.firstElementChild?.textContent || ''
            debugger
            pdf.addPage(
              [ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height],
              'portrait',
            )
            lastScrolledChildId = lastChild.id
            return generatePage({
              pdf,
              container,
              el: lastChild.firstElementChild,
              pageHeight,
              totalHeight,
              lastScrolledChildId,
              offsetStart: nextOffsetStart,
              offsetEnd: nextOffsetEnd,
            })
          }
        }
      }
    } else {
      debugger
      // The actual content is not included in the height
      // because we have to scroll further for more content
      // We must find the last child within the offsetStart and offsetEnd
      if (offsetStart + scrollHeight > offsetEnd) {
        if (el.childElementCount) {
          lastChild = findBottomPageChild(el.firstElementChild, offsetEnd)
          const lastChildText = lastChild?.textContent?.trim() || ''
          const lastChildBounds =
            lastChild?.getBoundingClientRect?.() as DOMRect
          debugger

          if (lastChild) {
            if (scrolledTimes > 0) {
              lastScrolledChildId = lastChild.id
              scrolledTimes++
            }
            const canvas = await generateCanvas(
              container,
              { scrollY: offsetStart },
              lastScrolledChildId,
            )

            currPageCount++

            // prettier-ignore
            pdf.addImage(
              canvas.toDataURL(), 'png', 0, 0,
              width, height,
              'FAST', 'FAST'
            )

            const div = await display(canvas)
            debugger
            div.click()

            lastScrolledChildId = lastChild.id
            offsetStart = lastChildBounds.bottom
            offsetEnd = offsetStart + pageHeight

            if (offsetEnd < totalHeight) {
              pdf.addPage(
                [ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height],
                'portrait',
              )
              debugger
              return generatePage({
                pdf,
                container,
                el: lastChild,
                pageHeight,
                totalHeight,
                offsetStart,
                offsetEnd,
                lastScrolledChildId,
              })
            }
          } else {
            const canvas = await generateCanvas(
              container,
              {
                scrollY: offsetStart,
              },
              lastScrolledChildId,
            )
            currPageCount++
            scrolledTimes++

            const div = await display(canvas)
            debugger
            div.click()

            // prettier-ignore
            pdf.addImage(
              canvas.toDataURL(), 'png', 0, 0,
              ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height,
              'FAST', 'FAST'
              )
            pdf.addPage(
              [ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height],
              'portrait',
            )
            throw new Error(
              `Couldn't find last child within offsetEnd ${offsetEnd}`,
            )
          }
        } else {
          // The whole element itself is large
          lastChild = el
          debugger
        }
      } else {
        // All of the actual content is included in the height
        const numPages = Math.ceil(scrollHeight / pageHeight)
        for (let i = 0; i < numPages; i++) {
          container.scrollTo({ top: offsetEnd })

          const canvas = await generateCanvas(
            container,
            { scrollY: offsetEnd },
            lastScrolledChildId,
          )
          scrolledTimes++
          const div = await display(canvas)
          debugger
          div.click()
          canvas.remove()
          // prettier-ignore
          pdf.addImage(
          canvas.toDataURL(), 'png', 0, 0,
          ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height,
          'FAST', 'FAST'
          )
          pdf.addPage(
            [ExportPdf().sizes.A4.width, ExportPdf().sizes.A4.height],
            'portrait',
          )
        }
        if (offsetEnd < totalHeight) {
          offsetStart = offsetEnd
          offsetEnd = offsetStart + pageHeight
          debugger
          return generatePage({
            pdf,
            container,
            el,
            pageHeight,
            totalHeight,
            offsetStart,
            offsetEnd,
            lastScrolledChildId,
          })
        }
      }
    }
  } else {
    debugger
    return {
      pdf,
      offsetStart,
      offsetEnd,
    }
  }
  debugger
  return {
    pdf,
    offsetStart,
    offsetEnd,
  }
}

async function generateCanvas(
  el: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
  idToScrollTo = '',
) {
  try {
    const { width, height } = el.getBoundingClientRect()
    return html2canvas(el, {
      width,
      height,
      windowWidth: ExportPdf().sizes.A4.width,
      windowHeight: ExportPdf().sizes.A4.height,
      useCORS: true,
      ...options,
      onclone: (d, e) => {
        try {
          d.getElementById(idToScrollTo)?.scrollIntoView?.()
          e.querySelector(`#${idToScrollTo}`)?.scrollIntoView?.()
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error(err)
        }
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

function display(canvas: HTMLCanvasElement): Promise<HTMLDivElement> {
  return new Promise((resolve, reject) => {
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.top = '0'
    div.style.right = '0'
    div.style.bottom = '0'
    div.style.left = '0'
    div.style.width = '100%'
    div.style.height = '100%'
    div.style.display = 'flex'
    div.style.justifyContent = 'center'
    div.style.alignContent = 'center'
    div.style.background = '#fff'
    div.style.zIndex = '99999999'
    const image = new Image()
    image.src = canvas.toDataURL()
    image.style.margin = 'auto'
    image.style.textAlign = 'center'
    image.style.border = '1px solid tomato'
    image.onload = () => {
      resolve(div)
    }
    image.onerror = (error) => {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(err)
      div.click()
      reject(err)
    }
    div.appendChild(image)
    const onClick = () => {
      document.body.removeChild(div)
      div.removeEventListener('click', onClick)
    }
    div.addEventListener('click', onClick)
    document.body.appendChild(div)
  })
}
