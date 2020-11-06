import { IComponentTypeInstance, IListItem, NOODLComponentType } from 'noodl-ui'
import { componentEventMap, componentEventIds } from './constants'

export interface INOODLUiDOM {
  on<CT extends NOODLComponentType>(
    eventName: NOODLDOMEvent,
    cb: (
      node: NOODLDOMElement | null,
      component: IComponentTypeInstance<CT>,
    ) => void,
  ): this
  off(
    eventName: NOODLDOMEvent,
    cb: (
      node: NOODLDOMElement | null,
      component: IComponentTypeInstance,
    ) => void,
  ): this
  emit(
    eventName: NOODLDOMEvent,
    node: NOODLDOMElement | null,
    component: IComponentTypeInstance,
  ): this
  getCallbacks(eventName: NOODLDOMEvent): Function[] | null
  isValidAttr(tagName: NOODLDOMElementTypes, key: string): boolean
  parse<C extends IComponentTypeInstance>(
    component: C,
    container?: NOODLDOMElement | null,
  ): NOODLDOMElement | null
}

export interface INOODLDOMList {
  addListItem(listItem: IListItem): this
  getListItem(index: number): IListItem | null
  removeListItem(index: number | IListItem): this
  setListItem(index: number, listItem: IListItem): this
  updateListItem(index: number | IListItem, listItem?: IListItem): this
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
