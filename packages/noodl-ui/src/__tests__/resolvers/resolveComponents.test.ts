import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import sinon from 'sinon'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { waitFor } from '@testing-library/dom'
import { ComponentObject } from 'noodl-types'
import { ui } from '../../utils/test-utils'
import NUI from '../../noodl-ui'
import NUIPage from '../../Page'
import Viewport from '../../Viewport'
import * as c from '../../constants'

const getRoot = (args?: Record<string, any>) => ({
  Hello: { components: [mock.getButtonComponent()] },
  ...args,
})

const getPages = () => ['Hello', 'Cereal', 'SignIn']

async function resolveComponent(component: ComponentObject) {
  const pageName = 'Hello'
  const pageObject = { components: u.array(component) }
  NUI.use({
    getPages,
    getRoot: () => getRoot({ [pageName]: pageObject }),
    transaction: {
      [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () => pageObject,
    },
  })
  const page = NUI.createPage({
    name: pageName,
    viewport: { width: 375, height: 667 },
  })
  return NUI.resolveComponents({ components: component, page })
}

describe(coolGold(`resolveComponents (ComponentResolver)`), () => {
  it.only(`should call the callback on every resolved child in order of creation time`, async () => {
    const spy = sinon.spy((f) =>
      console.info(
        `[${f.type}] ${
          f.blueprint.viewTag || f.blueprint.dataKey || f.blueprint.contentType
        }`,
      ),
    )
    const listObject = [{ fruit: 'apple' }, { fruit: 'berry' }]
    const iteratorVar = 'itemObject'
    const pageObject = {
      components: [
        ui.view({
          children: [
            ui.label({ viewTag: 'labelTagAboveList' }),
            ui.list({
              iteratorVar,
              listObject,
              contentType: 'listObject',
              children: [
                ui.listItem({
                  viewTag: `listItemTag`,
                  [iteratorVar]: '',
                  children: [
                    ui.label({ dataKey: `${iteratorVar}.fruit` }),
                    ui.textField({
                      dataKey: `${iteratorVar}.fruit`,
                      placeholder: 'Edit fruit',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ui.button({ viewTag: 'submitTag', text: 'Submit' }),
        ui.button({ viewTag: 'closeTag', text: 'Close' }),
      ],
    }
    const HelloPg = NUI.getRoot().Hello
    NUI.use({ getRoot: () => ({ Hello: HelloPg, Sam: pageObject }) })
    const page = NUI.getRootPage()
    page.page = 'Sam'
    const components = await NUI.resolveComponents({
      components: pageObject.components,
      page,
      callback: spy,
    })
    await fs.writeJson('calls.json', spy.getCalls(), { spaces: 2 })
    const expectedCalls = [
      { type: 'view' },
      { type: 'label' },
      { type: 'list' },
      { type: 'listItem' },
      { type: 'label' },
      { type: 'textField' },
      { type: 'listItem' },
      { type: 'label' },
      { type: 'textField' },
      { type: 'button' },
      { type: 'button' },
    ]
    // console.info(spy.getCalls())
    expect(spy).to.have.property('callCount').to.eq(expectedCalls.length)
    expectedCalls.forEach((res) => {
      //
    })
  })

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
      async () => {
        const component = await resolveComponent(componentObject)
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
      async () => {
        const component = await resolveComponent(componentObject)
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

  describe(italic(`page`), () => {
    let componentObject: ReturnType<typeof ui.page>

    beforeEach(() => {
      componentObject = ui.page('Cereal')
    })

    async function resolveComponent(component: ComponentObject) {
      const pageObject = { components: u.array(component) }
      NUI.use({
        getPages,
        getRoot: () => getRoot({ Cereal: pageObject }),
        transaction: {
          [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () => pageObject,
        },
      })
      const page = NUI.createPage({
        name: 'Hello',
        viewport: { width: 375, height: 667 },
      })
      return NUI.resolveComponents({ components: component, page })
    }

    it(`should set "page" on the component that is an instance of NUIPage`, async () => {
      expect(
        (await resolveComponent(componentObject)).get('page'),
      ).to.be.instanceOf(NUIPage)
    })

    it(`should set its current page name to its "path" value`, async () => {
      expect((await resolveComponent(componentObject)).get('page').page).to.eq(
        'Cereal',
      )
    })

    it(`should have created its own Viewport inside the Page`, async () => {
      expect((await resolveComponent(componentObject)).get('page'))
        .to.have.property('viewport')
        .to.be.instanceOf(Viewport)
    })

    it(
      `should have set the Viewport's width/height as the same as the ` +
        `component if it was provided`,
      async () => {
        const component = await resolveComponent({
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
        const component = await resolveComponent({
          ...componentObject,
          style: {},
        })
        const page = component.get('page') as NUIPage
        const rootPage = NUI.getRootPage()
        expect(page.viewport.width).to.eq(rootPage.viewport.width)
        expect(page.viewport.height).to.eq(rootPage.viewport.height)
      },
    )

    it(`should rerun the fetch components function and emit PAGE_COMPONENTS with the new components when PAGE_CHANGED is emitted`, async () => {
      const dividerComponent = ui.divider({ id: 'divider' })
      const Cereal = {
        components: ui.page({ path: 'Hello', children: [ui.label('Hi all')] }),
      }
      const spy = sinon.spy()
      NUI.use({
        getRoot: () =>
          getRoot({ Cereal, Tiger: { components: [dividerComponent] } }),
        getPages: () => ['Cereal', 'Hello', 'Tiger'],
        transaction: {
          [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (p) =>
            p.page === 'Tiger' ? NUI.getRoot().Tiger : Cereal,
        },
      })
      const component = await NUI.resolveComponents(Cereal.components)
      expect(component.get('page')).to.be.instanceOf(NUIPage)
      const page = component.get('page') as NUIPage
      page?.on(c.nuiEvent.component.page.PAGE_CHANGED, spy)
      page.page = 'Tiger'
      page.emit(c.nuiEvent.component.page.PAGE_CHANGED)
      await waitFor(() => expect(spy).to.be.calledOnce)
      expect(component.get('page')).to.have.property('page', 'Tiger')
      expect(component.get('page'))
        .to.have.property('components')
        .to.deep.eq([dividerComponent])
    })

    describe(`when passing in remote urls (http**/*)`, () => {
      xit(``, () => {
        //
      })
    })
  })

  describe(italic(`plugin`), () => {
    it(
      `should emit the ${magenta(`content`)} event with the content when ` +
        `contents are fetched`,
      async () => {
        const component = await NUI.resolveComponents({
          components: ui.pluginBodyTail({ path: 'abc.html' }),
        })
        const spy = sinon.spy(async () => 'hello123')
        component.on('content', spy)
        await waitFor(() => {
          expect(spy).to.be.calledOnce
        })
      },
    )

    xit(`should set this "content" property with the data received as its value`, async () => {
      const component = await NUI.resolveComponents({
        components: ui.pluginHead({ path: 'abc.html' }),
      })
      const contents = 'hello123'
      global.fetch = (f) => f
      const spy = sinon.stub(global, 'fetch').returns(async () => contents)
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

  describe(italic(`textField`), () => {
    it(`should set the data-value from local root`, async () => {
      const pageObject = {
        formData: { password: 'mypassword' },
        components: [ui.textField('formData.password')],
      }
      NUI.use({ getRoot: () => ({ Hello: pageObject }) })
      const component = (await NUI.resolveComponents(pageObject.components))[0]
      const value = component.get('data-value')
      expect(value).to.eq(pageObject.formData.password)
    })
  })

  describe(italic(`textBoard`), () => {
    //
  })

  describe(italic(`contentType: timer`), () => {
    //
  })
})
