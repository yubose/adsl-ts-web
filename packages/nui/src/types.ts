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
import type { VNode } from 'snabbdom/vnode'
import type { Attrs } from 'snabbdom/modules/attributes'
import type { Hooks, Key } from 'snabbdom'
import type { Classes } from 'snabbdom/modules/class'
import type { Dataset } from 'snabbdom/modules/dataset'
import type { On } from 'snabbdom/modules/eventlisteners'
import type { VNodeStyle } from 'snabbdom/modules/style'
import type EmitAction from './actions/EmitAction'
import type NuiPage from './Page'
import nui from './nui'
import * as c from './constants'
import NuiViewport from './Viewport'

export type ElementType = keyof HTMLElementTagNameMap

export type NuiActionType = ActionType | typeof c.actionTypes[number]
export type NuiActionGroupedType = typeof c.groupedActionTypes[number]
export type NuiComponentType = ComponentType | typeof c.componentTypes[number]
export type NuiTrigger = EventType | typeof c.emitTriggers[number]
export type NuiDataAttribute = typeof c.dataAttrs[number]

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

export namespace Resolve {
  export interface BaseOptions<N extends VNode> {
    vnode: N
    page?: NuiPage
  }

  export interface Config<N extends VNode = VNode> {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve.Func<N, boolean>
    before?: Resolve.Func<N>
    resolve?: Resolve.Func<N>
    after?: Resolve.Func<N>
  }

  export interface Func<N extends VNode, RT = void> {
    (
      options: ReturnType<NDOMResolver_['getOptions']> & Resolve.BaseOptions<N>,
    ): RT
  }

  export interface LifeCycle {
    before: Resolve.Config[]
    resolve: Resolve.Config[]
    after: Resolve.Config[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'

  export interface TranslateConfig<K extends string = string, V = any> {
    key: K
    value: any
    remove?: boolean
  }

  export interface ResolverFn {
    (options: Resolve.ResolverFnOptions): void
  }

  export interface ResolverFnOptions {
    component: ComponentObject
    vprops: {
      attrs: Attrs
      classes: Classes
      dataset: Dataset
      hooks: Hooks
      key: Key
      on: On
      style: VNodeStyle
    }
    viewport: NuiViewport
  }

  export interface TranslateFn<V = any, RT = any> {
    (value: V, helpers: TranslateFnHelpers): RT | void | never | undefined
  }

  export interface TranslateFnHelpers {
    component?: ComponentObject
    // vprops:
    viewport: { width: number | undefined; height: number | undefined }
  }
}

export namespace Store {
  export interface ActionObject<
    Type extends NuiActionType = NuiActionType,
    Trigger extends string = string,
  > {
    actionType: Type
    fn(
      action: Type extends 'emit' ? EmitAction : Action<Type, Trigger>,
      options: Store.Options,
    ): Promise<any[] | void>
    trigger?: LiteralUnion<NuiTrigger | Trigger, string>
  }

  export interface BuiltInObject<
    FuncName extends string = string,
    Trigger extends string = string,
  > {
    actionType: 'builtIn'
    fn(action: Action<'builtIn', Trigger>, options: any): Promise<any[] | void>
    funcName: FuncName
  }

  export type Options = {
    action: NuiAction
    component: ComponentObject
    vnode: VNode
  } & Pick<
    typeof nui,
    | 'assetsUrl'
    | 'baseUrl'
    | 'pages'
    | 'preload'
    | 'plugins'
    | 'registers'
    | 'root'
  >
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface Transaction {
  [c.transaction.REQUEST_PAGE_OBJECT]: {
    params: { page: string; modifiers?: Record<string, any> }
    fn(page: NuiPage | NuiPage['page']): Promise<PageObject>
    callback(pageObject: PageObject): void
  }
}

export type TransactionId = keyof Transaction

export interface UseOptions {
  builtIn?: Record<string, OrArray<Store.BuiltInObject['fn']>>
  emit?: Partial<
    Record<
      NuiTrigger,
      Store.ActionObject<'emit'>['fn'] | Store.ActionObject<'emit'>['fn'][]
    >
  >
  root?: Record<string, any> | (() => Record<string, any>)
  plugins?: OrArray<ComponentObject> | (() => OrArray<ComponentObject>)
  register?:
    | Record<string, Register.Object['fn']>
    | OrArray<
        RegisterComponentObject & { handler?: Register.Object['handler'] }
      >
  transaction?: Partial<
    Record<
      LiteralUnion<TransactionId, string>,
      Transaction[TransactionId] | Transaction[TransactionId]['fn']
    >
  >
}
