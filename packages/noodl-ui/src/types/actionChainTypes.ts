import Action from '../Action'
import ActionChain from '../ActionChain'
import Component from '../components/Base'
import NOODLUI from '../noodl-ui'
import {
  ConsumerOptions,
  PageObject,
  ResolverContext,
  Root,
  RootsParser,
  StateGetters,
} from './types'
import {
  ActionChainEmitTrigger,
  ActionType,
  ActionTriggerType,
  ResolveEmitTrigger,
} from './constantTypes'
import { ActionObject, BuiltInObject } from './actionTypes'

export type ActionChainConstructorArgs<C extends Component> = [
  actions: ActionObject[],
  opts: {
    actionsContext?: Partial<ActionChainContext>
    component: C
    getRoot(): Root
    pageName?: string
    pageObject?: PageObject
    trigger: ActionChainEmitTrigger
  },
]

export interface ActionChainGeneratorResult<A extends Action = any> {
  action: A | undefined
  result: any
}

export interface ActionChainContext {
  noodlui: NOODLUI
}

export type ActionChainUseObject =
  | ActionChainUseObjectBase
  | ActionChainUseBuiltInObject

export interface ActionChainUseObjectBase<
  A extends ActionObject = ActionObject,
  C = any
> {
  actionType: ActionType
  context?: C
  fn: ActionChainActionCallback<A> | ActionChainActionCallback<A>[]
  trigger?: ActionChainEmitTrigger | ResolveEmitTrigger
}

export interface ActionChainUseBuiltInObject {
  actionType?: 'builtIn'
  funcName: string
  fn:
    | ActionChainActionCallback<BuiltInObject>
    | ActionChainActionCallback<BuiltInObject>[]
}

export interface ActionChainAddActionObject<S extends ActionType = ActionType> {
  actionType: S
  fns: ActionChainActionCallback[]
}

export interface ActionChainSnapshot<Actions extends any[]> {
  currentAction: Actions[number]
  original: ActionObject[]
  queue: Actions
  status: ActionChain<Actions, Component>['status']
}

export interface ActionChainCallbackOptions<Actions extends any[] = any[]> {
  abort(reason?: string | string[]): Promise<any>
  error?: Error
  event: EventTarget | undefined
  parser?: RootsParser
  snapshot: ActionChainSnapshot<Actions>
  trigger: ActionTriggerType
}

export interface ActionChainActionCallback<A extends ActionObject = any> {
  (action: A, options: ActionChainActionCallbackOptions): Promise<any>
}

export interface ActionChainActionCallbackOptions<T extends Component = any>
  extends StateGetters {
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
  getAssetsUrl: ConsumerOptions['getAssetsUrl']
  getRoot: ConsumerOptions['getRoot']
  getPageObject: ConsumerOptions['getPageObject']
  page: string
  parser: RootsParser
  snapshot: ActionChainSnapshot<any[]>
  trigger: ActionTriggerType
}
