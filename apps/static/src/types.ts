import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type {
  ComponentPath,
  PageContext as GatsbyPluginPageContext,
  ListComponentsContext,
  StaticComponentObject,
} from '@/gatsby-plugin-noodl/types'
import type useRootObject from './hooks/useRootObject'

export type { ComponentPath, StaticComponentObject }

export type AppContext = ReturnType<typeof useRootObject>

export interface PageContext extends Omit<GatsbyPluginPageContext, 'lists'> {
  getId: (id: StaticComponentObject | string) => string
  getListObject: (
    id: StaticComponentObject | string,
    root?: Record<string, any>,
    pageName?: string,
  ) => any[] | nt.ReferenceString
  getIteratorVar: (id: StaticComponentObject | string) => string
  getCtxObject: (
    id: StaticComponentObject | string,
  ) => PageContextListContextObject | null
  getDataObject: (
    id: StaticComponentObject | string,
    root?: Record<string, any>,
    pageName?: string,
  ) => any
  isListConsumer: (id: StaticComponentObject | string) => boolean
  isCtxObj: (
    obj: PageContextListContextObject,
    id: StaticComponentObject | string,
  ) => boolean
  assetsUrl: string
  baseUrl: string
  name: string
  components: StaticComponentObject[]
  slug: string
  lists: PageContextListContextObject[]
}

export type PageContextListContextObject = ListComponentsContext[string]

export type RootObject<O extends Record<string, any> = Record<string, any>> =
  O & {
    Global: Record<LiteralUnion<'currentUser', string>, any>
    Style?: nt.StyleObject
  }
