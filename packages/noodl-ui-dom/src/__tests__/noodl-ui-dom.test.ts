import * as mock from 'noodl-ui-test-utils'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import {
  flatten,
  isComponent,
  NOODLUI as NUI,
  nuiEmitTransaction,
} from 'noodl-ui'
import { coolGold, italic } from 'noodl-common'
import { getByDataGlobalId } from '../utils'
import { ndom, createRender } from '../test-utils'
import * as c from '../constants'

describe(coolGold(`noodl-ui-dom`), () => {
  describe(italic(`Instantiating`), () => {
    xit(`should load up the styles resolver`, () => {
      //
    })
  })

  describe(italic(`clearRootNode`), () => {
    it(`should not remove nodes associated with global components`, async () => {
      const globalPopUpComponent = mock.getPopUpComponent({
        popUpView: 'cerealView',
        global: true,
      })
      const { page, ndom, request } = createRender({
        pageName: 'Hello',
        pageObject: {
          components: [
            mock.getSelectComponent(),
            mock.getButtonComponent(),
            globalPopUpComponent,
          ],
        },
      })
      const req = await request('')
      const components = req?.render()
      const component = components?.[2]
      const node = getByDataGlobalId(component?.get('globalId'))
      expect(document.body.contains(node)).to.be.true
      // expect(page.rootNode.children).to.have.lengthOf(2)
      // page.clearRootNode()
      // expect(page.rootNode.children).to.have.lengthOf(0)
      // expect(document.body.contains(node)).to.be.true
      // expect(document.body.children.length).to.eq(2)
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

  describe.only(italic(`draw`), () => {
    it(`should have all components in the component cache`, async () => {
      const rawComponents = [
        mock.getListComponent({
          children: [
            mock.getListItemComponent({
              children: [
                mock.getLabelComponent({ text: 'red' }),
                mock.getTextFieldComponent(),
                mock.getLabelComponent({ text: 'blue' }),
              ],
            }),
          ],
        }),
      ]
      const { ndom, request } = createRender({ components: rawComponents })
      const req = await request('Cereal')
      const flattened = flatten(req?.render()[0])
      flattened.forEach((c) => expect(ndom.cache.component.has(c)).to.be.true)
    })

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
          const component = req?.render()[0]
          const globalId = component?.get('globalId')
          const globalItem = ndom.global.components[globalId]
          expect(globalId).to.exist
          expect(globalItem).to.exist
          expect(globalItem).to.have.property('globalId', globalId)
          expect(globalItem).to.have.property('componentId', component?.id)
          expect(globalItem).to.have.property('pageId', page.id)
          expect(globalItem).to.have.property('node').instanceOf(HTMLElement)
        },
      )

      describe(
        `when encountering an equivalent or structurally equivalent ` +
          `component with global: true `,
        () => {
          it(
            `should update existing values in the global object it if ` +
              `this object was previously added but not replace the node`,
            async () => {
              const globalPopUpComponent = mock.getPopUpComponent({
                popUpView: 'cerealView',
                global: true,
              })
              const pageName = 'Hello'
              const { page, ndom } = createRender({
                pageName,
                pageObject: {
                  components: [
                    mock.getSelectComponent(),
                    mock.getButtonComponent(),
                    globalPopUpComponent,
                  ],
                },
              })
              let req = await ndom.request(page)
              req?.render()
              const nodes = document.getElementsByClassName('popup')
              const node = nodes[0] as HTMLElement
              expect(document.body.contains(node)).to.be.true
              expect(document.getElementsByClassName('popup')).to.have.lengthOf(
                1,
              )
              ndom.cache.component.get(node.id)
              page.components = [{ ...globalPopUpComponent }]
              req = await ndom.request(page, 'Cereal')
              req?.render()
              expect(document.body.contains(node)).to.be.true
              expect(document.getElementsByClassName('popup')).to.have.lengthOf(
                1,
              )
            },
          )
        },
      )
    })
  })

  describe(italic(`request`), () => {
    xit(
      `should throw if the ${nuiEmitTransaction.REQUEST_PAGE_OBJECT} transaction ` +
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

  describe.only(italic(`redraw`), () => {
    it(`should delete all components involved in the redraw from the component cache`, async () => {
      const rawComponents = [
        mock.getListComponent({
          children: [
            mock.getListItemComponent({
              children: [
                mock.getLabelComponent({ text: 'red' }),
                mock.getTextFieldComponent(),
                mock.getLabelComponent({ text: 'blue' }),
              ],
            }),
          ],
        }),
      ]
      const { getPageObject, ndom, page, request, render } = createRender({
        components: rawComponents,
      })
      page.components = rawComponents
      const req = await request('Hat')
      const list = req?.render()?.[0]
      const listItem = list?.child()
      const label1 = listItem?.child()
      const textField = listItem?.child(1)
      const label2 = listItem?.child(2)
      const components = [list, listItem, label1, textField, label2]
      components.forEach((c) => {
        expect(ndom.cache.component.has(c as any)).to.be.true
      })
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

    it(`should not remove components with global: true`, async () => {
      const { page, ndom } = createRender({
        pageObject: {
          formData: { password: 'hello123' },
          components: [
            mock.getButtonComponent(),
            mock.getTextFieldComponent(),
            mock.getSelectComponent(),
            mock.getVideoComponent({ global: true }),
          ],
        },
      })
      const req = await ndom.request(page)
      req?.render()
    })
  })

  describe(italic(`transact`), () => {
    it(
      `should be able to pull/call transactions that were stored ` +
        `inside noodl-ui`,
      async () => {
        const components = [
          mock.getButtonComponent(),
          mock.getTextFieldComponent(),
          mock.getSelectComponent(),
          mock.getVideoComponent({ global: true }),
        ]
        const { page, ndom } = createRender({
          pageObject: {
            formData: { password: 'hello123' },
            components,
          },
        })
        const pageObject = await ndom.transact(
          nuiEmitTransaction.REQUEST_PAGE_OBJECT,
          page,
        )
        expect(pageObject?.components).to.eq(components)
      },
    )

    xit(
      `should throw if ${nuiEmitTransaction.REQUEST_PAGE_OBJECT} is ` +
        `missing a transaction when being requested`,
      () => {
        //
      },
    )
  })
})
