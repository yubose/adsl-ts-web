import type { LiteralUnion } from 'type-fest'
import type { NUITrigger } from 'noodl-ui'
import { userEvent } from 'noodl-types'
import * as nt from 'noodl-types'

export type CommandName = 'FETCH'

export interface CommandFn<C extends string, A = any> {
  (options: MessageCommand<C, A>['options'], opts: CommandOptions): Promise<any>
}

export interface CommandOptions {
  postMessage: DedicatedWorkerGlobalScope['postMessage']
}

/**
 * Not being used atm
 */
export interface MessageOptions<Opts = Record<string, any>> {
  options: Opts | undefined
}

export interface MessageCommand<Cmd extends string, A = any> {
  command: Cmd | undefined
  options?: A
}

export interface FetchMessageCommand extends MessageCommand<'FETCH'> {
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

export interface NoodlWorkerState {
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
