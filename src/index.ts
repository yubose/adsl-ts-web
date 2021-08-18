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
    console.log(`%c[noodl reloader error]`, `color:#ec0000;`, err)
  })

  ws.addEventListener('close', (event) => {
    console.log(`%c[noodl reloader] closed`, `color:#FF5722;`, event)
  })

  return ws
}

window.addEventListener('load', async (e) => {
  try {
    log.func('onload')

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

  app.ndom.on(
    'onRedrawStart',
    function onRedrawStart({ context, component, node, page, parent }) {
      // console.table({
      //   page: page?.page || '',
      //   [`component [redrawing]`]: component?.type
      //     ? `[${component.type}] ${component.id}`
      //     : '<No component>',
      //   parentComponent: parent?.type
      //     ? `[${parent.type}] ${parent.id}`
      //     : '<No parent>',
      //   [`node [redrawing]`]: node?.tagName
      //     ? `[${node.tagName?.toLowerCase?.()}] ${node.id}`
      //     : '<No node>',
      //   parentNode: node?.parentElement
      //     ? `[${node.parentElement.tagName.toLowerCase?.()}] ${
      //         node.parentElement.id
      //       }`
      //     : '<No parent node>',
      // })
      // const activePages = [] as string[]
      // for (const obj of app.cache.component) {
      //   if (obj) {
      //     if (obj.page && !activePages.includes(obj.page)) {
      //       activePages.push(obj.page)
      //     }
      //   }
      // }
      // for (const obj of app.cache.page) {
      //   if (obj) {
      //     const [id, { page }] = obj
      //     if (!page.page || !activePages.includes(page.page)) {
      //       console.log(
      //         `%cRemoving ${!page.page ? 'empty' : 'inactive'} page from NUI`,
      //         `color:#00b406;`,
      //         page.toJSON(),
      //       )
      //       app.cache.page.remove(page)
      //     }
      //   }
      // }
    },
  )
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
  // @ts-expect-error
  window.componentStats = () => {
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
    console.log(pageComponentCount)
  }

  // @ts-expect-error
  window.getNDOMPagesByName = (name: string) =>
    u.values(app.ndom.pages).filter((page) => page.page === name)
  // @ts-expect-error
  window.getNUIPagesByName = (name: string) =>
    [...app.cache.page.get().values()].reduce(
      (acc, { page }) => (page.page === name ? acc.concat(page) : acc),
      [] as lib.Page[],
    )
  // @ts-expect-error
  window.getPageTable = () => {
    const result = {} as Record<string, { ndom: any[]; nui: any[] }>
    const getKey = (page: NDOMPage | lib.Page) =>
      page.page === '' ? 'unknown' : page.page

    for (const { page } of app.cache.page.get().values()) {
      const key = getKey(page)
      if (!(key in result)) {
        result[key] = { ndom: [], nui: [] }
      }
      result[key].nui.push(page)
    }

    for (const page of u.values(app.ndom.pages)) {
      const key = getKey(page)
      if (!(key in result)) {
        result[key] = { ndom: [], nui: [] }
      }
      result[key].ndom.push(page)
    }
  }

  attachDebugUtilsToWindow.attached = true
}

attachDebugUtilsToWindow.attached = false
