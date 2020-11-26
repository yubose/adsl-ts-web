import { AbortExecuteError } from '../errors'
import { IfObject } from './types'

export type ActionObject = BaseActionObject &
  (
    | AnonymousObject
    | BuiltInObject
    | EmitActionObject
    | EvalObject
    | PageJumpObject
    | PopupObject
    | PopupDismissObject
    | RefreshObject
    | SaveObject
    | UpdateActionObject
  )

export interface BaseActionObject {
  actionType: string
}

export interface AnonymousObject extends BaseActionObject {
  actionType: 'anonymous'
  fn?: Function
}

export interface BuiltInObject extends BaseActionObject {
  actionType: 'builtIn'
  funcName: string
}

export interface EmitActionObject extends BaseActionObject {
  actionType: 'emit'
  emit: {
    actions: [any, any, any]
    dataKey: string | { [key: string]: string }
  }
}

export interface EvalObject extends BaseActionObject {
  actionType: 'evalObject'
  object?: Function | IfObject
}

export interface GotoObject extends BaseActionObject {
  destination?: string
}

export interface PageJumpObject extends BaseActionObject {
  actionType: 'pageJump'
  destination: string
}

export interface PopupObject extends BaseActionObject {
  actionType: 'popUp'
  popUpView: string
}

export interface PopupDismissObject extends BaseActionObject {
  actionType: 'popUpDismiss'
  popUpView: string
}

export interface RefreshObject extends BaseActionObject {
  actionType: 'refresh'
}

export interface SaveObject extends BaseActionObject {
  actionType: 'saveObject'
  object?: [string, (...args: any[]) => any] | ((...args: any[]) => any)
}

export type UpdateActionObject<T = any> = {
  actionType: 'updateObject'
  object?: T
}

export interface IAction<A extends BaseActionObject = any> {
  abort(reason: string | string[], callback?: IAction<A>['callback']): void
  actionType: A['actionType']
  callback: ((...args: any[]) => any) | undefined
  clearTimeout(): void
  clearInterval(): void
  error: null | Error
  execute<Args = any>(args?: Args): Promise<any>
  id: string
  isTimeoutRunning(): boolean
  getSnapshot(): IActionSnapshot<A>
  original: A
  result: any
  resultReturned: boolean
  status: IActionStatus
  timeoutDelay: number
  type: A['actionType']
  onPending(snapshot: IActionSnapshot): any
  onResolved(snapshot: IActionSnapshot): any
  onError(snapshot: IActionSnapshot): any
  onAbort(snapshot: IActionSnapshot): any
  onTimeout: any
}

export interface IActionCallback {
  (snapshot: IActionSnapshot, handlerOptions?: any): any
}

export interface IActionOptions<OriginalAction extends BaseActionObject = any> {
  callback?: IActionCallback
  id?: string
  onPending?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onResolved?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onTimeout?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onError?: (snapshot: IActionSnapshot<OriginalAction>) => any
  onAbort?: (snapshot: IActionSnapshot<OriginalAction>) => any
  timeoutDelay?: number
}

export interface IActionSnapshot<OriginalAction = any> {
  actionType: string
  hasExecutor: boolean
  id: string
  original: OriginalAction
  status: IActionStatus
  timeout: {
    running: boolean
    remaining: number | null
  }
  result?: any
  error?: null | Error | AbortExecuteError
}

export type IActionStatus =
  | null
  | 'pending'
  | 'resolved'
  | 'aborted'
  | 'error'
  | 'timed-out'

export interface IBuiltIn<
  Func extends (...args: any[]) => any = (...args: any[]) => any,
  FuncName extends string = string
> {
  execute<Args extends any[]>(...args: Args): Promise<any>
  func: Func
  funcName: FuncName
}
