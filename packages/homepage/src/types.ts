import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'
import type { AppState } from './AppProvider'
import { Draft } from 'immer'

export type AppContext = AppState & {
  set: ((draft: Draft<AppState>) => void) | Partial<AppState>
  get: (key: string) => any
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
