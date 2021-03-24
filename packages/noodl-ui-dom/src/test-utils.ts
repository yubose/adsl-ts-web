import { ComponentObject, PageObject } from 'noodl-types'
import { NUIComponent, NOODLUI as NUI, Viewport } from 'noodl-ui'
import { NOODLDOMElement, Page, Resolve } from './types'
import { array, entries, keys, isUnd } from './utils/internal'
import { eventId } from './constants'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import * as defaultResolvers from './resolvers'

export const baseUrl = 'https://aitmed.com/'
export const assetsUrl = baseUrl + 'assets/'
export const ndom = new NOODLDOM()
export const viewport = new Viewport()

type MockDrawResolver =
  | Resolve.Config
  | keyof typeof defaultResolvers
  | (Resolve.Config | keyof typeof defaultResolvers)[]

interface MockDrawOptions<Evt extends Page.HookEvent = Page.HookEvent> {
  component?: ComponentObject
  on?: Partial<Record<Evt, Page.Hook[Evt]>>
  page?: NOODLDOMPage
  pageName?: string
  pageObject?: PageObject
  resolver?: MockDrawResolver
  root?: Record<string, any>
}

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function mockDraw<Evt extends Page.HookEvent = Page.HookEvent>({
  on,
  ...opts
}: MockDrawOptions = {}) {
  ndom.reset()

  let pageName = 'Hello'
  let page = (opts.page || ndom.page) as NOODLDOMPage
  let pageObject = (opts.pageObject || {}) as PageObject

  if (!opts.resolver) {
    opts.resolver = keys(defaultResolvers) as (keyof typeof defaultResolvers)[]
  }

  if (opts.pageName) {
    pageName = opts.pageName
  }

  if (!page) page = ndom.createPage()
  if (!page.page) page.page = 'Hello'

  if (on) {
    entries(on).forEach(([evt, fn]) =>
      page.on<Evt>(evt as Evt, fn as Page.Hook[Evt]),
    )
  }

  array(opts.resolver).forEach(
    (resolver: Resolve.Config | keyof typeof defaultResolvers) => {
      if (typeof resolver === 'string') {
        defaultResolvers[resolver] && ndom.register(defaultResolvers[resolver])
      } else {
        resolver && ndom.register(resolver)
      }
    },
  )

  if (!ndom.resolvers().find((o) => o.name === defaultResolvers.id.name)) {
    ndom.register(defaultResolvers.id)
  }

  pageObject = {
    ...opts.root?.[pageName],
    ...pageObject,
  }

  if (opts.component) {
    pageObject.components = array(opts.component)
  } else {
    if (!pageObject.components) {
      pageObject.components = opts.component ? array(opts.component) : []
    }
  }

  NUI.use({
    getRoot: () => ({ ...NUI.getRoot(), [pageName]: pageObject }),
  })

  if (isUnd(page.viewport.width) || isUnd(page.viewport.height)) {
    page.viewport.width = 375
    page.viewport.height = 667
  }

  page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, async () => ({
    name: page.page,
    object: pageObject,
  }))

  return {
    assetsUrl,
    page,
    pageObject,
    async render(name: string = pageName) {
      const components = await ndom.render(page)
      return components
    },
    async requestPageChange(name: string = pageName) {
      const components = await page.requestPageChange(name)
      return components
    },
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
