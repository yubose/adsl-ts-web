import { ComponentObject, StyleObject } from 'noodl-types'
import { ActionObject, EmitActionObject } from './actionTypes'
import {
  ActionChainActionCallback,
  ActionChainContext,
  ActionChainUseObjectBase,
  ActionConsumerCallbackOptions,
} from './actionChainTypes'
import { ComponentInstance } from './componentTypes'
import {
  ActionChainEventId,
  ActionType,
  ComponentType,
  ContentType,
  PageEventId,
} from './constantTypes'
import componentCache from '../utils/componentCache'
import NOODLUI from '../noodl-ui'
import Viewport from '../Viewport'
import { StoreActionObject, StoreBuiltInObject } from './storeTypes'

export interface INOODLUI {
  actionsContext: ActionChainContext
  assetsUrl: string
  page: string
  viewport: Viewport
  resolveComponents: NOODLUI['resolveComponents']
  createActionChainHandler: NOODLUI['createActionChainHandler']
  createSrc: NOODLUI['createSrc']
  createPluginObject: NOODLUI['createPluginObject']
  getBaseStyles: NOODLUI['getBaseStyles']
  getActionsContext: NOODLUI['getActionsContext']
  getContext: NOODLUI['getContext']
  getPageObject: NOODLUI['getPageObject']
  getConsumerOptions: NOODLUI['getConsumerOptions']
  getResolvers: NOODLUI['getResolvers']
  getState: NOODLUI['getState']
  setPage(page: string): this
  plugins: NOODLUI['plugins']
  use: NOODLUI['use']
  unuse: NOODLUI['unuse']
  componentCache: NOODLUI['componentCache']
  reset(...args: any[]): any
}

export interface NOODLComponent {
  type?: ComponentType
  style?: Style
  children?: NOODLComponent[]
  controls?: boolean
  dataKey?: string
  contentType?: ContentType
  inputType?: string // our custom key
  itemObject?: any
  isEditable?: boolean // specific to textView components atm
  iteratorVar?: string
  listObject?: '' | any[]
  maxPresent?: string // ex: "6" (Currently used in components with type: list)
  onClick?: ActionObject[]
  onHover?: ActionObject[]
  options?: string[]
  path?: string | IfObject
  pathSelected?: string
  poster?: string
  placeholder?: string
  resource?: string
  required?: 'true' | 'false' | boolean
  selected?: string
  src?: string // our custom key
  text?: string
  textSelectd?: string
  textBoard?: TextBoard
  'text=func'?: any
  viewTag?: string
  videoFormat?: string
}

export interface BuiltInActions {
  [funcName: string]: <A extends {}>(
    action: A,
    options: ActionConsumerCallbackOptions,
  ) => Promise<any> | any
}

export type ComponentCache = ReturnType<typeof componentCache>

export interface ComponentEventCallback {
  (
    noodlComponent: NOODLComponent,
    args: {
      component: ComponentInstance
      parent: ComponentInstance | null
    },
  ): void
}

export interface ConsumerObject<
  O extends ComponentObject = ComponentObject,
  K extends keyof ComponentObject = keyof ComponentObject
> {
  id?: string
  prop: K
  cond?(args: ConsumerResolveArgs): boolean
  async?: boolean
  type?: 'morph' | 'replace' | 'remove' | 'rename'
  resolve?(args: ConsumerResolveArgs): any
  finally?: ((args: ConsumerResolveArgs) => void) | ConsumerObject
}

export interface ConsumerResolveArgs<K extends string = string> {
  key: K
  styleKey: keyof StyleObject
  value: any
  component: Required<ComponentObject>
  original: Required<ComponentObject>
  page: string
  getContext(): ResolverContext
  getPageObject(page: string): PageObject
  getRoot(): Root
  viewport: Viewport
}

