// Component type: page
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import isEqual from 'lodash/isEqual'
import {
  ComponentObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  PageComponentObject,
  ViewComponentObject,
} from 'noodl-types'
import _internalResolver from '../resolvers/_internal'
import chalk from 'chalk'
import sinon from 'sinon'
import { StoreActionObject, StoreBuiltInObject } from '../types'
import { noodlui, createResolverTest } from '../utils/test-utils'
import { event as eventId } from '../constants'
import Resolver from '../Resolver'
import Viewport from '../Viewport'
import NOODLUI from '../noodl-ui'
import internalHandlePage from '../resolvers/_internal/handlePage'
import getStore from '../store'
import List from '../components/List'
import Page from '../components/Page'
import createComponent from '../utils/createComponent'

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
    style: { width: '1', height: '1', left: '0', top: '0' },
    children: [
      {
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: pageObject.genders,
        children: [
          {
            type: 'listItem',
            children: [
              { type: 'image', path: 'abc.png' } as ImageComponentObject,
              {
                type: 'label',
                dataKey: 'itemObject.key',
              } as LabelComponentObject,
            ],
          },
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
    style: { width: '0.5', height: '0.5', left: '0.2', top: '1' },
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
  describe(`references`, () => {
    describe(`actionsContext`, () => {
      it(`should inherit the props from the root instance`, () => {
        const spy = sinon.spy()
        const hello = {}
        noodlui.use({ actionsContext: { spy, hello } })
        const component = noodlui.resolveComponents(noodlComponent) as Page
        expect(noodlui.actionsContext.spy).to.eq(component.actionsContext.spy)
        expect(noodlui.actionsContext.hello).to.eq(
          component.actionsContext.hello,
        )
      })
    })

    describe(`assetsUrl`, () => {
      it('should initialize to the current value of the assetsUrl in the root instance', () => {
        const component = handlePage(noodlComponent)
        expect(noodlui.assetsUrl).to.eq(component.assetsUrl)
      })
      it(`should use its own getter onwards`, () => {
        const component = handlePage(noodlComponent)
        component.assetsUrl = 'abc'
        expect(noodlui.assetsUrl).not.to.eq(component.assetsUrl)
      })
    })

    describe(`componentCache`, () => {
      it(`should be pointing to the same resources as the componentCache one in the root instance`, () => {
        const component = handlePage(noodlComponent)
        expect(noodlui.componentCache().state()).to.eq(
          component.componentCache().state(),
        )
      })
    })

    it(`page should be different than the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
      expect(component.page).not.to.eq(noodlui.page)
    })

    it(`root should return the same root object as the one in the root instance`, () => {
      const component = noodlui.resolveComponents(noodlComponent) as Page
      expect(isEqual(component.getRoot(), noodlui.root))
    })

    it(`viewport should be different than the one in the root instance`, () => {
      const component = handlePage(noodlComponent)
      expect(component.viewport).not.to.eq(noodlui.viewport)
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
      expect(args).to.include.members(component.children)
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

  it(`should pass the page component to the ${chalk.magenta(
    eventId.NEW_PAGE_REF,
  )} listener`, async () => {
    const spy = sinon.spy()
    noodlui.on(eventId.NEW_PAGE_REF, spy)
    const component = noodlui.resolveComponents(noodlComponent) as Page
    await waitFor(() => {
      expect(spy.firstCall.args[0]).to.not.eq(noodlui)
      expect(spy.firstCall.args[0]).to.eq(component)
    })
  })

  it(`should create a new and isolated viewport from the main viewport`, () => {
    const component = noodlui.resolveComponents(noodlComponent) as Page
    const mainViewport = noodlui.viewport
    const refViewport = component.viewport
    expect(mainViewport).to.be.instanceOf(Viewport)
    expect(refViewport).to.be.instanceOf(Viewport)
    expect(mainViewport).to.not.eq(refViewport)
  })

  it(
    `should set the width/height of the viewport using the page ` +
      `component's width/height`,
    () => {
      const component = noodlui.resolveComponents(noodlComponent) as Page
      const refViewport = component.viewport
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
      const component = noodlui.resolveComponents(noodlComponent) as Page
      const mainViewport = noodlui.viewport
      const refViewport = component.viewport
      expect(refViewport.width).to.eq(mainViewport.width)
      expect(refViewport.height).to.eq(mainViewport.height)
    },
  )

  it(`should set the page to the "path" set on the page component`, () => {
    const component = noodlui.resolveComponents(noodlComponent) as Page
    expect(component).to.have.property('page').eq(path)
  })

  describe(`actionsContext`, () => {
    describe(`actionsContext [arbitrary props]`, () => {
      it(`should be reusing other actionsContext props from the root instance`, () => {
        const spy = sinon.spy()
        const s = { yes: 'no' }
        noodlui.use({ actionsContext: { spy } })
        noodlui.use({ actionsContext: { s } })
        const page = noodlui.resolveComponents(noodlComponent) as Page
        expect(page.actionsContext).to.have.property('spy').eq(spy)
        expect(page.actionsContext).to.have.property('s').eq(s)
      })
    })
  })

  describe(`use`, () => {
    describe(`when passing action objects`, () => {
      it(`should pass the call to store`, () => {
        const page = new Page()
        const spy = sinon.spy(getStore(), 'use')
        const args = { actionType: 'pageJump', fn: sinon.spy() }
        page.use(args)
        expect(spy).to.be.calledWith(args)
        spy.restore()
      })
    })

    describe(`when passing builtIn objects`, () => {
      it(`should pass the call to store`, () => {
        const page = new Page()
        const spy = sinon.spy(getStore(), 'use')
        const args = {
          actionType: 'builtIn',
          funcName: 'pearl',
          fn: sinon.spy(),
        }
        page.use(args)
        expect(spy).to.be.calledWith(args)
        spy.restore()
      })
    })

    describe(`when passing resolvers`, () => {
      it(`should pass the call to store`, () => {
        const page = new Page()
        const spy = sinon.spy(getStore(), 'use')
        const resolver = new Resolver()
        resolver.setResolver((c) => undefined)
        const obj = { name: 'hello', resolver }
        page.use(obj)
        expect(spy).to.be.calledWith(obj)
        spy.restore()
      })
    })

    it(`should set the viewport`, () => {
      const page = new Page()
      const viewport = new Viewport()
      expect(page.viewport).to.be.undefined
      page.use(viewport)
      expect(page.viewport).to.eq(viewport)
    })
    it(`should merge to the actionsContext`, () => {
      const page = new Page()
      page.use({ actionsContext: { hello: 'one', bye: 'two' } })
      expect(page.actionsContext).to.have.property('hello', 'one')
      expect(page.actionsContext).to.have.property('bye', 'two')
    })
    it(`should set the function getAssetsUrl`, () => {
      const page = new Page()
      page.use({ getAssetsUrl: () => 'abc/' })
      expect(page.getAssetsUrl()).to.eq('abc/')
    })
    it(`should set the function getBaseUrl`, () => {
      const page = new Page()
      page.use({ getBaseUrl: () => 'abc/' })
      expect(page.getBaseUrl()).to.eq('abc/')
    })
    it(`should set the function getPages`, () => {
      const page = new Page()
      const preloadPages = ['1', '2', '3']
      page.use({ getPages: () => preloadPages })
      expect(page.getPages()).to.eq(preloadPages)
    })
    it(`should set the function getPreloadPages`, () => {
      const page = new Page()
      const preloadPages = ['1', '2', '3']
      page.use({ getPreloadPages: () => preloadPages })
      expect(page.getPreloadPages()).to.eq(preloadPages)
    })
    it(`should set the function getRoot`, () => {
      const root = {}
      const page = new Page()
      page.use({ getRoot: () => root })
      expect(page.getRoot()).to.eq(root)
    })
  })

  it(`should return the expected resolvers`, () => {
    const page = noodlui.resolveComponents(noodlComponent) as Page
    expect(getStore().resolvers.length).to.be.greaterThan(1)
    expect(page.getResolvers()).to.have.lengthOf(getStore().resolvers.length)
  })

  describe(`toJS`, () => {
    it(`should return the expected object`, () => {
      const actionsContext = { fruits: [] }
      const assetsUrl = 'https://abc.com/assets/'
      const baseUrl = 'https://abc.com/'
      const currentPage = 'Apple'
      const preloadPages = ['hello', 'hi']
      const pages = ['Go', 'Bye']
      const root = { greeting: 'hi' }
      const page = new Page()
      page.setPage(currentPage)
      page.use({
        actionsContext,
        getAssetsUrl: () => assetsUrl,
        getBaseUrl: () => baseUrl,
        getPages: () => pages,
        getPreloadPages: () => preloadPages,
        getRoot: () => root,
      })
      const js = page.toJS()
      expect(js).to.have.property('assetsUrl', assetsUrl)
      expect(js).to.have.property('baseUrl', baseUrl)
      expect(js).to.have.property('currentPage', currentPage)
      expect(js).to.have.property('preloadPages', preloadPages)
      expect(js).to.have.property('pages', pages)
      expect(js).to.have.property('root', root)
      expect(js).to.have.property('style')
      // expect(js).to.have.property('type', 'iframe')
      expect(js).to.have.property('type', 'page')
    })
  })

  describe(`resolveComponents`, () => {
    it(`should render identical components in structure as the noodl-ui instance`, () => {
      noodlui.setPage(path)
      const pageJumpUseObj = {
        actionType: 'pageJump',
        fn: sinon.spy(),
      } as StoreActionObject<any>
      const builtInUseObj = {
        actionType: 'builtIn',
        funcName: 'dog',
        fn: sinon.spy(),
      } as StoreBuiltInObject<any>
      const actionsContext = { myName: 'isChris' }
      const baseUrl = 'https://abc.com/'
      const assetsUrl = baseUrl + 'assets/'
      const root = noodlui.root
      const initInstance = (inst: Page | NOODLUI) => {
        inst
          .setPage(path)
          .use(noodlui.viewport as any)
          .use(pageJumpUseObj as any)
          .use(builtInUseObj as any)
          .use({
            actionsContext,
            getAssetsUrl: () => assetsUrl,
            getBaseUrl: () => baseUrl,
            getRoot: () => root,
          })
        if (inst instanceof Page) {
          inst.createComponent = createComponent
          inst._internalResolver = _internalResolver
        }
      }

      const components = noodlui.resolveComponents(generatedComponents)
      const page = new Page({ type: 'page', path })
      initInstance(noodlui)
      initInstance(page)
      const resolvedPageComponents = page.resolveComponents(generatedComponents)
      const list1Instance = components[0].child()
      const list2Instance = resolvedPageComponents[0].child()
      ;[list1Instance].concat(list2Instance).forEach((list: List) => {
        const data = list.getData()
        list.set('listObject', [])
        data.forEach((d) => list.removeDataObject(d))
        data.forEach((d) => list.addDataObject(d))
      })
      const js1 = components[0].toJS()
      const js2 = resolvedPageComponents[0].toJS()
      const list1 = js1.children?.[0]
      const list2 = js2.children?.[0]
      const liBlueprint1 = list1.blueprint
      const liBlueprint2 = list2.blueprint
      const listObject1 = list1.listObject
      const listObject2 = list2.listObject
      expect(list1.type).to.eq(list2.type)
      expect(list1.children).to.have.lengthOf(list2.children.length)
      expect(list1.children).to.have.lengthOf(list2.children.length)
      expect(list1.type).to.eq(list2.type)
      expect(list1.iteratorVar).to.exist
      expect(list1.iteratorVar).to.eq(list2.iteratorVar)
      expect(liBlueprint1.type).to.eq(liBlueprint2.type)
      expect(isEqual(liBlueprint1.style, liBlueprint2.style)).to.be.true
      expect(liBlueprint1.path).to.eq(liBlueprint2.path)
      expect(isEqual(listObject1, listObject2)).to.be.true
      expect(isEqual(list1.style, list2.style)).to.be.true
      expect(list1.children[0].children[0].type).to.eq('img')
      expect(list1.children[0].children[0].type).to.eq('image')
    })
  })

  it(`should resolve components dimensions using the page components's viewport`, () => {
    const page = noodlui.resolveComponents(noodlComponent) as Page
    expect(page.children).to.have.length.greaterThan(0)
    const child = page.child()
    expect(child.style.width).to.eq(page.style.width)
    expect(child.style.height).to.eq(page.style.height)
  })
})
