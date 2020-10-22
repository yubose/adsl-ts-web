import _ from 'lodash'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from 'twilio-video'
import Logger from 'logsnap'
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
  IResolver,
  NOODLBuiltInObject,
  NOODLPageObject,
  NOODLComponentProps,
  Resolver,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { CachedPageObject, PageModalId, PageSnapshot } from './app/types'
import { forEachParticipant } from './utils/twilio'
import {
  callAll,
  forEachEntries,
  isMobile,
  reduceEntries,
} from './utils/common'
import { copyToClipboard, onSelectFile } from './utils/dom'
import { modalIds, CACHED_PAGES } from './constants'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import createLifeCycles from './handlers/lifeCycles'
import App from './App'
import Page from './Page'
import Meeting from './meeting'
import MeetingSubstreams from './meeting/Substreams'
import noodluidom from './app/noodl-ui-dom'
import './handlers/dom'
import './styles.css'

const log = Logger.create('src/index.ts')

/** TODO: Find out why I did this */
function enhanceActions(
  actions: ReturnType<typeof createActions>,
): ReturnType<typeof createActions> {
  return reduceEntries(
    actions,
    (acc, { key, value: fn }) => {
      acc[key] = callAll(
        (
          action: Action<any>,
          handlerOptions: ActionChainActionCallbackOptions<any>,
        ) => {
          if (action.original.dataObject === 'BLOB') {
            // Components with contentType: "file" need a blob/file object
            // so we inject logic for the file input window to open for the user
            // to select a file from their file system before proceeding
            // the action chain
            try {
              Promise.resolve(onSelectFile()).then(({ e, files }) =>
                fn(action, handlerOptions, { e, file: files?.[0] }),
              )
            } catch (err) {
              window.alert(err.message)
              console.error(err)
            }
          } else {
            /**
             * TEMP workaround until we write an official solution
             * Currently popUp components can have stale data values. Here's an injection to
             * re-query the data values
             */
            if (
              ['popUp', 'popUpDismiss'].includes(action.original.actionType)
            ) {
              const dataValues = getDataValues()
            }
          }
        },
        fn,
      )
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
    goto: ActionChainActionCallback<NOODLBuiltInObject>
    videoChat: (
      action: NOODLBuiltInObject & {
        roomId: string
        accessToken: string
      },
    ) => Promise<void>
  }
}) {
  return async (pageName: string): Promise<NOODLPageObject> => {
    const { default: noodl } = await import('app/noodl')
    await noodl.initPage(pageName, [], options)
    log.func('createPreparePage')
    log.grey(`Ran noodl.initPage on page "${pageName}"`)
    return noodl.root[pageName]
  }
}

