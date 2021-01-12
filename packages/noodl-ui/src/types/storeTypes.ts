import {
  ActionObject,
  ActionType,
  EmitObject,
  GotoObject,
  GotoUrl,
  ToastObject,
} from 'noodl-types'
import { ActionChainActionCallback } from './actionChainTypes'
import { ActionChainEmitTrigger, ResolveEmitTrigger } from './constantTypes'
import {
  BuiltInObject,
  EmitActionObject,
  GotoActionObject,
  ToastActionObject,
} from './actionTypes'
import Action from '../Action'
import Resolver from '../Resolver'

export interface StoreActionObject<
  A extends
    | ActionObject
    | GotoActionObject
    | EmitActionObject
    | ToastActionObject
> {
  actionType: A['actionType']
  fn: ActionChainActionCallback<Action<A>>
  trigger?: ActionChainEmitTrigger | ResolveEmitTrigger
}

export interface StoreBuiltInObject<A extends BuiltInObject> {
  actionType: BuiltInObject['actionType']
  fn: ActionChainActionCallback<Action<A>>
  funcName: string
}

export interface StoreChainingObject {}

export interface StoreResolverObject {
  name: string
  resolver: Resolver
}
