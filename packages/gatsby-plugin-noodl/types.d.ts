import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type {
  ActionObject,
  ComponentObject,
  Env,
  DeviceType,
  PageObject,
  ReferenceString,
} from 'noodl-types'
import type { LinkStructure, FileStructure } from 'noodl'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type { Action } from 'noodl-action-chain'
import type { PluginOptions as GatsbyPluginOptions } from 'gatsby'
import type { data } from './gatsby-node'

export namespace InternalData {
  /**
   * Used in the client side
   */
  export type Context = {
    [page: string]: {
      lists?: ListComponentsContext
      refs?: ComponentReferencesContext
    }
  }
  export type Pages = {
    /**
     * Used in lvl3 and noodl-ui
     */
    json: Record<string, PageObject>
    /**
     * Used in GrapQL
     */
    serialized: Record<string, any>
  }
  export type Paths = {
    output: string
    template: string
  }
}

export interface GatsbyNoodlPluginOptions {
  plugins: GatsbyPluginOptions
  /**
   * If buildSource is "local" it will build using files locally (using "path" configured above).
   *
   * If buildSource is "remote" it will build files remotely using the "config" key as the endpoint.
   *
   * Defaults to "remote"
   */
  buildSource?: string
  config?: string
  cwd?: string
  deviceType?: 'web' | 'android' | 'ios'
  ecosEnv?: Env
  loglevel?: 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn'
  paths?: {
    // assets?: string
    output?: string
    src?: string
    template?: string
  }
  startPage?: string
  viewport?: {
    width: number
    height: number
  }
  version?: LiteralUnion<'latest', string>
}

/**
 * Component static objects used in the client side to render react elements
 */
export type StaticComponentObject = ComponentObject &
  Partial<
    Record<
      NUITrigger,
      {
        actions: (NUIActionObject & Record<string, any>)[]
        trigger: LiteralUnion<NUITrigger, string>
        injected: (NUIActionObject & Record<string, any>)[]
        queue: NUIAction[]
        results: {
          action: NUIActionObject & Record<string, any>
          result: any
        }[]
        status: ActionChainStatus
      }
    >
  > &
  Record<string, any>

/**
 * Context for pages. Populated from gatsby-node.js
 */
export interface PageContext {
  assetsUrl: string
  baseUrl: string
  name: string
  components: StaticComponentObject[]
  lists?: ListComponentsContext
  slug: string
  refs: {
    [reference: nt.ReferenceString]: {
      /**
       * If true, the reference is pointing to local root object
       */
      isLocal: boolean
      /**
       * If true, the reference is pointing to a list's listObject data object
       */
      isListChildren: boolean
      key: string
      path: string
      ref: nt.ReferenceString
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
    componentPath: (string | number)[]
    id: string
    iteratorVar: string
    listObject: ReferenceString | any[]
  }
}

export type ComponentPath = (string | number)[]

/**
 * NOTE: Currently not being used
 */
export interface ComponentReferencesContext {
  [reference: string]: {
    key: string
    path: string
    reference: string
  }
}

export interface DumpedMetadata<ConfigKey extends string = string> {
  appKey: LiteralUnion<'cadlEndpoint.yml', string>
  assetsUrl: string
  baseUrl: string
  buildSource: 'local' | 'remote'
  configKey: ConfigKey
  configUrl: LiteralUnion<
    `https://public.aitmed.com/config/${ConfigKey}.yml`,
    string
  >
  deviceType: DeviceType
  ecosEnv: Env
  loglevel: string
  isFileSystemOutput: boolean
  startPage: LiteralUnion<'HomePage', string>
  paths: {
    cacheDir: string
    cacheFiles: {
      /**
       * Key is name/title, value is path to directory
       */
      [name: string]: string
    }
    cwd: string
    output: string
    resolvedAssetsDir: string
    resolvedConfigsDir: string
    resolvedAppConfigFile: string
    resolvedOutputNamespacedWithConfig: string
    src: string
    template: string
    timestamp: string
  }
  assets: {
    logged: string[]
    saved: string[]
  }
  missingFiles: {
    assets: {
      /**
       * key is filename
       * url is the endpoint it was downloaded from
       * filepath is the the path to the downloaded assset
       */
      [name: string]: {
        url: string
        filepath: string
      }
    }
    pages: {
      [name: string]: {
        filename: string
        filepath: string
        name: string
      }
    }
  }
  viewport: {
    width: number
    height: number
  }
}
