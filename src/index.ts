import yaml from 'yaml'
import * as u from '@jsmanifest/utils'
import CADL, { Account } from '@aitmed/cadl'
import Logger from 'logsnap'
import pick from 'lodash/pick'
import * as lib from 'noodl-ui'
import {
  asHtmlElement,
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findByGlobalId,
  findByPlaceholder,
  findBySelector,
  findBySrc,
  findByViewTag,
  findByUX,
  findWindow,
  findWindowDocument,
} from 'noodl-ui-dom'
import { findReferences } from 'noodl-utils'
import { copyToClipboard, getVcodeElem, toast } from './utils/dom'
import App from './App'
import 'vercel-toast/dist/vercel-toast.css'
import './styles.css'

const log = Logger.create('App.ts')

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return u.assign(
    {
      findByDataAttrib,
      findByDataKey,
      findByElementId,
      findByGlobalId,
      findByPlaceholder,
      findBySelector,
      findBySrc,
      findByViewTag,
      findByUX,
      findReferences,
      findWindow,
      findWindowDocument,
      getVcodeElem,
      toast,
    },
    pick(lib, ['getDataValues', 'publish']),
  )
}

let app: App
let ws: WebSocket

async function initializeApp(
  args: { noodl?: CADL; Account?: typeof Account } = {},
) {
  let { noodl, Account: accountProp } = args

  !noodl && (noodl = (await import('./app/noodl')).default)
  !accountProp && (accountProp = (await import('@aitmed/cadl')).Account)

  if (!app) {
    app = new App({
      noodl,
      getStatus: Account?.getStatus?.bind(Account),
    }) as App
  }

  const {
    default: firebase,
    aitMessage,
    isSupported: firebaseSupported,
  } = await import('./app/firebase')

  await app.initialize({
    firebase: { client: firebase, vapidKey: aitMessage.vapidKey },
    firebaseSupported: firebaseSupported(),
  })

  return app
}

async function initializeNoodlPluginRefresher() {
  ws = new WebSocket(`ws://127.0.0.1:3002`)

  ws.addEventListener('open', (event) => {
    // console.log(`[noodl refresher] started`, event)
  })

  ws.addEventListener('message', (msg) => {
    let data
    try {
      data = JSON.parse(msg.data)
      // console.log(`%cReceived from noodl-webpack-plugin:`, `color:#e50087;`, data)
      data.type === 'FILE_CHANGED' && app.reset(true)
    } catch (error) {}
  })

  ws.addEventListener('error', (err) => {
    console.log(`%c[noodl refresher error]`, `color:#ec0000;`, err)
  })

  ws.addEventListener('close', (event) => {
    console.log(`%c[noodl refresher] closed`, `color:#FF5722;`, event)
  })

  return ws
}

window.addEventListener('load', async (e) => {
  try {
    log.func('onload')

    const { Account } = await import('@aitmed/cadl')
    const { aitMessage } = await import('./app/firebase')
    const { default: noodl } = await import('./app/noodl')
    const { createOnPopState } = await import('./handlers/history')

    await initializeNoodlPluginRefresher()

    log.cyan('Initializing [App] instance')
    app = await initializeApp({ noodl, Account })
    log.cyan('Initialized [App] instance')

    document.body.addEventListener('keydown', async function onKeyDown(e) {
      if ((e.key == '1' || e.key == '2') && e.metaKey) {
        e.preventDefault()
        let node: HTMLElement | null = null
        if (e.key == '1') {
          node = asHtmlElement(findByViewTag('1')) as HTMLElement
        } else if (e.key == '2') {
          node = asHtmlElement(findByViewTag('2')) as HTMLElement
        }
        console.log(node)
        node?.click?.()
      }
    })

    Object.defineProperties(window, {
      app: { get: () => app },
      build: { value: process.env.BUILD },
      l: { get: () => app?.meeting.localParticipant },
      cache: { get: () => app?.cache },
      cp: { get: () => copyToClipboard },
      meeting: { get: () => app?.meeting },
      noodl: { get: () => noodl },
      nui: { get: () => app?.nui },
      ndom: { get: () => app?.ndom },
      page: { get: () => app?.mainPage },
      FCMOnTokenReceive: {
        get: () => (args: any) =>
          noodl.root.builtIn
            .FCMOnTokenReceive({ vapidKey: aitMessage.vapidKey, ...args })
            .then(console.log)
            .catch(console.error),
      },
      ...u
        .entries(getWindowHelpers())
        .reduce(
          (acc, [key, fn]) => u.assign(acc, { [key]: { get: () => fn } }),
          {},
        ),
      toYml: { get: () => yaml.stringify.bind(yaml) },
    })

    window.addEventListener('popstate', createOnPopState(app))
  } catch (error) {
    console.error(error)
  }
})

if (module.hot) {
  module.hot.accept()

  if (module.hot.status() === 'apply') {
    // app = window.app as App
    // window.app.reset()
    delete window.app
    // console.log(window.app)
    // window.dispatchEvent(new Event('load'))
  }

  module.hot.dispose((data = {}) => {
    u.keys(data).forEach((key) => delete data[key])
  })
}
