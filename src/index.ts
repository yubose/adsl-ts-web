import yaml from 'yaml'
import * as u from '@jsmanifest/utils'
import CADL from '@aitmed/cadl'
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
import { isStable } from './utils/common'
import App from './App'
import 'vercel-toast/dist/vercel-toast.css'
import './styles.css'

const log = Logger.create('App.ts')
const stable = isStable()

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return Object.assign(
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

let app: App | undefined

async function getApp({
  noodl,
  Account,
}: { noodl?: CADL; Account?: any } = {}) {
  !noodl && (noodl = (await import('./app/noodl')).default)
  !Account && (Account = (await import('@aitmed/cadl')).Account)
  return new App({
    noodl,
    getStatus: Account?.getStatus?.bind(Account),
  }) as App
}

async function initializeApp(appProp = app) {
  if (!appProp) throw new Error(`Cannot initialize app because it is undefined`)
  const {
    default: firebase,
    aitMessage,
    isSupported: firebaseSupported,
  } = await import('./app/firebase')
  await appProp.initialize({
    firebase: { client: firebase, vapidKey: aitMessage.vapidKey },
    firebaseSupported: firebaseSupported(),
  })
  return appProp as App
}

window.addEventListener('load', async (e) => {
  try {
    const { Account } = await import('@aitmed/cadl')
    const { aitMessage } = await import('./app/firebase')
    const { default: noodl } = await import('./app/noodl')
    const { createOnPopState } = await import('./handlers/history')

    app = await getApp({ noodl, Account })
    // await useTrackers(app)

    document.body.addEventListener('keydown', async (e) => {
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
          (acc, [key, fn]) => Object.assign(acc, { [key]: { get: () => fn } }),
          {},
        ),
      toYml: {
        get() {
          return yaml.stringify.bind(yaml)
        },
      },
    })

    try {
      stable && log.cyan('Initializing [App] instance')

      await initializeApp(app)
      stable && log.cyan('Initialized [App] instance')
    } catch (error) {
      console.error(error)
    }

    window.addEventListener('popstate', createOnPopState(app))
  } catch (error) {
    console.error(error)
  }
})

async function useTrackers(app: App) {
  const { CONFIG_KEY } = await import('./app/noodl')
  const wssObs = (await import('./handlers/wss')).default
  console.log('mkmkmk')
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

  wssObs(app)
    // .track('track', {
    //   key: 'newDispatch',
    //   label: 'DISPATCHING',
    //   color: 'aquamarine',
    // })
    .track('track', {
      key: 'setFromLocalStorage',
      label: 'SETTING_FROM_LOCAL_STORAGE',
      color: 'salmon',
    })
  return wssObs
}

if (module.hot) {
  module.hot.accept()

  if (module.hot.status() === 'apply') {
    app = window.app as App
    app.reset(true)
  }

  module.hot.dispose((data = {}) => {
    u.keys(data).forEach((key) => delete data[key])
  })
}
