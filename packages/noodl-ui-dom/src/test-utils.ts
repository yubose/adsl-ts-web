import isNil from 'lodash/isNil'
import sinon from 'sinon'
import { ComponentObject, PageObject } from 'noodl-types'
import {
  nuiEmitTransaction,
  NUIComponent,
  NOODLUI as NUI,
  Page as NUIPage,
  Viewport,
} from 'noodl-ui'
import { NOODLDOMElement, Resolve } from './types'
import { array, keys, isArr, isStr, isUnd } from './utils/internal'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import * as defaultResolvers from './resolvers'

export const baseUrl = 'https://aitmed.com/'
export const assetsUrl = baseUrl + 'assets/'
export const ndom = new NOODLDOM(NUI)
export const viewport = new Viewport({ width: 375, height: 667 })

const defaultResolversKeys = keys(
  defaultResolvers,
) as (keyof typeof defaultResolvers)[]

type MockDrawResolver =
  | Resolve.Config
  | keyof typeof defaultResolvers
  | (Resolve.Config | keyof typeof defaultResolvers)[]

interface MockRenderOptions {
  components?: ComponentObject | ComponentObject[]
  currentPage?: string
  getPageObject?: (page: string) => Promise<Partial<PageObject>>
  page?: NOODLDOMPage
  pageName?: string
  pageObject?: Partial<PageObject>
  resolver?: MockDrawResolver
  root?: Record<string, any>
}

export function createDataKeyReference({
  nui = NUI,
  page = nui.getRootPage(),
  pageName = page.page,
  pageObject,
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

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function createRender(opts: MockRenderOptions) {
  ndom.reset()

  let currentPage = ''
  let pageRequesting = ''
  let page: NOODLDOMPage | undefined
  let pageObject: Partial<PageObject> | undefined
  let root = { ...NUI.getRoot(), ...opts?.root }

  currentPage = opts.currentPage || ''
  page = opts.page
  pageRequesting = opts.pageName || page?.requesting || 'Hello'
  pageObject =
    (opts.pageObject
      ? ({
          ...opts.pageObject,
          components: opts.components || opts.pageObject.components || [],
        } as PageObject)
      : undefined) ||
    ({ components: opts.components || page?.components || [] } as PageObject)

  !page && (page = ndom.page || ndom.createPage(currentPage))
  !opts.resolver && (opts.resolver = defaultResolversKeys)

  if (page.requesting !== pageRequesting) page.requesting = pageRequesting
  if (page.page !== currentPage) page.page = currentPage

  array(opts.resolver).forEach(
    (resolver: Resolve.Config | typeof defaultResolversKeys[number]) => {
      if (isStr(resolver)) {
        defaultResolvers[resolver] && ndom.register(defaultResolvers[resolver])
      } else {
        resolver && ndom.register(resolver)
      }
    },
  )

  pageObject = {
    ...root,
    ...root[pageRequesting],
    ...pageObject,
  }

  if (pageObject && !isArr(pageObject?.components)) {
    pageObject.components = [pageObject.components as any]
  }

  if (isUnd(page.viewport.width) || isUnd(page.viewport.height)) {
    page.viewport.width = page.viewport.width || 375
    page.viewport.height = page.viewport.height || 667
  }

  const use = {
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPageObject: async () => pageObject as PageObject,
    getPages: () => [pageRequesting],
    getPreloadPages: () => [],
    getRoot: () => ({
      ...opts.root,
      [pageRequesting]: pageObject,
    }),
  }

  ndom.use({
    transaction: {
      [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () =>
        pageObject as PageObject,
    },
  })

  ndom.use(use)

  const o = {
    ...use,
    assetsUrl,
    baseUrl,
    nui: NUI,
    ndom,
    page,
    pageObject,
    request: (pgName?: string) => {
      pgName && page && (page.requesting = pgName)
      return ndom.request(page)
    },
    render: async (pgName?: string): Promise<NUIComponent.Instance> => {
      const req = await o.request(pgName)
      return req && req?.render?.()[0]
    },
  }

  return o
}

export function stubInvariant() {
  const stub = sinon.stub(global.console, 'error').callsFake(() => {})
  return stub
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends NUIComponent.Instance = NUIComponent.Instance
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (typeof props?.props === 'function') {
    node = ndom.draw(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = NUI.resolveComponents(props) as any
    // @ts-expect-error
    node = ndom.draw(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