window.addEventListener('load', async () => {
  // Experimenting dynamic import (code splitting)
  // const { Account } = await import('@aitmed/cadl')
  const { default: noodl } = await import('app/noodl')
  const { default: noodlui } = await import('app/noodl-ui')

  window.ecos_env = process.env.ECOS_ENV
  window.env = process.env.NODE_ENV
  window.ecos_dev_paths = process.env.USE_DEV_PATHS
  window.getDataValues = getDataValues
  window.getByDataUX = getByDataUX
  window.noodl = noodl
  window.noodlui = noodlui
  window.noodluidom = noodluidom
  window.streams = Meeting.getStreams()
  window.meeting = Meeting
  window.cp = copyToClipboard
  // Auto login for the time being
  // const vcode = await Account.requestVerificationCode('+1 8882465555')
  // const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  // log.magenta(vcode)
  // log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const viewport = new Viewport()
  const page = new Page()
  const app = new App({ viewport })
  const builtIn = createBuiltInActions({ page, noodluidom })
  const actions = createActions({ page })
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
    page.pageStack.push(pageName)
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
    log.grey('Rendering components', {
      previousPage: page.previousPage,
      currentPage: page.currentPage,
      requestedPage: pageName,
    })
    if (Meeting.room?.state === 'connected') Meeting.leave()
    if (pageName !== page.currentPage) {
      // Load the page in the SDK

      const pageObject = await preparePage(pageName)
      log.orange(`Received pageObject`, {
        previousPage: page.previousPage,
        currentPage: page.currentPage,
        requestedPage: pageName,
        pageName,
        pageObject,
      })
      // This will be passed into the page renderer
      const pageSnapshot: PageSnapshot = {
        name: pageName,
        object: pageObject,
      }
      // Initialize the noodl-ui client (parses components) if it
      // isn't already initialized
      if (!noodlui.initialized) {
        log.func('page.onBeforePageRender')
        log.grey('Initializing noodl-ui client', noodl)
        viewport.width = window.innerWidth
        viewport.height = window.innerHeight
        noodlui
          .init({ viewport })
          .setAssetsUrl(noodl?.assetsUrl || '')
          .setPage(pageName)
          .setRoot(noodl.root)
          .use(viewport)
          .use(
            _.reduce(
              [
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
              ],
              (acc, r: ResolverFn) => acc.concat(new Resolver().setResolver(r)),
              [] as IResolver[],
            ),
          )
          .on('builtIn', {
            checkField: builtIn.checkField,
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
            toggleFlag: builtIn.toggleFlag,
            toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
          })

        forEachEntries(actions, (key, value) => noodlui.on(key, value))
        forEachEntries(lifeCycles, (key, value) => noodlui.on(key, value))

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
      noodlui.setRoot(noodl.root).setPage(pageSnapshot)
      log.grey(`Set root + page obj after receiving page object`, {
        previousPage: page.previousPage,
        currentPage: page.currentPage,
        requestedPage: pageName,
        pageName,
        pageObject,
      })
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
  // NOTE - This is not being used atm
  page.onModalStateChange = (prevState, nextState) => {
    const { id, opened, ...rest } = nextState
    log.func('page.onModalStateChange')
    if (opened) {
      const modalId = modalIds[id as PageModalId]
      // const modalComponent = modalComponents[modalId]
      const modalComponent = undefined
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
    async function disconnected() {
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
      noodl.root?.VideoChat?.listData?.participants || [],
      (p) => p.sid === participant.sid,
    )
    if (!isInSdk) {
      /**
       * Updates the participants list in the sdk. This will also force the value
       * to be an array if it's not already an array
       * @param { RemoteParticipant } participant
       */
      noodl.editDraft((draft: typeof noodl.root) => {
        const participants = Meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants || [],
        ).concat(participant)
        _.set(draft, 'VideoChat.listData.participants', participants)
      })

      log.func('Meeting.onAddRemoteParticipant')
      log.green('Updated SDK with new participant', {
        addedParticipant: participant,
        newParticipantsList: noodl.root?.VideoChat?.listData?.participants,
      })
    }
  }

  Meeting.onRemoveRemoteParticipant = function (participant, stream) {
    /**
     * Updates the participants list in the sdk. This will also force the value
     * to be an array if it's not already an array
     * @param { RemoteParticipant } participant
     */
    noodl.editDraft((draft: typeof noodl.root) => {
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
      newParticipantsList: noodl.root?.VideoChat?.listData?.participants,
      removedParticipant: participant,
    })
  }

  /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */

  noodluidom.on('all', function onCreateNode(
    node: NOODLDOMElement | null,
    props,
  ) {
    if (node) {
      // Dominant/main participant/speaker
      if (identify.stream.video.isMainStream(props.toJS())) {
        const mainStream = streams.getMainStream()
        if (!mainStream.isSameElement(node)) {
          mainStream.setElement(node, { uxTag: 'mainStream' })
          log.func('onCreateNode')
          log.green('Bound an element to mainStream', { mainStream, node })
        }
      }
      // Local participant
      else if (identify.stream.video.isSelfStream(props.toJS())) {
        const selfStream = streams.getSelfStream()
        if (!selfStream.isSameElement(node)) {
          selfStream.setElement(node, { uxTag: 'selfStream' })
          log.func('onCreateNode')
          log.green('Bound an element to selfStream', { selfStream, node })
        }
      }
      // Remote participants container
      else if (identify.stream.video.isSubStreamsContainer(props.toJS())) {
        let subStreams = streams.getSubStreamsContainer()
        if (!subStreams) {
          subStreams = streams.createSubStreamsContainer(node, props.toJS())
          log.func('onCreateNode')
          log.green('Created subStreams container', subStreams)
        }
      }
      // Individual remote participant video element container
      else if (identify.stream.video.isSubStream(props.toJS())) {
        const subStreams = streams.getSubStreamsContainer() as MeetingSubstreams
        if (subStreams) {
          if (!subStreams.elementExists(node)) {
            subStreams.create({ node } as any)
          } else {
            log.func('onCreateNode')
            log.red(
              `Attempted to add an element to a subStream but it ` +
                `already exists in the subStreams container`,
              { subStreams, node, props },
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
  })

  /* -------------------------------------------------------
    ---- VIEWPORT / WINDOW SIZING
  -------------------------------------------------------- */
  // Register the onresize listener once, if it isn't already registered
  if (viewport.onResize === undefined) {
    /**
     * This manages viewport aspect ratios for the SDK whenever it changes.
     * This affects the endpoints that the SDK uses to load pages
     */
    /**
     * The binary Great Common Divisor calculator (fastest performance)
     * https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio
     * @param { number } u - Upper
     * @param { number } v - Lower
     */
    function getGCD(u: number, v: number): any {
      if (u === v) return u
      if (u === 0) return v
      if (v === 0) return u
      if (~u & 1)
        if (v & 1) return getGCD(u >> 1, v)
        else return getGCD(u >> 1, v >> 1) << 1
      if (~v & 1) return getGCD(u, v >> 1)
      if (u > v) return getGCD((u - v) >> 1, v)
      return getGCD((v - u) >> 1, u)
    }

    function getSizes(w: number, h: number) {
      var d = getGCD(w, h)
      return [w / d, h / d]
    }

    viewport.onResize = ({ width, height, previousWidth, previousHeight }) => {
      if (width !== previousWidth || height !== previousHeight) {
        log.grey('Updating aspectRatio because viewport changed')
        const [newWidth, newHeight] = getSizes(width, height)
        const aspectRatio = newWidth / newHeight
        noodl.aspectRatio = aspectRatio
        viewport.width = width
        viewport.height = height
        if (page.rootNode) {
          page.rootNode.style.width = `${width}px`
          page.rootNode.style.height = `${height}px`
          page.render(noodl?.root?.[page.currentPage]?.components)
        } else {
          // TODO
        }
      }
    }
  }

  /* -------------------------------------------------------
    ---- LOCAL STORAGE
  -------------------------------------------------------- */
  // Override the start page if they were on a previous page
  let cachedPages = getCachedPages()
  let cachedPage = cachedPages[0]
  if (cachedPages?.length) {
    if (cachedPage?.name && cachedPage.name !== startPage) {
      startPage = cachedPage.name
    }
    // // Populate the previous/currentPage in page state as well
    // cachedPages = cachedPages.slice(1)
    // try {
    //   let pg: string
    //   while (cachedPages.length) {
    //     pg = cachedPages.shift()?.name || ''
    //     if (pg && pg !== page.currentPage && pg !== page.previousPage) {
    //       page.previousPage =
    //       log.green(`Updated previous page: ${page.previousPage}`)
    //       break
    //     }
    //   }
    // } catch (error) {
    //   console.error(error)
    // }
  }

  await page.requestPageChange(startPage)
})

/* -------------------------------------------------------
  ---- LOCAL STORAGE HELPERS FOR CACHED PAGES
-------------------------------------------------------- */
/** Adds the current page name to the end in the list of cached pages */
function cachePage(name: string) {
  const cacheObj = { name } as CachedPageObject
  const prevCache = getCachedPages()
  if (prevCache[0]?.name === name) return
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
