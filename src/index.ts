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
    var pg
    var pageUrlArr = page.pageUrl.split('-')

    if (pageUrlArr.length > 1) {
      pageUrlArr.pop()
      while (
        pageUrlArr[pageUrlArr.length - 1].endsWith('MenuBar') &&
        pageUrlArr.length > 1
      ) {
        pageUrlArr.pop()
      }
      if (pageUrlArr.length > 1) {
        pg = pageUrlArr[pageUrlArr.length - 1]
        page.pageUrl = pageUrlArr.join('-')
      } else if (pageUrlArr.length === 1) {
        if (pageUrlArr[0].endsWith('MenuBar')) {
          page.pageUrl = 'index.html?'
          pg = noodl?.cadlEndpoint?.startPage
        } else {
          pg = pageUrlArr[0].split('?')[1]
          page.pageUrl = pageUrlArr[0]
        }
      }
    } else {
      page.pageUrl = 'index.html?'
      pg = noodl?.cadlEndpoint?.startPage
    }
    let pageModifiers = undefined
    if (typeof page.requestingPageModifiers.reload === 'boolean') {
      pageModifiers = {
        reload: page.requestingPageModifiers.reload,
      }
      delete page.requestingPageModifiers.reload
    }
    await page.requestPageChange(pg, pageModifiers, true)
  })
})
