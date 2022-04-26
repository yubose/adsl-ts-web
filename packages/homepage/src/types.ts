import type React from 'react'
import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type useRootObject from './hooks/useRootObject'

export type RootObjectContext<
  O extends Record<string, any> = Record<string, any>,
> = {
  Global: Record<string, any>
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
    idOrComponent: string | StaticComponentObject,
  ) => string | any[]
  getListsCtxObject: (
    idOrComponent: string | StaticComponentObject,
  ) => PageContextListContextObject
  getIteratorVar: (idOrComponent: string | StaticComponentObject) => string
  getListDataObject: (idOrComponent: string | StaticComponentObject) => any
  isListConsumer: (idOrComponent: string | StaticComponentObject) => boolean
  startPage?: string
  pageName: string
  pageObject: {
    components: StaticComponentObject[]
  } & Record<string, any>
  slug: string
  lists: {
    [componentId: string]: PageContextListContextObject
  }
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
  dataObjectMapping?: Record<string, any>
  id: string
  iteratorVar: string
  listObject: nt.ReferenceString | any[]
  listObjectPath?: string
  isReference: boolean
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
  _context_: PageContext['_context_']
  pageName: string
}

export type ComponentPath = (string | number)[]
