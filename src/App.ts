import axios from 'axios'
import CADL from '@aitmed/cadl'
import startOfDay from 'date-fns/startOfDay'
import add from 'date-fns/add'
import isPlainObject from 'lodash/isPlainObject'
import Logger from 'logsnap'
import NOODLUIDOM, { eventId, NOODLDOMElement, Page } from 'noodl-ui-dom'
import get from 'lodash/get'
import set from 'lodash/set'
import some from 'lodash/some'
import { ComponentObject } from 'noodl-types'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from 'twilio-video'
import {
  Component,
  ComponentInstance,
  event as noodluiEvent,
  getAllResolversAsMap,
  identify,
  List,
  NOODL as NOODLUI,
  PageObject,
  publish,
  Resolver,
  Viewport,
} from 'noodl-ui'
import { AuthStatus } from './app/types/commonTypes'
import { IMeeting } from './meeting'
import { CACHED_PAGES, pageEvent, pageStatus } from './constants'
import { CachedPageObject } from './app/types'
import { isMobile } from './utils/common'
import { forEachParticipant } from './utils/twilio'
import createActions from './handlers/actions'
import createBuiltIns, { onVideoChatBuiltIn } from './handlers/builtIns'
import createViewportHandler from './handlers/viewport'
import MeetingSubstreams from './meeting/Substreams'
import firebaseApp from './app/firebase'
import { WritableDraft } from 'immer/dist/internal'

const log = Logger.create('App.ts')

export type ViewportUtils = ReturnType<typeof createViewportHandler>

class App {
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  #preparePage = {} as (pageName: string) => Promise<PageObject>
  #viewportUtils = {} as ViewportUtils
  _store: {
    messaging: { serviceRegistration: ServiceWorkerRegistration; token: string }
  } = {
    messaging: {
      serviceRegistration: {} as ServiceWorkerRegistration,
      token: '',
    },
  }
  authStatus: AuthStatus | '' = ''
  initialized: boolean = false
  firebase = {} as typeof firebaseApp
  meeting: IMeeting = {} as IMeeting
  messaging = {} as ReturnType<typeof firebaseApp.messaging>
  noodl = {} as CADL
  noodlui = {} as NOODLUI
  noodluidom = {} as NOODLUIDOM
  streams = {} as ReturnType<IMeeting['getStreams']>

