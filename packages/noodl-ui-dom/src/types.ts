import { Component, ListItem, ComponentType } from 'noodl-ui'
import { componentEventMap, componentEventIds } from './constants'

export interface INOODLUiDOM {
  on<CT extends ComponentType>(
    eventName: NOODLDOMEvent,
    cb: (node: NOODLDOMElement | null, component: Component<CT>) => void,
  ): this
  off(
    eventName: NOODLDOMEvent,
    cb: (node: NOODLDOMElement | null, component: Component) => void,
  ): this
  emit(
    eventName: NOODLDOMEvent,
    node: NOODLDOMElement | null,
    component: Component,
  ): this
  getCallbacks(eventName: NOODLDOMEvent): Function[] | null
  isValidAttr(tagName: NOODLDOMElementTypes, key: string): boolean
  parse<C extends Component>(
    component: C,
    container?: NOODLDOMElement | null,
  ): NOODLDOMElement | null
}

export interface INOODLDOMList {
  addListItem(listItem: ListItem): this
  getListItem(index: number): ListItem | null
  removeListItem(index: number | ListItem): this
  setListItem(index: number, listItem: ListItem): this
  updateListItem(index: number | ListItem, listItem?: ListItem): this
}

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
