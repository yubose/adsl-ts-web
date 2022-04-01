/// <reference lib="WebWorker" />
// importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js')
importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.worker.min.js')
// importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.min.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import type IDB from 'idb'
import * as jss from 'jsstore'
import SqlWeb from 'sqlweb'
import type _JSBI from 'jsbi/jsbi'
import * as u from '@jsmanifest/utils'
import { c, Worker as PiWorker } from 'noodl-pi'

const dataType = jss.DATA_TYPE

declare global {
  const ipb: typeof IDB
}

const connection = new jss.Connection() as jss.Connection & {
  $sql: { run: (query: string) => Promise<void> }
}

connection.on(jss.EVENT.Create, function () {
  console.log(`%c[worker] Create`, `color:${_color}`, arguments)
})

connection.on(jss.EVENT.Open, function () {
  console.log(`%c[worker] Open`, `color:${_color}`, arguments)
})

connection.on(jss.EVENT.RequestQueueEmpty, function () {
  console.log(`%c[worker] RequestQueueEmpty`, `color:${_color}`, arguments)
})

connection.on(jss.EVENT.RequestQueueFilled, function () {
  console.log(`%c[worker] RequestQueueFilled`, `color:${_color}`, arguments)
})

connection.on(jss.EVENT.Upgrade, function () {
  console.log(`%c[worker] Upgrade`, `color:${_color}`, arguments)
})

connection.addPlugin(SqlWeb)

const pi = new PiWorker(connection.$sql.run)

pi.use({
  all(evtName, ...args) {
    console.log(`%c[worker](all) ${evtName}`, `color:${_color};`, args)
  },
  storeDataFetchResponse({ cachedVersion, response, storeName, url }) {
    if (storeName === 'CPT') {
      // return pi.setStoreData({
      //   storeName,
      //   version: response?.CPT?.version,
      //   data: response.CPT,
      // })
    }
  },
  async search({ storeName, query }) {
    switch (storeName) {
      case 'CPT': {
        if (!query) {
          // const cptCodes = await this.getStoreData(storeName, 'content')
          // return pi.sendMessage({
          //   type: c.storeEvt.SEARCH_RESULT,
          //   query,
          //   result: cptCodes,
          //   storeName,
          // })
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

let initQuery = ``

initQuery += `DEFINE DB noodl;`

initQuery += `DEFINE TABLE ecos_doc_table(
      ctime ${dataType.Number},
      mtime ${dataType.Number},
      atime ${dataType.Number},
      atimes ${dataType.Number},
      id ${dataType.String} notnull primarykey,
      name ${dataType.String},
      deat ${dataType.String},
      size ${dataType.Number},
      fid ${dataType.String},
      eid ${dataType.String},
      bsig ${dataType.String},
      esig ${dataType.String},
      subtype ${dataType.Number},
      type ${dataType.Number},
      tage ${dataType.Number}
    );`

initQuery += `DEFINE TABLE index_tables(
      fkey ${dataType.Number},
      kText ${dataType.String},
      docId ${dataType.String},
      docType ${dataType.Number},
      score ${dataType.Number}
    );`

initQuery += `DEFINE TABLE api_hash_table(
      api_input_hash ${dataType.String},
      resultId ${dataType.String}
    );`

pi.run(initQuery)
  .then(async () => {
    pi.sendMessage({ type: c.WORKER_INITIATED })
  })
  .catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`, err.stack)
  })

type StoreNames = 'CPT' | 'CPTMod'
// type CptCode = ${dataType.String}
// type CptCodeDescription = ${dataType.String}

let _self = self as DedicatedWorkerGlobalScope
let _color = 'hotpink'
let _cptStore: IDB.IDBPObjectStore
let _cptStoreMod: IDB.IDBPObjectStore

// const pi = new PiWorker<any, StoreNames>([
//   { storeName: 'CPT', url: `http://127.0.0.1:3000/cpt` },
// ])

// idb
//   .openDB('noodl', undefined, {
//     upgrade: (...args) => {
//       const [db, oldVersion, newVersion, transaction] = args
//       console.log(`%c[upgrade] Preparing`, `color:${_color};`)
//       if (pi.stores.size) {
//         ;[...pi.stores.keys()].forEach((storeName) => {
//           console.log(
//             `%c[upgrade] Creating store "${storeName}"`,
//             `color:${_color};`,
//           )
//           db.createObjectStore(storeName)
//         })
//       }
//     },
//     blocked() {
//       console.log(`%c[openDB-blocked]`, `color:tomato;`, arguments)
//     },
//     blocking() {
//       console.log(`%c[openDB-blocking]`, `color:tomato;`, arguments)
//     },
//     terminated() {
//       console.log(`%c[openDB-terminated]`, `color:orange;`, arguments)
//     },
//   })
//   .then(async (db) => pi.init(db))
//   .then((db) => {
//     console.log(`%c[worker] Ready`, `color:${_color};`, pi)
//     pi.sendMessage({ type: c.WORKER_INITIATED })
//     return db
//   })
//   .then(async (db) => {
//     const store = db.transaction('CPT', 'readonly').store
//     const cursor = await store.openCursor('content', 'nextunique')
//     console.log({ cursor, cursorValue: cursor == null ? void 0 : cursor.value })
//     console.log('key: ' + (cursor == null ? void 0 : cursor.key))
//   })
//   .catch((error) => {
//     const err = error instanceof Error ? error : new Error(String(error))
//     u.logError(err)
//   })
