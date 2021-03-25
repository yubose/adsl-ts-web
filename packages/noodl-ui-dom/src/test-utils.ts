import { ComponentObject, PageObject } from 'noodl-types'
import { NUIComponent, NOODLUI as NUI, Viewport } from 'noodl-ui'
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
  page?: NOODLDOMPage
  pageName?: string
  pageObject?: PageObject
  resolver?: MockDrawResolver
  root?: Record<string, any>
}

interface CreateRenderReturnObject {
  assetsUrl: string
  baseUrl: string
  nui: typeof NUI
  ndom: NOODLDOM
  page: NOODLDOMPage
  pageObject: PageObject
  root: Record<string, any>
  render(
    page?: NOODLDOMPage,
  ): Promise<{ node: HTMLElement | null; component: NUIComponent.Instance }[]>
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
  let pageObject: PageObject | undefined

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
    ...NUI.getRoot()[pageRequesting],
    ...opts.root?.[pageRequesting],
    ...pageObject,
  }

  if (!isArr(pageObject?.components)) {
    // @ts-expect-error
    pageObject.components = [pageObject.components]
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
      ...NUI.getRoot(),
      ...opts.root,
      [pageRequesting]: pageObject,
    }),
  }

  ndom.use(use)

  return {
    ...use,
    assetsUrl,
    baseUrl,
    nui: NUI,
    ndom,
    page,
    pageObject,
    render: () => ndom.render(page as NOODLDOMPage),
  }
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
