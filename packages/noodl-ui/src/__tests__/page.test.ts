// Component type: page
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import {
  ComponentObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  PageComponentObject,
  ViewComponentObject,
} from 'noodl-types'
import chalk from 'chalk'
import sinon from 'sinon'
import { ComponentInstance, NOODLComponent } from '../types'
import { noodlui, createResolverTest } from '../utils/test-utils'
import { event as eventId } from '../constants'
import Component from '../components/Base'
import Resolver from '../Resolver'
import Viewport from '../Viewport'
import NOODLUI from '../noodl-ui'
import internalHandlePage from '../resolvers/_internal/handlePage'

let path = 'HelloPage' as const
let pageObject = {
  genders: [
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Other' },
  ],
}
let noodlComponent: PageComponentObject
let generatedComponents = [
  {
    type: 'view',
    children: [
      {
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: pageObject.genders,
        children: [
          { type: 'image', path: 'abc.png' } as ImageComponentObject,
          { type: 'label', dataKey: 'itemObject.key' } as LabelComponentObject,
        ],
      } as ListComponentObject,
    ],
  } as ViewComponentObject,
] as ComponentObject[]
let handlePage: ReturnType<typeof createResolverTest>

beforeEach(() => {
  noodlComponent = {
    type: 'page',
    path,
    style: { width: '0.2', height: '0.2', left: '0.2', top: '1' },
  } as PageComponentObject
  // TODO - Find out why our test this fails when we take async off
  // noodlui.on(eventId.NEW_PAGE_REF, async () => {})
  noodlui.setPage('Hello')
  noodlui.use({
    getRoot: () => ({
      Hello: {},
      [path]: { ...pageObject, components: generatedComponents },
    }),
    getPages: () => ['Hello', path],
  })
  handlePage = createResolverTest(internalHandlePage)
})

