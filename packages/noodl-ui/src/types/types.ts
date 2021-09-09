import { ComponentObject, PageObject, StyleObject } from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { noodluiObserver } from '../constants'
import { NOODLUIActionChain, NOODLUIActionObject } from './actionTypes'
import { NOODLUITrigger } from './index'
import { ComponentInstance } from './componentTypes'
import { Store } from './storeTypes'
import componentCache from '../utils/componentCache'
import Page from '../Page'
import noodlui_next from '../noodl-ui'
import Viewport from '../Viewport'

export { Page }

export interface IPage {
  id: 'root' | number
  page: string
  viewport: Viewport
}

export type NOODLUIObserver = typeof noodluiObserver

export type NOODLUIObserverFn<
  Evt extends keyof NOODLUIObserver
> = NOODLUIObserver[Evt][number]

export type ComponentCache = typeof componentCache

export type ComponentResolverArgs = [
  component: ComponentInstance,
  options: ConsumerOptions,
  next: (opts?: Record<string, any>) => void,
]

export type ConsumerOptions = Omit<
  ReturnType<typeof noodlui_next['getConsumerOptions']>,
  'createActionChain' | 'getBaseStyles'
> & {
  createActionChain(
    trigger: NOODLUITrigger,
    actions: NOODLUIActionObject | NOODLUIActionObject[],
    opts?: { loadQueue?: boolean },
  ): NOODLUIActionChain
  getBaseStyles(
    component: ComponentInstance,
  ): StyleObject & { [key: string]: any }
  ref?: NOODLUIActionChain
}

export type PageObjectContainer<K extends string = string> = Record<
  K,
  PageObject
>

export type PluginCreationType =
  | string
  | ComponentInstance
  | ComponentObject
  | Store.PluginObject

export type PluginLocation = 'head' | 'body-top' | 'body-bottom'

export interface ProxiedComponent extends ComponentObject {
  blueprint?: ComponentObject
  content?: any
  'data-key'?: string
  'data-listid'?: any
  'data-name'?: string
  'data-value'?: string
  'data-ux'?: string
  id?: string
  listId?: string
  listIndex?: number
  location?: PluginLocation
  [key: string]: any
}

export type RegisterStore = Map<
  RegisterPage,
  Record<string, Store.RegisterObject>
>

export type RegisterPage<P extends string = '_global'> = LiteralUnion<P, string>

export interface RegisterPageObject {
  [name: string]: Store.RegisterObject
}

export interface ResolverFn<C extends ComponentInstance = ComponentInstance> {
  (
    component: C | ComponentInstance,
    options: ConsumerOptions,
    internal?: any,
  ): void
}

export interface SelectOption {
  key: string
  label: string
  value: string
}
