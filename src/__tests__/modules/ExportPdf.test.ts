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

  describe(`PatientChart page`, () => {
    const { A4 } = ExportPdf().sizes
    const elBoundingClientRect = {
      x: 0,
      y: 74.6875,
      width: 373.5,
      height: 620,
      top: 74.6875,
      right: 373.5,
      bottom: 694.6875,
      left: 0,
    }
    // Total pages = Total height / A4 height = 3.709675623515439
    const format = [595, 842] // [A4.width, A4.height]
    const orientation = 'portrait'
    const imageSize = { width: 373.5, height: 620 }
    const outerStartY = 74.6875
    const totalWidth = 373.5
    const totalHeight = 3123.546875
    const viewport = { width: 373.5, height: 747 }
    const totalPages = Math.ceil(totalHeight / A4.height)

    xit(``, () => {})
  })
})
