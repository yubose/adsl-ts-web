/**
 * Exports a DOM tree to a PDF document
 */
import * as u from '@jsmanifest/utils'
import type { Viewport as NuiViewport } from 'noodl-ui'
import { isViewport } from 'noodl-ui'
import jsPDF from 'jspdf'
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

  async function create(pdf: jsPDF, el: HTMLElement | null | undefined) {
    try {
      if (!el) return pdf
      let { width, top } = el.getBoundingClientRect()
      let format = [_settings.pageWidth, _settings.overallHeight]
      let currHeight = 0
      let remaining = _settings.overallHeight
      let scrollToPositions = [0] as number[]

      while (currHeight <= _settings.overallHeight) {
        scrollToPositions.push(currHeight + top)
        currHeight += _settings.pageHeight
        remaining -= _settings.pageHeight
      }

      if (remaining >= 1) {
        scrollToPositions.push(_settings.overallHeight - remaining)
        remaining = 0
      }

      pdf.addPage(format, _settings.orientation as 'portrait' | 'landscape')

      let numPos = scrollToPositions.length
      let lastPos = scrollToPositions[numPos - 1]

      for (let index = 0; index < numPos; index++) {
        let pos = scrollToPositions[index]
        let isRemaining = pos === lastPos && pos < _settings.overallHeight

        const canvas = await html2canvas(el, {
          allowTaint: true,
          width: _settings.pageWidth,
          height: _settings.overallHeight,
          x: 0,
          scrollY: -window.scrollY,
          windowWidth: width,
          windowHeight: _settings.overallHeight,
          // useCORS: true,
          onclone: (doc, el) => {
            el.scrollTo({ top: pos })

            if (isRemaining && el.children.length) {
              let remaining = _settings.overallHeight - pos
              let tempHeight = 0

              for (const child of el.children) {
                if (isElement(child)) {
                  const height = child.getBoundingClientRect().height

                  if (tempHeight + height <= remaining) {
                    child.style.visibility = 'hidden'
                    forEachSibling(
                      'right',
                      (sibling) => {
                        if (sibling.style) sibling.style.visibility = 'hidden'
                      },
                      child,
                    )
                  }

                  tempHeight++
                }
              }
            }
          },
        })

        pdf.addImage(canvas, 'PNG', 0, pos, canvas.width, canvas.height)
      }

      return pdf
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  }

  /**
   * Calculates the total page height of a DOM node's tree including the height
   * inside scroll windows
   *
   * @param el
   */
  function getTotalHeightFromElement(el: HTMLElement) {
    let height = 0
    for (const childNode of [...el.children]) {
      if (childNode.children.length) {
        height += getTotalHeightFromElement(childNode as HTMLElement)
      } else {
        height += childNode.scrollHeight
      }
    }
    return height
  }

  function getTotalWidthFromElement(el: HTMLElement) {
    return el.getBoundingClientRect().width
  }

  function getFormat(
    el?: NuiViewport | HTMLElement | null | undefined,
  ): [width: number, height: number] {
    if (isViewport(el)) {
      _viewport = el
      return [el.width, el.height]
    }
    if (isElement(el))
      return [getTotalWidthFromElement(el), getTotalHeightFromElement(el)]
    return _viewport
      ? [_viewport.width, _viewport.height]
      : [window.innerWidth, window.innerHeight]
  }

  function getOrientation(el: HTMLElement | null | undefined) {
    if (isElement(el)) {
      const { width, height } = el.getBoundingClientRect()
      return width > height ? 'landscape' : 'portrait'
    }
    return 'portrait'
  }

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
