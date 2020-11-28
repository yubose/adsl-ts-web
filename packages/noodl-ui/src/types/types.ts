import { Draft } from 'immer'
import {
  ActionObject,
  BuiltInObject,
  EmitActionObject,
  EvalObject,
  GotoObject,
  PageJumpObject,
  PopupDismissObject,
  PopupObject,
  RefreshObject,
  SaveObject,
} from './actionTypes'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  ActionChainCallbackOptions,
  ActionChainActionCallbackReturnType,
  ActionChainLifeCycleComponentListeners,
  IActionChain,
  IActionChainUseObject,
  ParsedChainActionUpdateObject,
} from './actionChainTypes'
import {
  IComponentType,
  IComponentTypeInstance,
  IComponentTypeObject,
  IResolver,
  NOODLComponentProps,
} from './componentTypes'
import {
  EventId,
  NOODLActionTriggerType,
  NOODLComponentType,
  NOODLContentType,
} from './constantTypes'
import Viewport from '../Viewport'

export interface NOODLComponent {
  type?: NOODLComponentType
  style?: Style
  children?: NOODLComponent[]
  controls?: boolean
  dataKey?: string
  contentType?: NOODLContentType
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

export type NOODLPage<K extends string = string> = Record<K, NOODLPageObject>

export interface NOODLPageObject {
  components: NOODLComponent[]
  lastTop?: string
  final?: string // ex: "..save"
  init?: string | string[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  module?: string
  pageNumber?: string
  [key: string]: any
}

/* -------------------------------------------------------
    ---- ACTIONS
  -------------------------------------------------------- */

/* -------------------------------------------------------
  ---- CONSTANTS
-------------------------------------------------------- */

export interface INOODLUi {
  actionsContext: IActionChain['actionsContext']
  assetsUrl: string
  initialized: boolean
  page: string
  root: { [key: string]: any }
  createActionChainHandler(
    actions: ActionObject[],
    args: {
      component: IComponentTypeInstance
      trigger?: NOODLActionTriggerType
    },
  ): (event: Event) => Promise<any>
  createSrc(
    path: string | IfObject | EmitActionObject,
    component?: IComponentTypeInstance,
  ): string
  on(eventName: EventId, cb: INOODLUiComponentEventCallback): this
  off(eventName: EventId, cb: INOODLUiComponentEventCallback): this
  emit(
    eventName: EventId,
    ...args: Parameters<INOODLUiComponentEventCallback>
  ): this
  getContext(): ResolverContext
  getConsumerOptions(args: {
    component: IComponentTypeInstance
    [key: string]: any
  }): ConsumerOptions
  getPageObject<P extends string>(page: P): INOODLUi['root'][P]
  getResolvers(): ResolverFn[]
  getState(): INOODLUiState
  getStateHelpers(): INOODLUiStateHelpers
  getStateGetters(): INOODLUiStateGetters
  getStateSetters(): INOODLUiStateSetters
  reset(): this
  resolveComponents(
    components: IComponentType | IComponentType[] | Page['object'],
  ): IComponentTypeInstance | IComponentTypeInstance[] | null
  setAssetsUrl(assetsUrl: string): this
  setPage(page: string): this
  setRoot(key: string | { [key: string]: any }, value?: any): this
  setViewport(viewport: IViewport | null): this
  use(resolver: IResolver | IResolver[]): this
  use(action: IActionChainUseObject | IActionChainUseObject[]): this
  use(viewport: IViewport): this
  unuse(...args: Parameters<INOODLUi['use']>): this
}

export interface INOODLUiState {
  page: string
  showDataKey: boolean
}

export type INOODLUiStateHelpers = INOODLUiStateGetters & INOODLUiStateSetters

export type INOODLUiStateGetters = Pick<INOODLUi, 'getState' | 'getPageObject'>

export type INOODLUiStateSetters = { [key: string]: any }

export interface INOODLUiComponentEventCallback<
  NC = any,
  C extends IComponentTypeInstance = IComponentTypeInstance
> {
  (
    noodlComponent: NC,
    args: { component: C; parent: IComponentTypeInstance | null },
  ): void
}

/* -------------------------------------------------------
  ---- COMPONENTS
-------------------------------------------------------- */

/* -------------------------------------------------------
  ---- ACTION CHAIN
-------------------------------------------------------- */

/* -------------------------------------------------------
  ---- LISTENERS
-------------------------------------------------------- */

export interface BuiltInActions {
  [funcName: string]: <A extends {}>(
    action: A,
    options: ActionChainActionCallbackOptions,
  ) => Promise<any> | any
}

export interface LifeCycleListener<T = any> {
  (component: T, options: ConsumerOptions):
    | Promise<'abort' | undefined | void>
    | 'abort'
    | undefined
    | void
}

// Listed in order of invocation
export interface LifeCycleListeners {
  onAction?: {
    builtIn?: {
      [funcName: string]: ActionChainActionCallback<BuiltInObject>
    }
    evalObject?: ActionChainActionCallback<EvalObject>
    goto?: ActionChainActionCallback<GotoURL | GotoObject>
    pageJump?: ActionChainActionCallback<PageJumpObject>
    popUp?: ActionChainActionCallback<PopupObject>
    popUpDismiss?: ActionChainActionCallback<PopupDismissObject>
    saveObject?: (
      action: SaveObject,
      options: ActionChainActionCallbackOptions,
    ) => Promise<any>
    refresh?(
      action: RefreshObject,
      options: ActionChainActionCallbackOptions,
    ): Promise<any>
    updateObject?: (
      action: ParsedChainActionUpdateObject,
      options: ActionChainActionCallbackOptions,
    ) => Promise<any>
  }
  onBeforeResolve?: LifeCycleListener | ActionChainLifeCycleComponentListeners
  onBeforeResolveStyles?:
    | ActionChainLifeCycleComponentListeners
    | LifeCycleListener
  onChainStart?: <Actions extends any[]>(
    actions: Actions,
    options: ActionChainCallbackOptions<Actions>,
  ) => ActionChainActionCallbackReturnType
  onChainAborted?: <Action = any>(
    action: Action,
    options: ActionChainCallbackOptions<Action[]>,
  ) => ActionChainActionCallbackReturnType
  onOverrideDataValue?: (key: string) => void
  onBuiltinMissing?: <Action = any>(
    action: Action,
    options: ActionChainCallbackOptions<Action[]>,
  ) => void
  onChainEnd?: <Actions extends any[]>(
    actions: Actions,
    options: ActionChainCallbackOptions<Actions>,
  ) => Promise<any>
  onChainError?: <Action = any>(
    error: Error,
    action: Action,
    options: ActionChainCallbackOptions<Action[]>,
  ) => Promise<any>
  onAfterResolve?: ActionChainLifeCycleComponentListeners | LifeCycleListener
}

export type ProxiedDraftComponent = Draft<ProxiedComponent>

export interface ProxiedComponent extends Omit<NOODLComponent, 'children'> {
  blueprint?: any
  custom?: boolean
  id?: string
  itemObject?: any
  items?: any[]
  listId?: string
  listItem?: any
  listItemIndex?: number
  listObject?: '' | any[]
  noodlType?: NOODLComponentType
  parentId?: string
  style?: Style
  children?:
    | string
    | number
    | NOODLComponent
    | NOODLComponentProps
    | ProxiedComponent
    | (NOODLComponent | NOODLComponentProps | ProxiedComponent)[]
}

export interface ResolveComponent<T = any> {
  (component: IComponentTypeInstance): T
}

export type ResolverFn<T extends NOODLComponentType = NOODLComponentType> = ((
  component: IComponentTypeInstance,
  resolverConsumerOptions: ConsumerOptions,
) => void) & {
  getChildren?: Function
}

export interface ResolverOptions
  extends LifeCycleListeners,
    INOODLUiStateHelpers {
  context: ResolverContext
  parser: RootsParser
  resolveComponent: ResolveComponent
}

export interface ConsumerOptions {
  component: IComponentTypeInstance
  context: ResolverContext
  createActionChainHandler: INOODLUi['createActionChainHandler']
  createSrc(path: Parameters<INOODLUi['createSrc']>[0]): string
  getBaseStyles(styles?: Style): Partial<Style>
  getPageObject: INOODLUiStateHelpers['getPageObject']
  getResolvers(): INOODLUi['getResolvers']
  getRoot(): { [key: string]: any }
  getState: INOODLUiStateHelpers['getState']
  page: string
  parser: ResolverOptions['parser']
  resolveComponent(
    c: NOODLComponentType | IComponentTypeInstance | IComponentTypeObject,
  ): IComponentTypeInstance
  resolveComponent(
    c: (NOODLComponentType | IComponentTypeInstance | IComponentTypeObject)[],
  ): IComponentTypeInstance[]
  resolveComponentDeep: INOODLUi['resolveComponents']
  showDataKey: boolean
}

export interface ResolverContext {
  assetsUrl: string
  page: string
  root: Record<string, any>
  viewport: IViewport | undefined
}

export interface Page {
  name: string
  object?: null | NOODLPageObject
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface RootsParser<Root extends {} = any> {
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

/* -------------------------------------------------------
    ---- ACTIONS
  -------------------------------------------------------- */

/* -------------------------------------------------------
  ---- RAW/ORIGINAL NOODL TYPE DEFINITIONS
-------------------------------------------------------- */

export interface NOODLPageObject {
  components: NOODLComponent[]
  lastTop?: string
  listData?: { [key: string]: any }
  final?: string // ex: "..save"
  init?: string | string[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  module?: string
  pageNumber?: string
  [key: string]: any
}

export interface NOODLComponent {
  type?: NOODLComponentType
  style?: Style
  children?: NOODLComponent[]
  controls?: boolean
  dataKey?: string
  contentType?: NOODLContentType
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
  [key: string]: any
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

/* -------------------------------------------------------
  ---- OTHER
-------------------------------------------------------- */

export type GotoURL = string

export interface IfObject {
  if: [any, any, any]
}

export type Path = string | EmitActionObject | IfObject

export interface IViewport {
  width: number | undefined
  height: number | undefined
  isValid(): boolean
  onResize: IViewportListener | undefined
}

export interface IViewportOptions {
  width: number
  height: number
}

export interface IViewportListener {
  (
    viewport: IViewportOptions & {
      previousWidth: number | undefined
      previousHeight: number | undefined
    },
  ): Promise<any> | any
}
