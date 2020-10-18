import { Draft } from 'immer'
import Viewport from './Viewport'
import {
  actionTypes,
  componentTypes,
  contentTypes,
  event,
  eventTypes,
} from './constants'

export interface INOODLUi {
  assetsUrl: string
  initialized: boolean
  page: Page
  parser: RootsParser
  root: { [key: string]: any }
  addListItem(parent: IComponent, component: IComponent): this
  init(opts: { log?: boolean; viewport?: Viewport }): this
  createActionChain(
    actions: NOODLActionObject[],
    { trigger }: { trigger?: NOODLActionTriggerType; [key: string]: any },
  ): (event: Event) => Promise<any>
  on(eventName: string, cb: (...args: any[]) => any, cb2?: any): this
  off(eventName: string, cb: (...args: any[]) => any): this
  getContext(): ResolverContext
  getConsumerOptions(include?: { [key: string]: any }): ConsumerOptions
  getLists(): any[]
  getList(component: string | IComponent): Map<IComponent, IComponent>
  getListItem(component: IComponent): any
  getNode(component: IComponent | string): IComponent | null
  getNodes(): IComponent[]
  getResolverOptions(include?: { [key: string]: any }): ResolverOptions
  getState(): INOODLUiState
  getStateHelpers(): INOODLUiStateHelpers
  getStateGetters(): INOODLUiStateGetters
  getStateSetters(): INOODLUiStateSetters
  reset(): this
  resolveComponents(
    components: ComponentType | ComponentType[] | Page['object'],
  ): IComponent | IComponent[] | null
  setAssetsUrl(assetsUrl: string): this
  setList(component: IComponent, list: any): this
  setNode(component: IComponent): this
  setPage(page: string): this
  setRoot(key: string | { [key: string]: any }, value?: any): this
  setViewport(viewport: IViewport | null): this
  use(mod: IResolver | IResolver[] | IViewport): this
  unuse(mod: any): this
}

export interface INOODLUiState {
  nodes: Map<IComponent, IComponent>
  lists: Map<IComponent, Map<IComponent, any>>
  showDataKey: boolean
}

export type INOODLUiStateHelpers = INOODLUiStateGetters & INOODLUiStateSetters

export type INOODLUiStateGetters = Pick<
  INOODLUi,
  'getLists' | 'getList' | 'getListItem' | 'getState' | 'getNodes' | 'getNode'
>

export type INOODLUiStateSetters = Pick<INOODLUi, 'setNode' | 'setList'>

export type IComponentConstructor = new (component: ComponentType) => IComponent

export interface IComponent {
  action: NOODLActionObject
  id: string
  length: number
  original: NOODLComponent | NOODLComponentProps | ProxiedComponent
  status: 'drafting' | 'idle' | 'idle/resolved'
  stylesTouched: string[]
  stylesUntouched: string[]
  style: NOODLStyle
  touched: string[]
  untouched: string[]
  type: NOODLComponentType
  assign(
    key: string | { [key: string]: any },
    value?: { [key: string]: any },
  ): this
  assignStyles(styles: Partial<NOODLStyle>): this
  child(index?: number): IComponent | undefined
  children(): IComponent[]
  createChild(props: ComponentType): IComponent
  done(options?: { mergeUntouched?: boolean }): this
  draft(): this
  get<K extends keyof ProxiedComponent>(
    key: K,
    styleKey?: keyof NOODLStyle,
  ): ProxiedComponent[K]
  get<K extends keyof ProxiedComponent>(
    key: K[],
    styleKey?: keyof NOODLStyle,
  ): Record<K, ProxiedComponent[K]>
  getStyle<K extends keyof NOODLStyle>(styleKey: K): NOODLStyle[K]
  has(key: string, styleKey?: keyof NOODLStyle): boolean
  hasParent(): boolean
  hasStyle<K extends keyof NOODLStyle>(styleKey: K): boolean
  isHandled(key: string): boolean
  isTouched(key: string): boolean
  isStyleTouched(styleKey: string): boolean
  isStyleHandled(key: string): boolean
  merge(key: string | { [key: string]: any }, value?: any): this
  noodlType: NOODLComponentType
  on(eventName: IComponentEventId, cb: Function): this
  off(eventName: IComponentEventId, cb: Function): this
  parent(): IComponent | null
  remove(key: string, styleKey?: keyof NOODLStyle): this
  removeChild(child?: IComponent | number): this
  removeStyle<K extends keyof NOODLStyle>(styleKey: K): this
  set(key: string, value?: any, styleChanges?: any): this
  setParent(parent: IComponent | null): this
  setStyle<K extends keyof NOODLStyle>(styleKey: K, value: any): this
  snapshot(): (ProxiedComponent | NOODLComponentProps) & {
    _touched: string[]
    _untouched: string[]
    _touchedStyles: string[]
    _untouchedStyles: string[]
    _handled: string[]
    _unhandled: string[]
    noodlType: NOODLComponentType | undefined
  }
  toJS(): ProxiedComponent
  toString(): string
  touch(key: string): this
  touchStyle(styleKey: string): this
}

