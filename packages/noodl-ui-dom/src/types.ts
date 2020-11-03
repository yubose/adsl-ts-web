import { IComponentTypeInstance, IList, IListItem } from 'noodl-ui'
import { componentEventMap, componentEventIds } from './constants'

export interface INOODLUiDOM {
  on(eventName: NOODLDOMEvent, cb: NOODLDOMNodeCreationCallback): this
  off(eventName: NOODLDOMEvent, cb: NOODLDOMNodeCreationCallback): this
  emit(
    eventName: 'create.plugin',
    node: null,
    noodluidomComponent: INOODLDOMComponent<any>,
  ): this
  emit(
    eventName: NOODLDOMEvent,
    ...args: Parameters<NOODLDOMNodeCreationCallback>
  ): this
  getCallbacks(eventName: NOODLDOMEvent): NOODLDOMNodeCreationCallback[] | null
  isValidAttr(tagName: NOODLDOMElementTypes, key: string): boolean
  parse(
    component: IComponentTypeInstance,
    container?: NOODLDOMElement,
  ): NOODLDOMElement | null
}

export type NOODLDOMConstructorArgs<
  C extends IComponentTypeInstance,
  N extends NOODLDOMElement = NOODLDOMElement
> = ConstructorParameters<
  new (node: N, component: C) => INOODLDOMComponent<C, N>
>

export interface INOODLDOMComponent<
  C extends IComponentTypeInstance,
  N extends NOODLDOMElement = NOODLDOMElement
> {
  component: C
  node: N | null
}

export interface INOODLDOMList extends INOODLDOMComponent<IList> {
  addListItem(listItem: IListItem): this
  getListItem(index: number): IListItem | null
  removeListItem(index: number | IListItem): this
  setListItem(index: number, listItem: IListItem): this
  updateListItem(index: number | IListItem, listItem?: IListItem): this
}

export type DataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement

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

export interface NOODLDOMNodeCreationCallback<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends IComponentTypeInstance = IComponentTypeInstance
> {
  (node: N | null, component: INOODLDOMComponent<C, N>): void
}
