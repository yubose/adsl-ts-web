import { copyToClipboard } from './utils/dom'
import createActions from './handlers/actions'
import createBuiltInActions from './handlers/builtIns'
import App from './App'
import Page from './Page'
import Meeting from './meeting'
import './styles.css'

window.addEventListener('load', async () => {
  const { Account } = await import('@aitmed/cadl')
  const { default: noodl } = await import('app/noodl')
  const { default: noodlui, getWindowHelpers } = await import('app/noodl-ui')
  const { default: noodluidom } = await import('app/noodl-ui-dom')

  const page = new Page()
  const app = new App()
  const actions = createActions({ page })
  const builtIn = createBuiltInActions({ page })

  try {
    await app.initialize({
      actions,
      builtIn,
      meeting: Meeting,
      noodlui,
      noodluidom,
      page,
    })
  } catch (error) {
    console.error(error)
  }

  window.app = {
    Account,
    actions,
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
  window.noodl = noodl
  window.noodlui = noodlui
  window.noodluidom = noodluidom
  Object.assign(window, getWindowHelpers())

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

async function populateWindowWithNOODLUiHelpers() {}
