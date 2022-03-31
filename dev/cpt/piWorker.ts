/// <reference lib="WebWorker" />
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import type { ValueOf, LiteralUnion } from 'type-fest'
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import * as u from '@jsmanifest/utils'
import { c, Worker as PiWorker } from 'noodl-pi'

declare global {
  const ipb: typeof IDB
}

type StoreNames = 'CPT' | 'CPTMod'
type CptCode = string
type CptCodeDescription = string
interface Schema extends IDB.DBSchema {
  CPT: {
    key: 'version' | 'content'
    value: string | Record<CptCode, CptCodeDescription>
  }
  CPTMod: {
    key: 'version' | 'content'
    value: string | Record<CptCode, CptCodeDescription>
  }
}

const _color = 'hotpink'
let _self = self as DedicatedWorkerGlobalScope
let _cptStore: IDB.IDBPObjectStore
let _cptStoreMod: IDB.IDBPObjectStore

const pi = new PiWorker<Schema, StoreNames>([
  { storeName: 'CPT', url: `http://127.0.0.1:3000/cpt` },
])

pi.use({
  all(evtName, ...args) {
    console.log(`%c[worker](all) ${evtName}`, `color:${_color};`, args)
  },
  storeDataFetchResponse({ cachedVersion, response, storeName, url }) {
    if (storeName === 'CPT') {
      return pi.setStoreData({
        storeName,
        version: response?.CPT?.version,
        data: response.CPT,
      })
    }
  },
  async search({ storeName, query }) {
    switch (storeName) {
      case 'CPT': {
        if (!query) {
          const cptCodes = await this.getStoreData(storeName, 'content')
          return pi.sendMessage({
            type: c.storeEvt.SEARCH_RESULT,
            query,
            result: cptCodes,
            storeName,
          })
        }
      }
    }
  },
  get({ storeName }) {
    switch (storeName) {
      case 'CPT':
        break
    }
  },
  delete({ storeName }) {
    switch (storeName) {
      case 'CPT':
        break
    }
  },
  update({ storeName }) {
    switch (storeName) {
      case 'CPT':
        break
    }
  },
  storeDataVersionUpdate({ storeName, data, version }) {},
  storeEmpty({ storeName }) {},
  storeDataCleared(storeName) {},
  storeCreated({ storeName }) {
    console.log(`%c[worker] Store "${storeName}" created`, `color:${_color};`)
  },
})

idb
  .openDB('noodl', undefined, {
    upgrade: (...args) => {
      const [db, oldVersion, newVersion, transaction] = args
      console.log(`%c[upgrade] Preparing`, `color:${_color};`)
      if (pi.stores.size) {
        ;[...pi.stores.keys()].forEach((storeName) => {
          console.log(
            `%c[upgrade] Creating store "${storeName}"`,
            `color:${_color};`,
          )
          db.createObjectStore(storeName)
        })
      }
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
  .then(async (db) => pi.init(db))
  .then((db) => {
    console.log(`%c[worker] Ready`, `color:${_color};`, pi)
    pi.sendMessage({ type: c.WORKER_INITIATED })
    return db
  })
  .then(async (db) => {
    const store = db.transaction('CPT', 'readonly').store
    const cursor = await store.openCursor('content', 'nextunique')
    console.log({ cursor, cursorValue: cursor == null ? void 0 : cursor.value })
    console.log('key: ' + (cursor == null ? void 0 : cursor.key))
  })
  .catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error))
    u.logError(err)
  })
