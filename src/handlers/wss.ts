import * as u from '@jsmanifest/utils'
import App from '../App'

export interface WssObserver {
  configPages: string[]
  listen(): void
  track(
    kind: 'property' | '',
    tracker: Omit<TrackPropertyMessage, 'type'>,
  ): this
  trackers: {
    propertyTrackers: Map<string, TrackPropertyMessage>
  }
  url: string
  ws: WebSocket
}

export interface WssMessage {
  type: string
  [key: string]: any
}

export interface TrackPropertyMessage extends WssMessage {
  key: string
  label: string
  color?: string
  args?: Record<string, any>
}

function createWssObserver(fn: (ws: WebSocket) => App): WssObserver
function createWssObserver(app: App): WssObserver
function createWssObserver(appProp: App | ((fn: WebSocket) => App)) {
  let app: App
  let ws: WebSocket = new WebSocket(`ws://127.0.0.1:3002`)

  if (u.isFnc(appProp)) return appProp(ws)

  app = appProp

  let configPages = [
    ...(app.noodl.cadlEndpoint?.preload || []),
    ...(app.noodl.cadlEndpoint?.page || []),
  ] as string[]

  function trackProperty({
    type,
    key: keyProp,
    label: labelProp,
    color: colorProp = 'grey',
    args: argsProp,
  }: WssMessage) {
    const ref = app.noodl[keyProp as keyof typeof app.noodl].bind(app.noodl)
    const label = `%c[${labelProp}]`
    const color = `color:${colorProp};`
    const getArgs = (args: any[]) => (args.length > 1 ? args : args[0])

    function value(this: typeof app.noodl, ...args: any[]) {
      // console.log(label, color, getArgs(args))

      const msg = {
        type,
        args,
        label: labelProp,
        key: keyProp,
      }

      argsProp && (msg.args = argsProp)

      try {
        // worker.postMessage(msg)
        ws.send(JSON.stringify(msg, null, 2))
      } catch (error) {
        console.error({
          code: error.code,
          name: error.name,
          message: error.message,
        })
      }

      // Send to noodl plugin
      // console.log(getArgs(msg.args))
      // ws.send(JSON.stringify(msg, null, 2))
      return ref(...args)
    }

    Object.defineProperty(app.noodl, keyProp, {
      get: () => value,
    })
  }

  const propertyTrackers: Record<string, Omit<TrackPropertyMessage, 'key'>> = {}

  const trackers = {
    propertyTrackers: new Map([
      ...u.entries(propertyTrackers),
    ]) as WssObserver['trackers']['propertyTrackers'],
  }

  const observer: WssObserver = {
    configPages,
    listen() {
      ws.addEventListener('open', (event) => {
        //
      })

      ws.addEventListener('message', (event) => {
        console.log(`Received new message`, event)
      })

      ws.addEventListener('error', (event) => {
        //
      })

      ws.addEventListener('close', (event) => {
        //
      })
    },
    trackers,
    track(kind: 'track' | '', tracker: TrackPropertyMessage) {
      if (kind === 'track') {
        trackProperty({ ...tracker, type: 'track' })
      }
      return observer
    },
    url: ws.url,
    ws,
  }

  return observer
}

export default createWssObserver

/**
// async function useTrackers(app: App) {
//   const { CONFIG_KEY } = await import('./app/noodl')
//   const wssObs = (await import('./handlers/wss')).default

// const worker = new Worker('worker.js')

// worker.postMessage(`Worker started`)

// worker.onmessage = function onMessage(evt) {
//   console.log(`[index.ts] Received new worker message`, evt)
// }

// worker.onmessageerror = function onMessageError(evt) {
//   console.log(`[index.ts] Received an error worker message`, evt)
// }

// worker.onerror = function onMessageError(err) {
//   console.log(`[index.ts] Received an error from worker`, err)
// }

// wssObs(app)
//   .track('track', {
//     key: 'newDispatch',
//     label: 'DISPATCHING',
//     color: 'aquamarine',
//   })
//   .track('track', {
//     key: 'setFromLocalStorage',
//     label: 'SETTING_FROM_LOCAL_STORAGE',
//     color: 'salmon',
//   })
//   return wssObs
// }
 */
