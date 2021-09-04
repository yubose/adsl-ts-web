/**
 * Handlers for window.history listeners
 */
import { BASE_PAGE_URL } from 'noodl-ui-dom'
import curry from 'lodash/curry'
import Logger from 'logsnap'
import App from '../App'

const log = Logger.create('history')

export const createOnPopState = curry(
  async (app: App, event: PopStateEvent) => {
    log.func('onPopState')

    let parts = app.mainPage.pageUrl.split('-')
    let popped

    if (
      app.previousPage === app.currentPage &&
      app.startPage &&
      app.startPage !== 'SignIn' &&
      app.previousPage !== app.startPage
    ) {
      log.grey(`Received the "goBack" page as ${app.previousPage}`)
    } else {
      log.grey(`Received the "goBack" page as ${app.previousPage}`)
    }
    if (parts.length > 1) {
      popped = parts.pop()
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        popped = parts.pop()
      }
      if (parts.length > 1) {
        app.mainPage.pageUrl = parts.join('-')
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          app.mainPage.pageUrl = BASE_PAGE_URL
        } else {
          app.mainPage.pageUrl = parts[0]
        }
      }
    } else {
      app.mainPage.pageUrl = BASE_PAGE_URL
    }
    await app.navigate(app.previousPage)
  },
)
