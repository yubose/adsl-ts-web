/// <reference lib="WebWorker" />

declare const self: DedicatedWorkerGlobalScope

import * as idb from 'idb-keyval'
import commands, { Commands } from './commands'
import { getOrFetch } from './utils'
import { command as cmd, id } from '../../constants'
import * as t from '../workerTypes'

const style = 'color:#157DEC;font-weight:400;'
const tag = `%c[dedicatedWorker]`
const log = console.log.bind(console)

function createDedicatedWorker(options?: {
  commands?: {
    command: string
    fn?: t.Bg.CommandFn<string, Record<string, any>>
  }[]
}) {
  let { commands: commandsConfig = [] } = options || {}

  /** Initiate commands */
  for (const commandConfig of commandsConfig) {
    commands.createCommand(commandConfig.command, commandConfig.fn)
  }

  self.addEventListener(
    'message',
    async function onWorkerMessage(
      this: DedicatedWorkerGlobalScope,
      msg: MessageEvent,
    ) {
      let { command, options } = msg.data || {}
      log(`${tag} Message`, style, msg)

      if (command) {
        this.postMessage({
          command,
          result: await commands.commands[command]?.(options, {
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

  const api = {
    commands,
    getHelpers: () => ({
      commands: api.commands,
      getOrFetch: api.getOrFetch,
      getStore: api.getStore,
    }),
    getOrFetch,
    getStore: async (): Promise<t.StoreObject> => {
      if (!(await idb.get(`noodl`))) await idb.set(`noodl`, {})
      return idb.get('noodl') as t.StoreObject
    },
  }

  return api
}

const dedicatedWorker = createDedicatedWorker()

export default dedicatedWorker
