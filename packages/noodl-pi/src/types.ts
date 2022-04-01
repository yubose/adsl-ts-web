import type PiWorker from './noodl-pi'
import type { storeEvt } from './constants'

export interface ExecuteSQL<Q extends string = string> {
  (query: Q): Promise<any>
}

export interface HookHandler<Arg = any, Args = any> {
  (this: PiWorker, arg: Arg, ...args: Args[]): any
}

export interface Hooks<SNames extends string = string> {
  all: HookHandler<keyof Hooks>
  [storeEvt.STORE_EMPTY]: HookHandler<WorkerStoreObject>
  [storeEvt.FETCHED_STORE_DATA]: HookHandler<
    HookCRUDFnArgs<SNames> & {
      cachedVersion: number | null
      response: any
      url: string
    }
  >
  [storeEvt.STORE_DATA_VERSION_UPDATE]: HookHandler<
    HookCRUDFnArgs<SNames> & {
      data: any
      version: number
    }
  >
  [storeEvt.STORE_DATA_CLEARED]: HookHandler<SNames>
  [storeEvt.STORE_CREATED]: HookHandler<HookCRUDFnArgs<SNames>>
  [storeEvt.SEARCH]: HookHandler<
    HookCRUDFnArgs<SNames> & {
      query?: any
    }
  >
  [storeEvt.GET]: HookHandler<HookCRUDFnArgs<SNames>>
  [storeEvt.DELETE]: HookHandler<HookCRUDFnArgs<SNames>>
  [storeEvt.UPDATE]: HookHandler<HookCRUDFnArgs<SNames>>
}
export interface HookCRUDFnArgs<SName> {
  storeName: SName
}
export interface WorkerStoreObject {
  storeName: string
  version?: number | string
  url?: string
}
export interface PersonalIndexObjectBase {
  kText: string
  fKey: number
  fKeyHex: string
  initMapping: string
}
