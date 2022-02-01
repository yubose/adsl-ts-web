import type { Draft } from 'immer'
import type React from 'react'
import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type { AppState } from './AppProvider'

export type AppContext = AppState & {
  set: (
    fnOrState: ((draft: Draft<AppState>) => void) | Partial<AppState>,
  ) => void
  get: (key: string, pageName?: string) => any
}

export type StaticComponentObject = nt.ComponentObject &
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

export interface PageContext {
  isPreload: boolean
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
  children?: CreateElementProps<Props>[]
  style?: React.CSSProperties
  [key: string]: any
}

export interface CommonRenderComponentHelpers {
  _context_: PageContext['_context_']
  getInRoot: AppContext['get']
  pageName: string
  root: AppContext['pages']
  setInRoot: AppContext['set']
}
