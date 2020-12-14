import Action from '../Action'
import ActionChain from '../ActionChain'
import Component from '../components/Base'
import NOODLUI from '../noodl-ui'
import {
  ConsumerOptions,
  PageObject,
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
import { EmitObject } from '.'

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

export interface ActionChainContext<SDK = any> {
  noodl?: SDK
  noodlui: NOODLUI
}

export type ActionChainUseObject =
  | ActionChainUseObjectBase
  | ActionChainUseBuiltInObject

export interface ActionChainUseObjectBase<
  A extends ActionObject = any,
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
    | ActionChainActionCallback<BuiltInObject>
    | ActionChainActionCallback<BuiltInObject>[]
}

export interface ActionChainAddActionObject<S extends ActionType = ActionType> {
  actionType: S
  fns: ActionChainActionCallback[]
}

export interface ActionChainSnapshot {
  currentAction: Action
  original: ActionObject[]
  queue: Action[]
  status: ActionChain<ActionObject[], Component>['status']
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
      | 'getAssetsUrl'
      | 'getCbs'
      | 'getResolvers'
      | 'getRoot'
      | 'getState'
      | 'page'
      | 'plugins'
      | 'setPlugin'
      | 'viewport'
    > {
  abort?: ActionChain['abort']
  event?: Event
  path?: EmitObject
  ref?: ActionChain
}
