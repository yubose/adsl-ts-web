import { ComponentObject } from 'noodl-types'
import {
  ActionChainContext,
  ComponentInstance,
  ComponentType,
  NOODL as NOODLUI,
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
} from './utils/utils'
import { eventId } from './constants'
import { ComponentInstance } from '../../noodl-ui/dist'

export interface AnyFn {
  (...args: any[]): any
}

export interface ActionChainDOMContext extends ActionChainContext {
  findAllByViewTag: typeof findAllByViewTag
  findByElementId: typeof findByElementId
  findByViewTag: typeof findByViewTag
  findWindow: typeof findWindow
  findWindowDocument: typeof findWindowDocument
  isPageConsumer: typeof isPageConsumer
}

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

export type Observer = {
  [eventId.page.on.ON_DOM_CLEANUP](
    this: NOODLDOM,
    rootNode: NOODLDOM['page']['rootNode'],
  ): void
  [eventId.page.on.ON_APPEND_NODE](
    this: NOODLDOM,
    args: {
      page: NOODLDOMPage
      parentNode: HTMLElement
      node: HTMLElement
      component: ComponentInstance
    },
  ): void
  [eventId.page.on.ON_BEFORE_APPEND_CHILD](
    this: NOODLDOM,
    args: {
      component: {
        instance: ComponentInstance
        node: HTMLElement
        bounds: DOMRect
      }
      child: {
        instance: ComponentInstance
        node: HTMLElement
        bounds: DOMRect
        index: number
      }
    },
  ): void
  [eventId.page.on
    .ON_AFTER_APPEND_CHILD]: Observer[typeof eventId.page.on.ON_BEFORE_APPEND_CHILD]
  [eventId.page.on.ON_CHILD_NODES_RENDERED](args: {
    node: HTMLElement
    component: ComponentInstance
    blueprint: ComponentObject
    page: NOODLDOMPage
  }): void
  // Redraw events
  [eventId.page.on.ON_REDRAW_BEFORE_CLEANUP](
    this: NOODLDOM,
    node: HTMLElement | null,
    component: ComponentInstance,
  ): void
}

/**
 * Type utility/factory to construct node resolver func types. Node resolver
 * funcs in noodl-ui-dom are any functions that take a DOM node as the first
 * argument and a component instance as the second, at its base structure
 */

export interface Parse<C extends ComponentInstance = any> {
  (component: C, container?: NOODLDOMElement | null): NOODLDOMElement | null
}

export type Redraw = any

export namespace Resolve {
  export type BaseArgs = [node: HTMLElement, component: ComponentInstance]

  export interface Config {
    name?: string
    cond?: ComponentType | Func<boolean>
    before?: Resolve.Config | Func
    resolve?: Resolve.Config | Func
    after?: Resolve.Config | Func
    observe?: Partial<Observer>
  }

  export interface Func<RT = void> {
    (
      node: HTMLElement | null,
      component: ComponentInstance,
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
    noodlui: NOODLUI
    noodluidom: NOODLDOM
    original: ComponentObject
    draw: Parse
    redraw: Redraw
  }
}

export namespace Render {
  export interface Func {
    (components: ComponentObject | ComponentObject[]): ComponentInstance[]
  }
}

export type RegisterOptions = Resolve.Config

/* -------------------------------------------------------
  ---- PAGE TYPES
-------------------------------------------------------- */

export namespace Page {
  export type Cbs<K extends Event | Status> = Record<K, AnyFn[]>

  export type Event = typeof eventId.page.on[keyof typeof eventId.page.on]

  export type Status = typeof eventId.page.status[keyof typeof eventId.page.status]

  export interface State {
    previous: string
    current: string
    requesting: string
    modifiers: {
      [pageName: string]: { reload?: boolean } & {
        [key: string]: any
      }
    }
    render: {
      lastTop: number
    }
    rootNode: boolean
    status: Status
  }
}

export interface PageCallbackObjectConfig {
  fn: AnyFn
  cond?(snapshot?: PageSnapshot): boolean
  once?: boolean
}

export interface PageSnapshot {
  status: Page.Status
  previous: string
  current: string
  requestingPage: string
  rootNode: HTMLDivElement
}
