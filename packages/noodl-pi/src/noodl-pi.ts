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
import * as t from './types'

const _color = 'gold'

class NoodlPiWorker {
  #hooks = [
    'all',
    'message',
    'messageError',
    'rejectionHandled',
    'rejectionunHandled',
  ].reduce(
    (acc, evtName) => Object.assign(acc, { [evtName]: () => {} }),
    {} as t.Hooks,
  )
  #runSql: t.ExecuteSQL<string>
  #self: DedicatedWorkerGlobalScope
  dbName: string;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      dbName: this.dbName,
      hasSqlExecutor: typeof this.#runSql === 'function',
      subscribedHooks: Object.entries(this.#hooks).reduce((acc, [key, fn]) => {
        if (typeof fn === 'function') acc[key] = true
        else acc[key] = false
        return acc
      }, {} as Record<keyof t.Hooks, boolean>),
      self: this.#self,
    }
  }

  constructor(dbName: string, run: t.ExecuteSQL<string>) {
    if (!run) throw new Error(`"run" function was not provided`)
    this.dbName = dbName
    this.#runSql = run
    this.#self = self as DedicatedWorkerGlobalScope

    this.#self.addEventListener('message', (evt) => {
      return this.#hooks?.message?.call(this.#self, evt)
    })
    this.#self.addEventListener('messageerror', (evt) =>
      this.#hooks.messageError?.call(this.#self, evt),
    )
    this.#self.addEventListener('rejectionhandled', (evt) =>
      this.#hooks.rejectionHandled?.call(this.#self, evt),
    )
    this.#self.addEventListener('unhandledrejection', (evt) =>
      this.#hooks.rejectionUnhandled?.call(this.#self, evt),
    )
  }

  /**
   * Returns the function that runs SQL queries against the IndexedDB database when called
   */
  get runSql() {
    return this.#runSql
  }

  getApiHashDaoQueries(tableName?: string) {
    return getApiHashDaoQueries(this.runSql, tableName || '')
  }

  getDocDaoQueries(tableName?: string) {
    return getDocDaoQueries(this.runSql, tableName || '')
  }

  getFuzzyIndexCreator() {
    return getFuzzyIndexCreator()
  }

  getIndexDaoQueries(tableName?: string) {
    return getIndexDaoQueries(this.runSql, tableName || '')
  }

  getIndexRepository(tableName?: string) {
    return getIndexRepository(this.runSql, tableName || '')
  }

  getJsonIndex(id: string, docType: number, kText: string[]) {
    return getJsonIndex(this.runSql, { id, docType, kText })
  }

  getPersonalIndexCtr(
    tableName?: string,
    indexDao = getIndexDaoQueries(this.runSql, tableName || ''),
  ) {
    return getPersonalIndexCtr(this.runSql, indexDao)
  }

  getPersonalIndexToS3Queries(
    tableName?: string,
    indexDao = getIndexDaoQueries(this.runSql, tableName || ''),
  ) {
    return getPersonalIndexToS3Queries(this.runSql, indexDao)
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
    this.#hooks.all?.call(this, evtName, arg, ...args)
    return this.#hooks[evtName as any]?.call(this, arg, ...args)
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
