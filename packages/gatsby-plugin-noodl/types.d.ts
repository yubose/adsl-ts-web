import type { LiteralUnion } from 'type-fest'
import type { ActionObject, ComponentObject, Env } from 'noodl-types'
import type { Action } from 'noodl-action-chain'
import type { PluginOptions as GatsbyPluginOptions } from 'gatsby'

export interface GatsbyNoodlPluginOptions {
  plugins: GatsbyPluginOptions
  assets?: string
  config?: string
  ecosEnv?: Env
  loglevel?: 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn'
  path?: string
  template?: string
  viewport?: {
    width: number
    height: number
  }
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
      lists?: Record<
        string,
        {
          children: string[][]
          id: string
          listObject: any[]
          iteratorVar: string
          path: (string | number)[]
        }
      >
      componentRefs?: ComponentReferencesContext[]
    }
  }
}

export interface ComponentReferencesContext {
  page: string
  path: string[]
  reference: string
}
