import _ from 'lodash'
import { createSelector } from '@reduxjs/toolkit'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from 'twilio-video'
import { Account } from '@aitmed/cadl'
import {
  Action,
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getByDataUX,
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
  identify,
  NOODLChainActionBuiltInObject,
  NOODLPageObject,
  NOODLComponentProps,
  Viewport,
} from 'noodl-ui'
import {
  CachedPageObject,
  DOMNode,
  PageModalId,
  PageSnapshot,
} from './app/types'
import { cadl, noodl } from './app/client'
import { createStoreObserver, isMobile, reduceEntries } from './utils/common'
import { forEachParticipant } from './utils/twilio'
import parser from './utils/parser'
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
import Meeting from './meeting'
import { noodlDomParserEvents } from './constants'
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
  window.getByDataUX = getByDataUX
  window.noodl = cadl
  window.noodlui = noodl
  window.streams = Meeting.getStreams()
  window.meeting = Meeting
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  log.green(vcode)
  log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const store = createStore()
  const observeStore = createStoreObserver(store)
  const dispatch = store.dispatch
  const viewport = new Viewport()
  const page = new Page()
  const app = new App({ store, viewport })
  const builtIn = createBuiltInActions({ page, store })
  const actions = enhanceActions(createActions({ store }))
  const streams = Meeting.getStreams()

  Meeting.initialize({ page, store, viewport })

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
              onBeforeResolve: lifeCycle.onBeforeResolve,
              onChainStart: lifeCycle.onChainStart,
              onChainEnd: lifeCycle.onChainEnd,
              onChainError: lifeCycle.onChainError,
              onChainAborted: lifeCycle.onChainAborted,
              onAfterResolve: lifeCycle.onAfterResolve,
            } as any)

          log.func('Listener - onBeforePageRender')
          log.green('Initialized noodl-ui client', noodl)
        }

        const previousPage = store.getState().page.previousPage
        log.func('Listener -- onBeforePageRender')
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
      // window.alert(error.message)
      // TODO - narrow the reasons down more
      dispatch(setRenderComponentsFailed(error))
    },
  )

  /**
   * Triggers the page.navigate from state changes.
   * Dispatch setPage to trigger this observer
   */
  observeStore(
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

  /** EXPERIMENTAL -- Custom routing */
  // TODO
  window.addEventListener('popstate', function onPopState(e) {
    log.func('addEventListener -- popstate')
    log.grey({ state: e.state, timestamp: e.timeStamp, type: e.type })
  })

  /**
   * Triggers opening/closing the modal if a matching modal id is set
   * Dispatch openModal/closeModal to open/close this modal
   */
  observeStore(
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

  /**
   * Callback invoked when Meeting.joinRoom receives the room instance.
   * Initiates participant tracks as well as register listeners for state changes on
   * the room instance.
   * @param { Room } room - Room instance
   */
  Meeting.onConnected = function (room) {
    /* -------------------------------------------------------
      ---- LISTEN FOR INCOMING MEDIA PUBLISH/SUBSCRIBE EVENTS
    -------------------------------------------------------- */
    // Disconnect using the room instance
    function disconnect() {
      room.disconnect?.()
    }
    // Callback runs when the LocalParticipant disconnects
    function disconnected() {
      const unpublishTracks = (
        trackPublication:
          | LocalVideoTrackPublication
          | LocalAudioTrackPublication,
      ) => {
        trackPublication?.track?.stop?.()
        trackPublication?.unpublish?.()
      }
      // Unpublish local tracks
      room.localParticipant.videoTracks.forEach(unpublishTracks)
      room.localParticipant.audioTracks.forEach(unpublishTracks)
      // Clean up listeners
      window.removeEventListener('beforeunload', disconnect)
      if (isMobile()) window.removeEventListener('pagehide', disconnect)
    }

    room.on('participantConnected', Meeting.addRemoteParticipant)
    room.on('participantDisconnected', Meeting.removeRemoteParticipant)
    room.once('disconnected', disconnected)

    window.addEventListener('beforeunload', disconnect)
    if (isMobile()) window.addEventListener('pagehide', disconnect)

    /* -------------------------------------------------------
      ---- INITIATING MEDIA TRACKS / STREAMS 
    -------------------------------------------------------- */
    // Local participant
    const localParticipant = room.localParticipant
    const selfStream = streams.getSelfStream()
    if (!selfStream.isSameParticipant(localParticipant)) {
      selfStream.setParticipant(localParticipant)
      if (selfStream.isSameParticipant(localParticipant)) {
        log.func('Meeting.onConnected')
        log.green(`Bound local participant to selfStream`, selfStream)
      }
    }
    // Remote participants
    forEachParticipant(room.participants, Meeting.addRemoteParticipant)
  }

  /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */
  function onCreateNode(node: DOMNode, props: NOODLComponentProps) {
    if (node) {
      // Dominant/main participant/speaker
      if (identify.stream.video.isMainStream(props)) {
        const mainStream = streams.getMainStream()
        if (!mainStream.isSameElement(node)) {
          mainStream.setElement(node)
          log.func('onCreateNode')
          log.green('Bound an element to mainStream', { mainStream, node })
        }
      }
      // Local participant
      else if (identify.stream.video.isSelfStream(props)) {
        const selfStream = streams.getSelfStream()
        if (!selfStream.isSameElement(node)) {
          selfStream.setElement(node)
          log.func('onCreateNode')
          log.green('Bound an element to selfStream', { selfStream, node })
        }
      }
      // Remote participants container
      else if (identify.stream.video.isSubStreamsContainer(props)) {
        if (streams.getSubStreamsContainer()?.container !== node) {
          streams.createSubStreamsContainer(node)
          log.func('onCreateNode')
          log.green(
            'Created subStream container',
            streams.getSubStreamsContainer(),
          )
        }
      }
      // Remote participant video element container (not the subStreams container)
      else if (identify.stream.video.isSubStream(props)) {
        const subStreamsContainer = streams.getSubStreamsContainer()
        if (subStreamsContainer) {
          const container = subStreamsContainer
          if (!container.elementExists(node)) {
            container.addElement(node)
          } else {
            log.func('onCreateNode')
            log.red(
              `Attempted to add an element as a sub stream but it ` +
                `already exists in the container`,
              { container, node, props },
            )
          }
        } else {
          log.func('onCreateNode')
          log.red(
            `Attempted to create a subStream but a container was not available`,
            {
              node,
              props,
              mainStream: streams.getMainStream(),
              selfStream: streams.getSelfStream(),
            },
          )
        }
      }
    }
  }

  if (
    !parser
      .getEventListeners(noodlDomParserEvents.onCreateNode)
      ?.includes(onCreateNode)
  ) {
    parser.on(noodlDomParserEvents.onCreateNode, onCreateNode)
  }

  /* -------------------------------------------------------
    ---- VIEWPORT / WINDOW SIZING
  -------------------------------------------------------- */
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

  /* -------------------------------------------------------
    ---- LOCAL STORAGE
  -------------------------------------------------------- */
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

/* -------------------------------------------------------
  ---- LOCAL STORAGE HELPERS FOR CACHED PAGES
-------------------------------------------------------- */
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
