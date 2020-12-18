import { ComponentObject, ComponentInstance, NOODL as NOODLUI } from 'noodl-ui'
import Internal from './Internal'
import { componentEventMap, componentEventIds } from './constants'

export type NOODLDOMComponentType = keyof typeof componentEventMap
export type NOODLDOMComponentEvent = typeof componentEventIds[number]
export type NOODLDOMElementTypes = keyof NOODLDOMElements
export type NOODLDOMEvent = NOODLDOMComponentEvent // Will be extended to include non-component events in the future

export type NOODLDOMDataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement

export type NOODLDOMElement = Extract<
  NOODLDOMElements[NOODLDOMElementTypes],
  HTMLElement
>

export type NOODLDOMElements = Pick<
  HTMLElementTagNameMap,
  | 'a'
  | 'article'
  | 'audio'
  | 'b'
  | 'blockquote'
  | 'body'
  | 'br'
  | 'button'
  | 'canvas'
  | 'caption'
  | 'code'
  | 'col'
  | 'div'
  | 'em'
  | 'embed'
  | 'fieldset'
  | 'figure'
  | 'footer'
  | 'form'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'header'
  | 'hr'
  | 'html'
  | 'i'
  | 'img'
  | 'input'
  | 'iframe'
  | 'label'
  | 'li'
  | 'link'
  | 'main'
  | 'meta'
  | 'nav'
  | 'noscript'
  | 'ol'
  | 'option'
  | 'p'
  | 'pre'
  | 'script'
  | 'select'
  | 'section'
  | 'small'
  | 'source'
  | 'span'
  | 'strong'
  | 'style'
  | 'table'
  | 'tbody'
  | 'td'
  | 'textarea'
  | 'tfoot'
  | 'th'
  | 'thead'
  | 'title'
  | 'tr'
  | 'track'
  | 'ul'
  | 'video'
>

export interface NodeResolver<
  N extends NOODLDOMElement = any,
  C = any,
  RT = any
> {
  (
    node: NodeResolverBaseArgs<N, C>[0],
    component: NodeResolverBaseArgs<N, C>[1],
    opts: NodeResolverOptions,
  ): RT
}

export type NodeResolverBaseArgs<N extends NOODLDOMElement = any, C = any> = [
  node: N | null,
  component: C,
]

export interface NodeResolverConfig {
  cond?: NOODLDOMComponentEvent | NodeResolver<any, any, boolean>
  resolve: NodeResolver<any, any, void>
}

export interface NodeResolverOptions {
  noodlui: NOODLUI
  original: ComponentObject
  redraw: Redraw
}

export type NodeResolverUseObject = NodeResolverConfig | NOODLUI | Internal

export interface NodeResolverRunner {
  (
    node: NOODLDOMElement | null,
    component: ComponentInstance,
    options: NodeResolverOptions,
  ): void
}

export interface Redraw {
  (
    node: NOODLDOMElement | null,
    component: ComponentInstance,
    options: {
      resolver(
        noodlComponent: ComponentObject | ComponentObject[],
      ): ComponentInstance | ComponentInstance[]
    },
  ): [typeof node, ComponentInstance]
}

export type RegisterOptions = NodeResolverConfig
