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
  /**
   * Used in the client side
   */
  _assets_: string[]
  /**
   * Used in the client side
   */
  _context_: {
    [page: string]: {
      lists?: ListComponentsContext
      componentRefs?: ComponentReferencesContext[]
    }
  }
  /**
   * Asset urls that were reported
   */
  _loggedAssets_: string[]
  _pages_: {
    /**
     * Used in lvl3 and noodl-ui
     */
    json: Record<string, PageObject>
    /**
     * Used in GrapQL
     */
    serialized: Record<string, any>
  }
  /**
   * Passed to Loader, lvl3, and output dir
   */
  configKey: string
  /**
   * Not being used atm
   */
  configUrl: string
  /**
   * Used in retrieving version in root config
   */
  deviceType: DeviceType
  /**
   * Bound to main '/' route
   */
  startPage: string
  /**
   * Used as the page component renderer
   */
  template: string
}

export interface GatsbyNoodlPluginOptions {
  plugins: GatsbyPluginOptions
  assets?: string
  config?: string
  deviceType?: 'web' | 'android' | 'ios'
  ecosEnv?: Env
  loglevel?: 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn'
  output?: {
    assets?: string
    pages?: string
  }
  path?: string
  startPage?: string
  template?: string
  viewport?: {
    width: number
    height: number
  }
}

/**
 * NOTE: Currently not being used
 */
export interface GatsbyNoodlPluginCacheObject {
  configKey?: string
  configUrl?: string
  configVersion?: string
  // rootConfig?: any
}

/**
 * Component static objects used in the client side to render react elements
 */
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

/**
 * Context for pages. Populated from gatsby-node.js
 */
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

/**
 * Components context populated from gatsby-node.js
 * This serves as a mapping for list data objects for list descendants
 * to retrieve their data
 */
export interface ListComponentsContext {
  [key: string]: {
    children: string[][]
    id: string
    listObject: any[]
    iteratorVar: string
    path: (string | number)[]
  }
}

/**
 * NOTE: Currently not being used
 */
export interface ComponentReferencesContext {
  page: string
  path: string[]
  reference: string
}
