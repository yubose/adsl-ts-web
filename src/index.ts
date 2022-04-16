import * as u from '@jsmanifest/utils'
import type { Account as CADLAccount, CADL } from '@aitmed/cadl'
import type * as jss from 'jsstore'
import Logger from 'logsnap'
import { asHtmlElement, findByViewTag } from 'noodl-ui'
import { toast } from './utils/dom'
import { isChrome } from './utils/common'
import App from './App'
import { getWindowDebugUtils } from './utils/windowDebugUtils'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'
import 'vercel-toast/dist/vercel-toast.css'
import './spinner/three-dots.css'
import './styles.css'

let app: App
let log = Logger.create('App.ts')
let ws: WebSocket

async function initializeApp(
  args: {
    noodl?: CADL
    Account?: typeof CADLAccount
  } = {},
) {
  let { noodl, Account: accountProp } = args
  let notification = new (await import('./app/Notifications')).default()
  !noodl && (noodl = (await import('./app/noodl')).default)
  !accountProp && (accountProp = (await import('@aitmed/cadl')).Account)
  if (!app) {
    const { Account } = await import('@aitmed/cadl')
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
    app.spinner.spin(document.getElementById('root') as HTMLDivElement)
  }
  const { trackSdk, trackWebApp } = await import('./app/trackers')
  trackSdk(app)
  trackWebApp(app)
  window.app = app
  await app.initialize({
    async onInitNotification(notification) {
      try {
        if (notification.supported) {
          if (!notification?.initiated) {
            app.serviceWorkerRegistration =
              await navigator.serviceWorker?.register(
                'firebase-messaging-sw.js',
              )

            app.serviceWorker?.addEventListener('statechange', (evt) => {
              console.log(
                `%c[App - serviceWorker] State changed`,
                `color:#c4a901;`,
                evt,
              )
            })

            const listenForWaitingServiceWorker = (
              reg: ServiceWorkerRegistration,
              promptUserToRefresh: (reg: ServiceWorkerRegistration) => void,
            ) => {
              const awaitStateChange = async (evt?: Event) => {
                await app.serviceWorkerRegistration?.update()
                console.log(
                  `%c[App - serviceWorkerRegistration] Update found`,
                  `color:#c4a901;`,
                  evt,
                )

                reg.installing?.addEventListener('statechange', function () {
                  if (this.state === 'installed') promptUserToRefresh(reg)
                })
              }
              if (!reg) return
              if (reg.waiting) return promptUserToRefresh(reg)
              if (reg.installing) awaitStateChange()
              reg.addEventListener('updatefound', awaitStateChange)
            }

            // Reload once when the new Service Worker starts activating
            let refreshing = false
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (refreshing) return
              refreshing = true
              window.location.reload()
            })

            navigator.serviceWorker.addEventListener('message', (msg) => {
              console.log(
                `%c[App] serviceWorker message`,
                `color:#00b406;`,
                msg,
              )
              if (msg?.type === 'send-skip-waiting') {
                app.serviceWorkerRegistration?.waiting?.postMessage(
                  'skipWaiting',
                )
              }
            })

            listenForWaitingServiceWorker(
              app.serviceWorkerRegistration,
              (reg: ServiceWorkerRegistration) => {
                reg.showNotification(
                  `There is an update available. Would you like to apply the update?`,
                  { data: { type: 'update-click' } },
                )
                // onClick -->   reg.waiting?.postMessage('skipWaiting')
              },
            )
            notification?.init()
          }
        }

        !notification?.initiated && (await notification?.init())
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error(err)
      }
    },
    onSdkInit(sdk) {
      initPiBackgroundWorker(
        new Worker('piBackgroundWorker.js'),
        // ../../../aitmed-noodl-web/build/piBackgroundWorker.js
      )
    },
  })
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
  if (isChrome()) {
    console.log(`%c[Chrome] You are using chrome browser`, `color:#e50087;`)
  } else {
    console.log(`%c[Chrome] You are not using chrome browser`, `color:orange;`)
  }

  try {
    window.build = process.env.BUILD
    window.ac = []
    log.func('onload')

    const { Account } = await import('@aitmed/cadl')
    const { default: noodl } = await import('./app/noodl')
    const { createOnPopState } = await import('./handlers/history')

    if (/(127.0.0.1|localhost)/i.test(location.hostname)) {
      await initializeNoodlPluginRefresher()
    }

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
})

