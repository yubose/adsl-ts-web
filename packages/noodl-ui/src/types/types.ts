import Component from '../components/Base'
import { ActionObject, EmitActionObject } from './actionTypes'
import { ActionChainActionCallbackOptions } from './actionChainTypes'
import { ComponentObject } from './componentTypes'
import { ComponentType, ContentType } from './constantTypes'
import NOODLUI from '../noodl-ui'
import Viewport from '../Viewport'

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
    options: ActionChainActionCallbackOptions,
  ) => Promise<any> | any
}

export interface ComponentEventCallback {
  (
    noodlComponent: NOODLComponent,
    args: {
      component: Component
      parent: Component | null
    },
  ): void
}

export interface ConsumerOptions {
  component: Component
  context: ResolverContext
  createActionChainHandler: NOODLUI['createActionChainHandler']
  createSrc(path: Parameters<NOODLUI['createSrc']>[0]): string
  getAssetsUrl(): string
  getBaseStyles(styles?: Style): Partial<Style>
  getPageObject: StateHelpers['getPageObject']
  getResolvers: NOODLUI['getResolvers']
  getRoot(): { [key: string]: any }
  getState: StateHelpers['getState']
  parser: RootsParser
  resolveComponent(
    c:
      | (ComponentType | Component | ComponentObject)
      | (ComponentType | Component | ComponentObject)[],
  ): Component
  resolveComponentDeep: NOODLUI['resolveComponents']
  showDataKey: boolean
  viewport: Viewport
}

export type GotoURL = string

export interface IfObject {
  if: [any, any, any]
}

export type Page<K extends string = string> = Record<K, PageObject>

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

export interface ProxiedComponent extends Omit<NOODLComponent, 'children'> {
  blueprint?: ProxiedComponent
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
  noodlType?: ComponentType
  style?: Style
  children?: ProxiedComponent | ProxiedComponent[]
  [key: string]: any
}

export interface ResolverContext {
  assetsUrl: string
  page: string
}

export interface ResolveComponent<T = any> {
  (component: Component): T
}

export interface ResolverFn<C = Component> {
  (component: C, consumerOptions: ConsumerOptions): void
}

export interface State {
  page: string
  showDataKey: boolean
}

export type StateHelpers = StateGetters & StateSetters

export type StateGetters = {
  getState(): State
  getPageObject(page: string): PageObject
}

export type StateSetters = { [key: string]: any }

export interface Root {
  [key: string]: any
}

export interface RootsParser {
  get<K extends keyof Root>(key: string): Root[K] | any
  getLocalKey(): string
  getByDataKey(dataKey: string, fallbackValue?: any): any
  mergeReference<T = any>(refKey: keyof T, originalObj: T): any
  nameField: {
    getKeys(key: string): string[]
  }
  parse(value: any): any
  parseDataKey(dataKey: string): string | undefined
  setLocalKey(key: string): this
  setRoot(root: any): this
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
