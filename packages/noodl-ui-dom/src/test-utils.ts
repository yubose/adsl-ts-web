import { ComponentInstance, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { NOODLDOMElement } from './types'
import NOODLUIDOM from './noodl-ui-dom'

export const assetsUrl = 'https://aitmed.com/assets/'
export const noodluidom = new NOODLUIDOM()
export const noodlui = new NOODLUI()
export const viewport = new Viewport()

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function applyMockDOMResolver(opts: {
  assetsUrl?: string
  baseUrl?: string
  component?: any
  pageName?: string
  pageObject?: any
  resolver: any
  root?: { [key: string]: any }
}) {
  const utils = {
    assetsUrl: opts.assetsUrl || noodlui.assetsUrl,
    componentCache: noodlui.componentCache.bind(noodlui),
  } as {
    assetsUrl: string
    componentCache: NOODLUI['componentCache']
    noodlui: NOODLUI
    noodluidom: NOODLUIDOM
    node: NOODLDOMElement
    component: ComponentInstance
  }
  noodluidom.register({ resolve: opts.resolver })
  noodlui.setPage(opts.pageName || '').use({
    getAssetsUrl: () => utils.assetsUrl,
    getBaseUrl: () => opts.baseUrl || 'https://google.com/',
    getRoot: () => ({
      ...opts.root,
      [opts.pageName || '']: {
        ...opts.pageObject,
        ...opts.root?.[opts.pageName || ''],
      },
    }),
  })
  utils.component = noodlui.resolveComponents(opts.component)
  utils.node = noodluidom.draw(utils.component) as NOODLDOMElement
  return utils
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends ComponentInstance = ComponentInstance
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (typeof props?.children === 'function') {
    node = noodluidom.draw(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = noodluidom.draw(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
