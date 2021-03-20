import {
  ComponentObject,
  ComponentType,
  PageObject,
  StyleObject,
} from 'noodl-types'
import { ActionConsumerCallbackOptions } from './actionChainTypes'
import { ComponentInstance } from './componentTypes'
import componentCache from '../utils/componentCache'
import NOODLUI from '../noodl-ui'
import Viewport from '../Viewport'

export interface BuiltInActions {
  [funcName: string]: <A extends {}>(
    action: A,
    options: ActionConsumerCallbackOptions,
  ) => Promise<any> | any
}

export type ComponentCache = ReturnType<typeof componentCache>

export interface ComponentEventCallback {
  (
    noodlComponent: ComponentObject,
    args: {
      component: ComponentInstance
      parent: ComponentInstance | null
    },
  ): void
}

export interface ConsumerOptions {
  componentCache(): ComponentCache
  component: ComponentInstance
  context: ResolverContext
  createActionChainHandler: NOODLUI['createActionChainHandler']
  createSrc(path: Parameters<NOODLUI['createSrc']>[0]): string
  fetch?: Fetch
  getAssetsUrl(): string
  getBaseUrl(): string
  getBaseStyles(styles?: StyleObject): Partial<StyleObject>
  getCbs: NOODLUI['getCbs']
  getPageObject: StateHelpers['getPageObject']
  getPages(): string[]
  getPreloadPages(): string[]
  getResolvers: NOODLUI['getResolvers']
  getRoot(): { [key: string]: any }
  getState: StateHelpers['getState']
  plugins(location: 'head'): State['plugins']['head']
  plugins(location: 'body'): State['plugins']['body']
  plugins(location: 'body-top'): State['plugins']['body']['top']
  plugins(location: 'body-bottom'): State['plugins']['body']['bottom']
  plugins(location?: never): State['plugins']
  register: NOODLUI['register']
  resolveComponent(
    c:
      | (ComponentType | ComponentInstance | ComponentObject)
      | (ComponentType | ComponentInstance | ComponentObject)[],
  ): ComponentInstance
  resolveComponentDeep: NOODLUI['resolveComponents']
  setPlugin(plugin: string | PluginObject): this
  showDataKey: boolean
  viewport: Viewport
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

export interface ResolverContext {
  actionsContext: { noodl: any; noodlui: NOODLUI }
  assetsUrl: string
  page: string
}

export interface ResolverFn<C extends ComponentInstance = any> {
  (component: C, consumerOptions: ConsumerOptions): void
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
