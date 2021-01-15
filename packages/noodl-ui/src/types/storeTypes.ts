import { ActionObject } from 'noodl-types'
import {
  ActionChainActionCallback,
  ActionChainContext,
} from './actionChainTypes'
import { ActionChainEmitTrigger, ResolveEmitTrigger } from './constantTypes'
import {
  BuiltInObject,
  EmitActionObject,
  GotoActionObject,
  ToastActionObject,
} from './actionTypes'
import Action from '../Action'
import { AnyFn } from '.'

export interface StoreActionObject<
  A extends
    | ActionObject
    | EmitActionObject
    | GotoActionObject
    | ToastActionObject = any,
  AContext extends ActionChainContext = any
> {
  actionType: A['actionType']
  fn: ActionChainActionCallback<Action<A>, AContext>
  trigger?: ActionChainEmitTrigger | ResolveEmitTrigger
}

export interface StoreBuiltInObject<
  A extends BuiltInObject = BuiltInObject,
  AContext extends ActionChainContext = any
> {
  actionType: BuiltInObject['actionType']
  fn: ActionChainActionCallback<Action<A>, AContext>
  funcName: string
}

export interface StoreChainingObject {}

export interface StoreResolverObject {
  name?: string
  cond?(...args: any[]): boolean
  before?: AnyFn
  resolve: AnyFn
  after?: AnyFn
}
