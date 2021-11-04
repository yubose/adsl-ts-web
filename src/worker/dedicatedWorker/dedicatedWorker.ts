/// <reference lib="WebWorker" />

declare const self: DedicatedWorkerGlobalScope

import commands from './commands'
import createDb from './createDb'
import createStore from './createStore'
import { command as cmd } from '../../constants'

let id = `aitmed-noodl-web`
let db = registerIndexDbListeners(createDb(id))
let store = createStore(db)
let transaction = db.transaction

const style = 'color:aquamarine;font-weight:400;'
const tag = `%c[dedicatedWorker]`
const log = console.log

self.addEventListener(
  'message',
  async function onWorkerMessage(
    this: DedicatedWorkerGlobalScope,
    msg: MessageEvent,
  ) {
    let { command, options } = msg.data || {}

    if (command) {
      return this.postMessage({
        command,
        result: await commands.commands[command]?.(options, {
          db,
          store,
          transaction,
          postMessage: this.postMessage.bind(this),
        }),
      })
    }
  },
)

self.addEventListener(`messageerror`, function (msgEvt) {
  log(`${tag} Message event error`, style, {
    data: msgEvt.data,
    origin: msgEvt.origin,
    ports: msgEvt.ports,
    source: msgEvt.source,
    timestamp: msgEvt.timeStamp,
  })
})

self.addEventListener('error', function (errEvt) {
  log(`${tag} Error`, style, {
    error: errEvt.error,
    message: errEvt.message,
    timestamp: errEvt.timeStamp,
    type: errEvt.type,
    filename: errEvt.filename,
    column: errEvt.colno,
  })
})

self.addEventListener('languagechange', function (evt) {
  log(`${tag} Language updated`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('online', function (evt) {
  log(`${tag} Online`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('offline', function (evt) {
  log(`${tag} Offline`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('rejectionhandled', async function (rejEvt) {
  log(`${tag} Promise rejection handled`, style, {
    promise: await rejEvt.promise,
    reason: rejEvt.reason,
    timestamp: rejEvt.timeStamp,
    type: rejEvt.type,
  })
})

self.addEventListener('unhandledrejection', async function (unRejEvt) {
  log(`${tag} Promise rejection unhandled`, style, {
    eventPhase: unRejEvt.eventPhase,
    promise: await unRejEvt.promise,
    reason: unRejEvt.reason,
    timestamp: unRejEvt.timeStamp,
    type: unRejEvt.type,
  })
})

function registerIndexDbListeners(db: IDBOpenDBRequest) {
  const transaction = db.transaction

  db.onsuccess = (evt) => {
    self.postMessage({
      message: `Database opened successfully`,
      timestamp: evt.timeStamp,
      db: {
        error: db.error,
        objectStoreNames: transaction?.objectStoreNames,
        objectStore: transaction?.objectStore('aitmed-noodl-web'),
        readyState: db.readyState,
        source: db.source,
        transaction: {
          error: transaction?.error,
          mode: transaction?.mode,
        },
      },
    })

    transaction?.addEventListener('abort', (evt) => {
      self.postMessage({
        name: `[transaction] abort`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.addEventListener('complete', (evt) => {
      self.postMessage({
        name: `[transaction] complete`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.addEventListener('error', (evt) => {
      self.postMessage({
        name: `[transaction] error`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.db.addEventListener('abort', (evt) => {
      self.postMessage({
        name: `[transaction db] abort`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.db.addEventListener('error', (evt) => {
      self.postMessage({
        name: `[transaction db] error`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.db.addEventListener('close', (evt) => {
      self.postMessage({
        name: `[transaction db] close`,
        timestamp: evt.timeStamp,
      })
    })

    transaction?.db.addEventListener('versionchange', (evt) => {
      self.postMessage({
        name: `[transaction db] versionchange`,
        oldVersion: evt.oldVersion,
        newVersion: evt.newVersion,
        timestamp: evt.timeStamp,
      })
    })
  }

  db.onerror = (evt) => {
    self.postMessage({
      name: evt['name'],
      message: evt['message'] || `Error occurred when loading the IndexedDB db`,
      timestamp: evt.timeStamp,
    })
  }

  db.onupgradeneeded = (evt) => {
    self.postMessage({
      message: `Upgrade needed!`,
      oldVersion: evt.oldVersion,
      newVersion: evt.newVersion,
      timestamp: evt.timeStamp,
    })
  }

  db.onblocked = (evt) => {
    self.postMessage({
      message: `Database was blocked`,
      timestamp: evt.timeStamp,
    })
  }

  return db
}
