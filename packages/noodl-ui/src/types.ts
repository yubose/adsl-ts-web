import { Draft } from 'immer'
import { AbortExecuteError } from './errors'
import Viewport from './Viewport'
import {
  actionChainEmitTriggers,
  actionTypes,
  componentTypes,
  contentTypes,
  event,
  eventTypes,
  emitTriggers,
  resolveEmitTriggers,
} from './constants'

export interface NOODLPage<K extends string = string> {
  [pageName: K]: PageObject
}

export interface PageObject {
  components: NOODLComponent[]
  lastTop?: string
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
}

/* -------------------------------------------------------
    ---- ACTIONS
  -------------------------------------------------------- */

export interface ActionObject {
  actionType: NOODLActionType
  [key: string]: any
}

export interface GotoObject {
  destination?: string
  [key: string]: any
}

export interface BuiltInObject extends ActionObject {
  actionType: 'builtIn'
  funcName: string
}

export interface EvalObject extends ActionObject {
  actionType: 'evalObject'
  object?: Function | IfObject
  [key: string]: any
}

export interface PageJumpObject extends ActionObject {
  actionType: 'pageJump'
  destination: string
}

export interface PopupObject<K = any> extends ActionObject {
  actionType: 'popUp'
  popUpView: K
}

export interface PopupDismissObject extends ActionObject {
  actionType: 'popUpDismiss'
  popUpView: string
}

export interface RefreshObject extends ActionObject {
  actionType: 'refresh'
}

export interface SaveObject extends ActionObject {
  actionType: 'saveObject'
  object: [string, (...args: any[]) => any] | ((...args: any[]) => any)
}

/* -------------------------------------------------------
  ---- CONSTANTS
-------------------------------------------------------- */

export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type IActionChainEmitTrigger = typeof actionChainEmitTriggers[number]
export type IListEventObject = typeof event.component.list
export type IListEventAlias = keyof IListEventObject
export type IListEventId = IListEventObject[IListEventAlias]
export type IListItemEventObject = typeof event.component.listItem
export type IListItemEventAlias = keyof IListItemEventObject
export type IListItemEventId = IListItemEventObject[IListItemEventAlias]
export type EventId = ActionEventId | ActionChainEventId
export type ResolveEmitTrigger = typeof resolveEmitTriggers[number]

