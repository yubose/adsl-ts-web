import { NOODLComponentProps, NOODLComponentType } from 'noodl-ui'
import { noodlDOMEvents } from './constants'

export interface OnCreateNode {
  (node: NOODLElement, props: NOODLComponentProps): void
}

export type OnCreateNodeArgs = Parameters<OnCreateNode>

export interface INOODLUIDOM {
  on(eventName: NOODLDOMCreateNodeEvent, cb: OnCreateNode): this
  off(eventName: NOODLDOMCreateNodeEvent, cb: OnCreateNode): this
  emit(eventName: NOODLDOMCreateNodeEvent, ...args: any[]): this
  getListeners(eventName: NOODLDOMCreateNodeEvent): OnCreateNode[]
  isValidAttr(tagName: NOODLDOMTagName, key: string): boolean
  parse(props: NOODLComponentProps): NOODLElement | null
}

export type NOODLDOMComponentType = keyof typeof noodlDOMEvents

export type NOODLDOMCreateNodeEvent =
  | typeof noodlDOMEvents[keyof typeof noodlDOMEvents]
  | 'all'

export type NOODLElements = Pick<
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

export type NOODLElementTypes = keyof NOODLElements

export type NOODLElement = Extract<
  NOODLElements[NOODLElementTypes],
  HTMLElement
>

export type NOODLDOMTagName = keyof HTMLElementTagNameMap

export type DataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
