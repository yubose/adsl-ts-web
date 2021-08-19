import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import { OrArray } from '@jsmanifest/typefest'
import isNil from 'lodash/isNil'
import sinon from 'sinon'
import { ComponentObject, PageObject, userEvent } from 'noodl-types'
import {
  nuiEmitTransaction,
  NUIComponent,
  NUI,
  Page as NUIPage,
  Viewport,
} from 'noodl-ui'
import { NDOMElement, Resolve } from './types'
import { nui } from './nui'
import NOODLDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import { findBySelector } from './utils'

export const ui = { ...actionFactory, ...componentFactory }

export const _defaults = {
  baseUrl: 'https://aitmed.com/',
  get assetsUrl() {
    return _defaults.baseUrl + 'assets/'
  },
  iteratorVar: 'itemObject',
  nui: NUI,
  pageName: 'Hello',
  get pageRequesting() {
    return _defaults.pageName
  },
  pageObject: {
    formData: { email: 'pfft@gmail.com', password: 'ab123', user: 'Bob' },
    components: [
      ui.view({
        children: [ui.label({ dataKey: 'formData.email' })],
      }),
    ],
  } as PageObject,
  get root() {
    return {
      [_defaults.pageName]: {
        ..._defaults.nui.getRoot()[_defaults.pageName],
        ..._defaults.pageObject,
      },
    } as Record<string, PageObject>
  },
}

export const baseUrl = _defaults.baseUrl
export const assetsUrl = _defaults.assetsUrl
export let ndom = new NOODLDOM()
export const viewport = new Viewport({ width: 375, height: 667 })

type MockDrawResolver = Resolve.Config

interface MockRenderOptions {
  components?: OrArray<ComponentObject>
  currentPage?: string
  getPageObject?: (page?: string) => Promise<Partial<PageObject>>
  page?: NDOMPage
  pageName?: string
  pageObject?: Partial<PageObject>
  root?: Record<string, PageObject>
}

export function createDataKeyReference({
  nui = _defaults.nui,
  page = nui.getRootPage(),
  pageName = page.page || _defaults.pageName,
  pageObject = { ..._defaults.pageObject },
}: {
  nui?: typeof NUI
  page?: NUIPage
  pageName?: string
  pageObject?: Record<string, any>
}) {
  if (isNil(page.viewport.width)) page.viewport.width = 375
  if (isNil(page.viewport.height)) page.viewport.height = 667
  pageObject = {
    ...nui.getRoot()[pageName],
    ...pageObject,
  }
  if (page.page !== pageName) page.page = pageName
  const root = { ...nui.getRoot(), [pageName]: pageObject }
  nui.use({ getRoot: () => root })
  return { page }
}

export interface CreateRenderResult {
  getAssetsUrl(): string
  getBaseUrl(): string
  getPageObject(): Promise<PageObject>
  getPages(): string[]
  getPreloadPages(): string[]
  getRoot: () => Record<string, any>
  assetsUrl: string
  baseUrl: string
  nui: typeof NUI
  ndom: NOODLDOM
  page: NDOMPage
  pageObject: PageObject
  request(pgName?: string): Promise<{
    render: () => NUIComponent.Instance[]
  }>
  render(pgName?: string): Promise<NUIComponent.Instance>
}

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function createRender(
  components: OrArray<ComponentObject>,
): CreateRenderResult

export function createRender(opts: MockRenderOptions): CreateRenderResult

