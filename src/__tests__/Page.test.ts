import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import sinon from 'sinon'
import chalk from 'chalk'
import Page, { IPage } from '../Page'
import { pageEvent, pageStatus } from '../constants'

let page: IPage

beforeEach(() => {
  page = new Page()
  page.clearCbs()
})

describe('Page', () => {
  describe('when instantiating', () => {
    it('should initialize the root node', () => {
      expect(page.rootNode).to.be.instanceOf(HTMLDivElement)
    })
  })

  describe(`when requesting the page to be changed`, () => {
    it(`should set ${chalk.yellow(
      'requesting',
    )} to the requesting page's name`, async () => {
      const spy = sinon.spy()
      page.on(
        pageStatus.NAVIGATING,
        () => page.getState().requesting === 'tree' && spy('tree'),
      )
      await page.requestPageChange('tree')
      await waitFor(() => expect(spy).to.have.been.calledWith('tree'))
    })

    it(`should not proceed if the user is already on the requested page`, () => {
      const spy = sinon.spy()
      const requestingPage = 'hello'
      page.setCurrentPage(requestingPage)
      page.on(pageEvent.ON_NAVIGATE_ABORT, spy)
      page.requestPageChange(requestingPage)
      expect(spy.args[0][0]).to.have.property('from').eq('requestPageChange')
    })

    it(`should always proceed if the requesting page is an HTTP link`, () => {
      const spy = sinon.spy()
      const requestingPage = 'https://google.com'
      page.setCurrentPage(requestingPage)
      page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
      page.requestPageChange(requestingPage)
      expect(spy).to.be.called
    })

    it(
      `should always proceed if the "force: modifier was set on the page's ` +
        `modifiers object`,
      async () => {
        const spy = sinon.spy()
        const requestingPage = 'hello'
        page.setCurrentPage(requestingPage)
        page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
        await page.requestPageChange(requestingPage)
        expect(spy).to.be.called
      },
    )
  })

  describe(`when retrieving a snapshot`, () => {
    it(`should return the expected props`, () => {
      page.setPreviousPage('tree').setCurrentPage('node')
      expect(page.snapshot()).to.include({
        status: pageStatus.IDLE,
        previous: 'tree',
        current: 'node',
        requesting: page.getState().requesting,
        rootNode: page.rootNode,
      })
    })
  })

  describe(`when rendering the page's components`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`"once" functions should be removed as soon as they are run`, () => {
    xit(``, () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      page.once(pageStatus.COMPONENTS_RENDERED, () => {})
    })
  })
})
