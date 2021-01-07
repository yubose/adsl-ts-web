import axios from 'axios'
import Logger from 'logsnap'
import NOODLUIDOM, { eventId } from 'noodl-ui-dom'
import set from 'lodash/set'
import some from 'lodash/some'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from 'twilio-video'
import {
  ComponentObject,
  event as noodluiEvent,
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
  identify,
  List,
  NOODL as NOODLUI,
  PageObject,
  publish,
  ResolverFn,
  Resolver,
  Viewport,
} from 'noodl-ui'
import { AuthStatus } from './app/types/commonTypes'
import { listen as registerNOODLDOMListeners } from './app/noodl-ui-dom'
import { IPage } from './Page'
import { IMeeting } from './meeting'
import { modalIds, CACHED_PAGES, pageEvent } from './constants'
import { CachedPageObject, PageModalId } from './app/types'
import { isMobile } from './utils/common'
import { forEachParticipant } from './utils/twilio'
import createActions from './handlers/actions'
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import createViewportHandler from './handlers/viewport'
import MeetingSubstreams from './meeting/Substreams'

const log = Logger.create('App.ts')

export type ViewportUtils = ReturnType<typeof createViewportHandler>

const resolvers = [
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
]

class App {
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  #preparePage = {} as (pageName: string) => Promise<PageObject>
  #viewportUtils = {} as ViewportUtils
  actions = {} as ReturnType<typeof createActions>
  authStatus: AuthStatus | '' = ''
  builtIn = {} as ReturnType<typeof createBuiltInActions>
  initialized: boolean = false
  meeting: IMeeting = {} as IMeeting
  noodl: any
  noodlui = {} as NOODLUI
  noodluidom = {} as NOODLUIDOM
  page: IPage = {} as IPage
  streams = {} as ReturnType<IMeeting['getStreams']>

  async initialize({
    actions,
    builtIn,
    meeting,
    noodlui,
    noodluidom,
    page,
  }: {
    actions: ReturnType<typeof createActions>
    builtIn: ReturnType<typeof createBuiltInActions>
    meeting: IMeeting
    noodlui: NOODLUI
    noodluidom: NOODLUIDOM
    page: IPage
  }) {
    const { Account } = await import('@aitmed/cadl')
    const noodl = (await import('app/noodl')).default
    this.actions = actions
    this.builtIn = builtIn
    this.meeting = meeting
    this.noodl = noodl
    this.noodlui = noodlui
    this.noodluidom = noodluidom
    this.page = page
    this.streams = meeting.getStreams()
    this.#viewportUtils = createViewportHandler(new Viewport())

    await noodl.init()
    meeting.initialize({
      page,
      viewport: this.#viewportUtils.viewport,
    })
    registerNOODLDOMListeners({ noodlui })

    let startPage = noodl?.cadlEndpoint?.startPage

    if (!this.authStatus) {
      // Initialize the user's state before proceeding to decide on how to direct them
      const storedStatus = await Account.getStatus()
      if (storedStatus.code === 0) {
        noodl.setFromLocalStorage('user')
        this.authStatus = 'logged.in'
        this.onAuthStatus?.('logged.in')
      } else if (storedStatus.code === 1) {
        this.authStatus = 'logged.out'
        this.onAuthStatus?.('logged.out')
      } else if (storedStatus.code === 2) {
        this.authStatus = 'new.device'
        this.onAuthStatus?.('new.device')
      } else if (storedStatus.code === 3) {
        this.authStatus = 'temporary'
        this.onAuthStatus?.('temporary')
      }
    }

    this.#preparePage = async (pageName: string): Promise<PageObject> => {
      try {
        await noodl.initPage(pageName, [], {
          ...page.getState().modifiers[pageName],
          builtIn: {
            checkField: builtIn.checkField,
            goto: builtIn.goto,
            videoChat: onVideoChatBuiltIn({ joinRoom: meeting.join }),
          },
        })
        log.func('createPreparePage')
        log.grey(`Ran noodl.initPage on page "${pageName}"`, {
          pageName,
          pageModifiers: page.getState().modifiers[pageName],
          pageObject: noodl.root[pageName],
        })
        return noodl.root[pageName]
      } catch (error) {
        throw new Error(error)
      }
    }

