import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import sinon from 'sinon'
import Page, { IPage } from '../Page'
import { pageEvent, pageStatus } from '../constants'
import { highlight, italic } from './helpers'

let page: IPage

beforeEach(() => {
  page = new Page()
})

afterEach(() => {
  page.clearCbs()
})

describe('Page', () => {
  describe('when instantiating', () => {
    it('should initialize the root node', () => {
      expect(page.rootNode).to.be.instanceOf(HTMLDivElement)
    })
  })

  describe(`when requesting the page to be changed`, () => {
    it(`should set ${highlight(
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

    it(`should always proceed if the requesting page is an ${italic(
      'http',
    )} link`, () => {
      const spy = sinon.spy()
      const requestingPage = 'https://google.com'
      page.setCurrentPage(requestingPage)
      page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
      page.requestPageChange(requestingPage)
      expect(spy).to.be.called
    })

    it(
      `should always proceed if the ${highlight(
        'force',
      )} modifier was set on the page's ` + `modifiers object`,
      async () => {
        const spy = sinon.spy()
        const requestingPage = 'hello'
        page.setCurrentPage(requestingPage)
        page.on(pageEvent.ON_COMPONENTS_RENDERED, spy)
        await page.requestPageChange(requestingPage, { force: true })
        expect(spy).to.be.calledOnce
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
    //
  })

  describe(`when running ${highlight('navigate')}`, () => {
    Object.values(pageEvent)
      .filter((event) =>
        [
          pageEvent.ON_NAVIGATE_START,
          pageEvent.ON_BEFORE_RENDER_COMPONENTS,
          pageEvent.ON_COMPONENTS_RENDERED,
        ].includes(event as any),
      )
      .forEach((event) => {
        it(`should only be called once for ${highlight(event)}`, async () => {
          const link = 'CreateNewAccount'
          const spy = sinon.spy()
          page.on(event, spy)
          await page.navigate(link)
          expect(spy).to.be.calledOnce
        })
      })
    describe(`when requesting outbound (http) links`, () => {
      it(
        `should emit ${highlight(
          pageEvent.ON_OUTBOUND_REDIRECT,
        )} if it is an ` + `${italic('http')} link`,
        async () => {
          const link = 'http://www.google.com'
          const spy = sinon.spy()
          page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
          await page.navigate(link)
          expect(spy).to.be.calledWith(link)
        },
      )

      it(
        `should ${italic('not')} emit ${highlight(
          pageEvent.ON_OUTBOUND_REDIRECT,
        )} if it is a not an ` + `${italic('http')} link`,
        async () => {
          const link = 'cookies.and.apples'
          const spy = sinon.spy()
          page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
          await page.navigate(link)
          expect(spy).not.to.be.called
        },
      )

      it(`should not proceed and should set the status back to ${highlight(
        pageStatus.IDLE,
      )}`, async () => {
        const link = 'http://asfa'
        const spy = sinon.spy()
        const spy2 = sinon.spy()
        page.on(pageEvent.ON_OUTBOUND_REDIRECT, spy)
        page.on(pageEvent.ON_NAVIGATE_START, spy2)
        await page.navigate(link)
        expect(spy).to.be.calledWith(link)
        expect(spy2).not.to.be.called
      })
    })
  })

  describe(`when the navigation has ended`, () => {
    it(
      `should set "previous" to the previously current page and set the ` +
        `"current" to the new page`,
      async () => {
        page.setPreviousPage('hello')
        page.setCurrentPage('cookie')
        await page.requestPageChange('apple')
        const state = page.getState()
        expect(state.previous).to.eq('cookie')
        expect(state.current).to.eq('apple')
      },
    )

    it(
      `should invoke observers registered to ` +
        `${highlight(pageEvent.ON_COMPONENTS_RENDERED)}`,
      async () => {
        const spy = sinon.spy()
        page.on(pageEvent.ON_BEFORE_RENDER_COMPONENTS, spy)
        await page.requestPageChange('apple')
        expect(spy).to.be.calledOnce
      },
    )
  })

  describe(`when registering "once" observers`, () => {
    it(`should only be called once`, async () => {
      const spy = sinon.spy()
      page.once(pageEvent.ON_BEFORE_RENDER_COMPONENTS, spy)
      await page.requestPageChange('apple')
      await page.requestPageChange('mount')
      await page.requestPageChange('everest')
      expect(spy).to.be.calledOnce
    })
  })
})
