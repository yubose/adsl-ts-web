import _ from 'lodash'
import { createSelector } from '@reduxjs/toolkit'
import { Account } from '@aitmed/cadl'
import {
  Action,
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
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
import { CachedPageObject, PageModalId, PageSnapshot } from './app/types'
import { cadl, noodl } from './app/client'
import { observeStore, reduceEntries } from './utils/common'
import {
  setPage,
  setInitiatingPage,
  setInitializingRootNode,
  setInitializedRootNode,
  setInitializeRootNodeFailed,
  setRenderingComponents,
  setRenderedComponents,
  setRenderComponentsFailed,
  setPageCached,
  setReceivedSnapshot,
} from './features/page'
import { modalIds, CACHED_PAGES } from './constants'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import createStore from './app/store'
import Logger from './app/Logger'
import App from './App'
import Page from './Page'
import Meeting from './Meeting'
import modalComponents from './components/modalComponents'
import * as lifeCycle from './handlers/lifeCycles'
import './styles.css'

const log = Logger.create('src/index.ts')

function enhanceActions(actions: ReturnType<typeof createActions>) {
  return reduceEntries(
    actions,
    (acc, { key, value: fn }) => {
      acc[key] = (
        action: Action<any>,
        handlerOptions: ActionChainActionCallbackOptions<any>,
      ) => fn(action, handlerOptions)
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
    log
      .func('createPreparePage')
      .grey(`Ran cadl.initPage on page "${pageName}"`)
    return cadl?.root?.[pageName]
  }
}

window.addEventListener('load', async () => {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.getDataValues = getDataValues
  window.noodl = cadl
  window.noodlui = noodl
  window.getVideoChatElements = Meeting.getVideoChatElements
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  log.green(vcode)
  log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const store = createStore()
  const dispatch = store.dispatch
  const viewport = new Viewport()
  const page = new Page({ store })
  const app = new App({ store, viewport })
  const builtIn = createBuiltInActions({ page, store })
  const actions = enhanceActions(createActions({ page, store }))

  Meeting.initialize({ page, store, viewport })

  window.meeting = Meeting

  let { startPage } = await app.initialize()

  const preparePage = createPreparePage({
    builtIn: {
      goto: builtIn.goto,
      videoChat: onVideoChatBuiltIn(Meeting.join),
    },
  })

  page.registerListener('onStart', (pageName) => {
    dispatch(setInitiatingPage())
  })

  page.registerListener('onRootNodeInitializing', () => {
    dispatch(setInitializingRootNode())
    log.func('Listener -- onRootNodeInitializing')
    log.grey('Initializing root node')
  })

  // TODO - onRootNodeInitializeError

  page.registerListener('onRootNodeInitialized', (rootNode: HTMLDivElement) => {
    dispatch(setInitializedRootNode())
    log.func('Listener -- onRootNodeInitialized')
    log.green('Root node initialized', rootNode)
  })

  page.registerListener(
    'onBeforePageRender',
    async ({ pageName }: { pageName: string; rootNode: HTMLDivElement }) => {
      dispatch(setRenderingComponents())
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
          log.func('Listener -- onBeforePageRender')
          log.grey('Initializing noodl-ui client', noodl)
          noodl
            .init({ viewport })
            .setAssetsUrl(cadl.assetsUrl || '')
            .setPage(pageSnapshot)
            .setRoot(cadl.root)
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

          log.func('Listener - onBeforePageRender')
          log.green('Initialized noodl-ui client', noodl)
        }

        log.func('Listener -- onBeforePageRender')
        const previousPage = store.getState().page.previousPage
        log.grey(`${previousPage} --> ${pageName}`, {
          previousPage,
          nextPage: pageSnapshot,
        })
        // Refresh the roots
        // TODO - Leave root/page auto binded to the lib
        noodl.setRoot(cadl.root).setPage(pageSnapshot)
        // NOTE: not being used atm
        if (page.rootNode && page.rootNode.id !== pageName) {
          page.rootNode.id = pageName
        }
        return pageSnapshot
      } else {
        log.func('Listener - onBeforePageRender')
        log.green('Avoided a duplicate navigate request')
      }
    },
  )

  page.registerListener(
    'onPageRendered',
    ({
      pageName,
      components,
    }: {
      pageName: string
      components: NOODLComponentProps[]
    }) => {
      dispatch(setRenderedComponents())
      log.func('onPageRendered')
      log.green(`Done rendering DOM nodes for ${pageName}`)
      window.pcomponents = components
      // Cache to rehydrate if they disconnect
      // TODO
      cachePage(pageName)
      dispatch(setPageCached())
      log.grey(`Cached page: "${pageName}"`)
    },
  )

  page.registerListener(
    'onError',
    ({ error, pageName }: { error: Error; pageName: string }) => {
      console.error(error)
      window.alert(error.message)
      // TODO - narrow the reasons down more
      dispatch(setRenderComponentsFailed(error))
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
      log.func('observeStore -- state.page[previousPage/currentPage]')
      log.grey('', { previousPage, nextPage: currentPage })
      if (currentPage) {
        const { snapshot } = (await page.navigate(currentPage)) || {}
        dispatch(setReceivedSnapshot())
        if (snapshot?.name === 'VideoChat') {
          if (Meeting.room?.state === 'connected') {
            // TODO - handle attaching to video streams
          }
        } else {
          //
        }
      }
    },
  )

  /** Starts the video chat streams as soon as the page is ready */
  observeStore(
    store,
    createSelector(
      (state) => state.page.currentPage,
      (state) => state.page.renderState.snapshot,
      (currentPage, snapshotStatus) => ({ currentPage, snapshotStatus }),
    ),
    ({ currentPage, snapshotStatus }) => {
      if (snapshotStatus === 'received') {
        if (currentPage === 'VideoChat') {
          if (Meeting.room.state === 'connected') {
            log.func('observeStore -- currentPage/renderState.status')
            log.grey('Initializing media tracks')
          }
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
      if (opened) {
        const modalId = modalIds[id as PageModalId]
        const modalComponent = modalComponents[modalId]
        if (modalComponent) {
          page.modal.open(id, modalComponent, { opened, ...rest })
        } else {
          log.func('observeStore -- state.page.modal')
          log.red(
            'Tried to open the modal component but the node was not available',
            modalState,
          )
        }
      } else {
        page.modal.close()
      }
    },
  )

  // Register the onresize listener once, if it isn't already registered
  if (viewport.onResize === undefined) {
    viewport.onResize = (newSizes) => {
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

  // Override the start page if they were on a previous page
  const cachedPages = getCachedPages()
  if (cachedPages?.length) {
    const cachedPage = cachedPages[0]?.name
    // Compare the two pages to make an informed decision before setting it
    if (cachedPage) {
      log.func().grey('Comparing cached page vs startPage', {
        startPage,
        cachedPage,
      })
      if (cachedPage !== startPage) {
        startPage = cachedPage
      }
    }
  }

  store.dispatch(setPage(startPage))
})

/** Adds the current page name to the end in the list of cached pages */
function cachePage(name: string) {
  const cacheObj = { name } as CachedPageObject
  const prevCache = getCachedPages()
  const cache = [cacheObj, ...prevCache]
  if (cache.length >= 4) cache.pop()
  cacheObj.timestamp = Date.now()
  setCachedPages(cache)
}

/** Retrieves a list of cached pages */
function getCachedPages(): CachedPageObject[] {
  let result: CachedPageObject[] = []
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
function setCachedPages(cache: CachedPageObject[]) {
  window.localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
}
