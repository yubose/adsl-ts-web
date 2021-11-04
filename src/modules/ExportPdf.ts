/**
 * Exports a DOM tree to a PDF document
 */
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
    pdf: null,
  }

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

        pdf.addImage(
          canvas.toDataURL(),
          'PNG',
          0,
          pos,
          canvas.width,
          canvas.height,
        )
      }

      return pdf
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  }

  const o = {
    create,
    settings: _settings,
  }

  return function makeExportPdf(settings: Partial<typeof _settings> = {}) {
    if (!isNil(settings.pageWidth)) _settings.pageWidth = settings.pageWidth
    if (!isNil(settings.pageHeight)) _settings.pageHeight = settings.pageHeight
    if (!isNil(settings.orientation))
      _settings.orientation = settings.orientation
    if (!isNil(settings.overallWidth))
      _settings.overallWidth = settings.overallWidth
    if (!isNil(settings.overallHeight))
      _settings.overallHeight = settings.overallHeight

    if (typeof window !== 'undefined') {
      if (isNil(settings.pageWidth)) _settings.pageWidth = window.innerWidth
      if (isNil(settings.pageHeight)) _settings.pageHeight = window.innerHeight
      if (isNil(settings.overallWidth))
        _settings.overallWidth = window.innerWidth
      if (isNil(settings.overallHeight))
        _settings.overallHeight = window.innerHeight
    }

    return o
  }
})()

export default ExportPdf
