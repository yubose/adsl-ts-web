import { AcceptArray } from '@jsmanifest/typefest'
import {
  ActionObject,
  ActionType,
  BuiltInActionObject,
  ComponentObject,
  ComponentType,
  EventType,
  EmitObject,
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
  StyleObject,
  ToastObject,
  UpdateActionObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PluginBodyTailComponentObject,
} from 'noodl-types'
import { Action, ActionChain } from 'noodl-action-chain'
import { LiteralUnion } from 'type-fest'
import ComponentBase from './Component'
import _ComponentCache from './cache/ComponentCache'
import _PluginCache from './cache/PluginCache'
import EmitAction from './actions/EmitAction'
import NUI from './noodl-ui'
import NUIPage from './Page'
import Viewport from './Viewport'
import {
  nuiEvent,
  groupedActionTypes,
  lib,
  nuiEmitType,
  nuiEmitTransaction,
} from './constants'

export type NUIActionType = ActionType | typeof lib.actionTypes[number]
export type NUIActionGroupedType = typeof groupedActionTypes[number]
export type NUIComponentType = ComponentType | typeof lib.components[number]
export type NUITrigger = EventType | typeof lib.emitTriggers[number]
export type DataAttribute = typeof lib.dataAttributes[number]

/* -------------------------------------------------------
  ---- ACTIONS 
-------------------------------------------------------- */

export type NUIActionChain = ActionChain<NUIActionObject, NUITrigger>

// Raw / non-ensured actionType
export type NUIActionObjectInput =
  | NUIActionObject
  | EmitObjectFold
  | GotoObject
  | ToastObject

export namespace NUIEmit {
  export interface EmitRegister<Evt extends string = string> {
    type: typeof nuiEmitType.REGISTER
    event: Evt
    params?: Register.Params<any>
  }

  export interface EmitTransaction<K extends TransactionId = TransactionId> {
    type: typeof nuiEmitType.TRANSACTION
    transaction: K
    params?: Transaction[K]['params']
  }
}

// With ensured actionType appended
export type NUIActionObject =
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

export type NUIAction = Action | EmitAction

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

export interface ICache {
  clear(): void
  length: number
}

export interface IPage {
  id: 'root' | string | number
  page: string
  viewport: Viewport
}

export namespace NUIComponent {
  export type CreateType =
    | ComponentType
    | ComponentObject
    | NUIComponent.Instance

  export interface EditResolutionOptions {
    remove?: string | string[] | Record<string, () => boolean>
  }

  export type HookEvent = keyof Hook

  export type Hook = {
    [nuiEvent.component.list.ADD_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [nuiEvent.component.list.DELETE_DATA_OBJECT](args: {
      component: NUIComponent.Instance
      dataObject: any
      index: number
    }): void
    [nuiEvent.component.list.UPDATE_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [nuiEvent.component.page.PAGE_INSTANCE_CREATED](page: NUIPage): void
    [nuiEvent.component.page.PAGE_OBJECT](
      component: NUIComponent.Instance,
      options: ConsumerOptions,
    ): Promise<void | PageObject>
    [nuiEvent.component.page.PAGE_COMPONENTS](
      components: NUIComponent.Instance[],
    ): void
    [nuiEvent.component.register.ONEVENT](): void
    content(pluginContent: string): void
    dataValue(dataValue: any): void
    'data-src'(src: string): void
    image(src: string): void
    options(options: any[]): void
    path(src: string): void
    placeholder(src: string): void
  } & Partial<
    Record<TimerHook<'init'>, (fn: (initialTimer: Date) => void) => void> &
      Record<
        TimerHook<'interval'>,
        (args: {
          value: Date | undefined
          component: NUIComponent.Instance
          node: HTMLElement
        }) => void
      > &
      Record<TimerHook<'ref'>, (ref: Timer) => void>
  >

  // TODO - Find a better place to put these Timer typings
  type TimerHook<Evt extends string = string> = `timer:${Evt}`
  export interface Timer {
    start(): void
    current: Date
    ref: NodeJS.Timeout | 0 | undefined
    clear: () => void
    increment(): void
    set(value: any): void
    onInterval?:
      | ((args: {
          value: Date | undefined
          node: HTMLElement
          component: NUIComponent.Instance
        }) => void)
      | null
  }

  export type Instance = ComponentBase

  export type ResolverArgs = [
    component: NUIComponent.Instance,
    options: ConsumerOptions,
    next: (opts?: Record<string, any>) => void,
  ]

  export type Type = NUIComponentType
}

export namespace Plugin {
  export type ComponentObject =
    | PluginComponentObject
    | PluginHeadComponentObject
    | PluginBodyTailComponentObject

  export type CreateType =
    | string
    | NUIComponent.Instance
    | Plugin.ComponentObject
    | Plugin.Object

  export type Location = 'head' | 'body-top' | 'body-bottom'

  export interface Object {
    initiated?: boolean
    location?: Plugin.Location
    path?: string
    content?: string
    id?: string
  }
}

export interface IComponent<
  C extends ComponentObject = ComponentObject,
  Type extends keyof C = ComponentType,
> {
  id: string
  type: Type
  style: StyleObject
  length: number
  blueprint: ComponentObject
  original: ComponentObject
  child(index?: number): NUIComponent.Instance | undefined
  children: NUIComponent.Instance[]
  createChild<Child extends NUIComponent.Instance = any>(child: Child): Child
  removeChild(child: NUIComponent.Instance): NUIComponent.Instance | undefined
  removeChild(id: string): NUIComponent.Instance | undefined
  removeChild(index: number): NUIComponent.Instance | undefined
  removeChild(): NUIComponent.Instance | undefined
  get<K extends keyof C>(key: K, styleKey?: keyof StyleObject): C[K]
  get<K extends keyof C>(
    key: K[],
    styleKey?: keyof StyleObject,
  ): Record<K, C[K]>
  get(key: keyof C, styleKey?: keyof StyleObject): any
  has(key: keyof C, styleKey?: keyof StyleObject): boolean
  on<Evt extends NUIComponent.HookEvent>(
    evt: Evt,
    cb: NUIComponent.Hook[Evt],
    id?: string,
  ): this
  off(eventName: string, cb: Function): this
  parent: NUIComponent.Instance | null
  props: { id: string } & ComponentObject
  remove(key: keyof C, styleKey?: keyof StyleObject): this
  set<K extends keyof C>(key: K, value?: any, styleChanges?: any): this
  set<O extends C>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: NUIComponent.Instance): this
  snapshot(): ReturnType<IComponent['toJSON']> & {
    _cache: any
  }
  toJSON(): Omit<IComponent['props'], 'children'> & {
    children: ReturnType<IComponent['toJSON']>[]
    parentId: string | null
  }
}

export type ConsumerOptions = Omit<
  ReturnType<typeof NUI['getConsumerOptions']>,
  'createActionChain' | 'getBaseStyles'
> & {
  createActionChain(
    trigger: NUITrigger,
    actions: NUIActionObject | NUIActionObject[],
    opts?: { loadQueue?: boolean },
  ): NUIActionChain
  event?: Event
  getBaseStyles(
    component: NUIComponent.Instance,
  ): StyleObject & { [key: string]: any }
  ref?: NUIActionChain
}

export namespace Register {
  export interface Object<N extends string = string> {
    name: N
    callbacks: (Register.Object['fn'] | NUIActionChain)[]
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

