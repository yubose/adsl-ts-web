import {
  ActionType,
  ComponentObject,
  ComponentType,
  EventType,
  BuiltInActionObject,
  EmitObject,
  EvalActionObject,
  GotoObject,
  PageJumpActionObject,
  PageObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  ToastObject,
  SaveActionObject,
  StyleObject,
  UpdateActionObject,
  userEvent,
  ActionObject,
  RegisterComponentObject,
} from 'noodl-types'
import { Action, ActionChain } from 'noodl-action-chain'
import { LiteralUnion } from 'type-fest'
import ComponentBase from './components/Base'
import _ComponentCache from './cache/ComponentCache'
import RegisterCache from './cache/RegisterCache'
import EmitAction from './actions/EmitAction'
import NUI from './noodl-ui'
import NUIPage from './Page'
import ComponentResolver from './Resolver'
import Viewport from './Viewport'
import { event, lib, nuiEmitType, nuiEmitTransaction } from './constants'

export type NOODLUIActionType = ActionType | typeof lib.actionTypes[number]
export type NOODLUIComponentType = ComponentType | typeof lib.components[number]
export type NOODLUITrigger = EventType | typeof lib.emitTriggers[number]

export type ActionChainEmitTrigger = typeof userEvent[number]
export type ActionChainEventAlias = keyof typeof event.actionChain
export type ActionChainEventId = typeof event.actionChain[ActionChainEventAlias]
export type ActionEventAlias = keyof typeof event.action
export type ActionEventId = typeof event.action[ActionEventAlias]
export type EventId = ActionEventId | ActionChainEventId | PageComponentEventId
export type PageEventId = typeof event.SET_PAGE | typeof event.NEW_PAGE
export type PageComponentEventId = PageComponentEventObject[keyof PageComponentEventObject]
export type PageComponentEventObject = typeof event.component.page

/* -------------------------------------------------------
  ---- ACTIONS 
-------------------------------------------------------- */

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

export namespace NUIEmit {
  export interface RegisterObject {
    type: typeof nuiEmitType.REGISTER
    args: Register.Object
  }

  export interface TransactionObject<K extends TransactionId = TransactionId> {
    type: typeof nuiEmitType.TRANSACTION
    transaction: K
    params?: Transaction[K]['params']
  }
}

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

export type NOODLUIAction = Action | EmitAction

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

export interface IPage {
  id: 'root' | string | number
  page: string
  viewport: Viewport
}

export namespace Cache {
  export type ComponentCache = _ComponentCache

  export interface ComponentCacheHook {
    add(component: NUIComponent.Instance): void
    clear(components: { [id: string]: NUIComponent.Instance }): void
    remove(component: ReturnType<NUIComponent.Instance['toJSON']>): void
  }

  export type ComponentCacheHookEvent = 'add' | 'clear' | 'remove'

  export type Pages = Map<PageId, Cache.PageEntry>

  export type PageId = IPage['id']

  export interface PageEntry {
    page: NUIPage
  }

  export type Register = RegisterCache
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

  export interface Hook {
    [event.component.list.ADD_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [event.component.list.DELETE_DATA_OBJECT](args: {
      component: NUIComponent.Instance
      dataObject: any
      index: number
    }): void
    [event.component.list.UPDATE_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [event.component.page.PAGE_INSTANCE_CREATED](page: NUIPage): void
    [event.component.page.PAGE_OBJECT](
      component: NUIComponent.Instance,
      options: ConsumerOptions,
    ): Promise<void | PageObject>
    [event.component.page.PAGE_COMPONENTS](
      components: NUIComponent.Instance[],
    ): void
    [event.component.register.ONEVENT](): void
    content(pluginContent: string): void
    dataValue(dataValue: any): void
    path(src: string): void
    placeholder(src: string): void
  }

  export type Instance = ComponentBase

  export interface Proxy
    extends ComponentObject,
      Partial<Record<DataAttribute, string>> {
    blueprint?: NUIComponent.Proxy
    id?: string
    location?: Plugin.Location
    [key: string]: any
  }

  export type ResolverArgs = [
    component: NUIComponent.Instance,
    options: ConsumerOptions,
    next: (opts?: Record<string, any>) => void,
  ]
}

export namespace Plugin {
  export type CreateType =
    | string
    | NUIComponent.Instance
    | ComponentObject
    | Plugin.Object

