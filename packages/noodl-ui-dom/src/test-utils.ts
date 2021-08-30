import * as u from '@jsmanifest/utils'
import isNil from 'lodash/isNil'
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import { OrArray } from '@jsmanifest/typefest'
import { ComponentObject, PageObject, userEvent } from 'noodl-types'
import {
  nuiEmitTransaction,
  NUIComponent,
  NUI,
  Page as NUIPage,
  Viewport,
} from 'noodl-ui'
import NOODLDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import { _syncPages } from './utils/internal'
import { findBySelector } from './utils'
import { nui } from './nui'
import * as t from './types'

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
export const ndom = new NOODLDOM()
export const viewport = new Viewport({ width: 375, height: 667 })

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
    render: () => Promise<NUIComponent.Instance[]>
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
  ndom.resync()

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
      u.assign(pageObject, opts.root[pageRequesting])
      if (opts.root[pageRequesting].components) {
        pageObject.components = u.array(opts.root[pageRequesting].components)
      }
    }
    if (opts.pageObject) u.assign(pageObject, opts.pageObject)
    if (opts.components) {
      pageObject.components = u.array(opts.components)
      if (!root[pageRequesting]) root[pageRequesting] = {} as PageObject
      root[pageRequesting].components = pageObject.components
    }
  }

  root?.[pageRequesting] && (root[pageRequesting] = pageObject as PageObject)
  !page && (page = ndom.page || ndom.createPage(pageRequesting))
  currentPage ? (page.page = currentPage) : (page.page = '')
  pageRequesting && (page.requesting = pageRequesting)

  if (u.isUnd(page?.viewport.width) || u.isUnd(page?.viewport.height)) {
    page.viewport.width = page.viewport.width || 375
    page.viewport.height = page.viewport.height || 667
  }

  const getPageObject = (pageProp = page as NDOMPage | string) => {
    return new Promise((resolve) => {
      // Simulate a real world request delay
      setTimeout(() => {
        const result = use.getRoot()[
          u.isStr(pageProp)
            ? pageProp
            : (pageProp as NDOMPage)?.requesting ||
              (pageProp as NDOMPage)?.page ||
              ''
        ] as PageObject
        resolve(result)
      })
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
    request: async (pgName = '') => {
      pgName && page && (page.requesting = pgName)
      return ndom.request(page)
    },
    render: async (pgName = ''): Promise<NUIComponent.Instance> => {
      const req = await o.request(pgName || page?.requesting)
      return u.array(await req?.render?.())?.[0] as NUIComponent.Instance
    },
  } as CreateRenderResult

  return o
}

createRender.userEvents = userEvent.slice()

export async function waitForPageChildren(
  getPageElem = () => findBySelector('page'),
) {
  await waitFor(() => {
    const pageElem = getPageElem() as HTMLIFrameElement
    const pageBodyElem = pageElem?.contentDocument?.body as HTMLBodyElement
    expect(pageBodyElem, "expected page component's HTMLBodyElement to exist")
      .to.exist
    expect(
      pageBodyElem,
      "expected page component's HTMLBodyElement to have children",
    )
      .to.have.property('children')
      .with.length.greaterThan(0)
  })
}

export function getAllElementCount(selector = '') {
  return u.array(findBySelector(selector)).filter(Boolean).length
}

export function getPageComponentChildIds(component: NUIComponent.Instance) {
  const pageName = component.get('page')?.page
  return ndom.cache.component.reduce((acc, obj) => {
    return obj.page === pageName ? acc.concat(obj.component.id) : acc
  }, [] as string[])
}

export function render(components: ComponentObject[]): Promise<t.NDOMElement[]>
export function render(component: ComponentObject): Promise<t.NDOMElement>
export async function render(options: ComponentObject | ComponentObject[]) {
  let components: ComponentObject[] = []
  let isArr = false
  let page = ndom.createPage(nui.createPage({ id: 'root' }) as NUIPage)
  page.requesting = _defaults.pageName || ''
  let pageObject = { ..._defaults.root[page.requesting] }
  let root = { ..._defaults.root }
  page.requesting && (root[page.requesting] = { ...pageObject })

  if (u.isArr(options)) {
    isArr = true
    components.push(...(await nui.resolveComponents(options)))
  } else if (u.isObj(options)) {
    if ('type' in options) {
      components.push(await nui.resolveComponents(options))
    }
  }

  ndom.use({
    getAssetsUrl: () => _defaults.assetsUrl,
    getBaseUrl: () => _defaults.baseUrl,
    getPages: () => [page.requesting],
    getPreloadPages: () => [],
    getRoot: () => ({ ...root, [page.requesting]: root[_defaults.pageName] }),
    transaction: {
      [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (page) =>
        root[page.requesting],
    },
  })

  return isArr ? u.array(await ndom.render(page)) : await ndom.render(page)
}