    this.observeClient({ noodlui, noodl })
    this.observeInternal(noodlui)
    this.observeViewport(this.getViewportUtils())
    this.observePages(page)
    this.observeMeetings(meeting)

    /* -------------------------------------------------------
      ---- LOCAL STORAGE
    -------------------------------------------------------- */
    // Override the start page if they were on a previous page
    let cachedPages = this.getCachedPages()
    let cachedPage = cachedPages[0]
    if (cachedPages?.length) {
      if (cachedPage?.name && cachedPage.name !== startPage) {
        startPage = cachedPage.name
      }
    }
    if (
      !window.localStorage.getItem('tempConfigKey') &&
      window.localStorage.getItem('config')
    ) {
      let localConfig = JSON.parse(window.localStorage.getItem('config') || '')
      window.localStorage.setItem('tempConfigKey', localConfig.timestamp)
    }

    if (page && window.location.href) {
      let newPage = noodl.cadlEndpoint.startPage
      let hrefArr = window.location.href.split('/')
      let urlArr = hrefArr[hrefArr.length - 1]
      let localConfig = JSON.parse(window.localStorage.getItem('config') || '')
      if (
        window.localStorage.getItem('tempConfigKey') &&
        window.localStorage.getItem('tempConfigKey') !==
          JSON.stringify(localConfig.timestamp)
      ) {
        window.localStorage.setItem('CACHED_PAGES', JSON.stringify([]))
        page.pageUrl = 'index.html?'
        await page.requestPageChange(newPage)
      } else {
        if (!urlArr?.startsWith('index.html?')) {
          page.pageUrl = 'index.html?'
          await page.requestPageChange(newPage)
        } else {
          let pagesArr = urlArr.split('-')
          if (pagesArr.length > 1) {
            newPage = pagesArr[pagesArr.length - 1]
          } else {
            let baseArr = pagesArr[0].split('?')
            if (baseArr.length > 1 && baseArr[baseArr.length - 1] !== '') {
              newPage = baseArr[baseArr.length - 1]
            }
          }
          page.pageUrl = urlArr
          await page.requestPageChange(newPage)
        }
      }
    }
    this.initialized = true
  }

  getViewportUtils() {
    return this.#viewportUtils
  }

  observeClient({ noodl, noodlui }: { noodl: any; noodlui: NOODLUI }) {
    // When noodl-ui emits this it expects a new "child" instance. To keep memory usage
    // to a minimum, keep the root references the same as the one in the parent instance
    // Currently this is used by components of type: page
    noodlui
      .on(noodluiEvent.NEW_PAGE, async (page: string) => {
        await noodl.initPage(page)
        log.func(`[observeClient][${noodluiEvent.NEW_PAGE}]`)
        log.grey(`Initiated page: ${page}`)
      })
      .on(noodluiEvent.NEW_PAGE_REF, async (ref: NOODLUI) => {
        ref
          .use(
            resolvers.reduce(
              (acc, r: ResolverFn) => acc.concat(new Resolver().setResolver(r)),
              [] as Resolver[],
            ),
          )
          .use(
            Object.entries(this.actions).reduce(
              (arr, [actionType, actions]) =>
                arr.concat(actions.map((a) => ({ ...a, actionType }))),
              [] as any[],
            ),
          )
          .use(
            // @ts-expect-error
            Object.entries({
              checkField: this.builtIn.checkField,
              checkUsernamePassword: this.builtIn.checkUsernamePassword,
              goBack: this.builtIn.goBack,
              lockApplication: this.builtIn.lockApplication,
              logOutOfApplication: this.builtIn.logOutOfApplication,
              logout: this.builtIn.logout,
              redraw: this.builtIn.redraw,
              toggleCameraOnOff: this.builtIn.toggleCameraOnOff,
              toggleFlag: this.builtIn.toggleFlag,
              toggleMicrophoneOnOff: this.builtIn.toggleMicrophoneOnOff,
            }).map(([funcName, fn]) => ({ funcName, fn })),
          )
      })
  }

  // Cleans window.ac (used for debugging atm)
  observeInternal(noodlui: NOODLUI) {
    noodlui.on(noodluiEvent.SET_PAGE, () => {
      if (typeof window !== 'undefined' && 'ac' in window) {
        Object.keys(window.ac).forEach((key) => {
          delete window.ac[key]
        })
      }
    })
  }

  observeViewport(utils: ReturnType<typeof createViewportHandler>) {
    const {
      computeViewportSize,
      on,
      setMinAspectRatio,
      setMaxAspectRatio,
      setViewportSize,
    } = utils

    if (this.noodl.getConfig()?.viewWidthHeightRatio) {
      const { min, max } = this.noodl.getConfig()?.viewWidthHeightRatio
      setMinAspectRatio(min)
      setMaxAspectRatio(max)
    }

    const { aspectRatio, width, height, min, max } = computeViewportSize({
      width: window.innerWidth,
      height: window.innerHeight,
      previousWidth: window.innerWidth,
      previousHeight: window.innerHeight,
    })

    setViewportSize({ width, height })
    this.noodl.aspectRatio = aspectRatio

    on(
      'resize',
      ({
        aspectRatio,
        width,
        height,
      }: ReturnType<typeof computeViewportSize>) => {
        log.func('on resize [viewport]')
        if (this.noodlui.page === 'VideoChat') {
          return log.grey(
            `Skipping avoiding the page rerender on the VideoChat "onresize" event`,
          )
        }
        this.noodl.aspectRatio = aspectRatio
        document.body.style.width = `${width}px`
        document.body.style.height = `${height}px`
        if (this.page.rootNode) {
          this.page.rootNode.style.width = `${width}px`
          this.page.rootNode.style.height = `${height}px`
        }
        this.page.render(
          this.noodl?.root?.[this.page.getState().current]?.components,
        )
      },
    )
  }

  observePages(page: IPage) {
    page
      .on(pageEvent.ON_NAVIGATE_START, (pageName) => {
        console.log(
          `%cRendering the DOM for page: "${pageName}"`,
          `color:#95a5a6;`,
        )
      })
      .on(
        pageEvent.ON_BEFORE_RENDER_COMPONENTS as any,
        async ({ pageName }) => {
          if (
            /videochat/i.test(page.getState().current) &&
            !/videochat/i.test(pageName)
          ) {
            this.meeting.leave()
            log.func('page [before-page-render]')
            log.grey(`Disconnected from room`, this.meeting.room)

            const mainStream = this.streams.getMainStream()
            const selfStream = this.streams.getSelfStream()
            const subStreamsContainer = this.streams.getSubStreamsContainer()
            const subStreams = subStreamsContainer?.getSubstreamsCollection()

            if (mainStream.getElement()) {
              log.grey('Wiping mainStream state', mainStream.reset())
            }
            if (selfStream.getElement()) {
              log.grey('Wiping selfStream state', selfStream.reset())
            }
            if (subStreamsContainer?.length) {
              const logMsg = `Wiping subStreams container's state`
              log.grey(logMsg, subStreamsContainer.reset())
            }
            if (Array.isArray(subStreams)) {
              subStreams.forEach((subStream) => {
                if (subStream.getElement()) {
                  log.grey(`Wiping a subStream's state`, subStream.reset())
                  subStreamsContainer?.removeSubStream(subStream)
                }
              })
            }
          }

          let pageSnapshot = {} as { name: string; object: any }
          let pageModifiers = page.getState().modifiers[pageName]

          if (pageName !== page.getState().current || pageModifiers?.force) {
            // Load the page in the SDK
            const pageObject = await this.#preparePage(pageName)
            // This will be passed into the page renderer
            pageSnapshot = {
              name: pageName,
              object: pageObject,
            }
            // Initialize the noodl-ui client (parses components) if it
            // isn't already initialized
            if (!this.initialized) {
              log.func('page [before-page-render]')
              log.grey('Initializing noodl-ui client', {
                noodl: this.noodl,
                actions: this.actions,
                pageSnapshot,
              })

              const fetch = (url: string) =>
                axios.get(url).then(({ data }) => data)
              // .catch((err) => console.error(`[${err.name}]: ${err.message}`))
              const config = this.noodl.getConfig()
              const plugins = [] as ComponentObject[]
              if (config.headPlugin) {
                plugins.push(
                  this.noodlui.createPluginObject({
                    type: 'pluginHead',
                    path: config.headPlugin,
                  }),
                )
              }
              if (config.bodyTopPplugin) {
                plugins.push(
                  this.noodlui.createPluginObject({
                    type: 'pluginBodyTop',
                    path: config.bodyTopPplugin,
                  }),
                )
              }
              if (config.bodyTailPplugin) {
                plugins.push(
                  this.noodlui.createPluginObject({
                    type: 'pluginBodyTail',
                    path: config.bodyTailPplugin,
                  }),
                )
              }
              this.noodlui
                .init({
                  actionsContext: {
                    noodl: this.noodl,
                    noodluidom: this.noodluidom,
                  } as any,
                  viewport: this.#viewportUtils.viewport,
                })
                .setPage(pageName)
                .use(this.#viewportUtils.viewport)
                .use({
                  fetch,
                  getAssetsUrl: () => this.noodl.assetsUrl,
                  getBaseUrl: () => this.noodl.baseUrl,
                  getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
                  getPages: () => this.noodl.cadlEndpoint?.page || [],
                  getRoot: () => this.noodl.root,
                  plugins,
                })
                .use(
                  resolvers.reduce(
                    (acc, r: ResolverFn) =>
                      acc.concat(new Resolver().setResolver(r)),
                    [] as Resolver[],
                  ),
                )
                .use(
                  Object.entries(this.actions).reduce(
                    (arr, [actionType, actions]) =>
                      arr.concat(actions.map((a) => ({ ...a, actionType }))),
                    [] as any[],
                  ),
                )
                .use(
                  // @ts-expect-error
                  Object.entries({
                    checkField: this.builtIn.checkField,
                    checkUsernamePassword: this.builtIn.checkUsernamePassword,
                    goBack: this.builtIn.goBack,
                    lockApplication: this.builtIn.lockApplication,
                    logOutOfApplication: this.builtIn.logOutOfApplication,
                    logout: this.builtIn.logout,
                    redraw: this.builtIn.redraw,
                    toggleCameraOnOff: this.builtIn.toggleCameraOnOff,
                    toggleFlag: this.builtIn.toggleFlag,
                    toggleMicrophoneOnOff: this.builtIn.toggleMicrophoneOnOff,
                  }).map(([funcName, fn]) => ({ funcName, fn })),
                )

              log.func('page [before-page-render]')
              log.green('Initialized noodl-ui client', this.noodlui)
            }

            const previousPage = page.getState().previous
            log.func('page [before-page-render]')
            log.grey(`${previousPage} --> ${pageName}`, page.snapshot())
            // Refresh the root
            // TODO - Leave root/page auto binded to the lib
            this.noodlui.setPage(pageSnapshot.name)
            log.grey(`Set root + page obj after receiving page object`, {
              previousPage: page.getState().previous,
              currentPage: page.getState().current,
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
            log.func('page [before-page-render]')
            log.green('Avoided a duplicate navigate request')
          }

          return pageSnapshot
        },
      )
      .on(
        pageEvent.ON_COMPONENTS_RENDERED,
        async ({ pageName, components }) => {
          log.func('page [rendered]')
          log.green(`Done rendering DOM nodes for ${pageName}`)
          window.pcomponents = components
          // Cache to rehydrate if they disconnect
          // TODO
          this.cachePage(pageName)
          log.grey(`Cached page: "${pageName}"`)
        },
      )
      .on(pageEvent.ON_NAVIGATE_ERROR, ({ error }) => {
        console.error(error)
        log.func('page.onError')
        log.red(error.message, error)
        // window.alert(error.message)
        // TODO - narrow the reasons down more
      })
      /**
       * Triggers opening/closing the modal if a matching modal id is set
       * Dispatch openModal/closeModal to open/close this modal
       */
      // NOTE - This is not being used atm
      .on(pageEvent.ON_MODAL_STATE_CHANGE, (prevState, nextState) => {
        const { id, opened, ...rest } = nextState
        log.func('page [modal-state-change]')
        if (opened) {
          const modalId = modalIds[id as PageModalId]
          // const modalComponent = modalComponents[modalId]
          const modalComponent = undefined
          if (modalComponent) {
            this.page.modal.open(id, modalComponent, { opened, ...rest })
            log.green('Modal opened', { prevState, nextState })
          } else {
            log.red(
              'Tried to open the modal component but the node was not available',
              { prevState, nextState, node: this.page.modal.node },
            )
          }
        } else {
          this.page.modal.close()
          log.green('Closed modal', { prevState, nextState })
        }
      })
  }

  /**
   * Callback invoked when Meeting.joinRoom receives the room instance.
   * Initiates participant tracks as well as register listeners for state changes on
   * the room instance.
   * @param { Room } room - Room instance
   */
  observeMeetings(meeting: IMeeting) {
    meeting.onConnected = (room) => {
      /* -------------------------------------------------------
      ---- LISTEN FOR INCOMING MEDIA PUBLISH/SUBSCRIBE EVENTS
    -------------------------------------------------------- */
      // Disconnect using the room instance
      function disconnect() {
        room.disconnect?.()
      }
      // Callback runs when the LocalParticipant disconnects
      const disconnected = async () => {
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

      room.on('participantConnected', this.meeting.addRemoteParticipant)
      room.on('participantDisconnected', this.meeting.removeRemoteParticipant)
      room.once('disconnected', disconnected)

      window.addEventListener('beforeunload', disconnect)
      if (isMobile()) window.addEventListener('pagehide', disconnect)

      /* -------------------------------------------------------
      ---- INITIATING MEDIA TRACKS / STREAMS 
    -------------------------------------------------------- */
      // Local participant
      const localParticipant = room.localParticipant
      const selfStream = this.streams.getSelfStream()
      if (!selfStream.isSameParticipant(localParticipant)) {
        selfStream.setParticipant(localParticipant)
        if (selfStream.isSameParticipant(localParticipant)) {
          log.func('Meeting.onConnected')
          log.green(`Bound local participant to selfStream`, selfStream)
        }
      }
      // Remote participants
      forEachParticipant(room.participants, this.meeting.addRemoteParticipant)
    }

    /**
     * Callback invoked when a new participant was added either as a mainStream
     * or into the subStreams collection
     * @param { RemoteParticipant } participant
     * @param { Stream } stream - mainStream or a subStream
     */
    meeting.onAddRemoteParticipant = (participant, stream) => {
      log.func('Meeting.onAddRemoteParticipant')
      log.green(`Bound remote participant to ${stream.type}`, {
        participant,
        stream,
      })
      const isInSdk = some(
        this.noodl.root?.VideoChat?.listData?.participants || [],
        (p) => p.sid === participant.sid,
      )
      if (!isInSdk) {
        /**
         * Updates the participants list in the sdk. This will also force the value
         * to be an array if it's not already an array
         * @param { RemoteParticipant } participant
         */
        this.noodl.editDraft((draft: any) => {
          const participants = this.meeting
            .removeFalseyParticipants(
              draft?.VideoChat?.listData?.participants || [],
            )
            .concat(participant)
          set(draft, 'VideoChat.listData.participants', participants)
        })

        log.func('Meeting.onAddRemoteParticipant')
        log.green('Updated SDK with new participant', {
          addedParticipant: participant,
          newParticipantsList: this.noodl.root?.VideoChat?.listData
            ?.participants,
        })
      }
      if (this.meeting.getWaitingMessageElement()) {
        this.meeting.getWaitingMessageElement().style.visibility = 'hidden'
      }
    }

    meeting.onRemoveRemoteParticipant = (participant, stream) => {
      /**
       * Updates the participants list in the sdk. This will also force the value
       * to be an array if it's not already an array
       * @param { RemoteParticipant } participant
       */
      this.noodl.editDraft((draft: any) => {
        set(
          draft.VideoChat.listData,
          'participants',
          this.meeting.removeFalseyParticipants(
            draft?.VideoChat?.listData?.participants ||
              [].filter((p) => p !== participant),
          ),
        )
      })
      if (!this.meeting.room.participants.size) {
        if (this.meeting.getWaitingMessageElement()) {
          this.meeting.getWaitingMessageElement().style.visibility = 'visible'
        }
      }
    }

    /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */

    this.noodluidom.configure({
      redraw: {
        resolveComponents: this.noodlui.resolveComponents.bind(this.noodlui),
      },
    })

    this.noodluidom.on(eventId.redraw.ON_BEFORE_CLEANUP, (node, component) => {
      console.log('Removed from componentCache: ' + component.id)
      this.noodlui.componentCache().remove(component)
      publish(component, (c) => {
        console.log('Removed from componentCache: ' + component.id)
        this.noodlui.componentCache().remove(c)
      })
    })

    this.noodluidom.register({
      name: 'meeting',
      cond: (node: any, component: any) => !!(node && component),
      resolve: (node: any, component: any) => {
        // Dominant/main participant/speaker
        if (identify.stream.video.isMainStream(component.toJS())) {
          const mainStream = this.streams.getMainStream()
          if (!mainStream.isSameElement(node)) {
            mainStream.setElement(node, { uxTag: 'mainStream' })
            log.func('onCreateNode')
            log.green('Bound an element to mainStream', { mainStream, node })
          }
        }
        // Local participant
        else if (identify.stream.video.isSelfStream(component.toJS())) {
          const selfStream = this.streams.getSelfStream()
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
          let subStreams = this.streams.getSubStreamsContainer()
          if (!subStreams) {
            subStreams = this.streams.createSubStreamsContainer(node, {
              blueprint: component.getBlueprint(),
              resolver: this.noodlui.resolveComponents.bind(this.noodlui),
            })
            log.func('onCreateNode')
            log.green('Created subStreams container', subStreams)
          } else {
            // If an existing subStreams container is already existent in memory, re-initiate
            // the DOM node and blueprint since it was reset from a previous cleanup
            log.red(`BLUEPRINT`, (component as List).blueprint)
            subStreams.container = node
            subStreams.blueprint = component.getBlueprint()
            subStreams.resolver = this.noodlui.resolveComponents.bind(
              this.noodlui,
            )
          }
        }
        // Individual remote participant video element container
        else if (identify.stream.video.isSubStream(component.toJS())) {
          const subStreams = this.streams.getSubStreamsContainer() as MeetingSubstreams
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
                mainStream: this.streams.getMainStream(),
                selfStream: this.streams.getSelfStream(),
              },
            )
          }
        }
      },
    })
  }

  /* -------------------------------------------------------
  ---- LOCAL STORAGE HELPERS FOR CACHED PAGES
-------------------------------------------------------- */
  /** Adds the current page name to the end in the list of cached pages */
  cachePage(name: string) {
    const cacheObj = { name } as CachedPageObject
    const prevCache = this.getCachedPages()
    if (prevCache[0]?.name === name) return
    const cache = [cacheObj, ...prevCache]
    if (cache.length >= 12) cache.pop()
    cacheObj.timestamp = Date.now()
    this.setCachedPages(cache)
  }

  /** Retrieves a list of cached pages */
  getCachedPages(): CachedPageObject[] {
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
  setCachedPages(cache: CachedPageObject[]) {
    window.localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
  }

  get onAuthStatus() {
    return this.#onAuthStatus
  }

  set onAuthStatus(fn) {
    this.#onAuthStatus = fn
  }
}

export default App
