import * as u from '@jsmanifest/utils'
import type { Account as CADLAccount, CADL } from '@aitmed/cadl'
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
} from 'noodl-ui-dom'
import { findReferences } from 'noodl-utils'
import { copyToClipboard, exportToPDF, getVcodeElem, toast } from './utils/dom'
import { isChrome } from './utils/common'
import {
  getUserProps as getUserPropsFromLocalStorage,
  saveUserProps as saveUserPropsFromLocalStorage,
} from './utils/localStorage'
import App from './App'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'
import 'vercel-toast/dist/vercel-toast.css'
import './spinner/three-dots.css'
import './styles.css'

const log = Logger.create('App.ts')

/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export async function getWindowHelpers() {
  // const { default: Lvl2 } = await import('@aitmed/ecos-lvl2-sdk')
  // const lvl2sdk = new Lvl2({ env: 'development', configUrl: '' })

  return u.assign({
    // lvl2: lvl2sdk.utilServices,
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
    noodl?: CADL
    Account?: typeof CADLAccount
  } = {},
) {
  const getAppName = () => {
    let appName = ''
    let hostname = location.hostname
    let hostnameParts = hostname.split('.')
    if (
      /(127.0.0.1|localhost)/.test(hostname) ||
      hostnameParts[1] === 'aitmed'
    ) {
      appName = 'aitmed'
    } else {
      appName = hostnameParts[0]
    }
    return appName
  }
  // if (!localStorage.getItem('config')) {
  //   const { default: axios } = await import('axios')
  //   const {
  //     default: { parse },
  //   } = await import('yaml')

  //   localStorage.setItem(
  //     'config',
  //     JSON.stringify(
  //       parse(
  //         (await axios.get(`https://public.aitmed.com/config/${getAppName()}.yml`))
  //           .data,
  //       ),
  //     ),
  //   )
  // }
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
  ////////////////////////////////////////////////////////////
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
      app.worker?.postMessage({ type: 'ON_INIT_SDK' })
      sdk.root.builtIn
        .SignInOk()
        .then((authed) => {
          if (authed) {
            app.worker?.postMessage({ type: 'AUTHENTICATED' })
            // document.getElementById('root').innerHTML = html
          }
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error(err)
        })
    },
    onWorker(worker) {
      worker.addEventListener('message', function (evt) {
        console.log(
          `%c[worker] Message`,
          `color:#00b406;font-weight:bold;`,
          evt,
        )
      })

      worker.addEventListener('messageerror', function (evt) {
        console.log(
          `%c[worker] Message error`,
          `color:tomato;font-weight:bold;`,
          evt,
        )
      })

      worker.addEventListener('error', function (evt) {
        console.log(`%c[worker] Error`, `color:tomato;font-weight:bold;`, evt)
      })
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
      cp: { configurable: true, get: () => copyToClipboard },
      ...u.reduce(
        u.entries(await getWindowHelpers()),
        (acc, [key, fn]) =>
          u.assign(acc, { [key]: { configurable: true, get: () => fn } }),
        {},
      ),
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
    const { key, storageArea } = evt
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
  // window.scrollTo({ left: window.innerWidth })
  // let interval = setInterval(() => {
  //   const imgElem = findFirstBySelector(
  //     `[src="http://127.0.0.1:3001/assets/downLoadBlue.svg"]`,
  //   )
  //   if (imgElem) {
  //     const btn = imgElem.nextElementSibling
  //     if (btn) {
  //       btn['click']()
  //       return clearInterval(interval)
  //     }
  //   }
  // console.log(`[interval] The btn button has not rendered yet`)
  // }, 150)
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
    getDataValues: {
      value() {
        return u.reduce(
          u.array(findByDataKey()),
          (acc, el) => {
            if (el) {
              if (el.dataset.value === '[object Object]') {
                const component = app.cache.component.get(el.id)?.component
                acc[el.dataset.key as string] = component.get('data-value')
              } else {
                acc[el.dataset.key as string] =
                  'value' in el ? (el as any).value : el.dataset.value
              }
            }
            return acc
          },
          {} as Record<string, any>,
        )
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
    findArrOfMinSize: {
      value: function findArrOfMinSize(
        root = {} as Record<string, any>,
        size: number,
        path = [] as (string | number)[],
      ) {
        const results = [] as { arr: any[]; path: (string | number)[] }[]

        if (Array.isArray(root)) {
          const count = root.length

          if (count >= size) results.push({ arr: root, path })

          for (let index = 0; index < count; index++) {
            const item = root[index]
            results.push(...findArrOfMinSize(item, size, path.concat(index)))
          }
        } else if (
          root &&
          typeof root === 'object' &&
          typeof root !== 'function'
        ) {
          for (const [key, value] of Object.entries(root)) {
            results.push(...findArrOfMinSize(value, size, path.concat(key)))
            // if (Array.isArray(value)) {
            // } else {}
          }
        }

        return results
      },
    },
  })

  attachDebugUtilsToWindow.attached = true
}

attachDebugUtilsToWindow.attached = false
