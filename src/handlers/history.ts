/**
 * Handlers for window.history listeners
 */
import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import Logger from 'logsnap'
import App from '../App'

const log = Logger.create('history')

export const createOnPopState = curry(
  async (app: App, event: PopStateEvent) => {
    log.func('onPopState')
    log.grey(`Received the "goBack" page as ${app.previousPage}`, event)

    let parts = app.mainPage.pageUrl.split('-')
    let popped

    if (parts.length > 1) {
      popped = parts.pop()
      while (parts[parts.length - 1].endsWith('MenuBar') && parts.length > 1) {
        popped = parts.pop()
      }
      if (parts.length > 1) {
        app.mainPage.pageUrl = parts.join('-')
      } else if (parts.length === 1) {
        if (parts[0].endsWith('MenuBar')) {
          app.mainPage.pageUrl = 'index.html?'
        } else {
          app.mainPage.pageUrl = parts[0]
        }
      }
    } else {
      app.mainPage.pageUrl = 'index.html?'
    }
    await app.navigate(app.previousPage)
  },
)