export interface IResolver {
  setResolver(resolver: ResolverFn): this
  resolve(component: IComponent, options: ConsumerOptions): this
}

export type ComponentType =
  | IComponent
  | NOODLComponent
  | NOODLComponentProps
  | ProxiedComponent

export interface NOODLPage {
  [pageName: string]: NOODLPageObject
}

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

export type NOODLActionType = typeof actionTypes[number]
export type NOODLActionTriggerType = typeof eventTypes[number]
export type NOODLComponentType = typeof componentTypes[number] | 'br'
export type NOODLContentType = typeof contentTypes[number]

export interface NOODLComponent {
  type?: NOODLComponentType
  style?: NOODLStyle
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
  onClick?: NOODLActionObject[]
  onHover?: NOODLActionObject[]
  options?: string[]
  path?: string | NOODLIfObject
  pathSelected?: string
  poster?: string
  placeholder?: string
  resource?: string
  required?: 'true' | 'false' | boolean
  selected?: string
  src?: string // our custom key
  text?: string | number
  textSelectd?: string
  textBoard?: NOODLTextBoard
  'text=func'?: any
  viewTag?: string
  videoFormat?: string
  [key: string]: any
}

export interface NOODLPluginComponent extends NOODLComponent {
  type: 'plugin'
  path: string
}

export interface NOODLIfObject {
  if: [any, any, any]
}

/* -------------------------------------------------------
    ---- ACTIONS
  -------------------------------------------------------- */

export type NOODLGotoAction = NOODLGotoURL | NOODLGotoObject

export type NOODLGotoURL = string

export interface NOODLGotoObject {
  destination?: string
  [key: string]: any
}

export type NOODLActionObject =
  | NOODLBuiltInObject
  | NOODLEvalObject
  | NOODLPageJumpObject
  | NOODLPopupBaseObject
  | NOODLPopupDismissObject
  | NOODLRefreshObject
  | NOODLSaveObject
  | NOODLUpdateObject

export interface NOODLActionObjectBase {
  actionType: NOODLActionType
  [key: string]: any
}

export interface NOODLBuiltInObject extends NOODLActionObjectBase {
  actionType: 'builtIn'
  funcName: string
}

export interface NOODLEvalObject extends NOODLActionObjectBase {
  actionType: 'evalObject'
  object?: any
  [key: string]: any
}

export interface NOODLPageJumpObject extends NOODLActionObjectBase {
  actionType: 'pageJump'
  destination: string
}

export interface NOODLRefreshObject extends NOODLActionObjectBase {
  actionType: 'refresh'
}

export interface NOODLSaveObject extends NOODLActionObjectBase {
  actionType: 'saveObject'
  object: [string, (...args: any[]) => any] | ((...args: any[]) => any)
}

export type NOODLUpdateObject<T = any> =
  | {
      actionType: 'updateObject'
      object: T
    }
  | {
      actionType: 'updateObject'
      dataKey: string
      dataObject: string
    }

