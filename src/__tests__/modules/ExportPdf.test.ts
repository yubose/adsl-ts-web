import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import type jsPDF from 'jspdf'
import fs from 'fs-extra'
import path from 'path'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import cheerio from 'cheerio'
import jsdom from 'jsdom-global'
import { findFirstByViewTag } from 'noodl-ui-dom'
import ExportPdf from '../../modules/ExportPdf'
import Cov19ResultsAndFluResultsReviewGeneratedData from '../fixtures/Cov19ResultsAndFluResultsReview.json'

const viewport = { width: 1464.94, height: 823 }
const { sizes } = ExportPdf()

const getAbsFilePath = (...s: string[]) =>
  path.resolve(path.join(process.cwd(), ...s))

const loadHtml = {
  DWCFormRFAReview: () =>
    fs.readFileSync(
      getAbsFilePath('src/__tests__/fixtures/DWCFormRFAReview.html'),
      'utf8',
    ),
}

// Needs to overwrite the call from setupTests.ts to disable the ajax requests
function loadHtmlToEnvironment(html = '') {
  return jsdom(html, {
    includeNodeLocations: true,
    pretendToBeVisual: true,
    url: 'http://localhost:3000',
    contentType: 'text/html',
  })
}

const renderedPseudoDOMElementMap = {}

function createMockDOMNode(
  pseudoElem: Partial<
    Record<keyof HTMLElement | 'bounds' | 'parent' | 'path', any>
  >,
) {
  renderedPseudoDOMElementMap[pseudoElem.id] = pseudoElem
  const node = u.omit(pseudoElem, ['bounds', 'parent', 'path'])
  node.getBoundingClientRect = () => pseudoElem.bounds
  node.parentElement = renderedPseudoDOMElementMap[pseudoElem.parent] || null
  return node as HTMLElement
}

describe.only(`ExportPDF`, () => {
  describe(`DWCFormRFAReview page`, () => {
    beforeEach(() => {
      loadHtmlToEnvironment(loadHtml.DWCFormRFAReview())
    })

    describe(`getTotalHeightFromElement`, () => {
      it(`should return the expected total height`, () => {
        const $ = cheerio.load(loadHtml.DWCFormRFAReview())
        const $mainViewEl = $(`[data-viewtag="mainView"]`)
        const mainViewEl = findFirstByViewTag('mainView')

        console.info($mainViewEl.css('width'))
        console.info($mainViewEl.css('height'))
        console.info(mainViewEl.getBoundingClientRect())

        // console.info(findFirstByViewTag('mainView').getBoundingClientRect())

        // expect(
        //   ExportPdf().getTotalHeightFromElement(findFirstByViewTag('mainView')),
        // ).to.eq(1)
      })
    })

    // it(``, async () => {
    //   const mainViewEl = findFirstByViewTag('mainView')
    //   const exporter = ExportPdf()
    //   exporter.
    // })
  })

  describe(`getTotalPages`, () => {
    it(`should return the expected total of pages`, () => {
      const [total, remaining] = ExportPdf().getTotalPages(300, 1595.59375)
      expect(total).to.eq(6)
    })

    it(`should return the expected remaining height`, () => {
      const [total, remaining] = ExportPdf().getTotalPages(300, 1595.59375)
      expect(remaining).to.eq(95.59375)
    })
  })

  describe(`createBlueprint`, () => {
    describe(`A4`, () => {
      it(`should set pageSize to be [${sizes.A4.width}, ${sizes.A4.height}]`, () => {
        const blueprint = ExportPdf().createBlueprint(
          [sizes.A4.width, sizes.A4.height],
          createMockDOMNode({ bounds: {} }),
        )
        expect(blueprint).to.have.property('pageWidth', sizes.A4.width)
        expect(blueprint).to.have.property('pageHeight', sizes.A4.height)
      })

      it.skip(`should set the expected total height`, () => {
        expect(
          ExportPdf().createBlueprint(
            [sizes.A4.width, sizes.A4.height],
            createMockDOMNode({
              bounds: {
                x: -90.5,
                y: 172.8125,
                width: 864.296875,
                height: 623.359375,
                top: 172.8125,
                right: 773.796875,
                bottom: 796.171875,
                left: -90.5,
              },
              clientWidth: 865,
              clientHeight: 623,
              offsetWidth: 865,
              offsetHeight: 623,
              scrollWidth: 865,
              scrollHeight: 623,
            }),
          ),
        ).to.have.property('totalPages', 6)
      })

      it(`should set the expected total of pages`, () => {
        //
      })

      it(``, () => {
        const el = createMockDOMNode({
          bounds: {
            x: -90.5,
            y: 172.8125,
            width: 864.296875,
            height: 623.359375,
            top: 172.8125,
            right: 773.796875,
            bottom: 796.171875,
            left: -90.5,
          },
          clientWidth: 865,
          clientHeight: 623,
          offsetWidth: 865,
          offsetHeight: 623,
          scrollWidth: 865,
          scrollHeight: 623,
        })
        const blueprint = ExportPdf().createBlueprint('A4', el)
        console.log(blueprint)
      })
    })
  })
})
