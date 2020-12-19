import {
  ComponentInstance,
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPlugins,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  isComponent,
  NOODL as NOODLUI,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import * as resolvers from './resolvers'
import { NOODLDOMElement, NodeResolverConfig } from './types'
import NOODLUIDOM from './noodl-ui-dom'

export const assetsUrl = 'https://aitmed.com/assets/'
export const noodluidom = new NOODLUIDOM()
export const noodlui = new NOODLUI()
export const viewport = new Viewport()

viewport.width = 365
viewport.height = 667

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This automatically prepares
 * the noodl-ui client so that you don't have to. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function applyMockDOMResolver(opts: {
  assetsUrl?: string
  component?: any
  pageName?: string
  pageObject?: any
  resolver: NodeResolverConfig
  root?: { [key: string]: any }
}) {
  const utils = {
    assetsUrl: opts.assetsUrl || noodlui.assetsUrl,
    componentCache: noodlui.componentCache.bind(noodlui),
  } as {
    assetsUrl: string
    componentCache: NOODLUI['componentCache']
    node: NOODLDOMElement
    component: ComponentInstance
  }
  noodluidom.register(opts.resolver)
  noodlui.setPage(opts.pageName || '').use({
    getAssetsUrl: () => utils.assetsUrl,
    getRoot: () => ({
      ...opts.root,
      [opts.pageName || '']: {
        ...opts.pageObject,
        ...opts.root?.[opts.pageName || ''],
      },
    }),
  })
  utils.component = noodlui.resolveComponents(opts.component)
  utils.node = noodluidom.parse(utils.component) as NOODLDOMElement
  return utils
}

export function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getCustomDataAttrs,
    getElementType,
    getEventHandlers,
    getFontAttrs,
    getPlugins,
    getPosition,
    getReferences,
    getSizes,
    getStylesByElementType,
    getTransformedAliases,
    getTransformedStyleAliases,
  ] as ResolverFn[]
}

export function getDOMResolver(key: keyof typeof resolvers) {
  return resolvers[key]
}

export function getDOMResolvers(asFuncs?: boolean) {
  if (asFuncs) return Object.values(resolvers)
  return resolvers
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends ComponentInstance = any
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (isComponent(props)) {
    node = noodluidom.parse(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = noodluidom.parse(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
