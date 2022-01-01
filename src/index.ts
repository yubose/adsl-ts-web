import yaml from 'yaml'
import * as u from '@jsmanifest/utils'
import { Account, CADL } from '@aitmed/cadl'
import Logger from 'logsnap'
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
  findFirstByClassName,
  findFirstByDataKey,
  findFirstByElementId,
  findFirstByViewTag,
  findWindow,
  findWindowDocument,
  Page as NDOMPage,
  findFirstBySelector,
} from 'noodl-ui-dom'
import { findReferences } from 'noodl-utils'
import { copyToClipboard, exportToPDF, getVcodeElem, toast } from './utils/dom'
import { isChrome } from './utils/common'
import {
  getUserProps as getUserPropsFromLocalStorage,
  saveUserProps as saveUserPropsFromLocalStorage,
} from './utils/localStorage'
import AppNotification from './app/Notifications'
import App from './App'
import 'vercel-toast/dist/vercel-toast.css'
import './spinner/three-dots.css'
import './styles.css'

const log = Logger.create('App.ts')

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export async function getWindowHelpers() {
  const { default: Lvl2 } = await import('@aitmed/ecos-lvl2-sdk')
  const lvl2sdk = new Lvl2({ env: 'development', configUrl: '' })

  return u.assign({
    lvl2: lvl2sdk.utilServices,
    exportToPDF,
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
    findFirstByClassName,
    findFirstByDataKey,
    findFirstByElementId,
    findFirstByViewTag,
    getVcodeElem,
    getUserPropsFromLocalStorage,
    saveUserPropsFromLocalStorage,
    toast,
  })
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
    u.assign(app.spinner.opts, {
      lines: 13, // The number of lines to draw
      length: 38, // The length of each line
      width: 17, // The line thickness
      radius: 45, // The radius of the inner circle
      animation: 'spinner-line-shrink', // The CSS animation name for the lines
      color: '#000', // CSS color or array of colors
      zIndex: 2000000000, // The z-index (defaults to 2e9)
    })
    app.spinner.spin(document.getElementById('root'))
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
  // app.navigate('Cov19TestNewPatReviewPage1')
  return app
}

async function initializeNoodlPluginRefresher() {
  ws = new WebSocket(`ws://127.0.0.1:3002`)
  ws.addEventListener('message', (msg) => {
    try {
      JSON.parse(msg.data)?.type === 'FILE_CHANGED' && app.reset(true)
    } catch (error) {}
  })

  return ws
}

window.addEventListener('load', async (e) => {
  try {
    window.build = process.env.BUILD
    window.ac = []
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
      ...u.reduce(
        u.entries(await getWindowHelpers()),
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

  window.addEventListener('storage', (evt) => {
    console.log(`[storage]`, evt)
  })

  const notifiedForChromeDesktop = window.localStorage.getItem(
    'notified-chrome-desktop',
  )

  if (!isChrome() && notifiedForChromeDesktop != 'notified') {
    const width = window.outerWidth
    if (width > 1000) {
      window.localStorage.setItem('notified-chrome-desktop', 'notified')
      toast(`For best performance, please use the Chrome browser`, {
        timeout: 10000,
        type: 'dark',
      })
    }
  }

  // const pdfElem = findFirstByViewTag('mainView')
  window.scrollTo({ left: window.innerWidth })
  let interval = setInterval(() => {
    const imgElem = findFirstBySelector(
      `[src="http://127.0.0.1:3001/assets/downLoadBlue.svg"]`,
    )
    if (imgElem) {
      const btn = imgElem.nextElementSibling
      if (btn) {
        btn['click']()
        return clearInterval(interval)
      }
    }
    console.log(`[interval] The btn button has not rendered yet`)
  }, 150)
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

        return result
      },
    },
    componentCache: {
      value: {
        findComponentsWithKeys: (...keys: string[]) => {
          const regexp = new RegExp(`(${keys.join('|')})`)
          return app.cache.component.filter((obj) =>
            [
              ...new Set([
                ...u.keys(obj?.component?.blueprint || {}),
                ...u.keys(obj?.component?.props || {}),
              ]),
            ].some((key) => regexp.test(key)),
          )
        },
        findByComponentType: (type: string) =>
          app.cache.component.filter((obj) => obj.component?.type === type),
        findById: (id: string) =>
          app.cache.component.filter((obj) => obj.component?.id === id),
        findByPopUpView: (popUpView: string) =>
          app.cache.component.filter(
            (obj) => obj.component?.blueprint?.popUpView === popUpView,
          ),
        findByViewTag: (viewTag: string) =>
          app.cache.component.filter(
            (obj) => obj.component?.blueprint?.viewTag === viewTag,
          ),
      },
    },
  })

  attachDebugUtilsToWindow.attached = true
}

attachDebugUtilsToWindow.attached = false
