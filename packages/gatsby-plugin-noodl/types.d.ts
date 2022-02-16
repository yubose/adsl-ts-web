import type { LiteralUnion } from 'type-fest'
import type {
  ActionObject,
  ComponentObject,
  Env,
  DeviceType,
  PageObject,
} from 'noodl-types'
import type { Action } from 'noodl-action-chain'
import type { PluginOptions as GatsbyPluginOptions } from 'gatsby'
import type { data } from './gatsby-node'

export interface InternalData {
  _assets_: string[]
  _context_: {
    [page: string]: {
      lists?: ListComponentsContext
      componentRefs?: ComponentReferencesContext[]
    }
  }
  _pages_: {
    json: Record<string, PageObject>
    serialized: Record<string, any>
  }
  configKey: string
  configUrl: string
  deviceType: DeviceType
  startPage: string
  template: string
}

export interface GatsbyNoodlPluginOptions {
  plugins: GatsbyPluginOptions
  assets?: string
  config?: string
  deviceType?: 'web' | 'android' | 'ios'
  ecosEnv?: Env
  loglevel?: 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn'
  path?: string
  startPage?: string
  template?: string
  viewport?: {
    width: number
    height: number
  }
}

export interface GatsbyNoodlPluginCacheObject {
  configKey?: string
  configUrl?: string
  configVersion?: string
  // rootConfig?: any
}

export type StaticComponentObject = ComponentObject &
  Record<
    string,
    {
      actions: (ActionObject & Record<string, any>)[]
      trigger: string
      injected: (ActionObject & Record<string, any>)[]
      queue: Action[]
      results: {
        action: ActionObject & Record<string, any>
        result: any
      }[]
      status: string
    }
  >

export interface PageContext {
  isPreload: boolean
  pageName: string
  pageObject: {
    components: StaticComponentObject[]
  }
  slug: string
  _context_: {
    [page: string]: {
      lists?: ListComponentsContext
      componentRefs?: ComponentReferencesContext[]
    }
  }
}

export interface ListComponentsContext {
  [key: string]: {
    children: string[][]
    id: string
    listObject: any[]
    iteratorVar: string
    path: (string | number)[]
  }
}

export interface ComponentReferencesContext {
  page: string
  path: string[]
  reference: string
}
