import type React from 'react'
import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type useRootObject from './hooks/useRootObject'

export type RootObject<O extends Record<string, any> = Record<string, any>> = {
  Global: Record<LiteralUnion<'currentUser', string>, any>
  Style?: nt.StyleObject
} & O

export type AppContext = ReturnType<typeof useRootObject>

export type StaticComponentObject = nt.ComponentObject &
  Partial<
    Record<
      NUITrigger,
      {
        actions: (NUIActionObject & Record<string, any>)[]
        trigger: LiteralUnion<NUITrigger, string>
        injected: (NUIActionObject & Record<string, any>)[]
        queue: NUIAction[]
        results: {
          action: NUIActionObject
          result: any
        }[]
        status: ActionChainStatus
      }
    >
  > &
  Record<string, any>

export interface PageContext {
  getListObject: (
    id: string | StaticComponentObject,
    root?: Record<string, any>,
    pageName?: string,
  ) => nt.ReferenceString | any[]
  getListsCtxObject: (
    id: string | StaticComponentObject,
  ) => PageContextListContextObject
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

export interface PageContextListContextObject {
  children: string[][]
  componentPath: (string | number)[]
  id: string
  iteratorVar: string
  listObject: nt.ReferenceString | any[]
}

export interface CreateElementProps<Props = any> {
  key?: string
  type: string
  children?: string | number | (string | number | CreateElementProps<Props>)[]
  style?: React.CSSProperties
  [key: string]: any
}

export interface CommonRenderComponentHelpers
  extends Pick<AppContext, 'root' | 'getR' | 'setR'> {
  name: string
}

export type ComponentPath = (string | number)[]
