/**
 * Handlers for window.history listeners
 */
import { BASE_PAGE_URL } from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import log from 'loglevel'
import App from '../App'

export const createOnPopState = curry(
  async (app: App, event: PopStateEvent) => {
    if (!app.getState().spinner.active) app.enableSpinner()

    // Restore the states that are missing because of the native browser back button behavior
    if (!app.mainPage.requesting && app.mainPage.previous) {
      const previousPage = app.mainPage.previous
      app.mainPage.requesting = previousPage
      if (!u.isObj(app.mainPage.modifiers)) {
        app.mainPage.setModifier(previousPage, {})
      }
      if (!u.isObj(app.mainPage.modifiers[previousPage])) {
        app.mainPage.modifiers[previousPage] = {}
      }
      if (!('reload' in app.mainPage.modifiers[previousPage])) {
        app.mainPage.modifiers[previousPage].reload = true
      }
    }

    let parts = app.mainPage.pageUrl.split('-')
    let popped

    if (
      app.previousPage === app.currentPage &&
      app.startPage &&
      app.startPage !== 'SignIn' &&
      app.previousPage !== app.startPage
    ) {
      log.debug(`Received the "goBack" page as ${app.previousPage}`)
    } else {
      log.debug(`Received the "goBack" page as ${app.previousPage}`)
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

    try {
      if (app.noodl.getState()?.queue?.length) {
        if (!app.getState().spinner?.active) app.enableSpinner()
      }
      await app.navigate(app.previousPage)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(err)
    } finally {
      if (!app.noodl.getState().queue?.length) {
        if (app.getState().spinner?.active) app.disableSpinner()
      }
    }
  },
)