export interface NOODLPopupBaseObject extends NOODLActionObjectBase {
  actionType: 'popUp'
  popUpView: string
}

export interface NOODLPopupDismissObject extends NOODLActionObjectBase {
  actionType: 'popUpDismiss'
  popUpView: string
}

/* -------------------------------------------------------
  ---- STYLING
-------------------------------------------------------- */

export interface NOODLStyle {
  align?: NOODLStyleAlign
  axis?: 'horizontal' | 'vertical'
  activeColor?: string // ex: ".colorTheme.highLightColor"
  border?: NOODLStyleBorderObject
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
  textAlign?: NOODLStyleTextAlign
  textColor?: string
  top?: string
  width?: string
  shadow?: string // ex: "false"
  [styleKey: string]: any
}

export interface NOODLStyleBorderObject {
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | 1 | 2 | 3 | 4 | 5 | 6 | 7
  width?: string | number
  color?: string | number
  line?: string // ex: "solid"
}

export type NOODLStyleTextAlign =
  | 'left'
  | 'center'
  | 'right'
  | NOODLStyleAlign
  | NOODLStyleTextAlignObject

export interface NOODLStyleTextAlignObject {
  x?: 'left' | 'center' | 'right'
  y?: 'left' | 'center' | 'right'
}

export type NOODLStyleAlign = 'centerX' | 'centerY'

export type NOODLTextBoard = (
  | NOODLTextBoardTextObject
  | NOODLTextBoardBreakLine
)[]

export type NOODLTextBoardBreakLine = 'br'

export interface NOODLTextBoardTextObject {
  text?: string
  color?: string
}

/* -------------------------------------------------------
---- LIB TYPES
-------------------------------------------------------- */

export type NOODLComponentProps = Omit<
  NOODLComponent,
  'children' | 'options' | 'type'
