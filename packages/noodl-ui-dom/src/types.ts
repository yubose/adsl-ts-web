import { ComponentObject, ComponentType, PageObject } from 'noodl-types'
import {
  Component,
  DataAttribute,
  NOODLUI as NUI,
  NUIEmit,
  nuiEmitTransaction,
  Transaction as NUITransaction,
  TransactionId,
  UseObject as NUIUseObject,
} from 'noodl-ui'
import NOODLDOM from './noodl-ui-dom'
import NOODLDOMPage from './Page'
import {
  findAllByViewTag,
  findByViewTag,
  findByElementId,
  findWindow,
  findWindowDocument,
  isPageConsumer,
} from './utils'
import MiddlewareUtils from './MiddlewareUtils'
import { eventId, transaction } from './constants'

export interface ActionChainDOMContext {
  findAllByViewTag: typeof findAllByViewTag
  findByElementId: typeof findByElementId
  findByViewTag: typeof findByViewTag
  findWindow: typeof findWindow
  findWindowDocument: typeof findWindowDocument
  isPageConsumer: typeof isPageConsumer
}

export type NOODLDOMDataAttribute = DataAttribute | 'data-globalid'

export type NOODLDOMElementTypes = keyof NOODLDOMElements

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
    cond?: ComponentType | Func<boolean>
    before?: Resolve.Config | Func
    resolve?: Resolve.Config | Func
    after?: Resolve.Config | Func
    observe?: Partial<Page.Hook>
  }

  export interface Func<RT = void> {
    (
      node: HTMLElement | null,
      component: Component,
      args: ActionChainDOMContext & Options,
    ): RT
  }

  export interface LifeCycle {
    before: Func[]
    resolve: Func[]
    after: Func[]
  }

  export type LifeCycleEvent = 'before' | 'resolve' | 'after'
  export interface Options {
    editStyle(
      styles: Record<string, any> | undefined,
      args?: { remove?: string | string[] | false },
    ): void
    ndom: NOODLDOM
    original: ComponentObject
    draw: Parse
    page: NOODLDOMPage
    redraw: Redraw
  }
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
    [eventId.page.on.ON_DOM_CLEANUP](
      rootNode: NOODLDOM['page']['rootNode'],
    ): void
    [eventId.page.on.ON_BEFORE_RENDER_COMPONENTS](
      snapshot: Snapshot,
    ): Promise<
      | 'old.request'
      | { name: string; object: Record<string, any> }
      | void
      | undefined
    >
    [eventId.page.on.ON_COMPONENTS_RENDERED](
      snapshot: Snapshot & { components: Component[] },
    ): void
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
    render: {
      lastTop: {
        value: number
        componentIds: string[]
      }
    }
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

export interface Transaction
  extends Omit<NUITransaction, typeof nuiEmitTransaction.REQUEST_PAGE_OBJECT> {
  [nuiEmitTransaction.REQUEST_PAGE_OBJECT](
    page: NOODLDOMPage,
  ): Promise<PageObject>
}

export interface UseObject extends Omit<NUIUseObject, 'transaction'> {
  createGlobalComponentId?: Middleware.Utils['createGlobalComponentId']
  resolver?: Resolve.Config
  transaction?: Transaction &
    Omit<
      NUIUseObject['transaction'],
      typeof nuiEmitTransaction.REQUEST_PAGE_OBJECT
    >
}
