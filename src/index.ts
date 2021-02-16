import { copyToClipboard } from './utils/dom'
import App from './App'
import Meeting from './meeting'
import 'vercel-toast/dist/vercel-toast.css'
import './styles.css'

window.addEventListener('load', async () => {
  const { Account } = await import('@aitmed/cadl')
  const { default: firebase, vapidKey } = await import('./app/firebase')
  const { default: noodl } = await import('app/noodl')
  const { default: noodlui, getWindowHelpers } = await import('app/noodl-ui')
  const { default: noodluidom } = await import('app/noodl-ui-dom')

  const page = noodluidom.page
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
      .FCMOnTokenReceive({ vapidKey, ...args })
      .then(console.log)
      .catch(console.error)
  }

  Object.assign(window, getWindowHelpers())

  try {
    await app.initialize({
      firebase: { client: firebase, vapidKey },
      meeting: Meeting,
      noodlui,
      noodluidom,
    })
  } catch (error) {
    console.error(error)
  }

  window.addEventListener('popstate', async function onPopState(e) {
    const goBackPage = page.getPreviousPage(noodl.cadlEndpoint?.startPage)
    let parts = page.pageUrl.split('-')
    if (parts.length > 1) {
      parts.pop()
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        parts.pop()
      }
      if (parts.length > 1) {
        page.pageUrl = parts.join('-')
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          page.pageUrl = 'index.html?'
        } else {
          page.pageUrl = parts[0]
        }
      }
    } else {
      page.pageUrl = 'index.html?'
    }
    await page.requestPageChange(goBackPage)
  })
})
