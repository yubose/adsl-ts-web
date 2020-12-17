import { IfObject } from './commonTypes'

export type ActionType =
  | 'builtIn'
  | 'evalObject'
  | 'pageJump'
  | 'popUp'
  | 'popUpDismiss'
  | 'refresh'
  | 'saveObject'
  | 'updateObject'

export interface ActionObject<T extends string = any> {
  actionType: T
  [key: string]: any
}

export interface BuiltInActionObject<FuncName extends string = any>
  extends ActionObject {
  actionType: 'builtIn'
  funcName: FuncName
}

export interface EvalActionObject extends ActionObject {
  actionType: 'evalObject'
  object?: Function | IfObject
}

export interface PageJumpActionObject<D extends string = any>
  extends ActionObject {
  actionType: 'pageJump'
  destination: D
}

export interface PopupActionObject<V extends string = any>
  extends ActionObject {
  actionType: 'popUp'
  popUpView: V
}

export interface PopupDismissActionObject<V extends string = any>
  extends ActionObject {
  actionType: 'popUpDismiss'
  popUpView: V
}

export interface RefreshActionObject extends ActionObject {
  actionType: 'refresh'
}

export interface SaveActionObject extends ActionObject {
  actionType: 'saveObject'
  object?: [string | ((...args: any[]) => any)] | ((...args: any[]) => any)
}

export type UpdateActionObject<T = any> = {
  actionType: 'updateObject'
  object?: T
}
