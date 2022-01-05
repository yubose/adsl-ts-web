import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import type jsPDF from 'jspdf'
import fs from 'fs-extra'
import path from 'path'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import { findFirstByViewTag } from 'noodl-ui-dom'
import cheerio from 'cheerio'
import jsdom from 'jsdom-global'
import type {
  Format,
  Orientation,
  PageBlueprint,
  PdfBlueprint,
  PathObject,
} from '../../modules/ExportPdf'
import ExportPdf, { traverseBF } from '../../modules/ExportPdf'
import Cov19ResultsAndFluResultsReviewGeneratedData from '../fixtures/Cov19ResultsAndFluResultsReview.json'
import getElementTreeDimensions from '../../utils/getElementTreeDimensions'

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
  node.children = pseudoElem.children?.map?.(createMockDOMNode) || []
  node.parentElement = renderedPseudoDOMElementMap[pseudoElem.parent] || null
  return node as HTMLElement
}

describe.only(`ExportPDF`, () => {
  xdescribe(`DWCFormRFAReview page`, () => {
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
      const [total] = ExportPdf().getTotalPages(300, [1595.59375])
      expect(total).to.eq(6)
    })

    it(`should return the expected remaining height`, () => {
      const [_, remaining] = ExportPdf().getTotalPages(300, [1595.59375])
      expect(remaining).to.eq(95.59375)
    })
  })

  describe(`traverseBF`, () => {
    it(``, () => {
      traverseBF((sibling) => {
        console.log(sibling)
      }, createMockDOMNode(Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions))
    })
  })

  describe(`createBlueprint`, () => {
    // Tested with window.innerWidth: 1051, window.innerHeight: 823
    // Tested with viewport.width: 1464.94, viewport.height: 823
    let blueprint: PdfBlueprint | undefined
    let format = [sizes.A4.width, sizes.A4.height] as Format
    let pageWidth = 842
    let pageHeight = 842
    let totalWidth = 864.296875
    let totalHeight = 1459.6875

    beforeEach(() => {
      blueprint = ExportPdf().createBlueprint(
        'A4',
        createMockDOMNode(
          Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
        ),
      )
    })

    describe.only(`createPageBlueprint`, () => {
      it.only(`should return the startY and endY`, () => {
        const pageBlueprint = ExportPdf().createPageBlueprint({
          pageHeight,
          totalHeight,
          path: blueprint?.path,
        })
        // expect(pageBlueprint).to.have.property('startY')
        // expect(pageBlueprint).to.have.property('endY')
        console.log(pageBlueprint)
      })

      describe(`when accumulated height exceeds page height`, () => {
        it(``, () => {
          const { blueprint } = Cov19ResultsAndFluResultsReviewGeneratedData
          const pageBlueprint = ExportPdf().createPageBlueprint({
            format: [sizes.A4.width, sizes.A4.height],
            pageHeight: sizes.A4.height,
            path: blueprint.path,
            totalHeight: blueprint.totalHeight,
          })

          console.log(pageBlueprint)
        })
      })

      describe(`when accumulated height does not exceed page height`, () => {
        xit(``, () => {
          //
        })
      })
    })

    describe(`A4`, () => {
      it(`should set pageWidth / pageHeight to be [${sizes.A4.width}, ${sizes.A4.height}]`, () => {
        const blueprint = ExportPdf().createBlueprint(
          [sizes.A4.width, sizes.A4.height],
          createMockDOMNode({ bounds: {} }),
        )
        expect(blueprint).to.have.property('pageWidth', sizes.A4.width)
        expect(blueprint).to.have.property('pageHeight', sizes.A4.height)
      })

      it(`should set totalWidth / totalHeight to 864.296875/1459.6875`, () => {
        const el = createMockDOMNode(
          Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
        )
        const blueprint = ExportPdf().createBlueprint('A4', el)
        expect(blueprint).to.have.property('totalWidth', 864.296875)
        expect(blueprint).to.have.property('totalHeight', 1459.6875)
      })

      it(`should set total pages to 2`, () => {
        const el = createMockDOMNode(
          Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
        )
        const blueprint = ExportPdf().createBlueprint('A4', el)
        expect(blueprint).to.have.property('totalPages', 2)
      })

      describe(`page #1`, () => {
        it(`should set format to the same as in the pdf blueprint`, () => {
          const el = createMockDOMNode(
            Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
          )
          const blueprint = ExportPdf().createBlueprint(
            'A4',
            el,
          ) as PdfBlueprint
          expect(blueprint.pages[0].format[0]).to.eq(blueprint.format[0])
          expect(blueprint.pages[0].format[1]).to.eq(blueprint.format[1])
        })

        it(`should set the expected orientation relative to page's width/height`, () => {
          const el = createMockDOMNode(
            Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
          )
          const blueprint = ExportPdf().createBlueprint(
            'A4',
            el,
          ) as PdfBlueprint
          expect(blueprint.pages[0]).to.have.property(
            'orientation',
            ExportPdf().getOrientation(blueprint.pages[0].container),
          )
        })

        it(`should set the the page to 1`, () => {
          const el = createMockDOMNode(
            Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
          )
          const blueprint = ExportPdf().createBlueprint(
            'A4',
            el,
          ) as PdfBlueprint
          expect(blueprint.pages[0]).to.have.property('page', 1)
        })

        it.skip(`should set the currPageHeight to the height size of the content`, () => {
          const el = createMockDOMNode(
            Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
          )
          const blueprint = ExportPdf().createBlueprint('A4', el)
          console.dir(blueprint, { depth: 1 })
          console.log('total height: ' + ExportPdf().getTotalHeight(el)[0])

          // const blueprint = ExportPdf().createBlueprint(
          //   'A4',
          //   el,
          // ) as PdfBlueprint
          // console.log(blueprint.pages)

          // expect(blueprint.pages[0]).to.have.property('currPageHeight').to.eq(1)
        })

        it.skip(`should set the remaining to the remaining height at that current point in time`, () => {
          const el = createMockDOMNode(
            Cov19ResultsAndFluResultsReviewGeneratedData.elementTreeDimensions,
          )
          const blueprint = ExportPdf().createBlueprint(
            'A4',
            el,
          ) as PdfBlueprint
          expect(blueprint.pages[0]).to.have.property('remaining').to.eq(1)
        })
      })

      it(`should set the expected total of pages`, () => {
        //
      })

      xit(``, () => {
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
