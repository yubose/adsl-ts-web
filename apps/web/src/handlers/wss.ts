import * as u from '@jsmanifest/utils'
import App from '../App'
import log from '../log'

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
  let ws: WebSocket | undefined

  if (u.isFnc(appProp)) return appProp(ws as WebSocket)
  if (!appProp) return

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
      // log.log(label, color, getArgs(args))

      const msg = {
        type,
        args,
        label: labelProp,
        key: keyProp,
      }

      argsProp && (msg.args = argsProp)

      try {
        // worker.postMessage(msg)
        ws?.send(JSON.stringify(msg, null, 2))
      } catch (error) {
        log.error(error instanceof Error ? error : new Error(String(error)))
      }

      // Send to noodl plugin
      // log.log(getArgs(msg.args))
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
      ws?.addEventListener('open', (event) => {
        //
      })

      ws?.addEventListener('message', (event) => {
        log.log(`Received new message`, event)
      })

      ws?.addEventListener('error', (event) => {
        //
      })

      ws?.addEventListener('close', (event) => {
        //
      })
    },
    trackers,
    // @ts-expect-error
    track(kind: 'track' | '', tracker: TrackPropertyMessage) {
      if (kind === 'track') {
        trackProperty({ ...tracker, type: 'track' })
      }
      return observer
    },
    get app() {
      return app
    },
    set app(_app) {
      app = _app
    },
    get url() {
      return observer?.ws.url
    },
    get ws() {
      return ws as WebSocket
    },
    set ws(_ws) {
      ws = _ws
    },
  }

  return observer
}

export default createWssObserver

/**
// async function useTrackers(app: App) {
//   const { CONFIG_KEY } = await import('./app/noodl')
//   const wssObs = (await import('./handlers/wss')).default


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
