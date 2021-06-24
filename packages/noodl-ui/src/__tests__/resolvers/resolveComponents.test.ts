import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { waitFor } from '@testing-library/dom'
import { ComponentObject } from 'noodl-types'
import { nuiEmitTransaction } from '../../constants'
import NUI from '../../noodl-ui'
import NUIPage from '../../Page'
import Viewport from '../../Viewport'

function resolveComponent(component: ComponentObject) {
  const page = NUI.createPage({
    name: 'Hello',
    viewport: { width: 375, height: 667 },
  })
  return NUI.resolveComponents({ components: component, page })
}

describe(coolGold(`resolveComponents (ComponentResolver)`), () => {
  describe(italic(`list`), () => {
    let listObject: ReturnType<typeof mock.getGenderListObject>
    let componentObject: ReturnType<typeof mock.getListComponent>

    beforeEach(() => {
      listObject = mock.getGenderListObject()
      componentObject = mock.getListComponent({
        contentType: 'listObject',
        iteratorVar: 'cereal',
        listObject,
      })
    })

    it(
      `should generate the same amount of children as the length of ` +
        `its listObject`,
      () => {
        const component = resolveComponent(componentObject)
        expect(component)
          .to.have.property('children')
          .lengthOf(listObject.length)
      },
    )

    it(
      `should provide the dataObject to each listItem children by setting ` +
        `it as the value to a property that is taken from value of ${magenta(
          'iteratorVar',
        )}`,
      () => {
        const component = resolveComponent(componentObject)
        const iteratorVar = component.get('iteratorVar') || ''
        component
          .get('listObject')
          .forEach((dataObject: any, index: number) => {
            expect(component.child(index).props).to.have.property(
              iteratorVar,
              dataObject,
            )
          })
      },
    )
  })

  describe.only(italic(`page`), () => {
    let componentObject: ReturnType<typeof mock.getPageComponent>

    beforeEach(() => {
      componentObject = mock.getPageComponent('Cereal')
    })

    it(`should set "page" on the component that is an instance of NUIPage`, () => {
      expect(resolveComponent(componentObject).get('page')).to.be.instanceOf(
        NUIPage,
      )
    })

    it(`should set its current page name to its "path" value`, () => {
      expect(resolveComponent(componentObject).get('page').page).to.eq('Cereal')
    })

    it(`should have created its own Viewport inside the Page`, () => {
      expect(resolveComponent(componentObject).get('page'))
        .to.have.property('viewport')
        .to.be.instanceOf(Viewport)
    })

    it(
      `should have set the Viewport's width/height as the same as the ` +
        `component if it was provided`,
      () => {
        const component = resolveComponent({
          ...componentObject,
          style: { width: '0.2', height: '0.5', top: '0' },
        })
        const page = component.get('page') as NUIPage
        expect(page.viewport.width + 'px').to.eq(
          Number(
            Viewport.getSize(
              component.blueprint.style.width,
              NUI.getRootPage().viewport.width,
            ),
          ).toPrecision() + 'px',
        )
        expect(page.viewport.height + 'px').to.eq(
          Number(
            Viewport.getSize(
              component.blueprint.style.height,
              NUI.getRootPage().viewport.height,
            ),
          ).toPrecision() + 'px',
        )
      },
    )

    it(
      `should have set the Viewport's width/height to the root page's viewport's ` +
        `width/height if it was not provided`,
      async () => {
        const component = resolveComponent({ ...componentObject, style: {} })
        const page = component.get('page') as NUIPage
        const rootPage = NUI.getRootPage()
        expect(page.viewport.width).to.eq(rootPage.viewport.width)
        expect(page.viewport.height).to.eq(rootPage.viewport.height)
      },
    )

    it(
      `should emit the "page-components" hook after receiving the resolved ` +
        `components`,
      async () => {
        const spy = sinon.spy()
        const component = resolveComponent({ ...componentObject, style: {} })
        component.on('page-components', spy)
        await waitFor(() => expect(spy).to.be.calledOnce)
      },
    )
  })

  describe(italic(`plugin`), () => {
    it(
      `should emit the ${magenta(`content`)} event with the content when ` +
        `contents are fetched`,
      async () => {
        const component = NUI.resolveComponents({
          components: mock.getPluginBodyTailComponent({ path: 'abc.html' }),
        })
        const spy = sinon.spy(async () => 'hello123')
        component.on('content', spy)
        await waitFor(() => {
          expect(spy).to.be.calledOnce
        })
      },
    )

    xit(`should set this "content" property with the data received as its value`, async () => {
      const component = NUI.resolveComponents({
        components: mock.getPluginHeadComponent({ path: 'abc.html' }),
      })
      const contents = 'hello123'
      global.fetch = (f) => f
      const spy = sinon
        .stub(global, 'fetch')
        .returns(() => Promise.resolve(contents))
      global.fetch = spy
      component.on('content', spy)
      await waitFor(() => {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledWith(contents)
        // expect(spy
      })
    })
  })

  describe(italic(`register`), () => {
    //
  })

  describe(italic(`scrollView`), () => {
    //
  })

  describe(italic(`textBoard`), () => {
    //
  })

  describe(italic(`contentType: timer`), () => {
    //
  })
})
