import { ComponentObject, PageObject } from 'noodl-types'
import { ComponentInstance, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { NOODLDOMElement, Page, Resolve } from './types'
import NOODLDOM from './noodl-ui-dom'

export const baseUrl = 'https://aitmed.com/'
export const assetsUrl = baseUrl + 'assets/'
export const ndom = new NOODLDOM()
export const noodlui = new NOODLUI()
export const viewport = new Viewport()

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function useResolver(opts: {
  component: ComponentObject
  noodlui?: NOODLUI
  on?: Partial<Page.Hook>
  pageName?: string
  pageObject?: PageObject
  resolver: Resolve.Config
  root?: Record<string, any>
}) {
  ndom.register({ resolve: opts.resolver })

  if (opts.on) {
    Object.entries(opts.on).forEach(([evt, fn]) => {
      // ndom.page.on(evt, fn)
    })
  }

  const nui = opts.noodlui || noodlui
  if (opts.pageName) {
    nui.use({
      getRoot: () => ({
        [opts.pageName as string]: {
          components: [],
          ...opts.pageObject,
          ...opts.root?.[opts.pageName as string],
        },
      }),
    })
  }
  const component = nui.resolveComponents(opts.component)
  return {
    assetsUrl,
    component,
    componentCache: () => nui.componentCache(),
    node: ndom.draw(component) as HTMLElement,
    page: ndom.page,
  }
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends ComponentInstance = ComponentInstance
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (typeof props?.children === 'function') {
    node = ndom.draw(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = ndom.draw(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
