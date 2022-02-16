import type React from 'react'
import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type useRootObject from './hooks/useRootObject'

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
  isPreload: boolean
  startPage?: string
  pageName: string
  pageObject: {
    components: StaticComponentObject[]
  } & Record<string, any>
  slug: string
  _context_: {
    lists?: Record<string, PageContextListContextObject>
  }
}

export interface PageContextListContextObject {
  children: string[][]
  id: string
  listObject: any[]
  listObjectPath?: string
  iteratorVar: string
  path: (string | number)[]
}

export interface CreateElementProps<Props = any> {
  key?: string
  type: string
  children?: string | number | (string | number | CreateElementProps<Props>)[]
  style?: React.CSSProperties
  [key: string]: any
}

export interface CommonRenderComponentHelpers
  extends Pick<AppContext, 'root' | 'getInRoot' | 'setInRoot'> {
  _context_: PageContext['_context_']
  pageName: string
}

export type ComponentPath = (string | number)[]
