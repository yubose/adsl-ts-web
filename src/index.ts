import yaml from 'yaml'
import * as u from '@jsmanifest/utils'
import CADL, { Account } from '@aitmed/cadl'
import Logger from 'logsnap'
import pick from 'lodash/pick'
import * as lib from 'noodl-ui'
import {
  asHtmlElement,
  eventId as ndomEventId,
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
  Page as NDOMPage,
} from 'noodl-ui-dom'
import { findReferences } from 'noodl-utils'
import { copyToClipboard, getVcodeElem, toast } from './utils/dom'
import AppNotification from './app/Notifications'
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
  args: {
    notification?: AppNotification
    noodl?: CADL
    Account?: typeof Account
  } = {},
) {
  let { notification, noodl, Account: accountProp } = args
  !noodl && (noodl = (await import('./app/noodl')).default)
  !accountProp && (accountProp = (await import('@aitmed/cadl')).Account)
  !notification &&
    (notification = new (await import('./app/Notifications')).default())
  if (!app) {
    app = new App({
      noodl,
      notification,
      getStatus: Account?.getStatus?.bind(Account),
    }) as App
  }
  /* -------------------------------------------------------
    ---- Testing tracker
  -------------------------------------------------------- */
  const { trackSdk, trackWebApp } = await import('./app/trackers')
  trackSdk(app)
  trackWebApp(app)
  window.app = app
  ////////////////////////////////////////////////////////////
  await app.initialize()

  return app
}

async function initializeNoodlPluginRefresher() {
  ws = new WebSocket(`ws://127.0.0.1:3002`)

  ws.addEventListener(
    'open',
    (event) => {
      // console.log(`[noodl refresher] started`, event)
    },
    { once: true },
  )

  ws.addEventListener('message', (msg) => {
    let data
    try {
      data = JSON.parse(msg.data)
      // console.log(`%cReceived from noodl-webpack-plugin:`, `color:#e50087;`, data)
      data.type === 'FILE_CHANGED' && app.reset(true)
    } catch (error) {}
  })

  ws.addEventListener(
    'error',
    (err) => {
      // console.log(`%c[noodl reloader error]`, `color:#ec0000;`, err)
    },
    { once: true },
  )

  ws.addEventListener(
    'close',
    (event) => {
      // console.log(`%c[noodl reloader] closed`, `color:#FF5722;`, event)
    },
    { once: true },
  )

  return ws
}

window.addEventListener('load', async (e) => {
  try {
    log.func('onload')
    log.green('Hello', e)

    const { Account } = await import('@aitmed/cadl')
    const { default: noodl } = await import('./app/noodl')
    const { createOnPopState } = await import('./handlers/history')

    await initializeNoodlPluginRefresher()

    log.grey('Initializing [App] instance')
    app = await initializeApp({ noodl, Account })
    log.func('onload')
    log.grey('Initialized [App] instance')

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
      app: { configurable: true, get: () => app },
      build: { configurable: true, value: process.env.BUILD },
      l: { configurable: true, get: () => app?.meeting.localParticipant },
      cache: { configurable: true, get: () => app?.cache },
      cp: { configurable: true, get: () => copyToClipboard },
      noodl: { configurable: true, get: () => noodl },
      nui: { configurable: true, get: () => app?.nui },
      ndom: { configurable: true, get: () => app?.ndom },
      phone: {
        get: () => app.root.Global?.currentUser?.vertex?.name?.phoneNumber,
      },
      ...u
        .entries(getWindowHelpers())
        .reduce(
          (acc, [key, fn]) =>
            u.assign(acc, { [key]: { configurable: true, get: () => fn } }),
          {},
        ),
      toYml: { configurable: true, get: () => yaml.stringify.bind(yaml) },
    })

    window.addEventListener('popstate', createOnPopState(app))
  } catch (error) {
    console.error(error)
  } finally {
    !attachDebugUtilsToWindow.attached && attachDebugUtilsToWindow(app)
  }

  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.addEventListener('gestureend', (e) => e.preventDefault())
  document.addEventListener('gesturechange', (e) => e.preventDefault())
})

if (module.hot) {
  module.hot.accept()
  if (module.hot.status() === 'apply') {
    app = window.app as App
    window.app.reset(true)
    delete window.app
  }

  module.hot.dispose((data = {}) => {
    u.keys(data).forEach((key) => delete data[key])
  })
}

function attachDebugUtilsToWindow(app: App) {
  Object.defineProperties(window, {
    componentStats: {
      get() {
        const pageComponentCount = {} as Record<string, number>
        for (const obj of app.cache.component) {
          if (obj) {
            const pageName = obj.page
            if (!(pageName in pageComponentCount)) {
              pageComponentCount[pageName] = 0
            }
            pageComponentCount[pageName]++
          }
        }
        return pageComponentCount
      },
    },
    ndomPages: {
      get() {
        return (name: string) =>
          u.values(app.ndom.pages).filter((page) => page.page === name)
      },
    },
    nuiPages: {
      get() {
        return (name: string) =>
          [...app.cache.page.get().values()].reduce(
            (acc, { page }) => (page.page === name ? acc.concat(page) : acc),
            [] as lib.Page[],
          )
      },
    },
    pageTable: {
      get() {
        const result = [] as { page: string; ndom: number; nui: number }[]
        const getKey = (page: NDOMPage | lib.Page) =>
          page.page === '' ? 'unknown' : page.page
        const pagesList = [] as string[]

        for (const { page } of app.cache.page.get().values()) {
          if (!pagesList.includes(page.page)) pagesList.push(page.page)
          const index = pagesList.indexOf(page.page)
          const obj = result[index]
          const pageKey = getKey(page) as keyof typeof result[number]

          if (!obj) {
            result[index] = {
              ndom: 0,
              nui: 0,
              page: pageKey,
            }
          }
          result[index].nui++
          result[index].page = pageKey
        }

        const ndomPagesEntries = u.entries(app.ndom.pages)

        for (let index = 0; index < ndomPagesEntries.length; index++) {
          const [_, ndomPage] = ndomPagesEntries[index]
          const pageKey = getKey(ndomPage) as keyof typeof result[number]
          const obj = result[index]
          if (!pagesList.includes(pageKey)) pagesList.push(pageKey)
          if (!obj) {
            result[index] = {
              ndom: 0,
              nui: 0,
              page: pageKey,
            }
          }
          result[index].ndom++
          result[index].page = pageKey
        }

        // for (const obj of app.cache.component) {
        //   if (obj?.component?.type === 'page') {
        //     const page = app.cache.page.get(obj.component)?.page
        //     if (page) {
        //       const pageKey = getKey(page)
        //       const resultObject = result.find((r) => r.page === pageKey)
        //       if (resultObject) {
        //         resultObject.nui++
        //         debugger
        //         const ndomPage = app.ndom.findPage(page)
        //         if (ndomPage) resultObject.ndom++
        //       }
        //     }
        //   }
        // }

        return result
      },
    },
  })

  attachDebugUtilsToWindow.attached = true
}

attachDebugUtilsToWindow.attached = false
