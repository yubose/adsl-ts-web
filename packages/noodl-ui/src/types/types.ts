import { ComponentObject, PageObject, StyleObject } from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { ComponentInstance } from './componentTypes'
import { Store } from './storeTypes'
import RegisterCache from '../cache/RegisterCache'
import ComponentCache from '../cache/ComponentCache'
import NUI from '../noodl-ui'
import NUIPage from '../Page'
import Viewport from '../Viewport'
import { NOODLUITrigger } from './constantTypes'
import { NOODLUIActionChain, NOODLUIActionObject } from './actionTypes'

export interface IPage {
  id: 'root' | string | number
  page: string
  viewport: Viewport
}

export namespace Cache {
  export type Component = ComponentCache

  export type ComponentHookEvent = 'add' | 'clear' | 'remove'

  export interface ComponentHook {
    add(component: ComponentInstance): void
    clear(components: { [id: string]: ComponentInstance }): void
    remove(component: ReturnType<ComponentInstance['toJSON']>): void
  }

  export type Pages = Map<PageId, Cache.PageEntry>

  export type PageId = IPage['id']

  export interface PageEntry {
    page: NUIPage
  }

  export type Register = RegisterCache
}

export type ComponentResolverArgs = [
  component: ComponentInstance,
  options: ConsumerOptions,
  next: (opts?: Record<string, any>) => void,
]

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
    component: ComponentInstance,
  ): StyleObject & { [key: string]: any }
  ref?: NOODLUIActionChain
}

export interface Fetch {
  (...args: any[]): Promise<any>
}

export type PageObjectContainer<K extends string = string> = Record<
  K,
  PageObject
>

export type PluginCreationType =
  | string
  | ComponentInstance
  | ComponentObject
  | PluginObject

export type PluginLocation = 'head' | 'body-top' | 'body-bottom'

export interface PluginObject {
  initiated?: boolean
  location?: PluginLocation
  path?: string
  content?: string
  ref: ComponentInstance
}

export interface ProxiedComponent extends Omit<ComponentObject, 'children'> {
  blueprint?: ProxiedComponent
  content?: any
  'data-key'?: string
  'data-listid'?: any
  'data-name'?: string
  'data-placeholder'?: string
  'data-src'?: string
  'data-value'?: string
  'data-ux'?: string
  id?: string
  itemObject?: any
  listId?: string
  listIndex?: number
  listObject?: '' | any[]
  location?: PluginLocation
  ref?: NOODLUI // Used for component type: page
  style?: StyleObject
  children?: ProxiedComponent | ProxiedComponent[]
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

export interface ResolverContext {
  actionsContext: { noodl: any; noodlui: NOODLUI }
  assetsUrl: string
  iteratorVar?: string
  page: string
}

export interface ResolverFn<C extends ComponentInstance = any> {
  (component: C, consumerOptions: ConsumerOptions, next?: () => void): void
}

export interface State {
  page: string
  plugins: {
    head: PluginObject[]
    body: {
      top: PluginObject[]
      bottom: PluginObject[]
    }
  }
  showDataKey: boolean
}

export type StateHelpers = StateGetters & StateSetters

export type StateGetters = {
  componentCache(): ComponentCache
  getState(): State
  getPageObject(page: string): PageObject
  plugins: ConsumerOptions['plugins']
}

export type StateSetters = { setPlugin: ConsumerOptions['setPlugin'] } & {
  [key: string]: any
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
