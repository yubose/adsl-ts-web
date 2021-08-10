import * as u from '@jsmanifest/utils'
import * as mock from 'noodl-ui-test-utils'
import { OrArray } from '@jsmanifest/typefest'
import isNil from 'lodash/isNil'
import sinon from 'sinon'
import { ComponentObject, PageObject } from 'noodl-types'
import {
  nuiEmitTransaction,
  NUIComponent,
  NUI,
  Page as NUIPage,
  Viewport,
} from 'noodl-ui'
import {
  GlobalCssResourceObject,
  GlobalJsResourceObject,
  NOODLDOMElement,
  Resolve,
  UseObject,
} from './types'
import { array, keys, isArr, isStr, isUnd } from './utils/internal'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import * as defaultResolvers from './resolvers'

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
      mock.getViewComponent({
        children: [mock.getLabelComponent({ dataKey: 'formData.email' })],
      }),
    ],
  } as PageObject,
  get root() {
    return {
      [_defaults.pageName]: {
        ..._defaults.nui.getRoot()[_defaults.pageName],
        ..._defaults.pageObject,
      },
    }
  },
}

export const baseUrl = _defaults.baseUrl
export const assetsUrl = _defaults.assetsUrl
export let ndom = new NOODLDOM(NUI)
export const viewport = new Viewport({ width: 375, height: 667 })

const defaultResolversKeys = keys(
  defaultResolvers,
) as (keyof typeof defaultResolvers)[]

type MockDrawResolver =
  | Resolve.Config
  | keyof typeof defaultResolvers
  | (Resolve.Config | keyof typeof defaultResolvers)[]

interface MockRenderOptions {
  components?: OrArray<ComponentObject>
  currentPage?: string
  getPageObject?: (page: string) => Promise<Partial<PageObject>>
  page?: NOODLDOMPage
  pageName?: string
  pageObject?: Partial<PageObject>
  resolver?: MockDrawResolver
  resource?: UseObject['resource']
  root?: Record<string, any>
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
  page: NOODLDOMPage
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
export function createRender(
  opts: OrArray<ComponentObject> | MockRenderOptions,
) {
  ndom.reset()

  let currentPage = ''
  let pageRequesting = ''
  let page: NOODLDOMPage | undefined
  let pageObject: Partial<PageObject>
  let root = _defaults.root
  let resolver: OrArray<MockDrawResolver> | undefined
  let resource: MockRenderOptions['resource'] | undefined

  if (u.isArr(opts) || 'type' in opts) {
    pageRequesting = _defaults.pageRequesting
  } else {
    currentPage = opts.currentPage || ''
    page = opts.page
    root = { ...root, ...opts?.root }
    resource = opts.resource
  }

  !page && (page = ndom.page || ndom.createPage(pageRequesting))

  if (u.isArr(opts) || 'type' in opts) {
    pageObject = _defaults.root[pageRequesting] || { components: [] }
    u.arrayEach(opts, (obj) => pageObject.components?.push(obj))
    page?.requesting !== pageRequesting &&
      ((page as NOODLDOMPage).requesting = pageRequesting)
  } else {
    pageRequesting =
      opts.pageName || page?.requesting || _defaults.pageRequesting
    pageObject = opts.pageObject || {
      ...root[pageRequesting],
    }
    pageObject.components =
      opts.components ||
      opts.pageObject?.components ||
      pageObject?.components ||
      root[pageRequesting]?.components ||
      root[_defaults.pageName]?.components ||
      _defaults.pageObject.components
  }

  !resolver && (resolver = defaultResolversKeys)

  if (page.requesting !== pageRequesting) page.requesting = pageRequesting
  if (currentPage && page.page !== currentPage) page.page = currentPage

  array(resolver).forEach(
    (r: Resolve.Config | typeof defaultResolversKeys[number]) => {
      if (isStr(r)) {
        defaultResolvers[r] && ndom.register(defaultResolvers[r])
      } else {
        r && ndom.register(r)
      }
    },
  )

  if (page && (isUnd(page?.viewport.width) || isUnd(page?.viewport.height))) {
    page.viewport.width = page.viewport.width || 375
    page.viewport.height = page.viewport.height || 667
  }

  const use = {
    getAssetsUrl: () => _defaults.assetsUrl,
    getBaseUrl: () => _defaults.baseUrl,
    getPageObject: async () => pageObject as PageObject,
    getPages: () => [pageRequesting],
    getPreloadPages: () => [],
    getRoot: () => {
      const result = {
        ...root,
        ...opts?.['root'],
        [pageRequesting]: {
          ...opts?.['root']?.[pageRequesting],
          ...root[pageRequesting],
          ...pageObject,
        },
      }
      return result
    },
    resource,
    transaction: {
      [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () =>
        use.getRoot()[page?.page || ''],
    },
  }

  ndom.use(use)

  const o: CreateRenderResult = {
    ...use,
    assetsUrl: _defaults.assetsUrl,
    baseUrl: _defaults.baseUrl,
    nui: _defaults.nui,
    ndom,
    page: page as NOODLDOMPage,
    pageObject: pageObject as PageObject,
    request: (pgName?: string) => {
      pgName && page && (page.requesting = pgName)
      return ndom.request(page) as Promise<{
        render: () => NUIComponent.Instance[]
      }>
    },
    render: async (pgName?: string): Promise<NUIComponent.Instance> => {
      const req = await o.request(pgName || page?.requesting)
      return req?.render?.()[0] as NUIComponent.Instance
    },
  }

  return o
}

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

export function stubInvariant() {
  const stub = sinon.stub(global.console, 'error').callsFake(() => {})
  return stub
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends NUIComponent.Instance = NUIComponent.Instance,
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  let page = ndom.page
  !ndom && (ndom = new NOODLDOM(NUI))
  !page && (page = ndom.createPage())
  if (typeof props?.props === 'function') {
    node = ndom.draw(props as any) as N
    component = props as any
  } else if (u.isObj(props)) {
    component = NOODLDOM._nui.resolveComponents({
      components: [props as ComponentObject],
      page: NOODLDOM._nui.getRootPage(),
    }) as any
    node = ndom.draw(component as C, ndom.page.rootNode) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