  async initialize({
    // actions,
    // builtIn,
    firebase: { firebase, webPushCertificatesKeyPair },
    meeting,
    noodlui,
    noodluidom,
  }: {
    // actions: ReturnType<typeof createActions>
    // builtIn: ReturnType<typeof createBuiltInActions>
    firebase: {
      firebase: typeof firebaseApp
      webPushCertificatesKeyPair: string
    }
    meeting: IMeeting
    noodlui: NOODLUI
    noodluidom: NOODLUIDOM
  }) {
    const { Account } = await import('@aitmed/cadl')
    const noodl = (await import('app/noodl')).default

    this.firebase = firebase
    this.messaging = this.firebase.messaging()
    this.meeting = meeting
    this.noodl = noodl
    this.noodlui = noodlui
    this.noodluidom = noodluidom
    this.streams = meeting.getStreams()
    this.#viewportUtils = createViewportHandler(new Viewport())

    noodluidom.use(noodlui)

    log.func('initialize')
    this._store.messaging.serviceRegistration = await navigator.serviceWorker.register(
      'firebase-messaging-sw.js',
    )
    log.green(
      'Initialized service worker',
      this._store.messaging.serviceRegistration,
    )
    // this._store.messaging.token = await this.messaging.getToken({
    //   vapidKey: webPushCertificatesKeyPair,
    //   serviceWorkerRegistration: this._store.messaging.serviceRegistration,
    // })
    // log.green('Received firebase messaging token', this._store.messaging.token)

    const unsubscribe = this.messaging.onMessage(
      function nextOrObserver(obs) {
        log.func('onMessage')
        log.green('[nextOrObserver]: obs', obs)
      },
      function onError(err) {
        log.func('onMessage')
        log.red(`[onError]: ${err.message}`, err)
      },
      function onComplete() {
        log.func('[onComplete]')
        log.grey(`from onMessage`)
      },
    )

    await noodl.init()

    createActions({ noodlui, noodluidom })
    createBuiltIns({ noodl, noodlui, noodluidom })

    meeting.initialize({
      noodluidom,
      page: this.noodluidom.page,
      viewport: this.#viewportUtils.viewport,
    })

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
          ...this.noodluidom.page.getState().modifiers[pageName],
          builtIn: {
            FCMOnTokenReceive: async (...args: any[]) => {
              const token = await this.messaging.getToken(...args)
              log.gold(
                `FCMOnTokenReceive noodl.initPage builtIn: PAGE TOKEN`,
                token,
              )
              noodlui.emit('register', {
                key: 'globalRegister',
                id: 'FCMOnTokenReceive',
                prop: 'onEvent',
                data: token,
              })
              return token
            },
            FCMOnTokenRefresh: this.messaging.onTokenRefresh.bind(
              this.messaging,
            ),
            checkField: this.noodluidom.builtIns.checkField?.find(Boolean)?.fn,
            goto: this.noodluidom.builtIns.goto?.find(Boolean)?.fn,
            videoChat: onVideoChatBuiltIn({ joinRoom: meeting.join }),
          },
        })
        log.func('createPreparePage')
        log.grey(`Ran noodl.initPage on page "${pageName}"`, {
          pageName,
          pageModifiers: this.noodluidom.page.getState().modifiers[pageName],
          pageObject: noodl.root[pageName],
          snapshot: this.noodluidom.page.snapshot(),
        })
        if (noodl.root?.Global?.globalRegister) {
          const Global = noodl.root.Global
          if (Array.isArray(Global.globalRegister)) {
            if (Global.globalRegister.length) {
              log.grey(
                `Scanning ${Global.globalRegister.length} items found in Global.globalRegister`,
                Global.globalRegister,
              )
              Global.globalRegister.forEach((value: any) => {
                if (isPlainObject(value)) {
                  if (value.type === 'register') {
                    log.grey(
                      `Found and registered a "register" component to Global`,
                      value,
                    )
                    noodlui.register({
                      key: 'globalRegister',
                      component: value,
                    })
                  }
                }
              })
            }
          }
        }
        return noodl.root[pageName]
      } catch (error) {
        throw new Error(error)
      }
    }

    this.observeClient({ noodlui, noodl })
    this.observeInternal(noodlui)
    this.observeViewport(this.getViewportUtils())
    this.observePages(this.noodluidom.page)
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

    if (this.noodluidom.page && window.location.href) {
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
        this.noodluidom.page.pageUrl = 'index.html?'
        await this.noodluidom.page.requestPageChange(newPage)
      } else {
        if (!urlArr?.startsWith('index.html?')) {
          this.noodluidom.page.pageUrl = 'index.html?'
          await this.noodluidom.page.requestPageChange(newPage)
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
          this.noodluidom.page.pageUrl = urlArr
          await this.noodluidom.page.requestPageChange(newPage)
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
    noodlui.on(noodluiEvent.NEW_PAGE_REF, async (ref: NOODLUI) => {
      await noodl.initPage(ref.page)
      log.func(`[observeClient][${noodluiEvent.NEW_PAGE_REF}]`)
      log.grey(`Initiated page: ${ref.page}`)
      Object.values(getAllResolversAsMap).forEach((resolver) => {
        ref.use(new Resolver().setResolver(resolver))
      })
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

    // The viewWidthHeightRatio in cadlEndpoint (app config) overwrites the
    // viewWidthHeightRatio in root config
    const viewWidthHeightRatio =
      this.noodl.cadlEndpoint?.viewWidthHeightRatio ||
      this.noodl.getConfig?.()?.viewWidthHeightRatio

    if (viewWidthHeightRatio) {
      const { min, max } = viewWidthHeightRatio
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
        if (this.noodluidom.page.rootNode) {
          this.noodluidom.page.rootNode.style.width = `${width}px`
          this.noodluidom.page.rootNode.style.height = `${height}px`
        }
        this.noodluidom.render(
          this.noodl?.root?.[this.noodluidom.page.getState().current]
            ?.components,
        )
      },
    )
  }

  observePages(page: Page) {
    page
      .on(pageEvent.ON_NAVIGATE_START, (snapshot) => {
        console.log(
          `%cRendering the DOM for page: "${snapshot.requesting}"`,
          `color:#95a5a6;`,
          snapshot,
        )
      })
      .on(
        pageEvent.ON_BEFORE_RENDER_COMPONENTS as any,
        async ({ requesting: pageName }) => {
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

          let pageSnapshot = {} as { name: string; object: any } | 'old.request'
          let pageModifiers = page.getState().modifiers[pageName]

          if (pageName !== page.getState().current || pageModifiers?.force) {
            // Load the page in the SDK
            const pageObject = await this.#preparePage(pageName)
            const noodluidomPageSnapshot = this.noodluidom.page.snapshot()
            // There is a bug that two parallel requests can happen at the same time, and
            // when the second request finishes before the first, the page renders the first page
            // in the DOM. To work around this bug we can determine this is occurring using
            // the conditions below
            if (
              noodluidomPageSnapshot.requesting === '' &&
              noodluidomPageSnapshot.status === pageStatus.IDLE &&
              noodluidomPageSnapshot.current !== pageName
            ) {
              pageSnapshot = 'old.request'
            } else {
              // This will be passed into the page renderer
              pageSnapshot = {
                name: pageName,
                object: pageObject,
              }
            }

            // Initialize the noodl-ui client (parses components) if it
            // isn't already initialized
            if (!this.initialized) {
              log.func('page [before-page-render]')
              log.grey('Initializing noodl-ui client', {
                noodl: this.noodl,
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
                  }) as any,
                )
              }
              if (config.bodyTopPplugin) {
                plugins.push(
                  this.noodlui.createPluginObject({
                    type: 'pluginBodyTop',
                    path: config.bodyTopPplugin,
                  }) as any,
                )
              }
              if (config.bodyTailPplugin) {
                plugins.push(
                  this.noodlui.createPluginObject({
                    type: 'pluginBodyTail',
                    path: config.bodyTailPplugin,
                  }) as any,
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
                  getBaseUrl: () => this.noodl.cadlBaseUrl,
                  getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
                  getPages: () => this.noodl.cadlEndpoint?.page || [],
                  getRoot: () => this.noodl.root,
                  plugins,
                })

              Object.entries(getAllResolversAsMap()).forEach(
                ([name, resolver]) => {
                  const r = new Resolver().setResolver(resolver)
                  this.noodlui.use({ name, resolver: r })
                },
              )
              log.func('page [before-page-render]')
              log.green('Initialized noodl-ui client', this.noodlui)
            }
            const previousPage = page.getState().previous
            log.func('page [before-page-render]')
            log.grey(`${previousPage} --> ${pageName}`, page.snapshot())
            // Refresh the root
            // TODO - Leave root/page auto binded to the lib
            this.noodlui.setPage(pageName)
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
        async ({ requesting: pageName, components }) => {
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

    this.noodluidom.register({
      name: 'videoChat.timer.updater',
      cond: (n, c) => typeof c.get('text=func') === 'function',
      resolve: (node, component) => {
        const dataKey = component.get('dataKey')

        if (component.contentType === 'timer') {
          component.on(
            'initial.timer',
            (setInitialTime: (date: Date) => void) => {
              const initialTime = startOfDay(new Date())
              // Initial SDK value is set in seconds
              const initialSeconds = get(this.noodl.root, dataKey, 0) as number
              // Sdk evaluates from start of day. So we must add onto the start of day
              // the # of seconds of the initial value in the Global object
              let initialValue = add(initialTime, { seconds: initialSeconds })
              if (initialValue === null || initialValue === undefined) {
                initialValue = new Date()
              }
              setInitialTime(initialValue)
            },
          )

          // Look at the hard code implementation in noodl-ui-dom
          // inside packages/noodl-ui-dom/src/resolvers/textFunc.ts for
          // the api declaration
          component.on(
            'timer.ref',
            (ref: {
              start(): void
              current: Date
              ref: NodeJS.Timeout
              clear: () => void
              increment(): void
              set(value: any): void
              onInterval?:
                | ((args: {
                    node: NOODLDOMElement
                    component: ComponentInstance
                    ref: typeof ref
                  }) => void)
                | null
            }) => {
              const textFunc = component.get('text=func') || ((x: any) => x)

              component.on(
                'interval',
                ({
                  node,
                  component,
                }: {
                  node: NOODLDOMElement
                  component: ComponentInstance
                  ref: typeof ref
                }) => {
                  this.noodl.editDraft(
                    (draft: WritableDraft<{ [key: string]: any }>) => {
                      let seconds = get(draft, dataKey, 0)
                      set(draft, dataKey, seconds + 1)
                      let updatedSecs = get(draft, dataKey)
                      if (
                        updatedSecs !== null &&
                        typeof updatedSecs === 'number'
                      ) {
                        if (seconds === updatedSecs) {
                          // Not updated
                          log.func('text=func timer [noodluidom.register]')
                          log.red(
                            `Tried to update the value of ${dataKey} but the value remained the same`,
                            {
                              node,
                              component,
                              seconds,
                              updatedSecs,
                              ref,
                            },
                          )
                        } else {
                          // Updated
                          ref.increment()
                          node.textContent = textFunc(ref.current)
                        }
                      }
                    },
                  )
                },
              )

              ref.start()
            },
          )
        }
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
