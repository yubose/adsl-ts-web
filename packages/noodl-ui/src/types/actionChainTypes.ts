import Action from '../Action'
import ActionChain from '../ActionChain'
import Component from '../components/Base'
import NOODLUI from '../noodl-ui'
import { ConsumerOptions, PageObject, Root, StateGetters } from './types'
import {
  ActionChainEmitTrigger,
  ActionType,
  ActionTriggerType,
  ResolveEmitTrigger,
} from './constantTypes'
import { ActionObject, BuiltInObject, EmitActionObject } from './actionTypes'
import { EmitObject } from '.'
import EmitAction from '../Action/EmitAction'

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

export interface ActionChainGeneratorResult<
  A extends Action<ActionObject> | EmitAction<EmitActionObject> = any
> {
  action: A | undefined
  result: any
}

export interface ActionChainContext<SDK = any> {
  noodl?: SDK
  noodlui: NOODLUI
  [key: string]: any
}

export type ActionChainUseObject =
  | ActionChainUseObjectBase
  | ActionChainUseBuiltInObject

export interface ActionChainUseObjectBase<
  A extends Action<ActionObject> = Action<ActionObject>,
  NoodlClient = any
> {
  actionType: ActionType
  context?: { noodl: NoodlClient }
  fn: ActionChainActionCallback<A>
  trigger?: ActionChainEmitTrigger | ResolveEmitTrigger
}

export interface ActionChainUseBuiltInObject {
  actionType?: 'builtIn'
  funcName: string
  fn:
    | ActionChainActionCallback<Action<BuiltInObject>>
    | ActionChainActionCallback<Action<BuiltInObject>>[]
}

export interface ActionChainAddActionObject<S extends ActionType = ActionType> {
  actionType: S
  fns: ActionChainActionCallback[]
}

export interface ActionChainSnapshot {
  currentAction: Action<ActionObject> | EmitAction<EmitActionObject>
  original: ActionObject[]
  queue: (Action<ActionObject> | EmitAction<EmitActionObject>)[]
  status: ActionChain<ActionObject[]>['status']
}

export interface ActionChainCallbackOptions {
  abort(reason?: string | string[]): Promise<any>
  error?: Error
  event: EventTarget | undefined
  snapshot: ActionChainSnapshot
  trigger: ActionTriggerType
}

export interface ActionChainActionCallback<
  A extends Action<ActionObject> | EmitAction<EmitActionObject> = any
> {
  (
    action: A,
    options: ActionConsumerCallbackOptions,
    actionsContext: ActionChainContext,
  ): Promise<any> | void
}
export interface ActionChainActionCallback<
  A extends Action<ActionObject> | EmitAction<EmitActionObject> = any
> {
  (
    action: A,
    options: ActionConsumerCallbackOptions,
    actionsContext: ActionChainContext,
  ): Promise<any> | void
}

export interface ActionConsumerCallbackOptions
  extends StateGetters,
    Pick<
      ConsumerOptions,
      | 'component'
      | 'context'
      | 'getAssetsUrl'
      | 'getBaseUrl'
      | 'getCbs'
      | 'getPages'
      | 'getPreloadPages'
      | 'getResolvers'
      | 'getRoot'
      | 'plugins'
      | 'setPlugin'
      | 'viewport'
    > {
  abort?: ActionChain['abort']
  page?: string
  event?: Event
  path?: EmitObject
  ref?: ActionChain
}
