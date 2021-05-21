import * as u from '@jsmanifest/utils'
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

window.addEventListener('load', async (e) => {
  try {
    const { Account } = await import('@aitmed/cadl')
    const {
      default: firebase,
      aitMessage,
      isSupported: firebaseSupported,
    } = await import('./app/firebase')
    const { default: noodl } = await import('./app/noodl')
    const { createOnPopState } = await import('./handlers/history')

    const app = new App({
      noodl,
      getStatus: Account.getStatus.bind(Account),
    })

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

    u.assign(window, {
      Account,
      build: process.env.BUILD,
    })

    Object.defineProperties(window, {
      app: { get: () => app },
      l: { get: () => app.meeting.localParticipant },
      cache: { get: () => app.cache },
      cp: { get: () => copyToClipboard },
      meeting: { get: () => app.meeting },
      noodl: { get: () => noodl },
      nui: { get: () => app.nui },
      ndom: { get: () => app.ndom },
      page: { get: () => app.mainPage },
      FCMOnTokenReceive: {
        get: () => (args: any) =>
          noodl.root.builtIn
            .FCMOnTokenReceive({ vapidKey: aitMessage.vapidKey, ...args })
            .then(console.log)
            .catch(console.error),
      },
      grid: {
        get: () => () => {
          const grid = document.getElementById('gridlines')
          if (grid) {
            grid.remove()
          } else {
            showGridLines.call(app, {
              width: app.mainPage.viewport.width,
              height: app.mainPage.viewport.height,
            })
          }
        },
      },
      ...u
        .entries(getWindowHelpers())
        .reduce(
          (acc, [key, fn]) => Object.assign(acc, { [key]: { get: () => fn } }),
          {},
        ),
    })

    try {
      stable && log.cyan('Initializing [App] instance')
      await app.initialize({
        firebase: { client: firebase, vapidKey: aitMessage.vapidKey },
        firebaseSupported: firebaseSupported(),
      })
      stable && log.cyan('Initialized [App] instance')
    } catch (error) {
      console.error(error)
    }

    const configPages = [
      ...(app.noodl.cadlEndpoint?.preload || []),
      ...(app.noodl.cadlEndpoint?.page || []),
    ] as string[]

    window.addEventListener('popstate', createOnPopState(app))

    // const ws = new WebSocket(`ws://127.0.0.1:3002`)

    // ws.onopen = (event) => {
    //   // log.green(`Websocket client opened!`, event)
    // }

    // ws.onclose = (event) => {
    //   log.grey(`Websocket client closed`, event)
    // }

    // ws.onerror = (event) => {
    //   log.red(`Websocket client received an error!`, event)
    // }

    // ws.onmessage = async (event) => {
    //   const data = JSON.parse(event.data)

    //   if (data.type === 'FILE_CHANGED') {
    //     const pageName = String(data.name).replace(/\//g, '')
    //     if (pageName && configPages.includes(pageName)) {
    //       console.clear()
    //       log.green(`A noodl file was changed and the app restarted`, data)
    //       app.reset(true)
    //     }
    //   }
    // }
  } catch (error) {
    console.error(error)
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.addEventListener('message', function onMessage(ev) {
  //     console.log(`%cReceived message!`, `color:#00b406;`, ev)
  //   })
  //   const registration = await navigator.serviceWorker.register('worker.js', {
  //     type: 'classic',
  //   })
  // }
})

function showGridLines(
  this: App,
  {
    width = '100%',
    height = 0,
  }: {
    width: any
    height: any
  },
) {
  if (typeof window !== 'undefined') {
    const container = document.createElement('div')
    const gridLines: HTMLDivElement[] = []

    document.body.appendChild(container)
    container.classList.add('grid-lines')
    container.id = 'gridlines'
    container.style.position = 'absolute'
    container.style.width = width
    container.style.height = '100%'
    container.style.minHeight = height
    container.style.top = '0px'
    container.style.right = '0px'
    container.style.left = '0px'
    container.style.pointerEvents = 'none'
    container.style.userSelect = 'none'

    let currTop = 0
    let offset = 50

    const createGridLineElem = ({
      top,
      text = '',
    }: {
      top: any
      text: string | ((...args: any[]) => any)
    }) => {
      const node = document.createElement('div')
      node.classList.add('grid-line')
      node.style.position = 'absolute'
      node.style.top = top + 'px'
      node.style.width = width + 'px'
      node.style.height = '100px'
      node.style.zIndex = '10000'
      // node.style.border = '0.5px dashed rgba(0, 0, 0, 0.15)'
      const child = document.createElement('div')
      child.style.position = 'absolute'
      child.style.left = '0px'
      child.style.width = width
      child.style.color = 'hotpink'
      child.style.fontSize = '11.5px'
      child.textContent = typeof text === 'function' ? text(node) : text
      node.appendChild(child)
      return node
    }

    while (currTop < height) {
      const node = createGridLineElem({
        top: currTop,
        text: currTop + 'px',
      })
      container.appendChild(node)
      gridLines.push(node)
      currTop += offset
    }
  }
}
