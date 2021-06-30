import * as mock from 'noodl-ui-test-utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { flatten, NUI, nuiEmitTransaction } from 'noodl-ui'
import { coolGold, italic, magenta } from 'noodl-common'
import { getFirstByGlobalId } from '../utils'
import {
  ndom,
  createRender,
  createMockCssResource,
  createMockJsResource,
} from '../test-utils'
import {
  GlobalComponentRecord,
  GlobalCssResourceRecord,
  GlobalJsResourceRecord,
} from '../global'

describe(coolGold(`noodl-ui-dom`), () => {
  describe(italic(`createGlobalRecord`), () => {
    it(`should add the GlobalComponentRecord to the global store`, async () => {
      const { render } = createRender({
        components: [mock.getPopUpComponent({ global: true })],
      })
      const component = await render()
      const globalId = component.get('data-globalid')
      expect(ndom.global.components.has(globalId)).to.be.true
      expect(ndom.global.components.get(globalId)).to.be.instanceOf(
        GlobalComponentRecord,
      )
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

    describe(`when passing a NUIPage instance`, () => {
      it(
        `should not create a new NOODLDOMPage instance if it already ` +
          `exists, and returns that instance instead`,
        () => {
          const nuiPage = NUI.createPage()
          const ndomPage = ndom.createPage(nuiPage)
          const anotherNdomPage = ndom.createPage(nuiPage) as any
          expect(ndomPage === anotherNdomPage).to.be.true
        },
      )
    })
  })

  describe(italic(`draw`), () => {
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
        `should create a global component object to the global store if it ` +
          `doesn't exist`,
        async () => {
          const pageName = 'Hello'
          const popUpComponentObj = mock.getPopUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const { page, ndom, render } = createRender({
            pageName,
            components: [popUpComponentObj],
          })
          const component = await render()
          const globalId = component?.get('data-globalid')
          const globalObj = ndom.global.components.get(globalId)
          expect(globalId).to.exist
          expect(globalObj).to.exist
          expect(globalObj).to.have.property('globalId', globalId)
          expect(globalObj).to.have.property('componentId', component.id)
          expect(globalObj).to.have.property('pageId', page.id)
          expect(globalObj).to.have.property(
            'nodeId',
            getFirstByGlobalId(globalId).id,
          )
        },
      )

      xit(
        `should replace the previous nodeId with the new one if the new ` +
          `node is referencing the same global id`,
        async () => {
          const { ndom, render } = createRender({
            pageName: 'Abc',
            components: [
              mock.getPopUpComponent({
                popUpView: 'cerealView',
                global: true,
              }),
            ],
          })
          let component = await render()
          const globalId = component.get('data-globalid')
          const prevNode = getFirstByGlobalId(globalId)
          const globalObject = ndom.global.components.get(
            globalId,
          ) as GlobalComponentRecord
          expect(globalObject.nodeId).to.eq(prevNode.id)
          component = await render('Hello')
          await waitFor(() => {
            const newNode = getFirstByGlobalId(`cerealView`)
            expect(globalObject.nodeId).not.to.eq(prevNode.id)
            expect(globalObject.nodeId).to.eq(newNode.id)
          })
        },
      )

      describe(`when the globalId already exists in the global component store`, () => {
        xit(
          `should replace the previous componentId with the new one if the new ` +
            `component is referencing the same global id`,
          async () => {
            //
          },
        )
      })

      xit(
        `should update the componentId and nodeId in the global object it if ` +
          `drawing the same global component`,
        async () => {
          const globalPopUpComponent = mock.getPopUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const pageName = 'Hello'
          const { page, ndom, request, render } = createRender({
            pageName,
            pageObject: {
              components: [
                mock.getSelectComponent(),
                mock.getButtonComponent(),
                globalPopUpComponent,
              ],
            },
          })
          const req = await request()
          const [select, button, popUp] = req.render()
          const globalPopUpNode = getFirstByGlobalId('cerealView')
          const globalRecord = ndom.global.components.get('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.true
          expect(globalRecord).to.have.property('componentId', popUp.id)
          expect(globalRecord).to.have.property('nodeId', globalPopUpNode.id)
          page.components = [
            mock.getPopUpComponent({
              popUpView: 'cerealView',
              global: true,
            }),
          ]
          const newPopUp = await render()
          const newPopUpNode = getFirstByGlobalId('cerealView')
          expect(globalRecord).to.have.property('componentId').not.eq(popUp.id)
          expect(globalRecord)
            .to.have.property('nodeId')
            .not.eq(globalPopUpNode.id)
          expect(globalRecord).to.have.property('componentId').eq(newPopUp.id)
        },
      )

      xit(
        `should remove the old nodes/components from the DOM/cache and replace ` +
          `them with the new one if encountering the same global component object`,
        async () => {
          const globalPopUpComponent = mock.getPopUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const pageName = 'Hello'
          const { page, ndom, request, render } = createRender({
            pageName,
            pageObject: {
              components: [
                mock.getSelectComponent(),
                mock.getButtonComponent(),
                globalPopUpComponent,
              ],
            },
          })
          const req = await request()
          const [select, button, popUp] = req.render()
          const globalPopUpNode = getFirstByGlobalId('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.true
          expect(ndom.cache.component.has(popUp)).to.be.true
          page.components = [
            mock.getPopUpComponent({
              popUpView: 'cerealView',
              global: true,
            }),
          ]
          const newPopUp = await render()
          const newPopUpNode = getFirstByGlobalId('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.false
          expect(ndom.cache.component.has(popUp)).to.be.false
          expect(document.body.contains(newPopUpNode)).to.be.true
          expect(ndom.cache.component.has(newPopUp)).to.be.true
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

  describe(italic(`redraw`), () => {
    xit(`should delete all components involved in the redraw from the component cache`, async () => {
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
      const { render } = createRender({
        components: [
          mock.getButtonComponent(),
          mock.getTextFieldComponent(),
          mock.getSelectComponent(),
          mock.getVideoComponent(),
        ],
      })
      const elemTypes = ['input', 'button', 'select', 'video']
      elemTypes.forEach((t) => {
        expect(document.getElementsByTagName(t)[0]).not.to.exist
      })
      await render()
      await waitFor(() => {
        elemTypes.forEach((t) => {
          expect(document.body.contains(document.getElementsByTagName(t)[0])).to
            .be.true
        })
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

  describe(italic(`use`), () => {
    describe(`resource`, () => {
      let cssResource = createMockCssResource()
      let jsResource = createMockJsResource()

      const getMockGlobalCssNode = (queryType?: 'all') => {
        const selector = `link[href="${cssResource.href}"]`
        if (queryType === 'all') return document.head.querySelectorAll(selector)
        return document.head.querySelector(selector)
      }

      const getMockGlobalJsNode = (queryType?: 'all') => {
        const selector = `script[src="${jsResource.src}"]`
        if (queryType === 'all') return document.body.querySelectorAll(selector)
        return document.body.querySelector(selector)
      }

      beforeEach(() => {
        cssResource = createMockCssResource()
        jsResource = createMockJsResource()
      })

      describe(italic(`remote resources`), () => {
        it(`should load the resource(s) to the global map`, () => {
          ndom.use({ resource: [cssResource, jsResource] })
          console.info(cssResource)
          console.info(jsResource)
          expect(ndom.global.resources.css).to.have.property(cssResource.href)
          expect(ndom.global.resources.js).to.have.property(jsResource.src)
        })

        xit(`should load global resources to the DOM when calling render`, async () => {
          const { render } = createRender({
            pageName: 'Hello',
            components: [mock.getButtonComponent()],
            resource: [cssResource, jsResource],
          })
          expect(getMockGlobalCssNode()).to.be.null
          expect(getMockGlobalJsNode()).to.be.null
          await render()
          await waitFor(() => {
            expect(document.head.children).to.have.length.greaterThan(0)
            expect(getMockGlobalCssNode()).not.to.be.null
            expect(getMockGlobalJsNode()).not.to.be.null
          })
        })

        xit(`should not load scripts twice`, async () => {
          const { render } = createRender({
            components: [mock.getVideoComponent()],
            resource: [cssResource, jsResource],
          })
          expect(getMockGlobalCssNode()).to.be.null
          expect(getMockGlobalJsNode()).to.be.null
          await render()
          await waitFor(() => {
            expect(getMockGlobalCssNode('all'))
              .to.have.property('length')
              .to.eq(1)
            expect(getMockGlobalJsNode('all'))
              .to.have.property('length')
              .to.eq(1)
          })
        })

        xit(`should not create duplicate elements that have the same script`, () => {
          //
        })

        xit(`should be able to render elements to the DOM after loading their resource(s)`, () => {
          //
        })
      })
    })
  })
})
