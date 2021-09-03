import { LiteralUnion } from 'type-fest'
import { OrArray, OrPromise } from '@jsmanifest/typefest'
import { ComponentObject, ComponentType } from 'noodl-types'
import {
  Component,
  NUIComponent,
  Store,
  UseArg as NUIUseObject,
} from 'noodl-ui'
import { VProperties, VNode as _VNode, VText as _VText } from 'virtual-dom'
import NDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import NDOMResolver, { NDOMResolver_ } from './Resolver'
import GlobalComponentRecord from './global/GlobalComponentRecord'
import GlobalTimers from './global/Timers'
import { eventId, triggers } from './constants'

export type VNode = _VNode
export type VNodeAttributes = Record<string, any>
export type VNodeStyle = keyof CSSStyleDeclaration
export type VText = _VText

export interface IGlobalObject<T extends string = string> {
  type: T
}

export interface GlobalMap {
  components: Map<string, GlobalComponentRecord>
  pages: Record<string, NDOMPage>
  timers: GlobalTimers
}

export interface Hooks {
  onRedrawStart(args: {
    parent: NUIComponent.Instance | null
    component: NUIComponent.Instance
    context?: { dataObject?: any }
    node: HTMLElement | null
    page: NDOMPage
  }): OrPromise<void>
  onBeforeRequestPageObject(page: NDOMPage): void
  onAfterRequestPageObject(page: NDOMPage): void
}

export type DOMNodeInput =
  | NodeListOf<any>
  | NodeList
  | HTMLCollection
  | HTMLElement
  | HTMLElement[]
  | null

export type NDOMElement<T extends string = string> = T extends 'button'
  ? HTMLButtonElement
  : T extends 'canvas'
  ? HTMLCanvasElement
  : T extends 'chart'
  ? HTMLDivElement
  : T extends 'chatList'
  ? HTMLUListElement
  : T extends 'divider'
  ? HTMLHRElement
  : T extends 'ecosDoc'
  ? HTMLDivElement
  : T extends 'footer'
  ? HTMLDivElement
  : T extends 'header'
  ? HTMLDivElement
  : T extends 'label'
  ? HTMLDivElement
  : T extends 'map'
  ? HTMLDivElement
  : T extends 'iframe' | 'page'
  ? HTMLIFrameElement
  : T extends 'plugin' | 'pluginHead' | 'pluginBodyTop' | 'pluginBodyTail'
  ? HTMLDivElement | HTMLScriptElement | HTMLLinkElement | HTMLStyleElement
  : T extends 'popUp'
  ? HTMLDivElement
  : T extends 'image'
  ? HTMLImageElement
  : T extends 'textField'
  ? HTMLInputElement
  : T extends 'list'
  ? HTMLUListElement
  : T extends 'listItem'
  ? HTMLLIElement
  : T extends 'register'
  ? HTMLElement
  : T extends 'stylesheet'
  ? HTMLLinkElement
  : T extends 'script'
  ? HTMLScriptElement
  : T extends 'select'
  ? HTMLSelectElement
  : T extends 'style'
  ? HTMLStyleElement
  : T extends 'textView'
  ? HTMLTextAreaElement
  : T extends 'video'
  ? HTMLVideoElement
  : T extends 'view'
  ? HTMLDivElement
  : HTMLElement

export type ElementBinding = Map<
  'audioStream' | 'videoStream',
  (component: NUIComponent.Instance) => HTMLElement | null
>

export namespace Resolve_ {
  export interface BaseOptions<N extends VNode> {
    vnode: N
    component: NUIComponent.Instance
    page?: NDOMPage
  }

  export interface Config<N extends VNode = VNode> {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve_.Func<N, boolean>
    init?: Resolve_.Func<N>
    before?: Resolve_.Func<N>
    resolve?: Resolve_.Func<N>
    after?: Resolve_.Func<N>
  }

  export interface Func<N extends VNode, RT = void> {
    (
      options: ReturnType<NDOMResolver_['getOptions']> &
        Resolve_.BaseOptions<N>,
    ): RT
  }