export function createRender<Opts extends MockRenderOptions>(
  opts: OrArray<ComponentObject> | Opts,
) {
  ndom.reset()

  let currentPage = ''
  let pageRequesting = ''
  let page: NDOMPage | undefined
  let pageObject: Partial<PageObject> = {}
  let root = _defaults.root

  if (u.isArr(opts) || 'type' in (opts || {})) {
    pageRequesting = _defaults.pageRequesting
    pageObject.components = u.array(opts) as PageObject['components']
  } else {
    opts.currentPage && (currentPage = opts.currentPage)
    opts.pageName && (pageRequesting = opts.pageName)
    opts.pageObject && u.assign(pageObject, opts.pageObject)
    opts.page && (page = page)
    opts.root && (root = opts.root)

    !pageRequesting && (pageRequesting = _defaults.pageRequesting)

    if (opts.root?.[pageRequesting]) {
      u.assign(pageObject, {
        ...opts.root[pageRequesting],
        components: u.array(opts.root[pageRequesting].components),
      })
    }
    if (opts.pageObject) {
      u.assign(pageObject, opts.pageObject)
    }
    if (opts.components) {
      pageObject.components = u.array(opts.components)
      if (!root[pageRequesting]) root[pageRequesting] = {} as PageObject
      root[pageRequesting].components = pageObject.components
    }
  }

  root?.[pageRequesting] && (root[pageRequesting] = pageObject as PageObject)

  page = ndom.page || ndom.createPage(pageRequesting)
  !page && (page = ndom.page || ndom.createPage(pageRequesting))
  currentPage && (page.page = currentPage)
  pageRequesting && (page.requesting = pageRequesting)

  if (u.isUnd(page?.viewport.width) || u.isUnd(page?.viewport.height)) {
    page.viewport.width = page.viewport.width || 375
    page.viewport.height = page.viewport.height || 667
  }

  const getPageObject = (pageProp = page as NDOMPage | string) => {
    return new Promise((resolve) => {
      // Simulate a real world request delay
      setTimeout(() =>
        resolve(
          use.getRoot()[
            u.isStr(page)
              ? page
              : (pageProp as NDOMPage)?.requesting ||
                (pageProp as NDOMPage)?.page ||
                ''
          ] as PageObject,
        ),
      )
    })
  }

  pageObject = { ...root?.[pageRequesting], ...pageObject }

  const use = {
    getAssetsUrl: () => _defaults.assetsUrl,
    getBaseUrl: () => _defaults.baseUrl,
    getPageObject,
    getPages: () => [pageRequesting],
    getPreloadPages: () => [],
    getRoot: () => ({ ...root, [pageRequesting]: pageObject }),
    transaction: { [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: getPageObject },
  }

  // @ts-expect-error
  ndom.use(use)

  const o = {
    ...use,
    assetsUrl: _defaults.assetsUrl,
    baseUrl: _defaults.baseUrl,
    nui: _defaults.nui,
    ndom,
    page,
    get pageObject() {
      return use.getRoot()[pageRequesting] as PageObject
    },
    request: (pgName = '') => {
      pgName && page && (page.requesting = pgName)
      return ndom.request(page) as Promise<{
        render: () => NUIComponent.Instance[]
      }>
    },
    render: async (pgName = ''): Promise<NUIComponent.Instance> => {
      const req = await o.request(pgName || page?.requesting)
      return req?.render?.()[0] as NUIComponent.Instance
    },
  } as CreateRenderResult

  return o
}

createRender.userEvents = userEvent.slice()

userEvent.slice().forEach((evt) => {
  createRender[evt] = function (this: NUIComponent.Instance) {
    //
  }
})

export function createMockCssResource({
  href = 'https://some-mock-link.com/chart.min.css',
  ...rest
}: Partial<GlobalCssResourceObject> = {}) {
  return { ...rest, type: 'css', href } as GlobalCssResourceObject
}

export function createMockJsResource({
  src = 'https://some-mock-link.com/chart.min.js',
  ...rest
}: Partial<GlobalJsResourceObject> = {}) {
  return { ...rest, type: 'js', src } as GlobalJsResourceObject
}

export function createPageComponentRootObjectHelper<
  InitPage = any,
  NextPage = any,
>(args: {
  initialPage: {
    data?: Record<string, any>
    name: string
    components: OrArray<ComponentObject>
  }
  nextPage: {
    data?: Record<string, any>
    name: string
    components: OrArray<ComponentObject>
  }
}) {
  const { initialPage, nextPage } = args

  return {
    [initialPage.name]: {
      ...args.initialPage.data,
      components: u.array(initialPage.components).filter(Boolean),
    },
    [nextPage.name]: {
      ...nextPage.data,
      components: u.array(nextPage.components).filter(Boolean),
    },
  }
}

export function stubInvariant() {
  const stub = sinon.stub(global.console, 'error').callsFake(() => {})
  return stub
}

export function toDOM<
  N extends NDOMElement = NDOMElement,
  C extends NUIComponent.Instance = NUIComponent.Instance,
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  let page = ndom.page
  !ndom && (ndom = new NOODLDOM())
  !page && (page = ndom.createPage())
  if (typeof props?.props === 'function') {
    node = ndom.draw(props as any) as N
    component = props as any
  } else if (u.isObj(props)) {
    component = nui.resolveComponents({
      components: [props as ComponentObject],
      page: nui.getRootPage(),
    }) as any
    node = ndom.draw(component as C, ndom.page.rootNode) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}

export async function waitForPageChildren(
  getPageElem = () => findBySelector('page'),
) {
  await waitFor(() => {
    const pageElem = getPageElem()
    const pageBodyElem = pageElem?.contentDocument?.body as HTMLBodyElement
    expect(pageBodyElem, 'expected page HTMLBodyElement to exist').to.exist
    expect(pageBodyElem, 'expected page HTMLBodyElement to have children')
      .to.have.property('children')
      .with.length.greaterThan(0)
  })
}

export function getAllElementCount(selector = '') {
  return u.array(findBySelector(selector)).filter(Boolean).length
}

export function getPageComponentChildIds(component: NUIComponent.Instance) {
  const pageName = component.get('page').page
  return ndom.cache.component.reduce((acc, obj) => {
    return obj.page === pageName ? acc.concat(obj.component.id) : acc
  }, [] as string[])
}
