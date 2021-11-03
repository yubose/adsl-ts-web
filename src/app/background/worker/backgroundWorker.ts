/// <reference lib="WebWorker" />
/// <reference lib="WebWorker.ImportScripts" />
import commands from './commands'
import createDb from './createDb'
import createStore from './createStore'
import { command as cmd } from '../../../constants'
// import * as t from './modules/NoodlWorker/types'

const style = 'color:aquamarine;font-weight:400;'
const tag = `%c[Worker]`
const log = console.log

// @ts-expect-error
self.oninstall = (event: ExtendableEvent) => {
  log(`${tag} oninstall`, style, event)
}

// @ts-expect-error
self.onactivate = (event: ExtendableEvent) => {
  log(`${tag} onactivate`, style, event)
}

self.addEventListener(
  'message',
  async function onWorkerMessage(this: DedicatedWorkerGlobalScope, msg) {
    let { command, options, type } = msg.data || {}
    let db = registerIndexDbListeners(createDb(`aitmed-noodl-web`))
    let store = createStore(db)
    let transaction = db.transaction

    if (command) {
      this.postMessage({
        command,
        result: await commands.commands[command]?.(options, {
          postMessage: this.postMessage.bind(this),
        }),
      })
    } else if (type === cmd.FETCH) {
    }
  },
)

// @ts-expect-error
self.onfetch = (event: FetchEvent) => {
  log(`${tag} onfetch`, style, event)
}

// @ts-expect-error
self.onpush = (event: PushEvent) => {
  log(`${tag} onpush`, style, event)
}

function registerIndexDbListeners(db: IDBOpenDBRequest) {
  const transaction = db.transaction

  db.onsuccess = (evt) => {
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