> & {
  'data-key'?: string
  'data-listdata'?: any[]
  'data-listid'?: any
  'data-name'?: string
  'data-value'?: string
  'data-ux'?: string
  custom?: boolean
  children?: string | number | NOODLComponentProps | NOODLComponentProps[]
  noodlType: NOODLComponentType
  id: string
  items?: any[]
  options?: SelectOption[]
  type: keyof Omit<HTMLElementTagNameMap, 'object'>
  [key: string]: any
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

/* -------------------------------------------------------
  ---- CONSTANTS
-------------------------------------------------------- */

export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type IComponentEventAlias = keyof typeof event.IComponent
export type IComponentEventId = typeof event.IComponent[IComponentEventAlias]
export type EventId = ActionEventId | ActionChainEventId | IComponentEventId

/* -------------------------------------------------------
  ---- LIB ACTIONS / ACTION CHAIN
-------------------------------------------------------- */

export type ActionChainStatus =
  | null
  | 'in.progress'
  | 'done'
  | 'timed-out'
  | { aborted: boolean | { reasons: string[] } }
  | { error: Error }

export interface ActionChainSnapshot<Actions extends any[]> {
  currentAction: Actions[number]
  original: NOODLActionObject[]
  queue: Actions
  status: ActionChainStatus
}

export interface ActionChainCallbackOptions<Actions extends any[]> {
  abort(reason?: string | string[]): Promise<any>
  error?: Error
  event: EventTarget | undefined
  parser?: ResolverOptions['parser']
  snapshot: ActionChainSnapshot<Actions>
}

export interface ActionSnapshot<OriginalAction = any> {
  actionType: string
  hasExecutor: boolean
  id: string
  original: OriginalAction
  status: ActionStatus
  timeout: {
    running: boolean
    remaining: number | null
  }
}

export type ActionStatus =
  | null
  | 'pending'
  | 'resolved'
  | 'aborted'
  | 'error'
  | 'timed-out'

export type ParsedChainActionUpdateObject = NOODLUpdateObject<
  ((...args: any[]) => Promise<any>)[] | ((...args: any[]) => Promise<any>)
>

/* -------------------------------------------------------
  ---- LIB | LISTENERS
-------------------------------------------------------- */

export interface ActionChainActionCallback<ActionObject = any> {
  (
    action: ActionObject,
    options: ActionChainActionCallbackOptions,
    args?: { file?: File; [key: string]: any },
  ): ActionChainActionCallbackReturnType
}

export interface ActionChainActionCallbackOptions<T extends IComponent = any>
  extends INOODLUiStateGetters {
  abort?(
    reason?: string | string[],
  ): Promise<IteratorYieldResult<any> | IteratorReturnResult<any> | undefined>
  component: T
  context: ConsumerOptions['context']
  dataValues?: Record<string, any>
  event?: Event
  error?: Error
  parser: ConsumerOptions['parser']
  snapshot: ActionChainSnapshot<any[]>
  trigger?: NOODLActionTriggerType
}

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

export type ActionChainLifeCycleComponentListeners = Record<
  NOODLComponentType,
  LifeCycleListener
> & {
  finally?: LifeCycleListener
}

export type ActionChainActionCallbackReturnType =
  | Promise<'abort' | undefined | void>
  | 'abort'
  | undefined
  | void

export type OnEvalObject = ActionChainActionCallback<NOODLEvalObject>

export type OnGoto = ActionChainActionCallback<NOODLGotoURL | NOODLGotoObject>

export type OnPageJump = ActionChainActionCallback<NOODLPageJumpObject>

export type OnPopup = ActionChainActionCallback<NOODLPopupBaseObject>

export type OnPopupDismiss = ActionChainActionCallback<NOODLPopupDismissObject>

export interface OnSaveObject {
  (action: NOODLSaveObject, options: ActionChainActionCallbackOptions): Promise<
    any
  >
}

export interface OnRefresh {
  (
    action: NOODLRefreshObject,
    options: ActionChainActionCallbackOptions,
  ): Promise<any>
}

export interface OnUpdateObject {
  (
    action: ParsedChainActionUpdateObject,
    options: ActionChainActionCallbackOptions,
  ): Promise<any>
}

// Listed in order of invocation
export interface LifeCycleListeners {
  onAction?: {
    builtIn?: {
      [funcName: string]: ActionChainActionCallback<NOODLBuiltInObject>
    }
    evalObject?: ActionChainActionCallback<NOODLEvalObject>
    goto?: ActionChainActionCallback<NOODLGotoURL | NOODLGotoObject>
    pageJump?: ActionChainActionCallback<NOODLPageJumpObject>
    popUp?: ActionChainActionCallback<NOODLPopupBaseObject>
    popUpDismiss?: ActionChainActionCallback<NOODLPopupDismissObject>
    saveObject?: (
      action: NOODLSaveObject,
      options: ActionChainActionCallbackOptions,
    ) => Promise<any>
    refresh?(
      action: NOODLRefreshObject,
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
  style?: NOODLStyle
  children?:
    | string
    | number
    | NOODLComponent
    | NOODLComponent[]
    | NOODLComponentProps
    | NOODLComponentProps[]
}

export interface ResolveComponent<T = any> {
  (component: ProxiedComponent, options: ResolverOptions): T
}

export type ResolverFn = ((
  component: IComponent,
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

export interface ConsumerOptions
  extends INOODLUiStateHelpers,
    Pick<
      INOODLUi,
      | 'createActionChain'
      | 'createSrc'
      | 'getNode'
      | 'getNodes'
      | 'getList'
      | 'getListItem'
      | 'getState'
      | 'setConsumerData'
      | 'setNode'
      | 'setList'
    > {
  context: ResolverContext
  parser: ResolverOptions['parser']
  resolveComponent: ResolveComponent
  showDataKey: boolean
}

export interface ResolverContext {
  assetsUrl: string
  page: undefined | NOODLPageObject
  roots: Record<string, any>
  viewport: IViewport | undefined
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

export interface ViewportListener {
  (
    viewport: ViewportOptions & {
      previousWidth: number | undefined
      previousHeight: number | undefined
    },
  ): Promise<any> | any
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
