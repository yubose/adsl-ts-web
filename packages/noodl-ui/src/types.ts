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
import Viewport from './Viewport'
import { event, lib } from './constants'

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

  export type HookEvent = keyof Hook | 'path'

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
    [event.component.page.PAGE_OBJECT](
      component: NUIComponent.Instance,
      options: ConsumerOptions,
    ): Promise<void | PageObject>
    [event.component.register.ONEVENT](): any
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
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent: NUIComponent.Instance | null
  props(): { id: string } & ComponentObject
  remove(key: keyof C, styleKey?: keyof StyleObject): this
  removeStyle<K extends keyof StyleObject>(styleKey: K): this
  set<K extends keyof C>(key: K, value?: any, styleChanges?: any): this
  set<O extends C>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: NUIComponent.Instance): this
  setStyle<K extends keyof StyleObject>(styleKey: K, value: any): this
  snapshot(): ReturnType<IComponent['toJSON']> & {
    _cache: any
  }
  toJSON(): Omit<ReturnType<IComponent['props']>, 'children'> & {
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
  export interface Object {
    type: LiteralUnion<'onEvent', string> // 'onEvent'
    registerEvent: string
    component: NUIComponent.Instance | null
    fn: // | RegisterObjectInput<LiteralUnion<Page | '_global' | Page, string>>['fn']
    undefined
    page: Page
    callback(data: any): void
  }

  export type Page<P extends string = '_global'> = LiteralUnion<P, string>

  export type Storage = Map<Page, Record<string, Object>>
}

export interface ResolverFn<C extends NUIComponent.Instance = any> {
  (component: C, consumerOptions: ConsumerOptions, next?: () => void): void
}

export namespace Store {
  export interface ActionObject {
    actionType: NOODLUIActionType
    fn: (...args: any[]) => any
    trigger?: NOODLUITrigger
  }

  export interface BuiltInObject {
    actionType: 'builtIn'
    fn: (...args: any[]) => any
    funcName: string
  }

  export interface ObserverObject<
    Evt extends NUIComponent.HookEvent = NUIComponent.HookEvent
  > {
    cond: ComponentType | Evt
    fn: NUIComponent.Hook[Evt]
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

  export interface RegisterObject<P extends Register.Page = '_global'> {
    registerEvent: string
    component?: RegisterComponentObject | NUIComponent.Instance
    fn?<D = any>(data?: D): D
    name?: string
    page: P
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

export interface IViewport {
  width: number | undefined
  height: number | undefined
  isValid(): boolean
  onResize: ViewportListener | undefined
}

export interface ViewportListener {
  (
    viewport: { width: number; height: number } & {
      previousWidth: number | undefined
      previousHeight: number | undefined
    },
  ): Promise<any> | any
}
