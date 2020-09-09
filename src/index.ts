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
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  log.green(vcode)
  log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const store = createStore()
  const viewport = new Viewport()
  const page = new Page({ store })
  const meeting = new Meeting({ page, store, viewport })
  const app = new App({ store, viewport })
  const builtIn = createBuiltInActions({ page, store })
  const actions = enhanceActions(createActions({ page, store }))

  window.meeting = meeting

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
      log
        .func('Listener -- onRootNodeInitialized')
        .green('Root node initialized', rootNode)
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
          log
            .func('Listener -- onBeforePageRender')
            .grey('Initializing noodl-ui client', noodl)
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

          log.func('Listener - onBeforePageRender').green('Initialized', noodl)
        }
        // Cache to rehydrate if they disconnect
        cachePage({ name: pageName })
        log
          .func('Listener -- onBeforePageRender')
          .grey(`Cached page: "${pageName}"`)
        const previousPage = store.getState().page.previousPage
        log.grey(`${previousPage} --> ${pageName}`, {
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
        log
          .func('Listener - onBeforePageRender')
          .green('Avoided a duplicate navigate request')
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
      store.dispatch(setRequestStatus({ pageName, success: true }))
      window.pcomponents = components
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
      log
        .func('observeStore -- previousPage/currentPage')
        .grey('Received an update to previousPage/currentPage', {
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
      log
        .func('observeStore -- modal')
        .grey('Received an update to page modal', modalState)
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
      log.func().grey('Comparing cached page vs startPage', {
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
