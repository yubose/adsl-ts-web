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
import { ActionChain } from 'noodl-action-chain'
import { AbortExecuteError } from '../errors'
import { ConsumerOptions } from './types'
import { NOODLUITrigger } from './constantTypes'
import Action from '../Action'

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

export type NOODLUIAction = any

// export type NOODLUIAction =
//   | Action<NOODLUIActionType, NOODLUITrigger>
//   | EmitAction

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

export interface IAction<A extends ActionObject = any> {
  abort(reason: string | string[], callback?: IAction<A>['callback']): void
  actionType: A['actionType']
  callback: ((...args: any[]) => any) | undefined
  clearTimeout(): void
  clearInterval(): void
  error: null | Error
  execute<Args extends any[] = any[]>(...args: Args): Promise<any>
  id: string
  isTimeoutRunning(): boolean
  getSnapshot(): ActionSnapshot<A>
  original: A
  result: any
  resultReturned: boolean
  status: ActionStatus
  timeoutDelay: number
  trigger: string
}

export interface AnonymousObject extends ActionObject {
  actionType: 'anonymous'
  fn?: Function
}

export interface ActionCallback<A extends Action<any> = Action<any>> {
  (snapshot: A, handlerOptions?: ConsumerOptions): any
}

export interface ActionOptions<OriginalAction extends ActionObject = any> {
  callback?: ActionCallback
  id?: string
  onPending?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onResolved?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onTimeout?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onError?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onAbort?: (snapshot: ActionSnapshot<OriginalAction>) => any
  timeoutDelay?: number
  trigger?: string
}

export interface ActionSnapshot<OriginalAction = any> {
  actionType: string
  hasExecutor: boolean
  id: string
  original: OriginalAction
  status: ActionStatus
  timeout: {
    running: boolean
    remaining: number | null
  }
  result?: any
  error?: null | Error | AbortExecuteError
}

export type ActionStatus =
  | null
  | 'pending'
  | 'resolved'
  | 'aborted'
  | 'error'
  | 'timed-out'
