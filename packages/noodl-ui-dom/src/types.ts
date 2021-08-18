import { LiteralUnion } from 'type-fest'
import { OrArray, OrPromise } from '@jsmanifest/typefest'
import { ComponentObject, ComponentType } from 'noodl-types'
import { Component, NUIComponent, NUI, UseArg as NUIUseObject } from 'noodl-ui'
import NDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import createResolver from './createResolver'
import GlobalComponentRecord from './global/GlobalComponentRecord'
import GlobalCssResourceRecord from './global/GlobalCssResourceRecord'
import GlobalJsResourceRecord from './global/GlobalJsResourceRecord'
import GlobalTimers from './global/Timers'
import { eventId } from './constants'
import { resourceTypes } from './utils/internal'

export interface IGlobalObject<T extends string = string> {
  type: T
}

export interface GlobalMap {
  components: Map<string, GlobalComponentRecord>
  pages: Record<string, NDOMPage>
  resources: {
    css: Record<string, GlobalResourceObject<'css'>>
    js: Record<string, GlobalResourceObject<'js'>>
  }
  timers: GlobalTimers
}

export interface GlobalResourceObject<Type extends GlobalResourceType> {
  isActive(): boolean
  onCreateRecord?: (<T extends GlobalResourceType>(
    record: GetGlobalResourceRecordAlias<T>,
  ) => Promise<void> | void)[]
  onLoad?: <T extends GlobalResourceType>(args?: {
    node: GetGlobalResourceElementAlias<T>
    record: GetGlobalResourceRecordAlias<T>
  }) => Promise<void> | void
  record: GetGlobalResourceRecordAlias<Type>
  lazyLoad?: boolean
}

export type GlobalResourceType = typeof resourceTypes[number]

export type GetGlobalResourceRecordAlias<Type extends GlobalResourceType> =
  Type extends 'css' ? GlobalCssResourceRecord : GlobalJsResourceRecord

export type GetGlobalResourceObjectAlias<Type extends GlobalResourceType> =
  Type extends 'css' ? GlobalCssResourceObject : GlobalJsResourceObject

export type GetGlobalResourceElementAlias<Type extends GlobalResourceType> =
  Type extends 'css'
    ? HTMLLinkElement
    : Type extends 'js'
    ? HTMLScriptElement
    : HTMLElement

export type GlobalResourceRecord =
  | GlobalCssResourceRecord
  | GlobalJsResourceRecord

export interface GlobalResourceObjectBase<T extends string = string> {
  cond?: Resolve.Config['cond']
  type: T
  [key: string]: any
}

export interface GlobalCssResourceObject
  extends GlobalResourceObjectBase<'css'> {
  href: string
  [key: string]: any
}

export interface GlobalJsResourceObject extends GlobalResourceObjectBase<'js'> {
  src: string
  [key: string]: any
}

export interface Hooks {
  onRedrawStart(args: {
    parent: NUIComponent.Instance | null
    component: NUIComponent.Instance
    context?: { dataObject?: any }
    node: HTMLElement | null
    page: NDOMPage
  }): OrPromise<void>
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

export namespace Resolve {
  export type BaseArgs = [node: HTMLElement, component: Component]

  export interface Config {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve.Func
    init?: Resolve.Func
    before?: Resolve.Func
    resolve?: Resolve.Func | Resolve.Hooks
    after?: Resolve.Func
    resource?: UseObject['resource']
  }

  export interface Func<RT = any> {
    (
      node: HTMLElement | null,
      component: NUIComponent.Instance,
      options: Resolve.Options,
    ): RT | void | Promise<RT | void>
  }

  export interface Hooks {
    onResource?: Record<
      string,
      (options: {
        node: HTMLElement | null
        component: NUIComponent.Instance
        options: Resolve.Options
        resource: {
          node: HTMLElement | null
          record: GlobalResourceRecord
        }
      }) => Promise<void> | void
    >
  }

  export interface LifeCycle {
    before: Resolve.Func[]
    resolve: (Resolve.Func | Resolve.Hooks)[]
    after: Resolve.Func[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'

  export type Options = ReturnType<
    ReturnType<typeof createResolver>['utils']['options']
  >
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
    [eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE](rootNode: HTMLElement): void
    [eventId.page.on.ON_DOM_CLEANUP](args: {
      global: NDOM['global']
      rootNode: NDOM['page']['rootNode']
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
    rootNode: boolean
  }

  export type Status =
    typeof eventId.page.status[keyof typeof eventId.page.status]

  export type Snapshot = ReturnType<NDOMPage['snapshot']>
}

export interface NDOMTransaction {
  REQUEST_PAGE_OBJECT(page: NDOMPage): Promise<NDOMPage>
}

export type NDOMTransactionId = keyof NDOMTransaction

export interface UseObject
  extends Omit<
    NUIUseObject<NDOMTransaction, NDOMTransactionId>,
    'transaction'
  > {
  createElementBinding?(
    component: NUIComponent.Instance,
  ): HTMLElement | null | void
  resolver?: Resolve.Config
  resource?: OrArray<Parameters<NDOM['createResource']>[0]>
  transaction?: Partial<NDOMTransaction>
}
