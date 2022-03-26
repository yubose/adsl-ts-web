/// <reference lib="WebWorker" />
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import IndexCreator from './Fuzzy/IndexCreator'

declare global {
  export const idb: typeof IDB
  export const JSBI: typeof _JSBI
}

interface PersonalIndexObjectBase {
  kText: string
  fKey: number
  fKeyHex: string
  initMapping: string
}

const REQUEST_STORE_DATA = 'REQUEST_STORE_DATA'
const REQUESTED_STORE_DATA = 'REQUESTED_STORE_DATA'
const STORE_DATA = 'STORE_DATA'

const dbName = 'noodl'
const stores = { cpt: 'cpt', cptMod: 'cptMod' }

// @ts-expect-error
let _self = self as DedicatedWorkerGlobalScope
let _db: IDB.IDBPDatabase
let _cptStore: IDB.IDBPObjectStore
let _cptStoreMod: IDB.IDBPObjectStore

let indexCreator = new IndexCreator()

_self.addEventListener('message', async function (evt) {
  const { data } = evt
  if (isObj(data)) {
    if (data.type) {
      switch (data.type) {
        case REQUESTED_STORE_DATA:
          console.log(data)
          saveStoreData(_db, data.storeName, data.data)
          sendMessage({
            type: STORE_DATA,
            storeName: data.storeName,
            name: data.storeName,
            data: data.data,
          })
          break
        default:
          break
      }
    }
  }
})

_self.addEventListener('messageerror', function (evt) {
  console.log(`%c[bg-messageerror] Message error`, `color:tomato;`, evt)
})

_self.addEventListener('error', function (evt) {
  console.log(`%c[bg-error] Error`, `color:tomato;`, evt)
})

_self.addEventListener('rejectionhandled', function (evt) {
  console.log(`%c[bg-rejectionhandled] Rejection`, `color:tomato;`, evt)
})

_self.addEventListener('unhandledrejection', function (evt) {
  console.log(`%c[bg-unhandledrejection] Rejection`, `color:tomato;`, evt)
})

/* -------------------------------------------------------
  ---- IndexedDB
-------------------------------------------------------- */

idb
  .openDB(dbName, undefined, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`%c[openDB-upgrade]`, `color:#00b406;`, arguments[0])
      if (!db.objectStoreNames.contains(stores.cpt)) {
        // @ts-expect-error
        _cptStore = db.createObjectStore(stores.cpt)
      }
      if (!db.objectStoreNames.contains(stores.cptMod)) {
        // @ts-expect-error
        _cptStoreMod = db.createObjectStore(stores.cptMod)
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
  .then(async (db) => {
    _db = db
    // @ts-expect-error
    _cptStore = _db.transaction(stores.cpt, 'readwrite').store
    // @ts-expect-error
    _cptStoreMod = _db.transaction(stores.cptMod, 'readwrite').store
    // console.log({ _db, _cptStore, _cptStoreMod })
    requestStoreData({ storeName: stores.cpt })

    console.log(IndexCreator)

    _db.addEventListener('error', function (evt) {
      console.log(`%c[_db-error] Error`, `color:tomato;`, evt)
    })

    _db.addEventListener('abort', function (evt) {
      console.log(`%c[_db-abort] Aborted`, `color:tomato;`, evt)
    })

    _db.addEventListener('close', function (evt) {
      console.log(`%c[_db-close] Closed`, `color:tomato;`, evt)
    })

    _db.addEventListener('versionchange', function (evt) {
      console.log(`%c[_db-versionchange] Version changed`, `color:tomato;`, evt)
    })
  })

async function saveStoreData(db: IDBDatabase, storeName: string, data: any) {
  await db.put(storeName, data, storeName)
}

const sendMessage = _self.postMessage
const isArr = <O = any>(value: any): value is O[] => Array.isArray(value)
const isObj = (value) =>
  value != null && !isArr(value) && typeof value === 'object'
const partialMsg = (msg1) => (msg2) => sendMessage({ ...msg1, ...msg2 })
const requestStoreData = partialMsg({ type: REQUEST_STORE_DATA })
const toArray = <O = any>(o: O) =>
  (isArr(o) ? o : [o]) as O extends any[] ? O : O[]

/* -------------------------------------------------------
  ---- PI / FUZZY
-------------------------------------------------------- */

function createPersonalIndex(
  cb: <O extends Record<string, any>>(
    pIndex: PersonalIndexObjectBase,
  ) => O & PersonalIndexObjectBase,
  kTexts: string | string[],
) {
  return toArray(kTexts).map((kText) => {
    const initMapping = indexCreator.initialMapping(kText)
    const fKey = indexCreator.toFuzzyInt64(initMapping)
    const fKeyHex = indexCreator.toFuzzyHex(initMapping)
    return cb({
      kText,
      fKey,
      fKeyHex,
      initMapping,
    })
  })
}
