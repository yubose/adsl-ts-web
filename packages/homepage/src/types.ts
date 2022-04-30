import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type {
  ComponentPath,
  PageContext as GatsbyPluginPageContext,
  ListComponentsContext,
  StaticComponentObject,
} from 'gatsby-plugin-noodl'
import type useRootObject from './hooks/useRootObject'

export type { ComponentPath, StaticComponentObject }

export type AppContext = ReturnType<typeof useRootObject>

export interface PageContext extends Omit<GatsbyPluginPageContext, 'lists'> {
  getId: (id: string | StaticComponentObject) => string
  getListObject: (
    id: string | StaticComponentObject,
    root?: Record<string, any>,
    pageName?: string,
  ) => nt.ReferenceString | any[]
  getIteratorVar: (id: string | StaticComponentObject) => string
  getCtxObject: (
    id: string | StaticComponentObject,
  ) => PageContextListContextObject | null
  getDataObject: (
    id: string | StaticComponentObject,
    root?: Record<string, any>,
    pageName?: string,
  ) => any
  isListConsumer: (id: string | StaticComponentObject) => boolean
  isCtxObj: (
    obj: PageContextListContextObject,
    id: string | StaticComponentObject,
  ) => boolean
  assetsUrl: string
  baseUrl: string
  name: string
  components: StaticComponentObject[]
  slug: string
  lists: PageContextListContextObject[]
}

export type PageContextListContextObject = ListComponentsContext[string]

export type RootObject<O extends Record<string, any> = Record<string, any>> = {
  Global: Record<LiteralUnion<'currentUser', string>, any>
  Style?: nt.StyleObject
} & O
