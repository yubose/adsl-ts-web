/// <reference lib="WebWorker" />
// importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js')
importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.worker.min.js')
importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.min.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import * as u from '@jsmanifest/utils'
import SqlWeb from 'sqlweb'
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import type * as jss from 'jsstore'
import { c, Worker as PiWorker } from 'noodl-pi'

declare global {
  export const ipb: typeof IDB
  export const JsStore: typeof import('jsstore')
}

let _self = self as DedicatedWorkerGlobalScope
let _color = 'hotpink'

const dataType = JsStore.DATA_TYPE

const connection = new JsStore.Connection(
  new Worker('jsstoreWorker.min.js'),
) as jss.Connection & {
  $sql: { run: (query: string) => Promise<void> }
}

connection.addPlugin(SqlWeb)

connection.on(JsStore.EVENT.Create, function () {
  console.log(`%c[worker] Create`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.Open, function () {
  console.log(`%c[worker] Open`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.RequestQueueEmpty, function () {
  console.log(`%c[worker] RequestQueueEmpty`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.RequestQueueFilled, function () {
  console.log(`%c[worker] RequestQueueFilled`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.Upgrade, function () {
  console.log(`%c[worker] Upgrade`, `color:${_color}`, arguments[0])
})

connection
  .initDb({
    name: 'noodl',
    tables: [
      {
        name: 'CPT',
        columns: {
          version: { dataType: dataType.String },
          content: { dataType: dataType.Object },
        },
      },
      {
        name: 'CPTMod',
        columns: {
          version: { dataType: dataType.String },
          content: { dataType: dataType.Object },
        },
      },
      {
        name: 'ecos_doc_table',
        columns: {
          ctime: { dataType: dataType.Number },
          mtime: { dataType: dataType.Number },
          atime: { dataType: dataType.Number },
          atimes: { dataType: dataType.Number },
          id: { dataType: dataType.String, notNull: true, primaryKey: true },
          name: { dataType: dataType.String },
          deat: { dataType: dataType.String },
          size: { dataType: dataType.Number },
          fid: { dataType: dataType.String },
          eid: { dataType: dataType.String },
          bsig: { dataType: dataType.String },
          esig: { dataType: dataType.String },
          subtype: { dataType: dataType.Number },
          type: { dataType: dataType.Number },
          tage: { dataType: dataType.Number },
        },
      },
      {
        name: 'index_tables',
        columns: {
          fkey: { dataType: dataType.Number },
          kText: { dataType: dataType.String },
          docId: { dataType: dataType.String },
          docType: { dataType: dataType.Number },
          score: { dataType: dataType.Number },
        },
      },
      {
        name: 'api_hash_table',
        columns: {
          api_input_hash: { dataType: dataType.String },
          resultId: { dataType: dataType.String },
        },
      },
    ],
  })
  .then(() => {
    const pi = new PiWorker('noodl', connection.$sql.run)

    const fuzzy = pi.getFuzzyIndexCreator()

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
              const resp = await _self.fetch(`http://127.0.0.1:3000/cpt`)
              const respData = await resp.json()
              const version = respData?.CPT?.version
              const content = respData?.CPT?.content
              // await connection.set('CPT', respData?.CPT)
              // await connection.insert({
              //   into: 'CPT',
              //   values: [version, content],
              // })
              // await connection.update({
              //   in: 'CPT',
              //   set: {
              //     version,
              //     content,
              //   },
              // })

              // await connection.set('content', cptCodes)
              return pi.sendMessage({
                type: c.storeEvt.SEARCH_RESULT,
                query,
                result: content,
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
        console.log(
          `%c[worker] Store "${storeName}" created`,
          `color:${_color};`,
        )
      },
    })

    return pi.sendMessage({ type: c.WORKER_INITIATED })
  })
  .catch((error) => {
    console.error(error)
  })
