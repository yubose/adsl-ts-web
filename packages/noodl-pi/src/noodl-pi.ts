/**
 * Noodl Personal Index Background Worker
 * Consumers of this library loads this worker in the client side like so:
 *
 * ```js
 * const piWorker = new Worker('./dist/noodl-pi.js')
 * ```
 */
import getFuzzyIndexCreator from './getFuzzyIndexCreator'
import getApiHashDaoQueries from './getApiHashDaoQueries'
import getDocDaoQueries from './getDocDaoQueries'
import getIndexDaoQueries from './getIndexDaoQueries'
import getIndexRepository from './getIndexRepository'
import getJsonIndex from './getJsonIndex'
import getPersonalIndexCtr from './getPersonalIndexCtr'
import getPersonalIndexToS3Queries from './getPersonalIndexToS3Queries'
import { isObj } from './utils'
import * as c from './constants'
import * as t from './types'

const _color = ''

class NoodlPiWorker {
  #run: t.ExecuteSQL<string>
  #self: DedicatedWorkerGlobalScope
  #stores = new Map<string, t.WorkerStoreObject>()
  #hooks = ['all', ...Object.values(c.storeEvt)].reduce((acc, evtName) => {
    acc[evtName] = () => {}
    return acc
  }, {} as Record<keyof t.Hooks, t.Hooks[keyof t.Hooks]>)
  indexCreator: ReturnType<typeof getFuzzyIndexCreator> | null = null;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      hasSqlExecutor: typeof this.#run === 'function',
      subscribedHooks: Object.entries(this.#hooks).reduce((acc, [key, fn]) => {
        if (typeof fn === 'function') acc[key] = true
        else acc[key] = false
        return acc
      }, {} as Record<keyof t.Hooks, boolean>),
      self: this.#self,
      stores: this.#stores,
    }
  }

  constructor(run: t.ExecuteSQL<string>) {
    if (!run) throw new Error(`"run" function was not provided`)
    this.#run = run
    // this.#stores.set(obj.storeName, {
    //   storeName: obj.storeName,
    //   url: obj.url,
    //   ...('version' in obj ? { version: obj.version } : undefined),
    // })
    this.#self = self as DedicatedWorkerGlobalScope

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
        // case c.storeEvt.STORE_DATA_VERSION_UPDATE: {
        //   await this.clearStoreData(data.storeName)
        //   return this.setStoreData({
        //     storeName: data.storeName,
        //     data: data.data,
        //     version: data.version,
        //   })
        // }
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

  get hooks() {
    return this.#hooks
  }

  get run() {
    return this.#run
  }

  get stores() {
    return this.#stores
  }

  getApiHashDaoQueries(tableName?: string) {
    return getApiHashDaoQueries(this.run, tableName || '')
  }

  getDocDaoQueries(tableName?: string) {
    return getDocDaoQueries(this.run, tableName || '')
  }

  getIndexDaoQueries(tableName?: string) {
    return getIndexDaoQueries(this.run, tableName || '')
  }

  getIndexRepository(tableName?: string) {
    return getIndexRepository(this.run, tableName || '')
  }

  getJsonIndex(id: string, docType: number, kText: string[]) {
    return getJsonIndex(this.run, { id, docType, kText })
  }

  getPersonalIndexCtr(
    tableName?: string,
    indexDao = getIndexDaoQueries(this.run, tableName || ''),
  ) {
    return getPersonalIndexCtr(this.run, indexDao)
  }

  getPersonalIndexToS3Queries(
    tableName?: string,
    indexDao = getIndexDaoQueries(this.run, tableName || ''),
  ) {
    return getPersonalIndexToS3Queries(this.run, indexDao)
  }

  sendMessage(
    ...args: Parameters<
      InstanceType<typeof DedicatedWorkerGlobalScope>['postMessage']
    >
  ) {
    console.log(`%c[lib] Sending "${args[0].type}"`, `color:${_color};`)
    return this.#self.postMessage(...args)
  }

  emit<Evt extends keyof t.Hooks, Arg = any, Args extends any[] = any[]>(
    evtName: Evt,
    arg?: Arg | undefined,
    ...args: Args
  ) {
    // @ts-expect-error
    this.hooks.all?.call(this, evtName, arg, ...args)
    return this.hooks[evtName as any]?.call(this, arg, ...args)
  }

  use(options: Partial<t.Hooks>) {
    if (isObj(options)) {
      for (const [key, value] of Object.entries(options)) {
        if (key in this.#hooks) this.#hooks[key] = value
      }
    }
  }
}

export default NoodlPiWorker