export interface ConsumerOptions {
  componentCache(): ComponentCache
  component: ComponentInstance
  context: ResolverContext
  createActionChainHandler: NOODLUI['createActionChainHandler']
  createSrc(path: Parameters<NOODLUI['createSrc']>[0]): string
  fetch?: Fetch
  getAssetsUrl(): string
  getBaseUrl(): string
  getBaseStyles(styles?: Style): Partial<Style>
  getCbs(
    key: 'actions',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', StoreActionObject[]>
  >
  getCbs(
    key: 'builtIns',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', StoreBuiltInObject[]>
  >
  getCbs(
    key: 'chaining',
  ): Partial<
    Record<
      ActionType | 'emit' | 'goto' | 'toast',
      ActionChainUseObjectBase<any, any>[]
    >
  >
  getCbs(key: PageEventId): ((page: string) => any)[]
  getCbs(key: 'new.page.ref'): ((component: any) => Promise<void> | undefined)[]
  getCbs(
    key?: 'actions' | 'builtIns' | 'chaining' | PageEventId,
  ): {
    action: Partial<
      Record<
        ActionType | 'emit' | 'goto' | 'toast',
        ActionChainUseObjectBase<any, any>[]
      >
    >
    builtIn: { [funcName: string]: ActionChainActionCallback<any>[] }
    chaining: Partial<Record<ActionChainEventId, Function[]>>
    on: Partial<Record<PageEventId, any[]>>
  }
  getPageObject: StateHelpers['getPageObject']
  getPages(): string[]
  getPreloadPages(): string[]
  getResolvers: NOODLUI['getResolvers']
  getRoot(): { [key: string]: any }
  getState: StateHelpers['getState']
  plugins(location: 'head'): State['plugins']['head']
  plugins(location: 'body'): State['plugins']['body']
  plugins(location: 'body-top'): State['plugins']['body']['top']
  plugins(location: 'body-bottom'): State['plugins']['body']['bottom']
  plugins(location?: never): State['plugins']
  resolveComponent(
    c:
      | (ComponentType | ComponentInstance | ComponentObject)
      | (ComponentType | ComponentInstance | ComponentObject)[],
  ): ComponentInstance
  resolveComponentDeep: NOODLUI['resolveComponents']
  setPlugin(plugin: string | PluginObject): this
  showDataKey: boolean
  viewport: Viewport
}

export interface Fetch {
  (...args: any[]): Promise<any>
}

export type GotoURL = string

export interface IfObject {
  if: [any, any, any]
}

export type PageObjectContainer<K extends string = string> = Record<
  K,
  PageObject
>

export interface PageObject {
  components: NOODLComponent[]
  lastTop?: string
  final?: string // ex: "..save"
  init?: string | string[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  module?: string
  pageNumber?: string
  [key: string]: any
}

export type Path = string | Omit<EmitActionObject, 'actionType'> | IfObject

export type PluginCreationType =
  | string
  | ComponentInstance
  | ComponentObject
  | PluginObject

export type PluginLocation = 'head' | 'body-top' | 'body-bottom'

export interface PluginObject {
  initiated?: boolean
  location?: PluginLocation
  path?: string
  content?: string
  ref: ComponentInstance
}

export interface ProxiedComponent extends Omit<NOODLComponent, 'children'> {
  blueprint?: ProxiedComponent
  content?: any
  'data-key'?: string
  'data-listid'?: any
  'data-name'?: string
  'data-value'?: string
  'data-ux'?: string
  id?: string
  itemObject?: any
  listId?: string
  listIndex?: number
  listObject?: '' | any[]
  location?: PluginLocation
  noodlType?: ComponentType
  ref?: NOODLUI // Used for component type: page
  style?: Style
  children?: ProxiedComponent | ProxiedComponent[]
  [key: string]: any
}

export interface ResolverContext {
  actionsContext: { noodl: any; noodlui: NOODLUI }
  assetsUrl: string
  page: string
}

export interface ResolveComponent<T = any> {
  (component: ComponentInstance): T
}

export interface ResolverFn<C extends ComponentInstance = any> {
  (component: C, consumerOptions: ConsumerOptions): void
}

export interface RegistryObject {
  called: boolean
  callCount: number
  callbacks: Function[]
  page: string
  refs: {
    components: ComponentInstance[]
  }
}

export interface State {
  page: string
  plugins: {
    head: PluginObject[]
    body: {
      top: PluginObject[]
      bottom: PluginObject[]
    }
  }
  registry: {
    onEvent: {
      [eventName: string]: RegistryObject
    }
  }
  showDataKey: boolean
}

export type StateHelpers = StateGetters & StateSetters

export type StateGetters = {
  componentCache(): ComponentCache
  getState(): State
  getPageObject(page: string): PageObject
  plugins: ConsumerOptions['plugins']
}

export type StateSetters = { setPlugin: ConsumerOptions['setPlugin'] } & {
  [key: string]: any
}

export interface Root {
  [key: string]: any
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface IViewport {
  width: number | undefined
  height: number | undefined
  isValid(): boolean
  onResize: ViewportListener | undefined
}

export interface ViewportOptions {
  width: number
  height: number
}

export interface ViewportListener {
  (
    viewport: ViewportOptions & {
      previousWidth: number | undefined
      previousHeight: number | undefined
    },
  ): Promise<any> | any
}

/* -------------------------------------------------------
  ---- STYLING
-------------------------------------------------------- */

export interface Style {
  align?: StyleAlign
  axis?: 'horizontal' | 'vertical'
  activeColor?: string // ex: ".colorTheme.highLightColor"
  border?: StyleBorderObject
  color?: string
  colorDefault?: string
  colorSelected?: string
  fontSize?: string
  fontFamily?: string
  fontStyle?: 'bold' | string
  height?: string
  isHidden?: boolean
  isHideCondition?: string // ex: "isPatient"
  left?: string
  required?: string | boolean
  outline?: string
  onHover?: string // ex: "surroundborder"
  textAlign?: StyleTextAlign
  textColor?: string
  top?: string
  width?: string
  shadow?: string // ex: "false"
  [styleKey: string]: any
}

export interface StyleBorderObject {
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | 1 | 2 | 3 | 4 | 5 | 6 | 7
  width?: string | number
  color?: string | number
  line?: string // ex: "solid"
}

export type StyleTextAlign =
  | 'left'
  | 'center'
  | 'right'
  | StyleAlign
  | StyleTextAlignObject

export interface StyleTextAlignObject {
  x?: 'left' | 'center' | 'right'
  y?: 'left' | 'center' | 'right'
}

export type StyleAlign = 'centerX' | 'centerY'

export type TextBoard = (TextBoardTextObject | TextBoardBreakLine)[]

export type TextBoardBreakLine = 'br'

export interface TextBoardTextObject {
  text?: string
  color?: string
}
