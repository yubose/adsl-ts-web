import _ from 'lodash'
import { createSelector } from '@reduxjs/toolkit'
import { Account } from '@aitmed/cadl'
import {
  ActionChainActionCallback,
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
  NOODLChainActionBuiltInObject,
  NOODLPageObject,
  NOODLComponentProps,
  Viewport,
} from 'noodl-ui'
import {
  CachedPage,
  ModalId,
  OnBeforePageRenderArgs,
  OnRootNodeInitializedArgs,
  PageSnapshot,
} from './app/types'
import { cadl, noodl } from './app/client'
import { observeStore, reduceEntries, serializeError } from './utils/common'
import { setPage, setRequestStatus } from './features/page'
import { modalIds, CACHED_PAGES } from './constants'
import createStore from './app/store'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import App from './App'
import Page from './Page'
import Meeting from './Meeting'
import modalComponents from './components/modalComponents'
import * as lifeCycle from './handlers/lifeCycles'
import './styles.css'

function enhanceActions(actions: ReturnType<typeof createActions>) {
  return reduceEntries(
    actions,
    (acc, { key, value: fn }, index) => {
      acc[key] = (...args: any[]) => {
        const logMsg = `%c[actions.ts][reduceEntries]`
        console.log(logMsg, `color:#95a5a6;font-weight:bold;`, args)
        // @ts-expect-error
        return fn(...args)
      }
      return acc
    },
    {},
  )
}

/**
 * A factory func that returns a func that prepares the next page on the SDK
 * @param { object } options - Options to feed into the SDK's initPage func
 */
function createPreparePage(options: {
  builtIn: {
    goto: ActionChainActionCallback<NOODLChainActionBuiltInObject>
    videoChat: (
      action: NOODLChainActionBuiltInObject & {
        roomId: string
        accessToken: string
      },
    ) => Promise<void>
  }
}) {
  return async (pageName: string): Promise<NOODLPageObject> => {
    await cadl.initPage(pageName, [], options)
    return cadl?.root?.[pageName]
  }
}

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.getDataValues = getDataValues
  window.noodl = cadl
  window.noodlui = noodl
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
  const actions = enhanceActions(createActions({ page, store }))

  let { startPage } = await app.initialize()

  const preparePage = createPreparePage({
    builtIn: {
      goto: builtIn.goto,
      videoChat: onVideoChatBuiltIn(meeting.joinRoom),
    },
  })

  page.registerListener('onStart', (pageName) => {
    store.dispatch(setRequestStatus({ pageName, pending: true }))
  })

  page.registerListener(
    'onRootNodeInitialized',
    (rootNode: OnRootNodeInitializedArgs) => {
      const logMsg =
        `%c[src/index.ts][Page listener -- onRootNodeInitialized] ` +
        `Root node initialized`
      console.log(logMsg, `color:#95a5a6;font-weight:bold;`, rootNode)
    },
  )

  page.registerListener(
    'onBeforePageRender',
    async ({ pageName }: OnBeforePageRenderArgs) => {
      const pageState = store.getState().page
      if (pageName === pageState.currentPage) {
        // Load the page in the SDK
        const pageObject = await preparePage(pageName)
        // This will be passed into the page renderer
        const pageSnapshot: PageSnapshot = {
          name: pageName,
          object: pageObject,
        }
        // Initialize the noodl-ui client (parses components) if it
        // isn't already initialized
        if (!noodl.initialized) {
          const logMsg =
            `%c[src/index.ts][Page listener -- onBeforePageRender] ` +
            `Initializing noodl-ui client`
          console.log(logMsg, `color:#00b406;font-weight:bold;`, noodl)
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
        // Cache to rehydrate if they disconnect
        cachePage({ name: pageName })
        const previousPage = store.getState().page.previousPage
        const logMsg =
          `%c[index.ts][onBeforePageRender] ` +
          `${previousPage} --> ${pageName}`
        console.log(logMsg, `color:green;font-weight:bold;`, {
          previousPage,
          nextPage: pageSnapshot,
        })
        // Refresh the roots
        noodl
          // TODO: Leave root/page auto binded to the lib
          .setRoot(cadl.root)
          .setPage(pageSnapshot)
        // NOTE: not being used atm
        if (page.rootNode && page.rootNode.id !== pageName) {
          page.rootNode.id = pageName
        }
        return pageSnapshot
      } else {
        const logMsg =
          `%c[src/index.ts][onBeforePageRender] ` +
          `Avoided a duplicate navigate request`
        console.log(logMsg, `color:#ec0000;font-weight:bold;`)
      }
    },
  )

  page.registerListener(
    'onPageRendered',
    ({ pageName }: { pageName: string; components: NOODLComponentProps }) => {
      store.dispatch(setRequestStatus({ pageName, success: true }))
    },
  )

  page.registerListener(
    'onError',
    ({ error, pageName }: { error: Error; pageName: string }) => {
      console.error(error)
      window.alert(error.message)
      store.dispatch(
        setRequestStatus({ pageName, error: serializeError(error) }),
      )
    },
  )

  /**
   * Respnsible for triggering the page.navigate from state changes
   * Dispatch setPage to navigate
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
        const { snapshot } = (await page.navigate(currentPage)) || {}
        if (snapshot?.name === 'VideoChat') {
          // TODO: connect to meeting
        } else {
          //
        }
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
      // TODO: Find out why noodl is undefined here
      const logMsg = `%c[src/index.ts][viewport.onResize] noodl-ui client`
      console.log(logMsg, `color:#FF5722;font-weight:bold;`, {
        noodl,
        viewport,
      })
      noodl?.setViewport?.(newSizes)
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
      // startPage = previousPage
    }
  }

  store.dispatch(setPage(startPage))
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
