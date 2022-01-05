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

function createMockDOMNode(pseudoElem) {
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
})
