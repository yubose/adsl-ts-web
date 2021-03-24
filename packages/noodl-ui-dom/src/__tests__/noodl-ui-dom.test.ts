import * as mock from 'noodl-ui-test-utils'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { ComponentObject, PageObject } from 'noodl-types'
import { createComponent, event as nuiEvent, NOODLUI as NUI } from 'noodl-ui'
import { coolGold, italic, magenta } from 'noodl-common'
import { getShape, getShapeKeys } from '../utils'
import { ndom, mockDraw } from '../test-utils'
import NOODLDOM from '../noodl-ui-dom'
import NOODLDOMPage from '../Page'

describe(coolGold(`noodl-ui-dom`), () => {
  describe(`Instantiating`, () => {
    xit(`should load up the styles resolver`, () => {
      //
    })
  })

  describe.only(italic(`createPage`), () => {
    it(`should set the base/main "page" property if it is empty`, () => {
      ndom.reset()
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage()
      expect(ndom.page).to.eq(page)
    })

    it(`should also add this to its object of pages in the global store`, () => {
      ndom.reset()
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage()
      expect(ndom.global.pages[page.id]).to.exist
    })

    it(`should set the default page name if given`, () => {
      ndom.reset()
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
          ndom.reset()
          const nuiPage = NUI.createPage()
          const ndomPage = ndom.createPage(nuiPage)
          expect(ndomPage.isEqual(ndom.createPage(nuiPage))).to.be.true
        },
      )
    })
  })

  describe(italic(`draw`), () => {
    describe(`when drawing components with global: true`, () => {
      it.only(
        `should create a global object to the middleware store ` +
          `using globalId as the key`,
        async () => {
          const pageName = 'Hello'
          const { requestPageChange } = mockDraw({
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
          const component = await requestPageChange()
          console.info(component)
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

  describe(italic(`render`), () => {
    xit(`should render noodl components to the DOM`, () => {
      ndom.reset()
      const page = ndom.createPage()
      const result = ndom.render(page)
    })
  })

  describe(italic(`getShape`), () => {
    let dataKey: string
    let iteratorVar: string
    let listObject: any[]
    let listId: string
    let noodlComponent: ComponentObject
    let path: any

    beforeEach(() => {
      dataKey = 'formData.password'
      iteratorVar = 'hello'
      listObject = [
        { fruit: 'apple' },
        { fruit: 'banana' },
        { fruit: 'orange' },
      ]
      listId = 'mylistid123'
      path = { emit: { dataKey: { var1: 'hello' }, actions: [{}, {}, {}] } }
      noodlComponent = {
        type: 'label',
        contentType: 'number',
        'data-key': dataKey,
        'data-value': 'mypassword',
        'data-listid': listId,
        'data-ux': 'genderTag',
        'data-name': 'password',
        dataKey,
        listObject,
        iteratorVar,
        placeholder: 'You do not have a password yet',
        required: 'true',
        style: {
          fontSize: '14',
          top: '0',
          left: '0.1',
          color: '0x000000',
        },
        text: 'mytext',
        viewTag: 'genderTag',
        children: [
          { type: 'label', text: 'hi', style: {} },
          { type: 'button', path: 'abc.png' },
        ],
      }
    })

    it('should return an object with properties only in the shapeKeys list', () => {
      const component = createComponent(noodlComponent)
      const shape = getShape(component)
      const shapeKeys = getShapeKeys()
      const shapeKeysResults = Object.keys(shape)
      shapeKeysResults.forEach((keyResult) => {
        expect(shapeKeys.includes(keyResult)).to.be.true
      })
    })

    it(
      'should return the default expected base shape for components ' +
        'that have them (ComponentObject properties)',
      () => {
        const component = createComponent(noodlComponent)
        const shape = getShape(component)
        const shapeKeys = getShapeKeys()
        Object.keys(noodlComponent).forEach((key) =>
          !shapeKeys.includes(key) ? delete noodlComponent[key] : undefined,
        )
        Object.keys(noodlComponent).forEach((k) => {
          expect(noodlComponent[k]).to.deep.eq(shape[k])
          delete shape[k]
        })
        expect(Object.keys(shape)).to.have.lengthOf(0)
      },
    )
  })
})