window.addEventListener('beforeunload', (evt) => {
  const html = document.getElementById('root')?.innerHTML || ''
  if (html) {
    localStorage.setItem(
      `__last__`,
      JSON.stringify({
        origin: location.origin,
        page: app.currentPage,
        startPage: app.startPage,
        root: html,
        x: window.scrollX,
        y: window.scrollY,
      }),
    )
  } else {
    localStorage.removeItem(`__last__`)
  }
})

window.addEventListener('keydown', (evt) => {
  // Secret helper to quickly get values of reference in runtime
  if (evt.key === '0' && evt.metaKey) window.get()
})

function attachDebugUtilsToWindow(app: App) {
  Object.defineProperties(
    window,
    u.entries(getWindowDebugUtils(app)).reduce((acc, [key, value]) => {
      acc[key] = { configurable: true, enumerable: true, value }
      return acc
    }, {} as Record<string, PropertyDescriptor>),
  )
  attachDebugUtilsToWindow.attached = true
}

attachDebugUtilsToWindow.attached = false

/**
 * Initializes the Personal Index Worker
 * @param { Worker } worker
 */
function initPiBackgroundWorker(worker: Worker) {
  const _color = 'navajowhite'

  /**
   * Wraps the worker with a "sendMessage" method. This is the same as postMessage but is being used here so we don't write "console.log" every time to debug logs
   * @param worker
   * @returns { Worker }
   */
  const withSendMessage = (worker: Worker) => {
    Object.defineProperty(worker, 'sendMessage', {
      value: function (this: Worker, ...args: any[]) {
        console.log(
          `%c[client] Sending "${args[0]?.type}"`,
          `color:${_color};`,
          args[0],
        )
        // @ts-expect-error
        return worker.postMessage(...args)
      },
    })
    return worker as Worker & { sendMessage: Worker['postMessage'] }
  }

  const piWorker = withSendMessage(worker)

  // piWorker.sendMessage({
  //   type: 'search',
  //   table: 'CPT',
  // })

  piWorker.addEventListener('message', async function (evt) {
    const data = evt.data
    const type = data?.type

    if (evt.data?.result?.database) {
      // Message sent from jsstore on initiation
      const result = evt.data.result as {
        isCreated: boolean
        database: jss.IDataBase
        oldVersion: number
        newVersion: number
      }
      const { database, isCreated } = result
      log.func('message')
      log.grey(
        `Database ${
          isCreated
            ? `"${database.name}" created with ${database.tables.length} tables`
            : `tables`
        }`,
        isCreated ? database : database.tables,
      )
    } else {
      log.grey(`Message "${type}"`, data)
    }

    switch (String(type)) {
      case 'workerInitiated': {
        const resp = await fetch(`/cpt`)
        const respData = await resp.json()
        piWorker.sendMessage({
          type: 'storeData',
          table: 'CPT',
          data: [respData.CPT.version, respData.CPT.content],
        })
        return piWorker.sendMessage({
          type: 'search',
          storeName: 'CPT',
        })
      }
      case 'searchResult': {
        const { table, result, query } = data
        const resp = await fetch('/cpt')
        const respData = await resp.json()
        console.log(`searchResult`, result)
        break
      }
      // case 'FETCHED_STORE_DATA': {
      //   const { storeName, cachedVersion, response } = data
      //   const responseDataVersion = response?.CPT?.version
      //   if (responseDataVersion && cachedVersion !== responseDataVersion) {
      //     return piWorker.sendMessage({
      //       type: storeEvt.STORE_DATA_VERSION_UPDATE,
      //       storeName,
      //       data: response?.CPT?.content,
      //       version: responseDataVersion,
      //     })
      //   }
      //   break
      // }
    }
  })
  piWorker.addEventListener('messageerror', function (evt) {
    console.log(`%c[client] MessageError`, `color:tomato;`, evt)
  })
  piWorker.addEventListener('error', function (evt) {
    console.log(`%c[client] Error`, `color:tomato;`, evt)
  })
}

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
