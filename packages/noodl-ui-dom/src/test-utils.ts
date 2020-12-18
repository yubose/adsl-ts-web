import {
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
  NOODL,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import { NOODLDOMElement } from './types'
import NOODLUIDOM from './noodl-ui-dom'

export const noodluidom = new NOODLUIDOM()
export const assetsUrl = 'https://aitmed.com/assets/'
export const viewport = new Viewport()
export const noodlui = new NOODL()

viewport.width = 365
viewport.height = 667

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

export function toDOM<N = NOODLDOMElement | null, C = any>(
  props: any,
): [N | null, C] {
  // @ts-expect-error
  let node: N = null
  let component: C | undefined
  if (isComponent(props)) {
    // @ts-expect-error
    node = noodluidom.parse(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = noodluidom.parse(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [N, C]
}
