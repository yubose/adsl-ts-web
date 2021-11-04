import type { LiteralUnion } from 'type-fest'
import type { NUITrigger } from 'noodl-ui'
import * as nt from 'noodl-types'

/* -------------------------------------------------------
    ---- FOREGROUND OWNED TYPES
  -------------------------------------------------------- */

export namespace Fg {
  export interface MessageCommand<Cmd extends string, A = any> {
    command: Cmd | undefined
    options?: A
  }
}

/* -------------------------------------------------------
  ---- BACKGROUND OWNED TYPES
-------------------------------------------------------- */

export namespace Bg {
  /**
   *      --- STATE ---
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
   *      --- COMMAND ---
   */

  export type CommandName = 'FETCH'

  export interface FetchMessageCommand extends Fg.MessageCommand<'FETCH'> {
    options: {
      /**
       * Defaults to 'plain/text'
       */
      type?: string
      error?: {
        code?: number
        name: string
        message: string
      }
      headers?: HeadersInit
      /**
       * Defaults to 'GET"
       */
      method?: 'GET' | 'POST'
      params?: Record<string, any>
      url: string
    }
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
      options: Fg.MessageCommand<C, A>['options'],
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
   *      --- MESSAGE ---
   */

  export interface MessageOptions<Opts = Record<string, any>> {
    options: Opts | undefined
  }
}
