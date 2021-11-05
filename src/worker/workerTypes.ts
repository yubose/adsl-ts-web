import type { LiteralUnion } from 'type-fest'
import type { NUITrigger } from 'noodl-ui'
import * as nt from 'noodl-types'

type CommonPreloadPage = 'BaseDataModel' | 'BaseCSS' | 'BasePage'

export interface StoreObject {
  noodl?: {
    [configName: string]: {
      config?: nt.RootConfig
      preload?: Record<
        LiteralUnion<CommonPreloadPage, string>,
        Record<string, any>
      >
      pages?: Record<
        LiteralUnion<CommonPreloadPage, string>,
        Record<string, any>
      >
    }
  }
}

/* -------------------------------------------------------
    ---- FOREGROUND OWNED TYPES
  -------------------------------------------------------- */

export namespace Fg {}

/* -------------------------------------------------------
  ---- BACKGROUND OWNED TYPES
-------------------------------------------------------- */

export namespace Bg {
  /**
   *  ------------ STATE ---------------------------------------------------
   */

  export interface State {
    configKey: string
    configVersion: string
    pages: {
      [name: string]: {
        prefetching: boolean
        fetched: boolean
        meta: PageMeta
      }
    }
  }

  export interface PageMeta {
    reload?: boolean
    goto?: GotoMeta
  }

  export type GotoMeta = {
    [destination: string]:
      | ({ kind: 'init' } & InitGotoMeta[])
      | ({ kind: 'component' } & ComponentGotoMeta[])
  }

  export interface InitGotoMeta {
    init: any[]
    index: number
    pageName?: string
    value: string | nt.GotoObject
  }

  /**
   *  ------------ COMMAND -------------------------------------------------
   */

  export type CommandName = 'FETCH'

  export interface MessageCommand<Cmd extends string, A = any> {
    command: Cmd | undefined
    options?: A
  }

  export interface FetchMessageCommand extends MessageCommand<'FETCH'> {
    options: {
      /** Defaults to 'plain/text' */
      type?: 'blob' | 'json' | 'text'
      error?: {
        code?: number
        name: string
        message: string
      }
      env?: 'test' | 'stable'
      headers?: HeadersInit
      /** Defaults to 'GET" */
      method?: 'GET' | 'POST'
      params?: Record<string, any>
      url: LiteralUnion<FetchConfigUrl | FetchPreloadUrl | FetchPageUrl, string>
      version?: string
    }
  }

  export type FetchConfigUrl<S extends string = string> = `config:${S}` | S
  export type FetchPreloadUrl<S extends string = string> = `preload:${S}` | S
  export type FetchPageUrl<S extends string = string> = `page:${S}` | S

  export interface CacheMessageCommand<
    C extends 'CACHE_GET' | 'CACHE_SET' = 'CACHE_GET' | 'CACHE_SET',
  > extends MessageCommand<C> {
    options: C extends 'CACHE_SET'
      ? { key: string; value: any }
      : { key: string }
  }

  export interface ComponentGotoMeta {
    type: LiteralUnion<nt.ComponentType, string>
    component: nt.ComponentObject
    pageName?: string
    position: [x: number, y: number]
    values: {
      trigger: LiteralUnion<NUITrigger, string>
      value: string | nt.GotoObject
    }[]
  }

  export interface CommandFn<C extends string, A = any> {
    (
      options: MessageCommand<C, A>['options'],
      opts: Bg.CommandFnHelpers,
    ): Promise<any>
  }

  export interface CommandFnHelpers {
    postMessage: DedicatedWorkerGlobalScope['postMessage']
  }

  export interface CommandResult<R = any> {
    command: string
    result: R
  }

  /**
   *  ------------ MESSAGE -------------------------------------------------
   */

  export interface MessageOptions<Opts = Record<string, any>> {
    options: Opts | undefined
  }
}
