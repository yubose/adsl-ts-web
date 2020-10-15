import { IComponent } from 'noodl-ui'
import { componentEventMap, componentEventIds } from './constants'

export type DataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement

export interface INOODLUiDOM {
  on(eventName: NOODLDOMEvent, cb: NodePropsFunc): this
  off(eventName: NOODLDOMEvent, cb: NodePropsFunc): this
  emit(
    eventName: 'all',
    node: NOODLDOMElement | null,
    component: IComponent,
  ): this
  emit(eventName: 'create.plugin', node: null, component: IComponent): this
  emit(eventName: NOODLDOMEvent, ...args: NodePropsFuncArgs): this
  getCallbacks(eventName: NOODLDOMEvent): NodePropsFunc[] | null
  isValidAttr(tagName: NOODLDOMElementTypes, key: string): boolean
  parse(
    component: IComponent,
    container?: NOODLDOMElement,
  ): NOODLDOMElement | null
}

export type NOODLDOMComponentType = keyof typeof componentEventMap

export type NOODLDOMComponentEvent = typeof componentEventIds[number]

export type NOODLDOMEvent = NOODLDOMComponentEvent | 'all'

export type NOODLDOMElementTypes = keyof NOODLDOMElements

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

export interface NodePropsFunc {
  (node: NOODLDOMElement | null, component: IComponent): void
}

export type NodePropsFuncArgs = Parameters<NodePropsFunc>
