/**
 * This file is in a separate bundle (not with the web app).
 * Read API: https://developer.mozilla.org/en-US/docs/Web/API/Worker
 *
 * webpack.config.js first transpiles this file and sends it to the /public dir as `piWorker.js`
 *
 * The web app imports this file via `new Worker('piWorker.js')`
 */
/// <reference lib="WebWorker" />
importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.worker.min.js')
importScripts('https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.min.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import type * as jss from 'jsstore'
import SqlWeb from 'sqlweb'
import { Worker as PiWorker } from 'noodl-pi'

declare global {
  export const ipb: typeof IDB
  export const JsStore: typeof import('jsstore')
}

let _self = self as DedicatedWorkerGlobalScope
let _color = 'hotpink'
let _tag = '[piBackgroundWorker]'

const dataType = JsStore.DATA_TYPE

const connection = new JsStore.Connection(
  new Worker('jsstoreWorker.min.js'),
) as jss.Connection & {
  $sql: { run: (query: string) => Promise<void> }
}

// Injects the SQL plugin to support the native SQL query syntax
connection.addPlugin(SqlWeb)

connection.on(JsStore.EVENT.Create, function () {
  console.log(`%c${_tag} Create`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.Open, function () {
  console.log(`%c${_tag} Open`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.RequestQueueEmpty, function () {
  console.log(`%c${_tag} RequestQueueEmpty`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.RequestQueueFilled, function () {
  console.log(`%c${_tag} RequestQueueFilled`, `color:${_color}`, arguments[0])
})

connection.on(JsStore.EVENT.Upgrade, function () {
  console.log(`%c${_tag} Upgrade`, `color:${_color}`, arguments[0])
})

connection
  .initDb({
    name: 'noodl',
    version: 2,
    tables: [
      {
        name: 'version',
        columns: {
          table: { dataType: dataType.String, primaryKey: true, notNull: true },
          value: { dataType: dataType.String },
        },
      },
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
  .then(async () => {
    const pi = new PiWorker('noodl', connection.$sql.run)
    // await connection.insert({
    //   into: 'version',
    //   values: ['CPT', '1.0.3'],
    // })
    // await connection.update({
    //   in: 'version',
    //   set: {
    //     value: '1.0.3',
    //   },
    //   where: {
    //     table: 'CPT',
    //   },
    // })

    // await pi.runSql(`INSERT into version values (table = CPT, value = 1.0.3);`)
    // await connection.set('version', { table: 'CPT', value: '1.0.5' })
    // await connection.insert({
    //   into: 'version',
    //   values: [{ table: 'CPT', value: '1.0.5' }],
    // })
    // await connection.insert({
    //   into: 'version',
    //   upsert: true,
    //   values: [{ table: 'CPT', value: '1.0.5' }],
    // })
    // await connection.update({
    //   in: 'version',
    //   set: {
    //     CPT: { table: 'CPT', value: '1.0.5' },
    //   },
    // })

    // const res = await pi.runSql(`SELECT from `)
    // console.log(`%c${_tag} SELECT * from version`, `color:${_color}`, res)

    pi.use({
      all(evtName, ...args) {
        console.log(`%c${_tag} ${evtName}`, `color:${_color};`, args)
      },
      async message(evt) {
        const data = evt.data
        const type = data?.type

        console.log(`%c${_tag} Message "${type}"`, `color:${_color};`, data)

        switch (type) {
          case 'storeData': {
            const { table, data: dataToStore } = data
            // return connection.insert({
            //   into: table,
            //   values: dataToStore,
            // })
            break
          }
          case 'search': {
            const { table, query } = data
            switch (table) {
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
                    type: 'searchResult',
                    query,
                    result: content,
                    table,
                  })
                }
              }
            }
          }
          case 'get':
          case 'delete':
          case 'update': {
            return pi.emit(type, data)
          }
        }
      },
      messageError(evt) {
        console.log(`%c${_tag} messageError`, `color: ${_color}`, evt)
      },
      rejectionHandled(evt) {
        console.log(`%c${_tag} rejectionHandled`, `color: ${_color}`, evt)
      },
      rejectionUnhandled(evt) {
        console.log(`%c${_tag} rejectionUnhandled`, `color: ${_color}`, evt)
      },
    })

    return pi.sendMessage({ type: 'workerInitiated' })
  })
  .catch((error) => {
    console.error(error)
  })
