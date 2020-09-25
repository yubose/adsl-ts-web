import _ from 'lodash'
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
  NOODLElement,
  PageModalId,
  PageSnapshot,
} from './app/types'
import { cadl, noodl } from './app/client'
import { isMobile, reduceEntries } from './utils/common'
import { forEachParticipant } from './utils/twilio'
import { createOnChangeFactory } from './utils/sdkHelpers'
import { modalIds, CACHED_PAGES } from './constants'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import createLifeCycles from './handlers/lifeCycles'
import Logger from './app/Logger'
import parser from './utils/parser'
import App from './App'
import Page from './Page'
import Meeting from './meeting'
import MeetingSubstreams from 'meeting/Substreams'
import { noodlDomParserEvents } from './constants'
import modalComponents from './components/modalComponents'
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
  // const vcode = await Account.requestVerificationCode('+1 8882465555')
  // const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  // log.green(vcode)
  // log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const viewport = new Viewport()
  const page = new Page()
  const app = new App({ getStatus: Account.getStatus, viewport })
  const builtIn = createBuiltInActions({ page, Account })
  const actions = enhanceActions(createActions({ page }))
  const lifeCycles = createLifeCycles()
  const streams = Meeting.getStreams()

  Meeting.initialize({ page, viewport })

  app.onAuthStatus = (status) => {
    log.func('app.onAuthStatus')
    log.grey(`Auth status changed: ${status}`)
  }

  let { startPage } = await app.initialize()

  const preparePage = createPreparePage({
    builtIn: {
      goto: builtIn.goto,
      videoChat: onVideoChatBuiltIn({ joinRoom: Meeting.join }),
    },
  })

  page.onStart = async (pageName) => {
    log.func('page.onStart').grey(`Rendering the DOM for page: "${pageName}"`)
  }

  page.onRootNodeInitializing = async () => {
    log.func('page.onRootNodeInitializing').grey('Initializing root node')
  }

  page.onRootNodeInitialized = async (rootNode) => {
    log.func('page.onRootNodeInitialized')
    log.green('Root node initialized', rootNode)
  }

  // TODO - onRootNodeInitializeError

  page.onBeforePageRender = async ({ pageName }) => {
    log.func('page.onBeforePageRender')
    log.grey('Rendering components')
    if (pageName === page.currentPage) {
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
        log.func('page.onBeforePageRender')
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
            ...lifeCycles,
          } as any)

        log.func('page.onBeforePageRender')
        log.green('Initialized noodl-ui client', noodl)
      }

      const previousPage = page.previousPage
      log.func('page.onBeforePageRender')
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
      log.func('page.onBeforePageRender')
      log.green('Avoided a duplicate navigate request')
    }
  }

  page.onPageRendered = async ({ pageName, components }) => {
    log.func('page.onPageRendered')
    log.green(`Done rendering DOM nodes for ${pageName}`)
    window.pcomponents = components
    // Cache to rehydrate if they disconnect
    // TODO
    cachePage(pageName)
    log.grey(`Cached page: "${pageName}"`)
  }

  page.onError = async ({ error }) => {
    console.error(error)
    log.func('page.onError').red(error.message, error)
    // window.alert(error.message)
    // TODO - narrow the reasons down more
  }

  /**
   * Triggers the page.navigate from state changes.
   * Call page.requestPageChange to trigger this observer
   */
  page.onPageRequest = ({ previous, current, requested: requestedPage }) => {
    console.groupCollapsed(
      `%c[page.onPageRequest] Requesting page change`,
      'color:#828282',
      { previous, current, requestedPage },
    )
    console.trace()
    console.groupEnd()
    if (requestedPage) {
      if (requestedPage === 'VideoChat') {
        if (Meeting.room?.state === 'connected') {
          // TODO - handle attaching to video streams
        }
      } else {
        //
      }
    }
    return true
  }

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
  page.onModalStateChange = (prevState, nextState) => {
    const { id, opened, ...rest } = nextState
    log.func('page.onModalStateChange')
    if (opened) {
      const modalId = modalIds[id as PageModalId]
      const modalComponent = modalComponents[modalId]
      if (modalComponent) {
        page.modal.open(id, modalComponent, { opened, ...rest })
        log.green('Modal opened', { prevState, nextState })
      } else {
        log.red(
          'Tried to open the modal component but the node was not available',
          { prevState, nextState, node: page.modal.node },
        )
      }
    } else {
      page.modal.close()
      log.green('Closed modal', { prevState, nextState })
    }
  }

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

  /**
   * Callback invoked when a new participant was added either as a mainStream
   * or into the subStreams collection
   * @param { RemoteParticipant } participant
   * @param { Stream } stream - mainStream or a subStream
   */
  Meeting.onAddRemoteParticipant = function (participant, stream) {
    log.func('Meeting.onAddRemoteParticipant')
    log.green(`Bound remote participant to ${stream.type}`, {
      participant,
      stream,
    })
    const isInSdk = _.some(
      cadl.root?.VideoChat?.listData?.participants || [],
      (p) => p.sid === participant.sid,
    )
    if (!isInSdk) {
      /**
       * Updates the participants list in the sdk. This will also force the value
       * to be an array if it's not already an array
       * @param { RemoteParticipant } participant
       */
      cadl.editDraft((draft: typeof cadl.root) => {
        const participants = Meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants || [],
        ).concat(participant)
        _.set(draft, 'VideoChat.listData.participants', participants)
      })

      log.func('Meeting.onAddRemoteParticipant')
      log.green('Updated SDK with new participant', {
        addedParticipant: participant,
        newParticipantsList: cadl.root?.VideoChat?.listData?.participants,
      })
    }
  }

  Meeting.onRemoveRemoteParticipant = function (participant, stream) {
    /**
     * Updates the participants list in the sdk. This will also force the value
     * to be an array if it's not already an array
     * @param { RemoteParticipant } participant
     */
    cadl.editDraft((draft: typeof cadl.root) => {
      _.set(
        draft.VideoChat.listData,
        'participants',
        Meeting.removeFalseyParticipants(
          _.filter(
            draft?.VideoChat?.listData?.participants || [],
            (p) => p !== participant,
          ),
        ),
      )
    })
    log.func('Meeting.onRemoveRemoteParticipant')
    log.green('Updated SDK with removal of participant', {
      newParticipantsList: cadl.root?.VideoChat?.listData?.participants,
      removedParticipant: participant,
    })
  }

  /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */
  function onCreateNode(node: NOODLElement, props: NOODLComponentProps) {
    if (node) {
      // Dominant/main participant/speaker
      if (identify.stream.video.isMainStream(props)) {
        const mainStream = streams.getMainStream()
        if (!mainStream.isSameElement(node)) {
          mainStream.setElement(node, { uxTag: 'mainStream' })
          log.func('onCreateNode')
          log.green('Bound an element to mainStream', { mainStream, node })
        }
      }
      // Local participant
      else if (identify.stream.video.isSelfStream(props)) {
        const selfStream = streams.getSelfStream()
        if (!selfStream.isSameElement(node)) {
          selfStream.setElement(node, { uxTag: 'selfStream' })
          log.func('onCreateNode')
          log.green('Bound an element to selfStream', { selfStream, node })
        }
      }
      // Remote participants container
      else if (identify.stream.video.isSubStreamsContainer(props)) {
        let subStreams = streams.getSubStreamsContainer()
        if (!subStreams) {
          subStreams = streams.createSubStreamsContainer(node, props)
          log.func('onCreateNode')
          log.green('Created subStreams container', subStreams)
        }
      }
      // Individual remote participant video element container
      else if (identify.stream.video.isSubStream(props)) {
        const container = streams.getSubStreamsContainer() as MeetingSubstreams
        if (container) {
          if (!container.elementExists(node)) {
            container.addToCollection({ node } as any)
            log.func('onCreateNode')
            log.green('Added an element to a subStream', node)
          } else {
            log.func('onCreateNode')
            log.red(
              `Attempted to add an element to a subStream but it ` +
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

  // THIS IS EXPERIMENTAL AND WILL BE REMOVED
  parser.createOnChangeFactory = createOnChangeFactory

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
        page.render(cadl?.root?.[page.currentPage]?.components)
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

  page.requestPageChange(startPage)
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
