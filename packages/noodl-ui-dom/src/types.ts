import { LiteralUnion } from 'type-fest'
import { AcceptArray } from '@jsmanifest/typefest'
import { ComponentObject, ComponentType } from 'noodl-types'
import { Component, NUIComponent, NUI, UseArg as NUIUseObject } from 'noodl-ui'
import MiddlewareUtils from './MiddlewareUtils'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import createResolver from './createResolver'
import GlobalComponentRecord from './global/GlobalComponentRecord'
import GlobalCssResourceRecord from './global/GlobalCssResourceRecord'
import GlobalJsResourceRecord from './global/GlobalJsResourceRecord'
import GlobalTimers from './global/Timers'
import { eventId, dataAttributes } from './constants'
import { resourceTypes } from './utils/internal'

export interface IGlobalObject<T extends string = string> {
  type: T
}

export interface GlobalMap {
  components: Map<string, GlobalComponentRecord>
  pages: Record<string, NOODLDOMPage>
  resources: {
    css: Record<string, GlobalResourceObject<'css'>>
    js: Record<string, GlobalResourceObject<'js'>>
  }
  timers: GlobalTimers
}

export interface GlobalResourceObject<Type extends GlobalResourceType> {
  onCreateRecord?: ((
    record: GetGlobalResourceRecordAlias<Type>,
  ) => Promise<void> | void)[]
  onLoad?(args?: {
    node: GetGlobalResourceElementAlias<Type>
    record: GetGlobalResourceRecordAlias<Type>
  }): Promise<void> | void
  record: GetGlobalResourceRecordAlias<Type>
}

export type GlobalResourceType = typeof resourceTypes[number]

export type GetGlobalResourceRecordAlias<
  Type extends GlobalResourceType = any,
> = Type extends 'css' ? GlobalCssResourceRecord : GlobalJsResourceRecord

export type GetGlobalResourceObjectAlias<
  Type extends GlobalResourceType = any,
> = Type extends 'css' ? GlobalCssResourceObject : GlobalJsResourceObject

export type GetGlobalResourceElementAlias<
  Type extends GlobalResourceType = any,
> = Type extends 'css' ? HTMLLinkElement : HTMLScriptElement

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
}

export interface GlobalJsResourceObject extends GlobalResourceObjectBase<'js'> {
  src: string
}

export interface GlobalComponentRecordObject {
  type: 'component'
  record: GlobalComponentRecord
}

export interface GlobalPageRecordObject {
  type: 'page'
  record: NOODLDOMPage
}

export type GlobalStoreRecordObject =
  | GlobalComponentRecordObject
  | GlobalPageRecordObject

export type GlobalRecordType = GlobalStoreRecordObject['type']

export type DOMNodeInput =
  | NodeListOf<any>
  | NodeList
  | HTMLCollection
  | HTMLElement
  | HTMLElement[]
  | null

export type NOODLDOMDataAttribute = typeof dataAttributes[number]
export type NOODLDOMDataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
export type NOODLDOMElement = Extract<
  NOODLDOMElements[NOODLDOMElementTypes],
  HTMLElement
>
export type NOODLDOMElements = Pick<
  HTMLElementTagNameMap,
  | 'br'
  | 'button'
  | 'canvas'
  | 'div'
  | 'footer'
  | 'img'
  | 'input'
  | 'iframe'
  | 'label'
  | 'li'
  | 'link'
  | 'ol'
  | 'option'
  // | 'script'
  | 'select'
  | 'span'
  | 'textarea'
  | 'ul'
  | 'video'
>

export type NOODLDOMElementTypes = keyof NOODLDOMElements

export type ElementBinding = Map<
  'audioStream' | 'videoStream',
  (component: NUIComponent.Instance) => HTMLElement | null
>

/**
 * Type utility/factory to construct node resolver func types. Node resolver
 * funcs in noodl-ui-dom are any functions that take a DOM node as the first
 * argument and a component instance as the second, at its base structure
 */

export interface Parse<C extends Component = any> {
  (component: C, container?: NOODLDOMElement | null): NOODLDOMElement | null
}

export type Redraw = any

export namespace Resolve {
  export type BaseArgs = [node: HTMLElement, component: Component]

  export interface Config {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve.Func
    init?: Resolve.Func
    before?: Resolve.Config | Resolve.Func
    resolve?: Resolve.Config | Resolve.Func | Resolve.Hooks
    after?: Resolve.Config | Resolve.Func
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
    resolve: Resolve.Func[]
    after: Resolve.Func[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'

  export type Options = ReturnType<
    ReturnType<typeof createResolver>['utils']['options']
  >
}

export namespace Middleware {
  export type Utils = MiddlewareUtils
}

export namespace Render {
  export interface Func {
    (components: ComponentObject | ComponentObject[]): Component[]
  }
}

export type RegisterOptions = Resolve.Config

/* -------------------------------------------------------
  ---- PAGE TYPES
-------------------------------------------------------- */
export namespace Page {
  export type HookEvent = keyof Hook

  export type Hook = {
    [eventId.page.on.ON_ASPECT_RATIO_MIN](prevMin: number, min: number): void
    [eventId.page.on.ON_ASPECT_RATIO_MAX](prevMax: number, max: number): void
    [eventId.page.on.ON_STATUS_CHANGE](status: Page.Status): void
    [eventId.page.on.ON_NAVIGATE_START](page: NOODLDOMPage): void
    [eventId.page.on.ON_NAVIGATE_STALE](args: {
      previouslyRequesting: string
      newPageRequesting: string
      snapshot: Snapshot
    }): void
    [eventId.page.on.ON_NAVIGATE_ABORT](snapshot: Snapshot): void
    [eventId.page.on.ON_NAVIGATE_ERROR](
      snapshot: Snapshot & { error: Error },
    ): void
    [eventId.page.on.ON_OUTBOUND_REDIRECT](snapshot: Snapshot): void
    [eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE](rootNode: HTMLElement): void
    [eventId.page.on.ON_DOM_CLEANUP](args: {
      global: NOODLDOM['global']
      rootNode: NOODLDOM['page']['rootNode']
    }): void
    [eventId.page.on.ON_BEFORE_RENDER_COMPONENTS](
      snapshot: Snapshot & { components: NUIComponent.Instance[] },
    ): void
    [eventId.page.on.ON_COMPONENTS_RENDERED](page: NOODLDOMPage): void
    [eventId.page.on.ON_APPEND_NODE](args: {
      page: NOODLDOMPage
      parentNode: HTMLElement
      node: HTMLElement
      component: Component
    }): void
    // Redraw events
    [eventId.page.on.ON_REDRAW_BEFORE_CLEANUP](
      node: HTMLElement | null,
      component: Component,
    ): void
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
    render: {}
    status: Status
    rootNode: boolean
  }

  export type Status =
    typeof eventId.page.status[keyof typeof eventId.page.status]

  export type Snapshot = ReturnType<NOODLDOMPage['snapshot']>
}

export interface NDOMTransaction {
  REQUEST_PAGE_OBJECT(page: NOODLDOMPage): Promise<NOODLDOMPage>
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
  resource?: AcceptArray<UseObjectGlobalResource>
  transaction?: Partial<NDOMTransaction>
}

export type UseObjectGlobalResource<
  Type extends GlobalResourceType = GlobalResourceType,
> =
  | string
  | (GetGlobalResourceObjectAlias<Type> &
      Partial<Pick<GlobalResourceObject<Type>, 'onCreateRecord' | 'onLoad'>>)
