import * as mock from 'noodl-ui-test-utils'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { ComponentObject, PageObject } from 'noodl-types'
import { createComponent, event as nuiEvent, NOODLUI as NUI } from 'noodl-ui'
import { coolGold, italic, magenta } from 'noodl-common'
import { getShape, getShapeKeys } from '../utils'
import { ndom, createRender } from '../test-utils'
import NOODLDOM from '../noodl-ui-dom'
import NOODLDOMPage from '../Page'
import * as c from '../constants'

describe(coolGold(`noodl-ui-dom`), () => {
  describe(italic(`Instantiating`), () => {
    xit(`should load up the styles resolver`, () => {
      //
    })
  })

  describe(italic(`createPage`), () => {
    it(`should set the base/main "page" property if it is empty`, () => {
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage()
      expect(ndom.page).to.eq(page)
    })

    it(`should also add this to its object of pages in the global store`, () => {
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage()
      expect(ndom.global.pages[page.id]).to.exist
    })

    it(`should set the default page name if given`, () => {
      const pageName = 'Water'
      let page = ndom.createPage(pageName)
      expect(page.page).to.eq(pageName)
      page = ndom.createPage({ name: pageName })
      expect(page.page).to.eq(pageName)
      page = ndom.createPage({ page: NUI.createPage({ name: pageName }) })
      expect(page.page).to.eq(pageName)
    })

    describe(`when passing a NUIPage instance`, () => {
      it(
        `should not create a new NOODLDOMPage instance if it already ` +
          `exists, and returns that instance instead`,
        () => {
          const nuiPage = NUI.createPage()
          const ndomPage = ndom.createPage(nuiPage)
          expect(ndomPage.isEqual(ndom.createPage(nuiPage))).to.be.true
        },
      )
    })
  })

  describe(italic(`draw`), () => {
    describe(`when drawing components with global: true`, () => {
      it(
        `should create a global object to the middleware store ` +
          `using globalId as the key`,
        async () => {
          const pageName = 'Hello'
          const { page, ndom } = createRender({
            pageName,
            pageObject: {
              components: [
                mock.getPopUpComponent({
                  popUpView: 'cerealView',
                  global: true,
                }),
              ],
            },
          })
          const req = await ndom.request(page)
          await req.navigate()
          const component = req.render()[0]
          const globalId = component.get('globalId')
          const globalItem = ndom.global.components[globalId]
          expect(globalId).to.exist
          expect(globalItem).to.exist
          expect(globalItem).to.have.property('globalId', globalId)
          expect(globalItem).to.have.property('componentId', component.id)
          expect(globalItem).to.have.property('pageId', page.id)
          expect(globalItem).to.have.property('node').instanceOf(HTMLElement)
        },
      )

      describe(
        `when a structurally equivalent component with global: true ` +
          `is encountered in draw`,
        () => {
          xit(``, () => {
            //
          })
        },
      )
    })
  })

  describe.only(italic(`request`), () => {
    it(
      `should throw if the ${c.transaction.GET_PAGE_OBJECT} transaction ` +
        `doesn't exist`,
      () => {
        const { page, ndom } = createRender({
          components: mock.getTextFieldComponent(),
        })
        ndom.reset('transactions')
        return expect(ndom.request(page)).to.eventually.be.rejectedWith(
          /transaction/i,
        )
      },
    )

    it(`should set the page object's components to the page instance`, async () => {
      const { page, pageObject, ndom } = createRender({
        components: [mock.getPopUpComponent()],
      })
      expect(page.components).to.have.lengthOf(0)
      await ndom.request(page)
      expect(page.components).to.have.length.greaterThan(0)
      expect(page.components).to.eq(pageObject?.components)
    })

    it(`should update the previous/page/requesting state correctly`, async () => {
      const pageName = 'Hello'
      const newPage = 'Cereal'
      const { page, ndom } = createRender({
        pageName,
        components: [mock.getPopUpComponent()],
      })
      expect(page.previous).to.eq('')
      expect(page.requesting).to.eq(pageName)
      expect(page.page).to.eq('')
      page.page = newPage
      expect(page.page).to.eq(newPage)
      await ndom.request(page)
      expect(page.previous).to.eq(newPage)
      expect(page.requesting).to.eq('')
      expect(page.page).to.eq(pageName)
    })
  })

  describe(italic(`render`), () => {
    it(`should render noodl components to the DOM`, async () => {
      const { page } = createRender({
        pageObject: {
          formData: { password: 'hello123' },
          components: [
            mock.getButtonComponent(),
            mock.getTextFieldComponent(),
            mock.getSelectComponent(),
            mock.getVideoComponent(),
          ],
        },
      })
      await ndom.request(page)
      const elemTypes = ['input', 'button', 'select', 'video']
      elemTypes.forEach((t) => {
        expect(document.getElementsByTagName(t)[0]).not.to.exist
      })
      ndom.render(page)
      elemTypes.forEach((t) => {
        expect(document.getElementsByTagName(t)[0]).to.exist
      })
      elemTypes.forEach((t) => {
        expect(document.body.contains(document.getElementsByTagName(t)[0])).to
          .exist
      })
    })
  })
})
