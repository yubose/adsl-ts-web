import Logger from 'logsnap'
import App from './App'
import Meeting from './meeting'
import { copyToClipboard } from './utils/dom'
import { isStable } from './utils/common'
import 'vercel-toast/dist/vercel-toast.css'
import './styles.css'

const log = Logger.create('App.ts')
const stable = isStable()

window.addEventListener('load', async (e) => {
  const { Account } = await import('@aitmed/cadl')
  const { default: firebase, aitMessage } = await import('./app/firebase')
  const { default: noodl } = await import('app/noodl')
  const { default: noodlui, getWindowHelpers } = await import('app/noodl-ui')
  const { default: noodluidom } = await import('app/noodl-ui-dom')

  const { page } = noodluidom
  const app = new App()

  window.app = {
    Account,
    app,
    build: process.env.BUILD,
    cp: copyToClipboard,
    meeting: Meeting,
    noodl,
    noodlui,
    page,
  }
  window.build = process.env.BUILD
  window.componentCache = noodlui.componentCache.bind(noodlui)
  window.cp = copyToClipboard

  Object.defineProperty(window, 'msg', {
    get() {
      return app.messaging
    },
  })

  window.noodl = noodl
  window.noodlui = noodlui
  window.noodluidom = noodluidom
  window.FCMOnTokenReceive = (args: any) => {
    noodl.root.builtIn
      .FCMOnTokenReceive({ vapidKey: aitMessage.vapidKey, ...args })
      .then(console.log)
      .catch(console.error)
  }

  Object.assign(window, getWindowHelpers())

  try {
    stable && log.cyan('Initializing [App] instance')
    await app.initialize({
      firebase: { client: firebase, vapidKey: aitMessage.vapidKey },
      meeting: Meeting,
      noodlui,
      noodluidom,
    })
    // @ts-expect-error
    window.grid = () => {
      const grid = document.getElementById('gridlines')
      if (grid) {
        grid.remove()
      } else {
        showGridLines.call(app, {
          width: noodlui.viewport.width,
          height: noodlui.viewport.height,
        })
      }
    }
    // @ts-expect-error
    window.grid()
    stable && log.cyan('Initialized [App] instance')
  } catch (error) {
    console.error(error)
  }

  window.addEventListener('popstate', async (e) => {
    const goBackPage = page.getPreviousPage(noodl.cadlEndpoint?.startPage)
    stable && log.cyan(`Received the "goBack" page as ${goBackPage}`)
    const parts = page.pageUrl.split('-')
    stable && log.cyan(`URL parts`, parts)
    if (parts.length > 1) {
      let popped = parts.pop()
      stable && log.cyan(`Popped: ${popped}`)
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        popped = parts.pop()
        stable && log.cyan(`Popped`)
      }
      stable && log.cyan(`Page URL: ${page.pageUrl}`)
      if (parts.length > 1) {
        page.pageUrl = parts.join('-')
        stable && log.cyan(`Page URL: ${page.pageUrl}`)
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          stable && log.cyan(`Page URL: ${page.pageUrl}`)
          page.pageUrl = 'index.html?'
        } else {
          page.pageUrl = parts[0]
          stable && log.cyan(`Page URL: ${page.pageUrl}`)
        }
      }
    } else {
      page.pageUrl = 'index.html?'
      stable && log.cyan(`Page URL: ${page.pageUrl}`)
    }
    await page.requestPageChange(goBackPage)
  })
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