describe(`component: ${chalk.keyword('orange')('Page')}`, () => {
  describe.only(`references`, () => {
    xit(`assetsUrl should use the return value of the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`componentCache`, () => {
      //
    })

    xit(`createActionChainHandler should be the same as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`createPluginObject should be the same as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`createSrc should be the same as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getActionsContext should return the same props as the one in the root instance but "noodlui" should point to the page component`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getBaseStyles should be the same as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getContext should be the same as the one in the root instance but actionsContext and page should be the one in the page component`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getCbs should be the same as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getPageObject should return the page object from root intance but the page should be the page set on the page component`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getConsumerOptions`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getResolvers`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getState`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getStateHelpers`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getStateGetters`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`getStateSetters`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`page should be different than the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`plugins`, () => {
      //
    })

    xit(`root should return the same root object as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`setPage`, () => {
      //
    })
    xit(`setPlugin`, () => {
      //
    })

    xit(`setViewport`, () => {
      //
    })

    xit(`viewport should be different than the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`resolveComponents should be the same reference as the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`____ from resolveComponents args should point to the one in the page component`, () => {
      const component = handlePage(noodlComponent)
    })
    xit(`use`, () => {
      //
    })
    xit(`unuse`, () => {
      //
    })
  })

  describe('behavior', () => {
    xit(`constructor`, () => {
      //
    })
  })

  it(
    `should get the children in the root object by using the path (page) ` +
      ` as the key`,
    async () => {
      const spy = sinon.spy()
      const component = noodlui.resolveComponents(noodlComponent)
      component.on(eventId.component.page.COMPONENTS_RECEIVED, spy)
      await waitFor(() => {
        expect(spy).to.be.called
        expect(spy).to.be.calledWith(generatedComponents)
      })
    },
  )

  it(`should resolve the children using the children it grabbed from the root object`, async () => {
    const spy = sinon.spy()
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.RESOLVED_COMPONENTS, spy)
    await waitFor(() => {
      expect(spy).to.be.called
      const args = spy.args[0][0]
      expect(args).to.include.members(component.children())
    })
  })

  it(
    `should emit ${chalk.magenta(
      eventId.component.page.SET_REF,
    )} after the ${chalk.magenta(eventId.NEW_PAGE_REF)} listeners ` +
      `were processed`,
    async () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      noodlui.on(eventId.NEW_PAGE_REF, spy)
      const component = noodlui.resolveComponents(noodlComponent)
      component.on(eventId.component.page.SET_REF, spy2)
      await waitFor(() => {
        expect(spy).to.be.calledBefore(spy2)
      })
    },
  )

  it(`should pass the ref to the new noodl-ui instance to ${chalk.magenta(
    eventId.NEW_PAGE_REF,
  )} and ${chalk.magenta(
    eventId.component.page.SET_REF,
  )} listeners`, async () => {
    const spy = sinon.spy()
    noodlui.on(eventId.NEW_PAGE_REF, spy)
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.SET_REF, spy)
    await waitFor(() => {
      expect(spy.firstCall.args[0]).to.not.eq(noodlui)
      expect(spy.firstCall.args[0]).to.eq(component.get('ref'))
      expect(spy.secondCall.args[0]).to.eq(component.get('ref'))
      expect(spy.secondCall.args[0]).to.eq(spy.firstCall.args[0])
      expect(component.get('ref')).to.be.instanceOf(NOODLUI)
    })
  })

  it(`should create a new and isolated viewport from the main viewport`, () => {
    const component = noodlui.resolveComponents(noodlComponent)
    const mainViewport = noodlui.viewport
    const refViewport = component.get('ref').viewport
    expect(mainViewport).to.be.instanceOf(Viewport)
    expect(refViewport).to.be.instanceOf(Viewport)
    expect(mainViewport).to.not.eq(refViewport)
  })

  it(
    `should set the width/height of the ref viewport using the page ` +
      `component's width/height`,
    () => {
      const component = noodlui.resolveComponents(noodlComponent)
      const refViewport = component.get('ref').viewport
      expect(refViewport.width).to.eq(
        Number(component.style.width?.replace('px', '')),
      )
      expect(refViewport.height).to.eq(
        Number(component.style.height?.replace('px', '')),
      )
    },
  )

  it(
    `should set the width/height of the ref viewport using the main viewport's ` +
      `width/height if there is no width and height on the component `,
    () => {
      delete noodlComponent.style?.width
      delete noodlComponent.style?.height
      const component = noodlui.resolveComponents(noodlComponent)
      const mainViewport = noodlui.viewport
      const refViewport = component.get('ref').viewport
      expect(refViewport.width).to.eq(mainViewport.width)
      expect(refViewport.height).to.eq(mainViewport.height)
    },
  )

  it(`should set the page on the ref to the "path" set on the page component`, () => {
    const component = noodlui.resolveComponents(noodlComponent)
    expect(component.get('ref')).to.have.property('page').eq(path)
  })

  describe(`actionsContext`, () => {
    describe(`actionsContext.noodlui`, () => {
      it(`should point to the new ref instance instead of the root instance`, () => {
        const component = noodlui.resolveComponents(noodlComponent)
        const ref = component.get('ref') as NOODLUI
        expect(ref).to.be.instanceOf(NOODLUI)
        expect(ref.actionsContext.noodlui).instanceOf(NOODLUI)
        // expect(ref.actionsContext.noodlui).not.to.eq(noodlui)
        // expect(ref.actionsContext.noodlui).to.eq(ref)
      })
    })

    describe(`actionsContext [other arbitrary props]`, () => {
      it(`should be reusing other actionsContext props from the root instance`, () => {
        const spy = sinon.spy()
        const s = { yes: 'no' }
        noodlui.use({ actionsContext: { spy } })
        noodlui.use({ actionsContext: { s } })
        const component = noodlui.resolveComponents(noodlComponent)
        const ref = component.get('ref') as NOODLUI
        expect(ref.actionsContext).to.have.property('spy').eq(spy)
        expect(ref.actionsContext).to.have.property('s').eq(s)
      })
    })

    xit(
      `should ensure the "noodl-ui" property in the ref points to it self and not the ` +
        `parent, while other properties should stay the same as the ones in the parent`,
      () => {
        const component = noodlui.resolveComponents(noodlComponent)
        expect()
      },
    )
  })

  xit(
    `should receive sandboxed noodl-ui ref as the noodl-ui instance in ` +
      `action/builtIn callbacks`,
    () => {
      const spy = sinon.spy()
      noodlui.on(eventId.NEW_PAGE_REF, spy)
      const component = noodlui.resolveComponents(noodlComponent)
      component.on(eventId.component.page.SET_REF, spy)
    },
  )
})
