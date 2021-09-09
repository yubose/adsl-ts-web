import {
  ActionObject,
  BuiltInActionObject,
  EmitObject,
  EvalActionObject,
  GotoObject,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  SaveActionObject,
  ToastObject,
  UpdateActionObject,
} from 'noodl-types'
import { ActionChain, Action } from 'noodl-action-chain'
import { NOODLUIActionType, NOODLUITrigger } from './index'
import EmitAction from '../actions/EmitAction'

export type NOODLUIActionChain = ActionChain<
  NOODLUIActionObject,
  NOODLUITrigger
>

// Raw / non-ensured actionType
export type NOODLUIActionObjectInput =
  | NOODLUIActionObject
  | EmitObject
  | GotoObject
  | ToastObject

// With ensured actionType appended
export type NOODLUIActionObject =
  | AnonymousActionObject
  | BuiltInActionObject
  | EmitActionObject
  | EvalActionObject
  | GotoActionObject
  | PageJumpActionObject
  | PopupActionObject
  | PopupDismissActionObject
  | RefreshActionObject
  | SaveActionObject
  | ToastActionObject
  | UpdateActionObject

export type NOODLUIAction =
  | Action<NOODLUIActionType, NOODLUITrigger>
  | EmitAction

export interface AnonymousActionObject extends ActionObject {
  actionType: 'anonymous'
  fn?: (...args: any[]) => any
}

export interface EmitActionObject extends ActionObject, EmitObject {
  actionType: 'emit'
  [key: string]: any
}

export interface GotoActionObject extends ActionObject, GotoObject {
  actionType: 'goto'
  [key: string]: any
}

export interface ToastActionObject extends ActionObject, ToastObject {
  actionType: 'toast'
  [key: string]: any
}
