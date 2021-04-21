import { ComponentObject, ComponentType, PageObject } from 'noodl-types'
import {
  Component,
  NUIComponent,
  nuiEmitTransaction,
  Page as NUIPage,
  Transaction as NUITransaction,
  Use,
  UseObject as NUIUseObject,
} from 'noodl-ui'
import MiddlewareUtils from './MiddlewareUtils'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import createResolver from './createResolver'
import {
  eventId,
  dataAttributes,
  transaction as ndomTransaction,
} from './constants'

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
    cond?: ComponentType | Func
    // createNode?()
    before?: Resolve.Config | Func
    resolve?: Resolve.Config | Func
    after?: Resolve.Config | Func
    observe?: Partial<Page.Hook>
  }

  export interface Func<RT = any, N extends HTMLElement | null = HTMLElement> {
    (node: N, component: Component, options: Resolve.Options): RT
  }

  export interface LifeCycle {
    before: Func[]
    resolve: Func[]
    after: Func[]
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
    [eventId.page.on.ON_STATUS_CHANGE](status: Page.Status): void
    [eventId.page.on.ON_NAVIGATE_START](snapshot: Snapshot): void
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
      snapshot: Snapshot,
    ): Promise<
      | 'old.request'
      | { name: string; object: Record<string, any> }
      | void
      | undefined
    >
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
    previous: string
    requesting: string
    modifiers: {
      [pageName: string]: { reload?: boolean } & {
        [key: string]: any
      }
    }
    render: {}
    reqQueue: string[]
    status: Status
    rootNode: boolean
  }

  export type Status = typeof eventId.page.status[keyof typeof eventId.page.status]

  export interface Snapshot {
    previous: string
    current: string
    requesting: string
    status: Page.Status
  }
}

export type NDOMTransaction =
  | {
      transaction: typeof ndomTransaction.REQUEST_PAGE_OBJECT
      page: NOODLDOMPage
    }
  | {
      transaction: typeof ndomTransaction.CREATE_ELEMENT
      component: NUIComponent.Instance
    }

export type NDOMTransactionId = keyof NDOMTransaction

export interface UseObject extends Omit<Use, 'transaction'>, Use.Action {
  createGlobalComponentId?: Middleware.Utils['createGlobalComponentId']

  resolver?: Resolve.Config
  transaction?: NDOMTransaction &
    Omit<
      NUIUseObject['transaction'],
      typeof ndomTransaction.REQUEST_PAGE_OBJECT
    > & {
      createElement?: {
        cond(component: NUIComponent.Instance): boolean
        resolve(component: NUIComponent.Instance): HTMLElement | null
      }
    }
}
