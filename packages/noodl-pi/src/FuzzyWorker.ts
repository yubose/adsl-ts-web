import * as u from '@jsmanifest/utils'
import type { ValueOf } from 'type-fest'
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import FuzzyIndexCreator from './IndexCreator'
import * as c from './constants'
import * as t from './types'

class FuzzyWorker {
  static databaseName = c.DATABASE_NAME
  #self: DedicatedWorkerGlobalScope
  #stores = new Map<
    string,
    { store?: IDB.IDBPObjectStore; storeName: string }
  >()
  db: IDB.IDBPDatabase | null = null
  indexCreator: FuzzyIndexCreator | null = null

  constructor(
    _self: DedicatedWorkerGlobalScope,
    storeProps?:
      | string // storeName
      | string[] // storeName[]
      | Record<
          string,
          string | ReturnType<ValueOf<FuzzyWorker, 'stores'>['get']>
        >,
    ...args: string[] // storeName[]
  ) {
    this.#self = _self

    if (u.isStr(storeProps) || u.isArr(storeProps) || args.length) {
      u.forEach(
        (arg) =>
          u.forEach(
            (storeName) => this.stores.set(storeName, { storeName }),
            u.array(arg as string),
          ),
        u.array(storeProps),
      )
    } else if (u.isObj(storeProps)) {
      u.forEach(([key, value]) => {
        if (u.isStr(value)) this.stores.set(key as string, { storeName: value })
        else if (!u.isObj(value)) this.stores.set(key as string, value as any)
        else throw new Error(`value is not an object`)
      }, u.entries(storeProps))
    }

    this.#self.addEventListener('message', async (evt) => {
      const { data } = evt
      if (u.isObj(data)) {
        if (data.type) {
          switch (data.type) {
            case c.REQUESTED_STORE_DATA:
              this.setStoreData(data.storeName, data.data)
              return this.sendMessage({
                type: c.STORE_DATA,
                storeName: data.storeName,
                name: data.storeName,
                data: data.data,
              })
            default:
              break
          }
        }
      }
    })

    this.#self.addEventListener('messageerror', function (evt) {
      console.log(`%c[bg-messageerror] Message error`, `color:tomato;`, evt)
    })

    this.#self.addEventListener('error', function (evt) {
      console.log(`%c[bg-error] Error`, `color:tomato;`, evt)
    })

    this.#self.addEventListener('rejectionhandled', function (evt) {
      console.log(`%c[bg-rejectionhandled] Rejection`, `color:tomato;`, evt)
    })

    this.#self.addEventListener('unhandledrejection', function (evt) {
      console.log(`%c[bg-unhandledrejection] Rejection`, `color:tomato;`, evt)
    })
  }

  get stores() {
    return this.#stores
  }

  async init() {
    try {
      this.db = await idb.openDB(FuzzyWorker.databaseName, undefined, {
        upgrade: async (...args) => {
          const [db, oldVersion, newVersion, transaction] = args

          console.log(`%c[init][openDB-upgrade]`, `color:#00b406;`, args)

          await Promise.all(
            [...this.stores.keys()].map(async (storeName) => {
              try {
                if (!db.objectStoreNames.contains(storeName)) {
                  this.createStore(storeName)
                  console.log(
                    `%cCreated database store "${storeName}"`,
                    `color:#c4a901;`,
                  )
                }
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error(String(error))
                throw err
              }
            }),
          )
        },
        blocked() {
          console.log(`%c[openDB-blocked]`, `color:tomato;`, arguments)
        },
        blocking() {
          console.log(`%c[openDB-blocking]`, `color:tomato;`, arguments)
        },
        terminated() {
          console.log(`%c[openDB-terminated]`, `color:orange;`, arguments)
        },
      })

      this.db.addEventListener('error', function (evt) {
        console.log(`%c[_db-error] Error`, `color:tomato;`, evt)
      })

      this.db.addEventListener('abort', function (evt) {
        console.log(`%c[_db-abort] Aborted`, `color:tomato;`, evt)
      })

      this.db.addEventListener('close', function (evt) {
        console.log(`%c[_db-close] Closed`, `color:tomato;`, evt)
      })

      this.db.addEventListener('versionchange', function (evt) {
        console.log(
          `%c[_db-versionchange] Version changed`,
          `color:tomato;`,
          evt,
        )
      })

      this.getStoreNames().forEach((storeName) => {
        const { store } = this.db?.transaction(storeName, 'readwrite') || {}
        this.sendMessage({
          type: c.REQUEST_STORE_DATA,
          storeName: store?.get(storeName),
        })
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  createStore(storeName: string, options?: IDBObjectStoreParameters) {
    const store = this.db?.createObjectStore(storeName, options)
    this.stores.set(storeName, { storeName, store: store as any })
    return store
  }

  getStore(storeName: string) {
    return this.stores.get(storeName)?.store || null
  }

  getStoreNames() {
    return [...this.stores.keys()]
  }

  async setStoreData(storeName: string, data: any) {
    const validKey = await this.db?.put(storeName, data)
    return validKey
  }

  sendMessage(
    ...args: Parameters<
      InstanceType<typeof DedicatedWorkerGlobalScope>['postMessage']
    >
  ) {
    return this.#self.postMessage(...args)
  }

  createPersonalIndex(
    cb: <O extends Record<string, any>>(
      pIndex: t.PersonalIndexObjectBase,
    ) => O & t.PersonalIndexObjectBase,
    kTexts: string | string[],
  ) {
    return u.array(kTexts).map((kText) => {
      const initMapping = this.indexCreator?.initialMapping(kText) as string
      const fKey = this.indexCreator?.toFuzzyInt64(initMapping) as number
      const fKeyHex = this.indexCreator?.toFuzzyHex(initMapping) as string
      return cb({
        kText,
        fKey,
        fKeyHex,
        initMapping,
      })
    })
  }

  use(arg: FuzzyIndexCreator) {
    if (arg instanceof FuzzyIndexCreator) {
      this.indexCreator = arg
    }
  }
}

export default FuzzyWorker