  export type Params<RT = any> = ParamsObject | ParamsGetter<RT>
  export type ParamsObject<K extends string = string> = Record<
    LiteralUnion<K, string>,
    any
  > & {
    args?: any[]
    data?: K | Record<K, any>
  }
  export type ParamsGetter<RT> = (obj: Register.Object) => RT | Promise<RT>

  export type Page<P extends string = '_global'> = LiteralUnion<P, string>
}

export namespace Store {
  export interface ActionObject<
    AType extends NUIActionType = NUIActionType,
    ATrigger extends NUITrigger = NUITrigger,
  > {
    actionType: AType
    fn(
      action: AType extends 'emit' ? EmitAction : Action<AType, ATrigger>,
      options: ConsumerOptions,
    ): Promise<any[] | void>
    trigger?: ATrigger
  }

  export interface BuiltInObject<
    FuncName extends string = string,
    ATrigger extends NUITrigger = NUITrigger,
  > {
    actionType: 'builtIn'
    fn(action: Action<'builtIn', ATrigger>, options: any): Promise<any[] | void>
    funcName: FuncName
  }

  export interface Plugins {
    head: Plugin.Object[]
    body: {
      top: Plugin.Object[]
      bottom: Plugin.Object[]
    }
  }
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface Transaction {
  [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: {
    params: { page: string; modifiers?: Record<string, any> }
    fn(page: NUIPage | NUIPage['page']): Promise<PageObject>
    callback(pageObject: PageObject): void
  }
  [key: string]: any
}

export type TransactionId = LiteralUnion<keyof Transaction, string>

export interface UseArg<
  TObj extends Record<string, any> = Record<string, any>,
  TName extends TransactionId = TransactionId,
> extends Partial<
    Record<
      NUIActionGroupedType,
      Store.ActionObject['fn'] | Store.ActionObject['fn'][]
    >
  > {
  builtIn?: Record<
    string,
    Store.BuiltInObject['fn'] | Store.BuiltInObject['fn'][]
  >
  emit?: Partial<
    Record<
      NUITrigger,
      Store.ActionObject<'emit'>['fn'] | Store.ActionObject<'emit'>['fn'][]
    >
  >
  getAssetsUrl?: () => string
  getBaseUrl?: () => string
  getPages?: () => string[]
  getPreloadPages?: () => string[]
  getRoot?: () => Record<string, any>
  plugin?: ComponentObject | ComponentObject[]
  register?:
    | Record<string, Register.Object['fn']>
    | AcceptArray<
        RegisterComponentObject & { handler?: Register.Object['handler'] }
      >
  transaction?: Partial<
    Record<LiteralUnion<TName, string>, TObj[TName] | TObj[TName]['fn']>
  >
}
