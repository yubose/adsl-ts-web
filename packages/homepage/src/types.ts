import * as nt from 'noodl-types'
import type { LiteralUnion } from 'type-fest'
import type { ActionChainStatus } from 'noodl-action-chain'
import type { NUIAction, NUIActionObject, NUITrigger } from 'noodl-ui'

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
