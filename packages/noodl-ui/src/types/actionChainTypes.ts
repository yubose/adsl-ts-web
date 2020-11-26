import Action from '../Action'
import ActionChain from '../ActionChain'
import {
  ConsumerOptions,
  INOODLUi,
  INOODLUiStateGetters,
  LifeCycleListener,
  NOODLPageObject,
  ResolverContext,
  ResolverOptions,
  RootsParser,
} from './types'
import {
  IActionChainEmitTrigger,
  NOODLActionType,
  NOODLActionTriggerType,
  NOODLComponentType,
  ResolveEmitTrigger,
} from './constantTypes'
import { IComponentTypeInstance } from './componentTypes'
import { ActionObject, BuiltInObject, UpdateActionObject } from './actionTypes'

export interface IActionChain<
  ActionObjects extends ActionObject[] = any[],
  C extends IComponentTypeInstance = any
> {
  abort(reason?: string | string[]): Promise<void>
  actions: ActionObject[]
  actionsContext: IActionChainContext
  component: C
  createGenerator(): ActionChain<ActionObjects, C>['gen']
  current: Action
  execute(event?: any): Promise<any>
  intermediary: Action[]
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
  gen: AsyncGenerator<
    { action: Action | undefined; results: IActionChainGeneratorResult[] },
    IActionChainGeneratorResult[],
    any
  >
  loadQueue(): this
  loadGen(): this
  next(
    args?: any,
  ): Promise<
    IteratorResult<
      { action: Action | undefined; results: IActionChainGeneratorResult[] },
      IActionChainGeneratorResult[]
    >
  >
  status:
    | null
    | 'in.progress'
    | 'done'
    | 'timed-out'
    | { aborted: boolean | { reasons: string[] } }
    | { error: Error }

  useAction(action: IActionChainUseObject): this
  useAction(action: IActionChainUseObject[]): this
  useBuiltIn(
    action: IActionChainUseBuiltInObject | IActionChainUseBuiltInObject[],
  ): this
}

export type ActionChainConstructorArgs<
  ActionObjects extends ActionObject[],
  C extends IComponentTypeInstance
> = [
  actions: ActionObjects,
  opts: {
    actionsContext?: IActionChainContext
    component: C
    pageName?: string
    pageObject?: NOODLPageObject
    trigger: IActionChainEmitTrigger
  },
]

export interface IActionChainGeneratorResult {
  action: Action | undefined
  result: any
}

export interface IActionChainContext {
  noodlui: INOODLUi
}

export type IActionChainUseObject =
  | IActionChainUseObjectBase<any, any>
  | IActionChainUseBuiltInObject

export interface IActionChainUseObjectBase<A extends ActionObject, C> {
  actionType: NOODLActionType
  context?: C
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

export interface ActionChainSnapshot<Actions extends any[]> {
  currentAction: Actions[number]
  original: ActionObject[]
  queue: Actions
  status: ActionChain<Actions, IComponentTypeInstance>['status']
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
