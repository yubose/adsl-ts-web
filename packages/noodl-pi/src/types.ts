import type IDB from 'idb'
import type PiWorker from './noodl-pi'
import type { storeEvt } from './constants'

export type DB<S extends IDB.DBSchema = IDB.DBSchema> = IDB.IDBPDatabase<S>

export interface HookHandler<
  S extends IDB.DBSchema,
  SNames extends IDB.StoreNames<S>,
  Arg = any,
  Args = any,
> {
  (this: PiWorker<S, SNames>, arg: Arg, ...args: Args[]): any
}

export interface Hooks<
  S extends IDB.DBSchema = IDB.DBSchema,
  SNames extends IDB.StoreNames<S> = IDB.StoreNames<S>,
> {
  all: HookHandler<S, SNames, keyof Hooks<S, SNames>>
  [storeEvt.STORE_EMPTY]: HookHandler<S, SNames, WorkerStoreObject<S, SNames>>
  [storeEvt.FETCHED_STORE_DATA]: HookHandler<
    S,
    SNames,
    HookCRUDFnArgs<SNames> & {
      cachedVersion: number | null
      response: any
      url: string
    }
  >
  [storeEvt.STORE_DATA_VERSION_UPDATE]: HookHandler<
    S,
    SNames,
    HookCRUDFnArgs<SNames> & {
      data: any
      version: number
    }
  >
  [storeEvt.STORE_DATA_CLEARED]: HookHandler<S, SNames, SNames>
  [storeEvt.STORE_CREATED]: HookHandler<S, SNames, HookCRUDFnArgs<SNames>>
  [storeEvt.SEARCH]: HookHandler<
    S,
    SNames,
    HookCRUDFnArgs<SNames> & {
      query?: any
    }
  >
  [storeEvt.GET]: HookHandler<S, SNames, HookCRUDFnArgs<SNames>>
  [storeEvt.DELETE]: HookHandler<S, SNames, HookCRUDFnArgs<SNames>>
  [storeEvt.UPDATE]: HookHandler<S, SNames, HookCRUDFnArgs<SNames>>
}
export interface HookCRUDFnArgs<SName> {
  storeName: SName
}
export interface WorkerStoreObject<
  S extends IDB.DBSchema,
  SName extends IDB.StoreNames<S>,
> {
  storeName: SName
  version?: number | string
  url?: string
}
export interface PersonalIndexObjectBase {
  kText: string
  fKey: number
  fKeyHex: string
  initMapping: string
}
