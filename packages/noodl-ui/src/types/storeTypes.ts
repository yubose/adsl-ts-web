import { ActionObject, ActionType } from 'noodl-types'
import { ActionChainActionCallback } from './actionChainTypes'
import { ActionChainEmitTrigger, ResolveEmitTrigger } from './constantTypes'
import { BuiltInObject } from './actionTypes'
import Action from '../Action'

export interface StoreActionObject<A extends ActionObject> {
  actionType: ActionType
  fn: ActionChainActionCallback<Action<A>>
  trigger?: ActionChainEmitTrigger | ResolveEmitTrigger
}

export interface StoreBuiltInObject<A extends BuiltInObject> {
  actionType: 'builtIn'
  fn: ActionChainActionCallback<Action<A>>
  funcName: string
}

export interface StoreChainingObject {}