  export interface LifeCycle {
    before: Resolve_.Config[]
    resolve: Resolve_.Config[]
    after: Resolve_.Config[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'
}

export namespace Resolve {
  export interface BaseOptions<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
  > {
    node: N
    component: NUIComponent.Instance
    page?: NDOMPage
  }

  export interface Config<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
  > {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve.Func<T, N, boolean>
    init?: Resolve.Func<T, N>
    before?: Resolve.Func<T, N>
    resolve?: Resolve.Func<T, N>
    after?: Resolve.Func<T, N>
  }

  export interface Func<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
    RT = void,
  > {
    (
      options: ReturnType<NDOMResolver['getOptions']> &
        Resolve.BaseOptions<T, N>,
    ): RT
  }

  export interface LifeCycle {
    before: Resolve.Config[]
    resolve: Resolve.Config[]
    after: Resolve.Config[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'
}

export namespace Render {
  export interface Func {
    (components: ComponentObject | ComponentObject[]): Component[]
  }
}

export type RegisterOptions = Resolve.Config

export namespace Page {
  export type HookEvent = keyof Hook

  export type Hook = {
    [eventId.page.on.ON_ASPECT_RATIO_MIN](prevMin: number, min: number): void
    [eventId.page.on.ON_ASPECT_RATIO_MAX](prevMax: number, max: number): void
    [eventId.page.on.ON_STATUS_CHANGE](status: Page.Status): void
    [eventId.page.on.ON_NAVIGATE_START](page: NDOMPage): void
    [eventId.page.on.ON_NAVIGATE_STALE](args: {
      previouslyRequesting: string
      newPageRequesting: string
      snapshot: Snapshot
    }): void
    [eventId.page.on.ON_NAVIGATE_ERROR](
      snapshot: Snapshot & { error: Error },
    ): void
    [eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE](node: HTMLElement): void
    [eventId.page.on.ON_DOM_CLEANUP](args: {
      global: NDOM['global']
      node: NDOM['page']['node']
    }): void
    [eventId.page.on.ON_BEFORE_RENDER_COMPONENTS](
      snapshot: Snapshot & { components: NUIComponent.Instance[] },
    ): void
    [eventId.page.on.ON_COMPONENTS_RENDERED](page: NDOMPage): void
    [eventId.page.on.ON_APPEND_NODE](args: {
      page: NDOMPage
      parentNode: HTMLElement
      node: HTMLElement
      component: Component
    }): void
    // Redraw events
    [eventId.page.on.ON_REDRAW_BEFORE_CLEANUP](args: {
      parent: NUIComponent.Instance | null
      component: NUIComponent.Instance
      context?: { dataObject?: any }
      node: HTMLElement | null
      page: NDOMPage
    }): void
    [eventId.page.on.ON_SET_ROOT_NODE](args: {
      node: HTMLDivElement | HTMLIFrameElement | null
    }): void
  }

  export interface HookDescriptor<Evt extends Page.HookEvent = Page.HookEvent> {
    id: Evt
    once?: boolean
    fn: Page.Hook[Evt]
  }

  export interface State {
    aspectRatio: number
    aspectRatioMin: number
    aspectRatioMax: number
    previous: string
    requesting: string
    modifiers: {
      [pageName: string]: { reload?: boolean } & {
        [key: string]: any
      }
    }
    status: Status
    node: boolean
  }

  export type Status =
    typeof eventId.page.status[keyof typeof eventId.page.status]

  export type Snapshot = ReturnType<NDOMPage['snapshot']>
}

export interface NDOMTransaction {
  REQUEST_PAGE_OBJECT(page: NDOMPage): Promise<NDOMPage>
}

export type NDOMTransactionId = keyof NDOMTransaction

export type NDOMTrigger = typeof triggers[number]

export interface UseObject
  extends Omit<
    NUIUseObject<NDOMTransaction, NDOMTransactionId>,
    'emit' | 'transaction'
  > {
  createElementBinding?(
    component: NUIComponent.Instance,
  ): HTMLElement | null | void
  emit: Partial<
    Record<NDOMTrigger, OrArray<Store.ActionObject<'emit', NDOMTrigger>['fn']>>
  >
  resolver?: Resolve.Config
  transaction?: Partial<NDOMTransaction>
}
