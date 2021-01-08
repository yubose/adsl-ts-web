import {
  ComponentObject,
  ComponentInstance,
  ComponentType,
  NOODL as NOODLUI,
  NOODLComponent,
} from 'noodl-ui'
import { eventId } from './constants'

export interface AnyFn {
  (...args: any[]): any
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

/**
 * Type utility/factory to construct node resolver func types. Node resolver
 * funcs in noodl-ui-dom are any functions that take a DOM node as the first
 * argument and a component instance as the second, at its base structure
 */
export interface NOODLUIDOMResolveFunc<
  N extends NOODLDOMElement,
  C extends ComponentInstance,
  Args extends unknown,
  RT extends unknown
> {
  (node: N | null | ((node: N | null) => any), component: C, args: Args): RT
}

export type NodeResolver<RT = any> = NOODLUIDOMResolveFunc<
  NOODLDOMElement,
  ComponentInstance,
  {
    noodlui: NOODLUI
    original: ComponentObject
    draw: Parse
    redraw: Redraw
  },
  RT | void
>

export type NodeResolverBaseArgs = [
  Parameters<NodeResolver>[0],
  Parameters<NodeResolver>[1],
]

export type NodeResolverUtils = Parameters<NodeResolver>[2]

export interface NodeResolverConfig {
  name?: string
  cond?: ComponentType | NodeResolver<boolean>
  before?: NodeResolverConfig | NodeResolver
  resolve?: NodeResolverConfig | NodeResolver
  after?: NodeResolverConfig | NodeResolver
}

export interface NodeResolverLifecycle {
  before: NodeResolver[]
  resolve: NodeResolver[]
  after: NodeResolver[]
}

export type NodeResolverLifeCycleEvent = 'before' | 'resolve' | 'after'

export interface Parse<C extends ComponentInstance = any> {
  (component: C, container?: NOODLDOMElement | null): NOODLDOMElement | null
}

export type Redraw = NOODLUIDOMResolveFunc<
  NOODLDOMElement,
  ComponentInstance,
  {
    resolver(
      noodlComponent: ComponentObject | ComponentObject[],
    ): ComponentInstance | ComponentInstance[]
  },
  [NOODLDOMElement, ComponentInstance]
>

export interface Render {
  (noodlComponents: NOODLComponent | NOODLComponent[]): ComponentInstance[]
}

export type RegisterOptions = NodeResolverConfig

/* -------------------------------------------------------
  ---- PAGE TYPES
-------------------------------------------------------- */

export type PageCbs<K extends PageEvent | PageStatus> = Record<K, AnyFn[]>
export type PageEvent = typeof eventId.page.on[keyof typeof eventId.page.on]
export type PageStatus = typeof eventId.page.status[keyof typeof eventId.page.status]

export interface PageCallbackObjectConfig {
  fn: AnyFn
  cond?(snapshot?: PageSnapshot): boolean
  once?: boolean
}

export interface PageSnapshot {
  status: PageStatus
  previous: string
  current: string
  requestingPage: string
  rootNode: HTMLDivElement
}
