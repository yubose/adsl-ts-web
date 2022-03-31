/**
 * Noodl Personal Index Background Worker
 * Consumers of this library loads this worker in the client side like so:
 *
 * ```js
 * const piWorker = new Worker('./dist/noodl-pi.js')
 * ```
 */
import type { LiteralUnion } from 'type-fest'
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import FuzzyIndexCreator from './IndexCreator'
import { isObj, toArr, spread } from './utils'
import * as c from './constants'
import * as t from './types'

const _color = ''

class NoodlPiWorker<
  S extends IDB.DBSchema,
  SNames extends IDB.StoreNames<S> = IDB.StoreNames<S>,
> {
  #db: IDB.IDBPDatabase<S> | null = null
  #self: DedicatedWorkerGlobalScope
  #stores = new Map<
    LiteralUnion<SNames, string>,
    t.WorkerStoreObject<S, SNames>
  >()
  #hooks = ['all', ...Object.values(c.storeEvt)].reduce((acc, evtName) => {
    acc[evtName] = () => {}
    return acc
  }, {} as Record<keyof t.Hooks<S, SNames>, t.Hooks<S, SNames>[keyof t.Hooks<S, SNames>]>)
  indexCreator: FuzzyIndexCreator | null = null;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      db: this.db,
      self: this.#self,
      stores: this.#stores,
    }
  }

  constructor(stores: t.WorkerStoreObject<S, SNames>[]) {
    this.#self = self as DedicatedWorkerGlobalScope

    toArr(stores).forEach((obj) => {
      if (!obj.storeName) throw new Error(`storeName is missing`)

      this.#stores.set(obj.storeName, {
        storeName: obj.storeName,
        url: obj.url,
        ...('version' in obj ? { version: obj.version } : undefined),
      })

      this.#self.addEventListener('message', async (evt) => {
        const data = evt.data
        const type = data?.type
        console.log(`%c[lib] Received "${type}"`, `color:${_color};`, data)
        switch (type) {
          case c.storeEvt.SEARCH:
          case c.storeEvt.GET:
          case c.storeEvt.DELETE:
          case c.storeEvt.UPDATE: {
            return this.emit(type, data)
          }
          case c.storeEvt.STORE_DATA_VERSION_UPDATE: {
            await this.clearStoreData(data.storeName)
            return this.setStoreData({
              storeName: data.storeName,
              data: data.data,
              version: data.version,
            })
          }
        }
      })

      this.#self.addEventListener('messageerror', (evt) => {
        console.log(`%c[lib] Message error`, `color:tomato;`, evt)
      })

      this.#self.addEventListener('error', (evt) => {
        console.log(`%c[lib] Error`, `color:tomato;`, evt)
      })

      this.#self.addEventListener('rejectionhandled', (evt) => {
        console.log(`%c[lib] Rejection`, `color:tomato;`, evt)
      })

      this.#self.addEventListener('unhandledrejection', (evt) => {
        console.log(`%c[lib] Unhandled rejection`, `color:tomato;`, evt)
      })
    })
  }

  #fetchData = async (url: string) => {
    try {
      const response = await this.#self.fetch(url)
      const respData = await response.json()
      console.log(`%c[lib] Response data`, `color:${_color};`, respData)
      return respData
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  get db() {
    return this.#db as IDB.IDBPDatabase<S>
  }

  get hooks() {
    return this.#hooks
  }

  get stores() {
    return this.#stores
  }

  async init(db: IDB.IDBPDatabase<S>) {
    try {
      this.#db = db
      this.db.addEventListener('error', function (evt) {
        console.log(`%c[lib] Error`, `color:tomato;`, evt)
      })
      this.db.addEventListener('abort', function (evt) {
        console.log(`%c[lib] Aborted`, `color:tomato;`, evt)
      })
      this.db.addEventListener('close', function (evt) {
        console.log(`%c[lib] Closed`, `color:tomato;`, evt)
      })
      this.db.addEventListener('versionchange', function (evt) {
        console.log(`%c[lib] Version changed`, `color:tomato;`, evt)
      })

      await Promise.all(
        this.getStoreNames().map(async (storeName) => {
          try {
            const storeInfo = this.stores.get(storeName) as t.WorkerStoreObject<
              S,
              SNames
            >

            const keys = await this.#db
              ?.transaction(storeName as SNames)
              .store.getAllKeys()

            const isEmpty = !keys?.length
            if (isEmpty) this.emit(c.storeEvt.STORE_EMPTY, storeInfo)
            if (storeInfo.url) {
              const cachedVersion = isEmpty
                ? null
                : await this.getStoreVersion(storeName as SNames)
              const respData = await this.#fetchData(storeInfo.url)
              return this.emit(c.storeEvt.FETCHED_STORE_DATA, {
                storeName,
                cachedVersion,
                response: respData,
                url: storeInfo.url,
              })
            }
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            throw err
          }
        }),
      )

      return this.db
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  async isStale<SName extends SNames>(storeName: SName, vers: string) {
    const cachedVersion = await this.db.get(storeName, 'version' as any)
    return cachedVersion !== vers
  }

  hasStore<SName extends SNames>(storeName: SName) {
    return this.db.objectStoreNames.contains(storeName)
  }

  async createStore(storeName, options) {
    const store = this.db.createObjectStore(storeName, options)
    this.stores.set(storeName, { ...this.#stores.get(storeName), storeName })
    return store
  }

  getStoreNames() {
    return [...this.stores.keys()]
  }

  getStoreVersion<SName extends SNames>(storeName: SName) {
    return this.db.get(storeName, 'version' as any)
  }

  getStoreData<SName extends SNames>(storeName: SName, key: IDBKeyRange) {
    return this.db.get(storeName, key)
  }

  async clearStoreData<SName extends SNames>(storeName: SName) {
    await this.db.clear(storeName)
    return this.emit(c.storeEvt.STORE_DATA_CLEARED, storeName)
  }

  async setStoreData<N extends SNames>({
    storeName,
    data,
    version,
  }: {
    storeName: N
    data: IDB.StoreValue<S, N>
    version?: number
  }) {
    if (isObj(data)) {
      const fn = spread(this.setValue.bind(this, storeName))
      await Promise.all(Object.entries(data).map(fn))
    }
    if (version) await this.db.put(storeName, version as any, 'version' as any)
  }

  setValue<N extends SNames>(storeName: N, key: any, value: any) {
    return this.db.put(storeName, value, key)
  }

  sendMessage(
    ...args: Parameters<
      InstanceType<typeof DedicatedWorkerGlobalScope>['postMessage']
    >
  ) {
    console.log(`%c[lib] Sending "${args[0].type}"`, `color:${_color};`)
    return this.#self.postMessage(...args)
  }

  emit<
    Evt extends keyof t.Hooks<S, SNames>,
    Arg = any,
    Args extends any[] = any[],
  >(evtName: Evt, arg?: Arg | undefined, ...args: Args) {
    // @ts-expect-error
    this.hooks.all?.call(this, evtName, arg, ...args)
    return this.hooks[evtName as any]?.call(this, arg, ...args)
  }

  use(options: Partial<t.Hooks<S, SNames>>) {
    if (isObj(options)) {
      for (const [key, value] of Object.entries(options)) {
        if (key in this.#hooks) this.#hooks[key] = value
      }
    }
  }
}

export default NoodlPiWorker