  export type Location = 'head' | 'body-top' | 'body-bottom'

  export interface Object {
    initiated?: boolean
    location?: Plugin.Location
    path?: string
    content?: string
    ref: NUIComponent.Instance
  }
}

export interface IComponent<
  C extends ComponentObject = ComponentObject,
  Type extends keyof C = ComponentType
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
  getStyle<K extends keyof StyleObject>(styleKey: K): StyleObject[K]
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
  removeStyle<K extends keyof StyleObject>(styleKey: K): this
  set<K extends keyof C>(key: K, value?: any, styleChanges?: any): this
  set<O extends C>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: NUIComponent.Instance): this
  setStyle<K extends keyof StyleObject>(styleKey: K, value: any): this
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
    trigger: NOODLUITrigger,
    actions: NOODLUIActionObject | NOODLUIActionObject[],
    opts?: { loadQueue?: boolean },
  ): NOODLUIActionChain
  getBaseStyles(
    component: NUIComponent.Instance,
  ): StyleObject & { [key: string]: any }
  ref?: NOODLUIActionChain
}

export type DataAttribute =
  | 'data-key'
  | 'data-listid'
  | 'data-name'
  | 'data-placeholder'
  | 'data-src'
  | 'data-value'
  | 'data-viewtag'
  | 'data-ux'

export type PageObjectContainer<K extends string = string> = Record<
  K,
  PageObject
>

export namespace Register {
  export interface Object<P extends Register.Page = '_global', Params = any> {
    name?: string
    component?: RegisterComponentObject | null
    page: P
    params?: Params
    callback?(obj: Register.Object, params?: Params): Promise<void>
  }

  export type Page<P extends string = '_global'> = LiteralUnion<P, string>

  export type Storage = Map<Page, Record<string, Object>>
}

export interface ResolverFn<C extends NUIComponent.Instance = any> {
  (component: C, consumerOptions: ConsumerOptions, next?: () => void): void
}

export namespace Store {
  export interface ActionObject<
    AType extends NOODLUIActionType = NOODLUIActionType,
    ATrigger extends NOODLUITrigger = NOODLUITrigger
  > {
    actionType: AType
    fn(
      action: Action<AType, ATrigger>,
      options: ConsumerOptions,
    ): Promise<any[] | void>
    trigger?: ATrigger
  }

  export interface BuiltInObject<
    FuncName extends string = string,
    ATrigger extends NOODLUITrigger = NOODLUITrigger
  > {
    actionType: 'builtIn'
    fn(
      action: Action<'builtIn', ATrigger>,
      options: ConsumerOptions,
    ): Promise<any[] | void>
    funcName: FuncName
  }

  export interface Plugins {
    head: Plugin.Object[]
    body: {
      top: Plugin.Object[]
      bottom: Plugin.Object[]
    }
  }

  export interface PluginObject {
    initiated?: boolean
    location?: 'head' | 'body-top' | 'body-bottom'
    path?: string
    content?: string
    ref: NUIComponent.Instance
  }
}

export interface State {
  page: string
  plugins: {
    head: Plugin.Object[]
    body: {
      top: Plugin.Object[]
      bottom: Plugin.Object[]
    }
  }
  showDataKey: boolean
}

export interface Root {
  [key: string]: any
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
}

export type TransactionId = keyof Transaction

export type Use =
  | Store.ActionObject
  | Store.BuiltInObject
  | Store.PluginObject
  | UseObject
  | ComponentResolver<any>

export interface UseObject {
  getAssetsUrl?(): string
  getBaseUrl?(): string
  getPages?(): string[]
  getPreloadPages?(): string[]
  getRoot?(): Record<string, any>
  getPlugins?: Plugin.CreateType[]
  register?: Register.Object | Register.Object[]
  transaction?: Record<TransactionId, Transaction[TransactionId]['fn']>
}
