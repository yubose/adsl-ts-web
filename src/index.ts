import _ from 'lodash'
import { createSelector } from '@reduxjs/toolkit'
import { Account } from '@aitmed/cadl'
import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  getDataValues,
  Page as NOODLUiPage,
  Viewport,
} from 'noodl-ui'
import { CachedPage, ModalId } from './app/types'
import { cadl, noodl } from './app/client'
import createStore from './app/store'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import App from './App'
import Page from './Page'
import Meeting from './Meeting'
import modalComponents from './components/modalComponents'
import { modalIds, CACHED_PAGES } from './constants'
import { observeStore, openOutboundURL } from './utils/common'
import * as action from './handlers/actions'
import * as lifeCycle from './handlers/lifeCycles'
import './styles.css'

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.getDataValues = getDataValues
  window.noodl = cadl
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  console.log(`%c${vcode}`, 'color:green;font-weight:bold;')
  console.log(`%cProfile`, 'color:green;font-weight:bold;', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const store = createStore()
  const viewport = new Viewport()
  const page = new Page({ store })
  const meeting = new Meeting({ page, store, viewport })
  const app = new App({ store, viewport })
  const builtIn = createBuiltInActions({ page, store })
  const actions = createActions({ page, store })

  let { startPage } = await app.initialize()

  page.setBuiltIn({
    goto: builtIn.goto,
    videoChat: onVideoChatBuiltIn(meeting.joinRoom),
  })

  page.registerListener('onBeforePageChange', () => {
    if (!noodl.initialized) {
      noodl
        .init({ viewport })
        .setAssetsUrl(cadl.assetsUrl || '')
        .setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        })
        .setResolvers(
          getElementType,
          getTransformedAliases,
          getReferences,
          getAlignAttrs,
          getBorderAttrs,
          getColors,
          getFontAttrs,
          getPosition,
          getSizes,
          getStylesByElementType,
          getTransformedStyleAliases,
          getChildren as any,
          getCustomDataAttrs,
          getEventHandlers,
        )
        .addLifecycleListener({
          action: actions,
          builtIn: {
            checkUsernamePassword: builtIn.checkUsernamePassword,
            enterVerificationCode: builtIn.checkVerificationCode,
            goBack: builtIn.goBack,
            lockApplication: builtIn.lockApplication,
            logOutOfApplication: builtIn.logOutOfApplication,
            logout: builtIn.logout,
            signIn: builtIn.signIn,
            signUp: builtIn.signUp,
            signout: builtIn.signout,
            toggleCameraOnOff: builtIn.toggleCameraOnOff,
            toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
          },
          onChainStart: lifeCycle.onChainStart,
          onChainEnd: lifeCycle.onChainEnd,
          onChainError: lifeCycle.onChainError,
          onChainAborted: lifeCycle.onChainAborted,
          onAfterResolve: lifeCycle.onAfterResolve,
        } as any)
    }
  })

  page.registerListener(
    'onBeforePageRender',
    async (noodlUiPage: NOODLUiPage) => {
      // Cache to rehydrate if they disconnect
      cachePage({ name: noodlUiPage.name })
      const previousPage = store.getState().page.previousPage
      const logMsg =
        `%c[App.tsx][onBeforePageRender] ` +
        `${previousPage} --> ${noodlUiPage.name}`
      console.log(logMsg, `color:green;font-weight:bold;`, {
        previousPage,
        nextPage: noodlUiPage,
      })
      // Refresh the roots
      noodl
        // TODO: Leave root/page auto binded to the lib
        .setRoot(cadl.root)
        .setPage(noodlUiPage)
      // NOTE: not being used atm
      if (page.rootNode && page.rootNode.id !== noodlUiPage.name) {
        page.rootNode.id = noodlUiPage.name
      }
    },
  )

  /**
   * Respnsible for keeping the UI in sync with changes to page routes.
   * Dispatch setCurrentPage to navigate
   */
  observeStore(
    store,
    createSelector(
      (state) => state.page.previousPage,
      (state) => state.page.currentPage,
      (previousPage, currentPage) => ({ previousPage, currentPage }),
    ),
    async ({ previousPage, currentPage }) => {
      const logMsg =
        `%c[src/index.ts][observeStore -- previousPage/currentPage] ` +
        'Received an update to previousPage/currentPage'
      console.log(logMsg, `color:#95a5a6;font-weight:bold;`, {
        previousPage,
        nextPage: currentPage,
      })
      if (currentPage) {
        await page.navigate(currentPage)
      }
    },
  )

  /** Responsible for managing the modal component */
  observeStore(
    store,
    createSelector(
      (state) => state.page.modal,
      (modalState) => modalState,
    ),
    (modalState) => {
      const { id, opened, ...rest } = modalState
      const logMsg =
        `%c[src/index.ts][observeStore -- modal] ` +
        'Received an update to page modal'
      console.log(logMsg, `color:#95a5a6;font-weight:bold;`, modalState)
      if (opened) {
        const modalId = modalIds[id as ModalId]
        const modalComponent = modalComponents[modalId]
        if (modalComponent) {
          page.modal.open(id, modalComponent, { opened, ...rest })
        } else {
          // log
        }
      } else {
        page.modal.close()
      }
    },
  )

  // Register the onresize listener once, if it isn't already registered
  if (viewport.onResize === undefined) {
    viewport.onResize = (newSizes) => {
      noodl.setViewport(newSizes)
      if (page.rootNode) {
        page.rootNode.style.width = `${newSizes.width}px`
        page.rootNode.style.height = `${newSizes.height}px`
        page.render(cadl?.root?.[store.getState().page.currentPage]?.components)
      } else {
        // TODO
      }
    }
  }

  const cachedPages = getCachedPages()
  if (cachedPages?.length) {
    const previousPage = cachedPages[0]?.name
    // Compare the two pages to make an informed decision before setting it
    if (previousPage) {
      const logMsg = `%c[src/index.ts] Comparing cached page vs startPage`
      console.log(logMsg, `color:#FF5722;font-weight:bold;`, {
        cachedPages,
        startPage,
        authState: store.getState().auth,
        pageState: store.getState().page,
      })
    } else {
      startPage = previousPage
    }
  }

  const { snapshot } = (await page.navigate(startPage)) || {}

  if (snapshot?.name === 'VideoChat') {
    // TODO: connect to meeting
  } else {
    //
  }
})

/** Adds the current page name to the end in the list of cached pages */
function cachePage(name: CachedPage | CachedPage[]) {
  const newPages = _.isArray(name) ? name : [name]
  if (newPages.length) {
    const prevCache = getCachedPages()
    const nextCache = newPages.concat(prevCache)
    if (nextCache.length >= 4) nextCache.shift()
    setCachedPages(nextCache)
  }
}

/** Retrieves a list of cached pages */
function getCachedPages(): CachedPage[] {
  let result: CachedPage[] = []
  const pageHistory = window.localStorage.getItem(CACHED_PAGES)
  if (pageHistory) {
    try {
      result = JSON.parse(pageHistory) || []
    } catch (error) {
      console.error(error)
    }
  }
  return result
}

/** Sets the list of cached pages */
function setCachedPages(cache: CachedPage[]) {
  window.localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
}
