import { OrArray } from '@jsmanifest/typefest'
import type {
  ActionObject,
  ActionType,
  BuiltInActionObject,
  ComponentObject,
  ComponentType,
  EventType,
  EmitObjectFold,
  EvalActionObject,
  GotoObject,
  PageJumpActionObject,
  PageObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RegisterComponentObject,
  SaveActionObject,
  ToastObject,
  UpdateActionObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PluginBodyTailComponentObject,
  PluginBodyTopComponentObject,
} from 'noodl-types'
import type { Action, ActionChain } from 'noodl-action-chain'
import type { LiteralUnion } from 'type-fest'
import type EmitAction from './actions/EmitAction'
import type NuiPage from './Page'
import * as c from './constants'

export type ElementType = keyof HTMLElementTagNameMap

export type NuiActionType = ActionType | typeof c.lib.actionTypes[number]
export type NuiActionGroupedType = typeof c.groupedActionTypes[number]
export type NuiComponentType = ComponentType | typeof c.lib.components[number]
export type NuiTrigger = EventType | typeof c.lib.emitTriggers[number]
export type NuiDataAttribute = typeof c.lib.dataAttributes[number]

/* -------------------------------------------------------
  ---- ACTIONS 
-------------------------------------------------------- */
export type NuiActionChain = ActionChain<NuiActionObject, NuiTrigger>
// With ensured actionType appended
export type NuiActionObject =
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
  | UpdateActionObject
  | AnonymousActionObject
  | EmitActionObject
  | GotoActionObject

export type NuiAction = Action | EmitAction

export interface AnonymousActionObject extends ActionObject {
  actionType: 'anonymous'
  fn?(...args: any[]): any
}

export interface EmitActionObject extends ActionObject, EmitObjectFold {
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

export namespace Plugin {
  export type ComponentObject =
    | PluginComponentObject
    | PluginHeadComponentObject
    | PluginBodyTopComponentObject
    | PluginBodyTailComponentObject

  export type Location = 'head' | 'body-top' | 'body-bottom'

  export interface Object {
    initiated?: boolean
    location?: Plugin.Location
    path?: string
    content?: string
    id?: string
  }
}

export namespace Register {
  export interface Object<N extends string = string> {
    name: N
    callbacks: (Register.Object['fn'] | NuiActionChain)[]
    page: LiteralUnion<'_global' | Register.Page, string>
    params?: Register.ParamsObject
    handler?: {
      fn?: Register.Object['fn']
      useReturnValue?: boolean
    }
    fn?: (
      obj: Register.Object,
      params: Register.Params | undefined,
    ) => Promise<any>
  }

  export type Params<RT = any> =
    | ParamsObject
    | ((obj: Register.Object) => RT | Promise<RT>)

  export type ParamsObject<K extends string = string> = Record<
    LiteralUnion<K, string>,
    any
  > & {
    args?: any[]
    data?: K | Record<K, any>
  }

  export type Page<P extends string = '_global'> = LiteralUnion<P, string>
}

export namespace Store {
  export interface ActionObject<
    AType extends NuiActionType = NuiActionType,
    ATrigger extends string = string,
  > {
    actionType: AType
    fn(
      action: AType extends 'emit' ? EmitAction : Action<AType, ATrigger>,
      options: ConsumerOptions,
    ): Promise<any[] | void>
    trigger?: LiteralUnion<NuiTrigger | ATrigger, string>
  }

  export interface BuiltInObject<
    FuncName extends string = string,
    ATrigger extends string = string,
  > {
    actionType: 'builtIn'
    fn(action: Action<'builtIn', ATrigger>, options: any): Promise<any[] | void>
    funcName: FuncName
  }
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface Transaction {
  [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: {
    params: { page: string; modifiers?: Record<string, any> }
    fn(page: NuiPage | NuiPage['page']): Promise<PageObject>
    callback(pageObject: PageObject): void
  }
  [key: string]: any
}

export type TransactionId = LiteralUnion<keyof Transaction, string>

export interface UseArg<
  TObj extends Record<string, any> = Record<string, any>,
  TName extends TransactionId = TransactionId,
> extends Partial<
    Record<NuiActionGroupedType, OrArray<Store.ActionObject['fn']>>
  > {
  builtIn?: Record<string, OrArray<Store.BuiltInObject['fn']>>
  emit?: Partial<
    Record<
      NuiTrigger,
      Store.ActionObject<'emit'>['fn'] | Store.ActionObject<'emit'>['fn'][]
    >
  >
  getAssetsUrl?: () => string
  getBaseUrl?: () => string
  getPages?: () => string[]
  getPreloadPages?: () => string[]
  getRoot?: () => Record<string, any>
  plugin?: OrArray<ComponentObject>
  register?:
    | Record<string, Register.Object['fn']>
    | OrArray<
        RegisterComponentObject & { handler?: Register.Object['handler'] }
      >
  transaction?: Partial<
    Record<LiteralUnion<TName, string>, TObj[TName] | TObj[TName]['fn']>
  >
}
