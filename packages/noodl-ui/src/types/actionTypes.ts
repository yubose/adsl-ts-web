import Action from '../Action'
import { AbortExecuteError } from '../errors'
import { ConsumerOptions, IfObject } from './types'

export type ActionObject = BaseActionObject &
  (
    | AnonymousObject
    | BuiltInObject
    | EmitActionObject
    | EvalObject
    | GotoObject
    | PageJumpObject
    | PopupObject
    | PopupDismissObject
    | RefreshObject
    | SaveObject
    | UpdateObject
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

export interface EmitActionObject extends BaseActionObject, EmitObject {
  actionType: 'emit'
}

export interface EmitObject {
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
  actionType: 'goto'
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

export type UpdateObject<T = any> = {
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
  getSnapshot(): ActionSnapshot<A>
  original: A
  result: any
  resultReturned: boolean
  status: ActionStatus
  timeoutDelay: number
  trigger: string[]
  type: A['actionType']
  onPending(snapshot: ActionSnapshot): any
  onResolved(snapshot: ActionSnapshot): any
  onError(snapshot: ActionSnapshot): any
  onAbort(snapshot: ActionSnapshot): any
  onTimeout: any
}

export interface ActionCallback<A extends Action = Action> {
  (snapshot: A, handlerOptions?: ConsumerOptions): any
}

export interface ActionOptions<OriginalAction extends BaseActionObject = any> {
  callback?: ActionCallback
  id?: string
  onPending?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onResolved?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onTimeout?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onError?: (snapshot: ActionSnapshot<OriginalAction>) => any
  onAbort?: (snapshot: ActionSnapshot<OriginalAction>) => any
  timeoutDelay?: number
  trigger?: string | string[]
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

export interface IBuiltIn<
  Func extends (...args: any[]) => any = (...args: any[]) => any,
  FuncName extends string = string
> {
  execute<Args extends any[]>(...args: Args): Promise<any>
  func: Func
  funcName: FuncName
}
