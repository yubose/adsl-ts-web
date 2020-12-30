import { getByDataUX } from 'noodl-ui-dom'
import { getDataValues } from 'noodl-ui'
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
  const { default: noodlui } = await import('app/noodl-ui')
  const { default: noodluidom } = await import('app/noodl-ui-dom')

  const page = new Page()
  const app = new App()
  const actions = createActions({ page })
  const builtIn = createBuiltInActions({ page })

  await app.initialize({
    actions,
    builtIn,
    meeting: Meeting,
    noodlui,
    noodluidom,
    page,
  })

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
  window.getByDataUX = getByDataUX
  window.getDataValues = getDataValues
  window.noodl = noodl
  window.noodlui = noodlui
  window.noodluidom = noodluidom

  /** EXPERIMENTAL -- Custom routing */
  // TODO
  window.addEventListener('popstate', async function onPopState(e) {
    let pg
    let parts = page.pageUrl.split('-')

    if (parts.length > 1) {
      parts.pop()
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        parts.pop()
      }
      if (parts.length > 1) {
        pg = parts[parts.length - 1]
        page.pageUrl = parts.join('-')
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          page.pageUrl = 'index.html?'
          pg = noodl?.cadlEndpoint?.startPage
        } else {
          pg = parts[0].split('?')[1]
          page.pageUrl = parts[0]
        }
      }
    } else {
      page.pageUrl = 'index.html?'
      pg = noodl?.cadlEndpoint?.startPage
    }
    const currentModifiers = page.getState().modifiers[pg]
    if (currentModifiers) {
      if (typeof currentModifiers.reload === 'boolean') {
        page.setModifier(pg, { reload: currentModifiers.reload })
      }
    }
    await page.requestPageChange(pg, { goBack: true })
  })
})
