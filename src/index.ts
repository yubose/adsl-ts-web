import set from 'lodash/set'
import some from 'lodash/some'
import axios from 'axios'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from 'twilio-video'
import Logger from 'logsnap'
import { getByDataUX } from 'noodl-ui-dom'
import {
  ActionChainActionCallback,
  BuiltInObject,
  ComponentObject,
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getPlugins,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  getDataValues,
  identify,
  List,
  Page as NOODLUIPage,
  PageObject,
  Resolver,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import { CachedPageObject, PageModalId } from './app/types'
import { forEachParticipant } from './utils/twilio'
import { isMobile } from './utils/common'
import { copyToClipboard } from './utils/dom'
import { modalIds, CACHED_PAGES } from './constants'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import createViewportHandler from './handlers/viewport'
import App from './App'
import Page from './Page'
import Meeting from './meeting'
import MeetingSubstreams from './meeting/Substreams'
import './styles.css'
import { root } from 'utils/test-utils'

const log = Logger.create('src/index.ts')

/**
 * A factory func that returns a func that prepares the next page on the SDK
 * @param { object } options - Options to feed into the SDK's initPage func
 */
function createPreparePage(options: {
  builtIn: {
    checkField: any
    goto: ActionChainActionCallback<BuiltInObject>
    videoChat: (
      action: BuiltInObject & {
        roomId: string
        accessToken: string
      },
    ) => Promise<void>
  }
}) {
  return (
    pageName: string,
    pageModifiers: { reload?: boolean } = {},
  ): Promise<PageObject> => {
    return new Promise((resolve, reject) => {
      return import('app/noodl')
        .then(({ default: noodl }) => {
          return noodl.initPage(pageName, [], {
            ...options,
            ...pageModifiers,
            done() {
              log.func('createPreparePage')
              log.grey(`Ran noodl.initPage on page "${pageName}"`, {
                pageName,
                pageModifiers,
                pageObject: noodl.root[pageName],
                ...options,
              })
              resolve(noodl.root[pageName])
            },
          })
        })
        .catch(reject)
    })
  }
}

window.addEventListener('load', async () => {
  const { Account } = await import('@aitmed/cadl')
  const { default: noodl } = await import('app/noodl')
  const { default: noodlui } = await import('app/noodl-ui')
  const { listen: registerNOODLDOMListeners } = await import('app/noodl-ui-dom')

  // Auto login for the time being
  // const vcode = await Account.requestVerificationCode('+1 8882465555')
  // const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  // log.magenta(vcode)
  // log.green('Profile', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const {
    computeViewportSize,
    on: listenOnViewport,
    setMinAspectRatio,
    setMaxAspectRatio,
    viewport,
    updateViewport,
  } = createViewportHandler(new Viewport())
  const page = new Page()
  const app = new App({ viewport })
  const builtIn = createBuiltInActions({ page })
  const actions = createActions({ page })
  const streams = Meeting.getStreams()
  const noodluidom = (window.noodluidom = registerNOODLDOMListeners({
    noodlui,
  }))

  window.build = process.env.BUILD
  window.noodlui = noodlui
  // @ts-expect-error
  window.componentCache = noodlui.componentCache.bind(noodlui)
  window.app = {
    build: process.env.BUILD,
    client: {
      app,
      page,
      viewport,
      Meeting,
      Logger,
    },
    noodl,
    noodlui,
    util: {
      Account,
      actions,
      cp: copyToClipboard,
      getDataValues,
      getByDataUX,
    },
  }
  window.noodl = noodl
  window.cp = copyToClipboard

  Meeting.initialize({ page, viewport })

  app.onAuthStatus = (status) => {
    log.func('app.onAuthStatus')
    log.grey(`Auth status changed: ${status}`)
  }

  let { startPage } = await app.initialize()

  const preparePage = createPreparePage({
    builtIn: {
      checkField: builtIn.checkField,
      goto: builtIn.goto,
      videoChat: onVideoChatBuiltIn({ joinRoom: Meeting.join }),
    },
  })

  // Initialize viewport dimensions
  {
    if (noodl.getConfig()?.viewWidthHeightRatio) {
      const { min, max } = noodl.getConfig()?.viewWidthHeightRatio
      setMinAspectRatio(min)
      setMaxAspectRatio(max)
    }

    const initialViewportSize = computeViewportSize({
      width: window.innerWidth,
      height: window.innerHeight,
      previousWidth: window.innerWidth,
      previousHeight: window.innerHeight,
    })

    console.log('initialViewportSize', initialViewportSize)
    updateViewport({
      width: initialViewportSize.width,
      height: initialViewportSize.height,
    })

    noodl.aspectRatio = initialViewportSize.aspectRatio
    document.body.style.width = `${initialViewportSize.width}px`
    document.body.style.height = `${initialViewportSize.height}px`

    if (page.rootNode) {
      page.rootNode.style.width = `${initialViewportSize.width}px`
      page.rootNode.style.height = `${initialViewportSize.height}px`
      page.rootNode.style.overflowX = 'auto'
    }

    listenOnViewport(
      'resize',
      ({
        aspectRatio,
        width,
        height,
        min,
        max,
      }: ReturnType<typeof computeViewportSize>) => {
        log.func('listenOnViewport')
        log.grey('Updating aspectRatio because viewport changed', { min, max })

        noodl.aspectRatio = aspectRatio

        document.body.style.width = `${width}px`
        document.body.style.height = `${height}px`

        if (page.rootNode) {
          page.rootNode.style.width = `${width}px`
          page.rootNode.style.height = `${height}px`
        }

        if (aspectRatio < min) {
          if (page.rootNode) page.rootNode.style.overflowX = 'auto'
          document.body.style.overflowX = 'auto'
          document.body.style.position = 'absolute'
        } else if (aspectRatio > max) {
          if (page.rootNode) page.rootNode.style.overflowX = 'hidden'
          document.body.style.width = `${max * height}px`
          document.body.style.overflowX = 'hidden'
          document.body.style.position = 'relative'
        }
        page.render(noodl?.root?.[page.currentPage]?.components)
      },
    )
  }

  page.onStart = async (pageName) => {
    log.func('page.onStart').grey(`Rendering the DOM for page: "${pageName}"`)
  }

  page.onRootNodeInitialized = async (rootNode) => {
    log.func('page.onRootNodeInitialized')
    log.green('Root node initialized', rootNode)
  }

  // TODO - onRootNodeInitializeError

  /**
   * Called right before rendering the components to the DOM. Put clean up
   * logic in here
   */
  page.onBeforePageRender = async (options) => {
    const { pageName, pageModifiers } = options
    log.func('page.onBeforePageRender')

    log.grey(
      `Rendering components for page "${pageName}". Running cleanup operations now...`,
      {
        previous: page.previousPage,
        current: page.currentPage,
        requested: pageName,
        pageModifiers,
      },
    )

    if (/videochat/i.test(page.currentPage) && !/videochat/i.test(pageName)) {
      log.grey(
        'You are navigating away from the video chat page. ' +
          'Running cleanup operations now...',
        streams,
      )

      Meeting.leave()
      log.grey(`Disconnected from room`, Meeting.room)

      const mainStream = streams.getMainStream()
      const selfStream = streams.getSelfStream()
      // selfStream.unpublish()
      const subStreamsContainer = streams.getSubStreamsContainer()
      const subStreams = subStreamsContainer?.getSubstreamsCollection()

      if (mainStream.getElement()) {
        log.grey('Wiping mainStream state', mainStream.reset())
      }

      if (selfStream.getElement()) {
        log.grey('Wiping selfStream state', selfStream.reset())
      }

      if (subStreamsContainer?.length) {
        log.grey(
          `Wiping subStreams container's state`,
          subStreamsContainer.reset(),
        )
      }

      if (Array.isArray(subStreams)) {
        subStreams.forEach((subStream) => {
          if (subStream.getElement()) {
            log.grey("Wiping a subStream's state", subStream.reset())
            subStreamsContainer?.removeSubStream(subStream)
          }
        })
      }
    }

    if (pageName !== page.currentPage || pageModifiers?.force) {
      // Load the page in the SDK
      const pageObject = await preparePage(pageName, pageModifiers)
      // This will be passed into the page renderer
      const pageSnapshot: { name: string; object: NOODLUIPage } = {
        name: pageName,
        object: pageObject,
      }
      // Initialize the noodl-ui client (parses components) if it
      // isn't already initialized
      if (!noodlui.initialized) {
        log.func('page.onBeforePageRender')
        log.grey('Initializing noodl-ui client', { noodl, actions })

        const fetch = async (url: string) =>
          axios.get(url).then(({ data }) => data)
        // .catch((err) => console.error(`[${err.name}]: ${err.message}`))
        const config = noodl.getConfig()
        const plugins = [
          { type: 'pluginHead', path: 'googleTM.js' },
          // { type: 'bodyTopPplugin', path: 'googleTMBodyTop.html' },
        ] as ComponentObject[]
        if (config.headPlugin) {
          plugins.push(
            noodlui.createPluginObject({
              type: 'pluginHead',
              path: config.headPlugin,
            }),
          )
        }
        if (config.bodyTopPplugin) {
          plugins.push(
            noodlui.createPluginObject({
              type: 'pluginBodyTop',
              path: config.bodyTopPplugin,
            }),
          )
        }
        if (config.bodyTailPplugin) {
          plugins.push(
            noodlui.createPluginObject({
              type: 'pluginBodyTail',
              path: config.bodyTailPplugin,
            }),
          )
        }
        noodlui
          .init({
            actionsContext: { noodl, noodluidom } as any,
            viewport,
          })
          .setPage(pageName)
          .use(viewport)
          .use({
            fetch,
            getAssetsUrl: () => noodl.assetsUrl,
            getRoot: () => noodl.root,
            plugins,
          })
          .use(
            [
              getElementType,
              getTransformedAliases,
              getReferences,
              getAlignAttrs,
              getBorderAttrs,
              getColors,
              getFontAttrs,
              getPlugins,
              getPosition,
              getSizes,
              getStylesByElementType,
              getTransformedStyleAliases,
              getCustomDataAttrs,
              getEventHandlers,
            ].reduce(
              (acc, r: ResolverFn) => acc.concat(new Resolver().setResolver(r)),
              [] as Resolver[],
            ),
          )
          .use(
            Object.entries(actions).reduce(
              (arr, [actionType, actions]) =>
                arr.concat(actions.map((a) => ({ ...a, actionType }))),
              [] as any[],
            ),
          )
          .use(
            // @ts-expect-error
            Object.entries({
              checkField: builtIn.checkField,
              checkUsernamePassword: builtIn.checkUsernamePassword,
              goBack: builtIn.goBack,
              lockApplication: builtIn.lockApplication,
              logOutOfApplication: builtIn.logOutOfApplication,
              logout: builtIn.logout,
              redraw: builtIn.redraw,
              toggleCameraOnOff: builtIn.toggleCameraOnOff,
              toggleFlag: builtIn.toggleFlag,
              toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
            }).map(([funcName, fn]) => ({ funcName, fn })),
          )

        log.func('page.onBeforePageRender')
        log.green('Initialized noodl-ui client', noodl)
      }

      const previousPage = page.previousPage
      log.func('page.onBeforePageRender')
      log.grey(`${previousPage} --> ${pageName}`, {
        previousPage,
        nextPage: pageSnapshot,
      })
      // Refresh the root
      // TODO - Leave root/page auto binded to the lib
      noodlui.setPage(pageSnapshot.name)
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
    log.func('page.onError')
    log.red(error.message, error)
    // window.alert(error.message)
    // TODO - narrow the reasons down more
  }

  /**
   * Triggers the page.navigate from state changes.
   * Call page.requestPageChange to trigger this observer
   */
  page.onPageRequest = ({
    previous,
    current,
    requested: requestedPage,
    modifiers,
  }) => {
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
    // Always return true for now
    return true
  }

  /** EXPERIMENTAL -- Custom routing */
  // TODO
  window.addEventListener('popstate', async function onPopState(e) {
    var pg
    var pageUrlArr = page.pageUrl.split('-')

    if (pageUrlArr.length > 1) {
      pageUrlArr.pop()
      while (
        pageUrlArr[pageUrlArr.length - 1].endsWith('MenuBar') &&
        pageUrlArr.length > 1
      ) {
        pageUrlArr.pop()
      }
      if (pageUrlArr.length > 1) {
        pg = pageUrlArr[pageUrlArr.length - 1]
        page.pageUrl = pageUrlArr.join('-')
      } else if (pageUrlArr.length === 1) {
        if (pageUrlArr[0].endsWith('MenuBar')) {
          page.pageUrl = 'index.html?'
          pg = noodl?.cadlEndpoint?.startPage
        } else {
          pg = pageUrlArr[0].split('?')[1]
          page.pageUrl = pageUrlArr[0]
        }
      }
    } else {
      page.pageUrl = 'index.html?'
      pg = noodl?.cadlEndpoint?.startPage
    }
    let pageModifiers = undefined
    if (typeof page.requestingPageModifiers.reload === 'boolean') {
      pageModifiers = {
        reload: page.requestingPageModifiers.reload,
      }
      delete page.requestingPageModifiers.reload
    }
    await page.requestPageChange(pg, pageModifiers, true)
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
    const isInSdk = some(
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
        set(draft, 'VideoChat.listData.participants', participants)
      })

      log.func('Meeting.onAddRemoteParticipant')
      log.green('Updated SDK with new participant', {
        addedParticipant: participant,
        newParticipantsList: noodl.root?.VideoChat?.listData?.participants,
      })
    }
    if (Meeting.getWaitingMessageElement()) {
      Meeting.getWaitingMessageElement().style.visibility = 'hidden'
    }
  }

  Meeting.onRemoveRemoteParticipant = function (participant, stream) {
    /**
     * Updates the participants list in the sdk. This will also force the value
     * to be an array if it's not already an array
     * @param { RemoteParticipant } participant
     */
    noodl.editDraft((draft: typeof noodl.root) => {
      set(
        draft.VideoChat.listData,
        'participants',
        Meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants ||
            [].filter((p) => p !== participant),
        ),
      )
    })
    log.func('Meeting.onRemoveRemoteParticipant')
    log.green('Updated SDK with removal of participant', {
      newParticipantsList: noodl.root?.VideoChat?.listData?.participants,
      removedParticipant: participant,
    })
    if (!Meeting.room.participants.size) {
      if (Meeting.getWaitingMessageElement()) {
        Meeting.getWaitingMessageElement().style.visibility = 'visible'
      }
    }
  }

  /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */

  noodluidom.register({
    name: 'meeting',
    cond: (node: any, component: any) => !!(node && component),
    resolve(node, component) {
      // Dominant/main participant/speaker
      if (identify.stream.video.isMainStream(component.toJS())) {
        const mainStream = streams.getMainStream()
        if (!mainStream.isSameElement(node)) {
          mainStream.setElement(node, { uxTag: 'mainStream' })
          log.func('onCreateNode')
          log.green('Bound an element to mainStream', { mainStream, node })
        }
      }
      // Local participant
      else if (identify.stream.video.isSelfStream(component.toJS())) {
        const selfStream = streams.getSelfStream()
        if (!selfStream.isSameElement(node)) {
          selfStream.setElement(node, { uxTag: 'selfStream' })
          log.func('onCreateNode')
          log.green('Bound an element to selfStream', { selfStream, node })
        }
      }
      // Remote participants container
      else if (
        /(vidoeSubStream|videoSubStream)/i.test(
          component.get('contentType') || '',
        )
      ) {
        let subStreams = streams.getSubStreamsContainer()
        if (!subStreams) {
          subStreams = streams.createSubStreamsContainer(node, {
            blueprint: component.getBlueprint(),
            resolver: noodlui.resolveComponents.bind(noodlui),
          })
          log.func('onCreateNode')
          log.green('Created subStreams container', subStreams)
        } else {
          // If an existing subStreams container is already existent in memory, re-initiate
          // the DOM node and blueprint since it was reset from a previous cleanup
          log.red(`BLUEPRINT`, (component as List).blueprint)
          subStreams.container = node
          subStreams.blueprint = component.getBlueprint()
          subStreams.resolver = noodlui.resolveComponents.bind(noodlui)
        }
      }
      // Individual remote participant video element container
      else if (identify.stream.video.isSubStream(component.toJS())) {
        const subStreams = streams.getSubStreamsContainer() as MeetingSubstreams
        if (subStreams) {
          if (!subStreams.elementExists(node)) {
            // subStreams.create({ node } as any)
            // log.grey(
            //   `Added a subStreams stream with only a DOM node but not a participant`,
            //   {
            //     node,
            //     component,
            //     subStreams,
            //   },
            // )
          } else {
            log.func('onCreateNode')
            log.red(
              `Attempted to add an element to a subStream but it ` +
                `already exists in the subStreams container`,
              { subStreams, node, component },
            )
          }
        } else {
          log.func('onCreateNode')
          log.red(
            `Attempted to create a subStream but a container was not available`,
            {
              node,
              component,
              mainStream: streams.getMainStream(),
              selfStream: streams.getSelfStream(),
            },
          )
        }
      }
    },
  })

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
  // await page.requestPageChange(startPage)
  if (
    !window.localStorage.getItem('tempConfigKey') &&
    window.localStorage.getItem('config')
  ) {
    var localConfig = JSON.parse(window.localStorage.getItem('config'))
    window.localStorage.setItem('tempConfigKey', localConfig.timestamp)
  }

  if (page && window.location.href) {
    var newPage = noodl.cadlEndpoint.startPage
    var hrefArr = window.location.href.split('/')
    var urlArr = hrefArr[hrefArr.length - 1]
    var localConfig = JSON.parse(window.localStorage.getItem('config'))
    if (
      window.localStorage.getItem('tempConfigKey') &&
      window.localStorage.getItem('tempConfigKey') !==
        JSON.stringify(localConfig.timestamp)
    ) {
      window.localStorage.setItem('CACHED_PAGES', JSON.stringify([]))
      page.pageUrl = 'index.html?'
      await page.requestPageChange(newPage)
    } else {
      if (!urlArr.startsWith('index.html?')) {
        page.pageUrl = 'index.html?'
        await page.requestPageChange(newPage)
      } else {
        var pagesArr = urlArr.split('-')
        if (pagesArr.length > 1) {
          newPage = pagesArr[pagesArr.length - 1]
        } else {
          var baseArr = pagesArr[0].split('?')
          if (baseArr.length > 1 && baseArr[baseArr.length - 1] !== '') {
            newPage = baseArr[baseArr.length - 1]
          }
        }
        page.pageUrl = urlArr
        await page.requestPageChange(newPage)
      }
    }
  }
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
  if (cache.length >= 12) cache.pop()
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