export interface INOODLUi {
  actionsContext: IActionChain['actionsContext']
  assetsUrl: string
  initialized: boolean
  page: string
  root: { [key: string]: any }
  init(opts: { viewport?: Viewport }): this
  createActionChainHandler(
    actions: IActionObject[],
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

export type IComponentConstructor = new (
  component: IComponentType,
) => IComponentTypeInstance

export interface IComponent<K = NOODLComponentType> {
  id: string
  type: K
  noodlType: NOODLComponentType
  style: Style
  action: ActionObject
  length: number
  original: NOODLComponent | NOODLComponentProps | ProxiedComponent
  status: 'drafting' | 'idle' | 'idle/resolved'
  stylesTouched: string[]
  stylesUntouched: string[]
  touched: string[]
  untouched: string[]
  assign(
    key: string | { [key: string]: any },
    value?: { [key: string]: any },
  ): this
  assignStyles(styles: Partial<Style>): this
  broadcast(cb: (child: IComponentTypeInstance) => void): this
  child(index?: number): IComponentTypeInstance | undefined
  children(): IComponentTypeInstance[]
  createChild<C extends IComponentTypeInstance>(child: C): C
  hasChild(childId: string): boolean
  hasChild(child: IComponentTypeInstance): boolean
  removeChild(index: number): IComponentTypeInstance | undefined
  removeChild(id: string): IComponentTypeInstance | undefined
  removeChild(child: IComponentTypeInstance): IComponent | undefined
  removeChild(): IComponentTypeInstance | undefined
  done(options?: { mergeUntouched?: boolean }): this
  draft(): this
  get<K extends keyof IComponentTypeObject>(
    key: K | K[],
    styleKey?: keyof Style,
  ): IComponentTypeObject[K] | Record<K, IComponentTypeObject[K]>
  getStyle<K extends keyof Style>(styleKey: K): Style[K]
  has(key: string, styleKey?: keyof Style): boolean
  hasParent(): boolean
  hasStyle<K extends keyof Style>(styleKey: K): boolean
  isHandled(key: string): boolean
  isTouched(key: string): boolean
  isStyleTouched(styleKey: string): boolean
  isStyleHandled(key: string): boolean
  keys: string[]
  merge(key: string | { [key: string]: any }, value?: any): this
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent(): IComponentTypeInstance | null
  remove(key: string, styleKey?: keyof Style): this
  removeStyle<K extends keyof Style>(styleKey: K): this
  set<K extends keyof IComponentTypeObject>(
    key: K,
    value?: any,
    styleChanges?: any,
  ): this
  set<O extends IComponentTypeObject>(
    key: O,
    value?: any,
    styleChanges?: any,
  ): this
  setParent(parent: IComponentTypeInstance): this
  setStyle<K extends keyof Style>(styleKey: K, value: any): this
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

export type IComponentType =
  | IComponentTypeInstance
  | IComponentTypeObject
  | NOODLComponentType

export type IComponentTypeInstance = IComponent

export type IComponentTypeObject =
  | NOODLComponent
  | NOODLComponentProps
  | ProxiedComponent

export interface IList<
  ListData extends any[] = any[],
  DataObject extends ListData[number] = ListData[number]
> extends IComponent {
  noodlType: 'list'
  children(): IListItem[]
  exists(childId: string): boolean
  exists(child: IListItem): boolean
  find(child: string | number | IListItem): IListItem | undefined
  getBlueprint(): IListBlueprint
  setBlueprint(blueprint: IListBlueprint): this
  getData(opts?: { fromNodes?: boolean }): ListData
  hasCb(eventName: IListEventId, fn: Function): boolean
  addDataObject(
    dataObject: DataObject,
  ): IListDataObjectOperationResult<DataObject>
  getDataObject(
    index: number | Function,
  ): IListDataObjectOperationResult<DataObject>
  removeDataObject(
    dataObject:
      | number
      | DataObject
      | ((dataObject: DataObject | null) => boolean),
  ): IListDataObjectOperationResult<DataObject>
  updateDataObject<DataObject = any>(
    index: number | Function,
    dataObject: DataObject | null,
  ): IListDataObjectOperationResult<DataObject>
  iteratorVar: string
  listId: string
  length: number
  find(id: string): IListItem | undefined
  find(index: number): IListItem | undefined
  find(inst: IListItem): IListItem | undefined
  find(
    pred: (listItem: IListItem, index: number) => boolean,
  ): IListItem | undefined
  emit(eventName: 'blueprint', blueprint: IListBlueprint): this
  emit(eventName: 'redraw'): this
  emit<E extends Exclude<IListEventId, 'blueprint' | 'redraw'>>(
    eventName: E,
    result: IListDataObjectOperationResult,
    args: IListDataObjectEventHandlerOptions,
  ): this
  on(eventName: 'blueprint', cb: (blueprint: IListBlueprint) => void): this
  on(eventName: 'redraw', cb: () => void): this
  on(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'remove.data.object'
      | 'retrieve.data.object',
    cb: (
      result: IListDataObjectOperationResult,
      args: IListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  toJS(): {
    blueprint: IListBlueprint
    children: ReturnType<IListItem['toJS']>[]
    listId: string
    listItemCount: number
    listObject: ListData
    iteratorVar: string
    style: Style | undefined
  }
}

export type IListBlueprint = Partial<ProxiedComponent> & {
  listId: string
  iteratorVar: string
}

export interface IListDataObjectOperationResult<DataObject = any> {
  index: null | number
  dataObject: DataObject | null
  success: boolean
  error?: string
}

export interface IListDataObjectEventHandlerOptions {
  blueprint: IListBlueprint
  listId: string
  iteratorVar: string
  nodes: IListItem[]
}

export interface IListItem<DataObject = any> extends IComponent {
  noodlType: 'listItem'
  listId: string
  listIndex: number | null
  iteratorVar: string
  getDataObject(): DataObject | undefined
  setDataObject(data: DataObject): this
  redraw(): this
  toJS(): {
    children: ReturnType<IComponentTypeInstance['toJS']>[]
    dataObject: DataObject
    listId: string
    listIndex: number | null
    iteratorVar: string
    style: Style | undefined
  }
  // on(eventName: 'redraw', (args: IListItemRedrawArgs) => void): this
  // on(eventName: 'redrawed', (args: IListItemRedrawedArgs) => void): this
  emit(eventName: 'redraw', args: IListItemRedrawArgs): this
  emit(eventName: 'redrawed', args: IListItemRedrawedArgs): this
}

export interface IListItemRedrawArgs {
  props: Partial<IComponentTypeObject>
}

export interface IListItemRedrawedArgs {
  props: IListItemRedrawArgs['props']
  listItem: IListItem
}

export interface ITextboard extends IComponent {}

export interface IResolver {
  internal: boolean
  setResolver(resolver: ResolverFn): this
  resolve: ResolverFn
}

/* -------------------------------------------------------
  ---- ACTIONS / ACTION CHAIN
-------------------------------------------------------- */

export type IActionChainConstructorArgs<
  ActionObjects extends ActionObject[],
  C extends IComponentTypeInstance
> = [
  actions: ActionObjects,
  opts: {
    actionsContext?: IActionChainContext
    component: C
    pageName?: string
    pageObject?: PageObject
    trigger: IActionChainEmitTrigger
  },
]

export interface IActionChain<
  ActionObjects extends ActionObject[] = any[],
  C extends IComponentTypeInstance = any
> {
  abort(reason?: string | string[]): Promise<void>
  actions: ActionObject[]
  actionsContext: IActionChainContext
  component: C
  createGenerator(): IActionChain['gen']
  current: { action: IAction<ActionObjects[number]> | undefined; index: number }
  execute(event?: any): Promise<any>
  intermediary: IAction<ActionObjects[number]>[]
  fns: {
    action: Partial<
      Record<
        NOODLActionType,
        ActionChainActionCallback<ActionObjects[number]>[]
      >
    >
    builtIn: {
      [funcName: string]: ActionChainActionCallback<ActionObjects[number]>[]
    }
  }
  getDefaultCallbackArgs(): {
    actions: ActionObjects[]
    component: C
    pageName: string
    pageObject: PageObject | null
    queue: IAction[]
    snapshot: ActionChainSnapshot<ActionObjects>
    status: IActionChain['status']
  }
  gen: AsyncGenerator<
    {
      action: IAction<ActionObject> | undefined
      results: {
        action: IAction | undefined
        result: any
      }[]
    },
    { action: IAction | undefined; result: any }[],
    any
  >
  getQueue(): IAction[]
  getSnapshot(): ActionChainSnapshot<ActionObjects>
  loadQueue(): this
  loadGen(): this
  status:
    | null
    | 'in.progress'
    | 'done'
    | 'timed-out'
    | { aborted: boolean | { reasons: string[] } }
    | { error: Error }

  // onBuiltinMissing?: LifeCycleListeners['onBuiltinMissing']
  // onChainStart?: LifeCycleListeners['onChainStart']
  // onChainEnd?: LifeCycleListeners['onChainEnd']
  // onChainError?: LifeCycleListeners['onChainError']
  // onChainAborted?: LifeCycleListeners['onChainAborted']
  // onAfterResolve?: LifeCycleListeners['onAfterResolve']
  useAction(action: IActionChainUseObject): this
  useAction(action: IActionChainUseObject[]): this
  useBuiltIn(
    action: IActionChainUseBuiltInObject | IActionChainUseBuiltInObject[],
  ): this
}

export interface IActionChainContext {
  emitCall?: Function
  noodlui: INOODLUi
}

export interface IActionChainBuildOptions {
  trigger?: NOODLActionTriggerType
  [key: string]: any
}

export type IActionChainUseObject =
  | IActionChainUseObjectBase<any>
  | IActionChainUseBuiltInObject

export interface IActionChainUseObjectBase<A extends ActionObject> {
  actionType: NOODLActionType
  context?: any
  fn: ActionChainActionCallback<A> | ActionChainActionCallback<A>[]
  trigger?: IActionChainEmitTrigger | ResolveEmitTrigger
}

export interface IActionChainUseBuiltInObject {
  actionType?: 'builtIn'
  funcName: string
  fn:
    | ActionChainActionCallback<BuiltInObject>
    | ActionChainActionCallback<BuiltInObject>[]
}

export interface IActionChainAddActionObject<
  S extends NOODLActionType = NOODLActionType
> {
  actionType: S
  fns: ActionChainActionCallback[]
}

export interface IAction<A extends ActionObject = ActionObject> {
  abort(reason: string | string[], callback?: IAction<A>['callback']): void
  actionType: A['actionType']
  callback: ((...args: any[]) => any) | undefined
  clearTimeout(): void
  clearInterval(): void
  error: null | Error
  execute<Args = any>(args?: Args): Promise<any>
  id: string
  isTimeoutRunning(): boolean
  getSnapshot(): IActionSnapshot<A>
  original: A
  result: any
  resultReturned: boolean
  status: IActionStatus
  timeoutDelay: number
  type: A['actionType']
  onPending(snapshot: IActionSnapshot): any
  onResolved(snapshot: IActionSnapshot): any
  onError(snapshot: IActionSnapshot): any
  onAbort(snapshot: IActionSnapshot): any
  onTimeout: any
}

export interface IActionCallback {
  (snapshot: IActionSnapshot, handlerOptions?: any): any
}

export interface IActionOptions<OriginalAction extends ActionObject = any> {
  callback?: IActionCallback
  id?: string
  onPending?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onResolved?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onTimeout?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onError?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onAbort?: (snapshot: IActionSnapshot<OriginalAction>) => any
  timeoutDelay?: number
}

export interface IActionSnapshot<OriginalAction = any> {
  actionType: string
  hasExecutor: boolean
  id: string
  original: OriginalAction
  status: IActionStatus
  timeout: {
    running: boolean
    remaining: number | null
  }
  result?: any
  error?: null | Error | AbortExecuteError
}

export type IActionStatus =
  | null
  | 'pending'
  | 'resolved'
  | 'aborted'
  | 'error'
  | 'timed-out'

export interface IBuiltIn<
  Func extends (...args: any[]) => any = (...args: any[]) => any,
  FuncName extends string = string
> {
  execute<Args extends any[]>(...args: Args): Promise<any>
  func: Func
  funcName: FuncName
}

export type NOODLComponentCreationType = string | number | IComponentType

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

/* -------------------------------------------------------
  ---- ACTION CHAIN
-------------------------------------------------------- */

export interface ActionChainSnapshot<Actions extends any[]> {
  currentAction: Actions[number]
  original: ActionObject[]
  queue: Actions
  status: IActionChain<Actions, IComponentTypeInstance>['status']
}

export interface ActionChainCallbackOptions<Actions extends any[] = any[]> {
  abort(reason?: string | string[]): Promise<any>
  error?: Error
  event: EventTarget | undefined
  parser?: ResolverOptions['parser']
  snapshot: ActionChainSnapshot<Actions>
  trigger: NOODLActionTriggerType
}

export interface ActionChainActionCallback<A = any> {
  (
    action: A,
    options: ActionChainActionCallbackOptions,
    args?: { file?: File; [key: string]: any },
  ): ActionChainActionCallbackReturnType
}

export interface ActionChainActionCallbackOptions<
  T extends IComponentTypeInstance = any
> extends INOODLUiStateGetters {
  abort?(
    reason?: string | string[],
  ): Promise<IteratorYieldResult<any> | IteratorReturnResult<any> | undefined>
  builtIn: Partial<Record<string, ActionChainCallbackOptions[]>>
  component: T
  context: ResolverContext
  createSrc: ConsumerOptions['createSrc']
  dataObject?: any
  event?: Event
  error?: Error
  parser: RootsParser
  snapshot: ActionChainSnapshot<any[]>
  trigger: NOODLActionTriggerType
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

export type ParsedChainActionUpdateObject = UpdateActionObject<
  ((...args: any[]) => Promise<any>)[] | ((...args: any[]) => Promise<any>)
>

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
    popUp?: ActionChainActionCallback<PopupObject<any>>
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
  getNode: INOODLUiStateHelpers['getNode']
  getNodes: INOODLUiStateHelpers['getNodes']
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
  roots: Record<string, any>
  viewport: IViewport | undefined
}

export interface Page {
  name: string
  object?: null | PageObject
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

export type IActionObject =
  | ActionObject
  | AnonymousObject
  | BuiltInObject
  | EmitActionObject
  | EvalObject
  | PageJumpObject
  | PopupObject
  | PopupDismissObject
  | RefreshObject
  | SaveObject
  | UpdateActionObject

export interface ActionObject {
  actionType: string
}

export interface AnonymousObject extends ActionObject {
  actionType: 'anonymous'
  fn?: Function
}

export interface BuiltInObject extends ActionObject {
  actionType: 'builtIn'
  funcName: string
}

export interface EmitActionObject extends ActionObject {
  emit: {
    actions: [any, any, any]
    dataKey: string | { [key: string]: string }
  }
}

export interface EvalObject extends ActionObject {
  actionType: 'evalObject'
  object?: Function | IfObject
}

export interface GotoObject extends ActionObject {
  destination?: string
}

export interface PageJumpObject extends ActionObject {
  actionType: 'pageJump'
  destination: string
}

export interface PopupObject extends ActionObject {
  actionType: 'popUp'
  popUpView: string
}

export interface PopupDismissObject extends ActionObject {
  actionType: 'popUpDismiss'
  popUpView: string
}

export interface RefreshObject extends ActionObject {
  actionType: 'refresh'
}

export interface SaveObject extends ActionObject {
  actionType: 'saveObject'
  object?: [string, (...args: any[]) => any] | ((...args: any[]) => any)
}

export type UpdateActionObject<T = any> = {
  actionType: 'updateObject'
  object?: T
}

/* -------------------------------------------------------
  ---- RAW/ORIGINAL NOODL TYPE DEFINITIONS
-------------------------------------------------------- */

export interface NOODLPage {
  [pageName: string]: PageObject
}

export interface PageObject {
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
  text?: string | number
  textSelectd?: string
  textBoard?: TextBoard
  'text=func'?: any
  viewTag?: string
  videoFormat?: string
  [key: string]: any
}

export type NOODLActionType = typeof actionTypes[number]
export type NOODLActionTriggerType = typeof eventTypes[number]
export type NOODLComponentType = typeof componentTypes[number] | 'br'
export type NOODLContentType = typeof contentTypes[number]
export type NOODLActionChainEmitTrigger = typeof actionChainEmitTriggers[number]
export type NOODLEmitTrigger = typeof emitTriggers[number]
export type NOODLResolveEmitTrigger = typeof resolveEmitTriggers[number]

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
