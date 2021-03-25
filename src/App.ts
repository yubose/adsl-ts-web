import CADL from '@aitmed/cadl'
import startOfDay from 'date-fns/startOfDay'
import add from 'date-fns/add'
import isPlainObject from 'lodash/isPlainObject'
import Logger from 'logsnap'
import NOODLDOM, {
  eventId,
  isPage as isNOODLDOMPage,
  NOODLDOMElement,
  Page as NOODLDOMPage,
  RegisterOptions,
} from 'noodl-ui-dom'
import get from 'lodash/get'
import set from 'lodash/set'
import { ComponentObject, PageObject } from 'noodl-types'
import {
  NUIComponent,
  event as nuiEvent,
  identify,
  NOODLUI as NUI,
  publish,
  Viewport,
} from 'noodl-ui'
import { WritableDraft } from 'immer/dist/internal'
import { copyToClipboard } from './utils/dom'
import { IMeeting } from './meeting'
import { CACHED_PAGES, pageStatus } from './constants'
import {
  AuthStatus,
  CachedPageObject,
  FirebaseApp,
  FirebaseMessaging,
} from './app/types'
import { isStable } from './utils/common'
import createRegisters from './handlers/register'
import createActions from './handlers/actions'
import createBuiltIns, { onVideoChatBuiltIn } from './handlers/builtIns'
import createMeetingHandlers from './handlers/meeting'
import createViewportHandler from './handlers/viewport'
import MeetingSubstreams from './meeting/Substreams'

const log = Logger.create('App.ts')
const stable = isStable()

export type ViewportUtils = ReturnType<typeof createViewportHandler>

class App {
  #enabled = {
    firebase: true,
  }
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  #preparePage = {} as (page: NOODLDOMPage) => Promise<PageObject>
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
  firebase = {} as FirebaseApp
  initialized = false
  messaging = null as FirebaseMessaging | null
  meeting: IMeeting = {} as IMeeting
  noodl = {} as CADL
  ndom = {} as NOODLDOM
  mainPage: NOODLDOMPage
  streams = {} as ReturnType<IMeeting['getStreams']>

  // addRequestParams(page: string, opts: Record<string, any>) {
  //   if (!this.pageModifiers[page]) this.pageModifiers[page] = {}
  //   this.pageModifiers[page] = { ...this.pageModifiers[page], ...opts }
  //   return this.pageModifiers[page]
  // }

  // emit<Evt extends keyof T.AppObserver>(
  //   evt: Evt,
  //   ...args: Parameters<T.AppObserverFn<Evt>>
  // ) {
  //   console.log(`%c[App/emit] emitting "${evt}"`, `color:#95a5a6;`)
  //   this.#obs[evt]?.forEach?.((cb: any) => (cb as any)?.(...args))
  // }

  // on<Evt extends keyof T.AppObserver>(evt: Evt, cb: T.AppObserverFn<Evt>) {
  //   if (!u.isArr(this.#obs[evt])) this.#obs[evt] = []
  //   if (!this.#obs[evt].includes(cb as any)) {
  //     console.log(`%c[App/on] on: ${evt}`, `color:#95a5a6;`)
  //     this.#obs[evt].push(cb as any)
  //   }
  //   return this
  // }

  // async getPageObject(pageName: string): Promise<PageObject> {
  //   try {
  //     // this.emit(obs.ON_BEFORE_INIT_PAGE, {
  //     //   name: pageName,
  //     //   modifiers: this.pageModifiers[pageName],
  //     // })
  //     await this.noodl.initPage(pageName, [], {
  //       ...this.pageModifiers[pageName],
  //       builtIn: {
  //         onNewMessageDisplay: this.sdkBuiltIns.onNewMessageDisplay,
  //         FCMOnTokenReceive: this.sdkBuiltIns.FCMOnTokenReceive,
  //         FCMOnTokenRefresh: this.sdkBuiltIns.FCMOnTokenRefresh,
  //         checkField: this.sdkBuiltIns.checkField,
  //         goto: this.sdkBuiltIns.goto,
  //         videoChat: this.sdkBuiltIns.videoChat,
  //       },
  //     })
  //     this.emit(obs.ON_AFTER_INIT_PAGE, { name: pageName })
  //     const pageObject = this.noodl.root[pageName]
  //     log.func('getPageObject')
  //     log.grey(
  //       `Ran noodl.initPage and received pageObject for page "${pageName}"`,
  //       {
  //         pageName,
  //         pageObject,
  //         snapshot: this.rootPage.snapshot(),
  //       },
  //     )
  //     return pageObject
  //   } catch (error) {
  //     throw new Error(error)
  //   } finally {
  // if (this.pageModifiers[pageName]) {
  //   console.log(
  //     `%c[App/getPageObject] Deleting modifiers for page ${pageName}"`,
  //     `color:#95a5a6;`,
  //     { ...this.pageModifiers[pageName] },
  //   )
  //   delete this.pageModifiers[pageName]
  // }
  //   }
  // }

  // async navigate(pageName: string) {
  //   console.log(
  //     `%c[App/navigate] Navigating to "${pageName}"`,
  //     `color:#95a5a6;`,
  //   )
  //   if (
  //     pageName &&
  //     this.rootPage.requesting &&
  //     this.rootPage.requesting !== pageName
  //   ) {
  //     console.log(
  //       `%cPrevented page "${pageName}" from continuing because a more recent request to ${this.rootPage.requesting} was instantiated`,
  //       `color:#00b406;`,
  //       {
  //         snapshot: this.rootPage.snapshot(),
  //         cancellingRequest: this.rootPage.ref[pageName],
  //         newerRequest: this.rootPage.ref[this.rootPage.requesting],
  //       },
  //     )
  //     return
  //   }
  //   await this.rootPage.request(pageName)
  // }

  constructor() {
    this.#viewportUtils = createViewportHandler(new Viewport())
    this.ndom = new NOODLDOM()
    this.mainPage = this.ndom.createPage(
      NUI.createPage({
        viewport: this.#viewportUtils.viewport,
      }),
    )
  }

  /**
   * Navigates to a page specified in page.requesting
   * The value set in page.requesting should be set prior to this call unless pageRequesting is provided where it will be set to it automatically
   * If only a page name is provided, by default the main page instance will be used
   * @param { NOODLDOMPage } page
   * @param { string | undefined } pageRequesting
   */
  async navigate(page: NOODLDOMPage, pageRequesting?: string): Promise<void>
  async navigate(pageRequesting: string, opts?: never): Promise<void>
  async navigate(page?: NOODLDOMPage | string, pageRequesting?: string) {
    try {
      let _page: NOODLDOMPage
      let _pageRequesting = ''

      if (isNOODLDOMPage(page)) {
        _page = page as NOODLDOMPage
        pageRequesting && (_pageRequesting = pageRequesting)
      } else {
        _page = this.mainPage
        typeof page === 'string' && (_pageRequesting = page)
      }

      if (_pageRequesting && _page.requesting !== _pageRequesting) {
        _page.requesting = _pageRequesting
      }
      // Retrieves the page object by using the GET_PAGE_OBJECT transaction registered inside
      // our init() method. Page.components should also contain the components retrieved from
      // that page object
      const req = await this.ndom.request(_page)
      if (req) {
        const components = req.render()
        log.func('navigate')
        log.grey(
          `Rendered ${components.length} components on ${_pageRequesting}`,
          components,
        )
      }
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  }

  async initialize({
    firebase: { client: firebase, vapidKey },
    meeting,
    ndom,
  }: {
    firebase: { client: App['firebase']; vapidKey: string }
    meeting: IMeeting
    ndom: NOODLDOM
  }) {
    try {
      const { Account } = await import('@aitmed/cadl')
      const noodl = (await import('app/noodl')).default
      const { isSupported: firebaseSupported } = await import('app/firebase')

      !firebaseSupported() && (this.#enabled.firebase = false)

      this.firebase = firebase
      this.messaging = this.#enabled.firebase ? this.firebase.messaging() : null
      stable && log.cyan(`Initialized firebase messaging instance`)
      this.meeting = meeting
      this.noodl = noodl
      this.ndom = ndom
      this.streams = meeting.getStreams()

      stable && log.cyan(`Initializing @aitmed/cadl sdk instance`)
      await noodl.init()
      stable && log.cyan(`Initialized @aitmed/cadl sdk instance`)
      stable && log.cyan(`Registered noodl-ui instance onto noodl-ui-dom`)

      this.ndom.use({
        getPageObject: async (page) => {
          const pageObject = await this.#preparePage(page)
          return pageObject
        },
      })

      createActions(this)
      createBuiltIns(this)
      createRegisters(this)
      createMeetingHandlers(this)

      meeting.initialize({
        ndom,
        page: this.mainPage,
        viewport: this.#viewportUtils.viewport,
      })

      if (this.#enabled.firebase) {
        this.messaging?.onMessage(
          (obs) => {
            log.func('onMessage')
            log.green('[nextOrObserver]: obs', obs)
          },
          (err) => {
            log.func('onMessage')
            log.red(`[onError]: ${err.message}`, err)
          },
          () => {
            log.func('[onComplete]')
            log.grey(`from onMessage`)
          },
        )
      }

      let startPage = noodl?.cadlEndpoint?.startPage
      stable && log.cyan(`Start page: ${startPage}`)

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

      this.#preparePage = async function preparePage(
        this: App,
        page: NOODLDOMPage,
      ): Promise<PageObject> {
        try {
          const pageRequesting = page.requesting
          stable && log.cyan(`Running noodl.initPage on ${pageRequesting}`)
          await noodl.initPage(pageRequesting, [], {
            ...page.modifiers,
            builtIn: {
              FCMOnTokenReceive: async (...args: any[]) => {
                try {
                  const permission = await Notification.requestPermission()
                  log.func('messaging.requestPermission')
                  log.grey(`Notification permission ${permission}`)
                } catch (err) {
                  log.func('messaging.requestPermission')
                  log.red('Unable to get permission to notify.', err)
                }
                try {
                  if (this.#enabled.firebase) {
                    this._store.messaging.serviceRegistration = await navigator.serviceWorker.register(
                      'firebase-messaging-sw.js',
                    )
                    args[0] = {
                      vapidKey,
                      serviceWorkerRegistration: this._store.messaging
                        .serviceRegistration,
                      ...args[0],
                    }
                    log.grey(
                      'Initialized service worker',
                      this._store.messaging.serviceRegistration,
                    )

                    this.messaging?.onMessage((...args) => {
                      log.func('messaging.onMessage')
                      log.green(`Received a message`, args)
                    })
                  } else {
                    log.red(
                      `Could not initiate the firebase service worker because this browser ` +
                        `does not support it`,
                      this,
                    )
                  }

                  const token = this.#enabled.firebase
                    ? (await this.messaging?.getToken(...args)) || ''
                    : ''

                  copyToClipboard(token)

                  if (this.#enabled.firebase) {
                    NUI.emit('register', {
                      data: token,
                      page: '_global',
                      registerEvent: 'FCMOnTokenReceive',
                    })
                  } else {
                    log.func('FCMOnTokenReceive')
                    log.red(
                      `Could not emit the "FCMOnTokenReceive" event because firebase ` +
                        `messaging is disabled. Is it supported by this browser?`,
                      this,
                    )
                  }

                  return token
                } catch (error) {
                  console.error(error)
                  return error
                }
              },
              FCMOnTokenRefresh: this.#enabled.firebase
                ? this.messaging?.onTokenRefresh.bind(this.messaging)
                : undefined,
              checkField: ndom.builtIns.checkField?.find(Boolean)?.fn,
              goto: ndom.builtIns.goto?.find(Boolean)?.fn,
              videoChat: onVideoChatBuiltIn({ joinRoom: meeting.join }),
            },
          })
          log.func('createPreparePage')
          log.grey(`Ran noodl.initPage on page "${pageRequesting}"`, {
            pageRequesting,
            pageModifiers: page.modifiers,
            pageObject: noodl.root[pageRequesting],
            snapshot: page.snapshot(),
          })
          if (noodl.root?.Global?.globalRegister) {
            const { Global } = noodl.root
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
                        { ...value },
                      )
                      const res = NUI.use({
                        registerEvent: '',
                        page: '_global',
                        component: value,
                      })
                      // SDK sets this
                      // value.onEvent = res.fn
                    }
                  }
                })
              }
            }
          }
          return noodl.root[pageRequesting]
        } catch (error) {
          throw new Error(error)
        }
      }.bind(this)

      this.observeComponents()
      this.observeClient()
      this.observeInternal()
      this.observeViewport(this.#viewportUtils)
      this.observePages()
      this.observeMeetings(meeting)

      /* -------------------------------------------------------
      ---- LOCAL STORAGE
    -------------------------------------------------------- */
      // Override the start page if they were on a previous page
      const cachedPages = this.getCachedPages()
      const cachedPage = cachedPages[0]

      if (cachedPages?.length) {
        if (cachedPage?.name && cachedPage.name !== startPage) {
          startPage = cachedPage.name
        }
      }

      const ls = window.localStorage

      if (!ls.getItem('tempConfigKey') && ls.getItem('config')) {
        ls.setItem(
          'tempConfigKey',
          JSON.parse(ls.getItem('config') || '')?.timestamp,
        )
      }

      if (this.mainPage && location.href) {
        let { startPage } = noodl.cadlEndpoint
        const urlParts = location.href.split('/')
        const pathname = urlParts[urlParts.length - 1]
        const localConfig = JSON.parse(ls.getItem('config') || '') || {}
        const tempConfigKey = ls.getItem('tempConfigKey')

        if (
          tempConfigKey &&
          tempConfigKey !== JSON.stringify(localConfig.timestamp)
        ) {
          ls.setItem('CACHED_PAGES', JSON.stringify([]))
          this.mainPage.pageUrl = 'index.html?'
          await this.navigate(this.mainPage, startPage)
        } else if (!pathname?.startsWith('index.html?')) {
          this.mainPage.pageUrl = 'index.html?'
          await this.navigate(this.mainPage, startPage)
        } else {
          const pageParts = pathname.split('-')
          if (pageParts.length > 1) {
            startPage = pageParts[pageParts.length - 1]
          } else {
            const baseArr = pageParts[0].split('?')
            if (baseArr.length > 1 && baseArr[baseArr.length - 1] !== '') {
              startPage = baseArr[baseArr.length - 1]
            }
          }
          this.mainPage.pageUrl = pathname
          await this.navigate(this.mainPage, startPage)
        }
      }

      this.initialized = true
    } catch (error) {
      console.error(error)
    }
  }

  observeComponents() {
    NUI.use({
      observe: [
        {
          cond: nuiEvent.component.page.PAGE_OBJECT,
          fn: async (component, options) => {
            const pageObject = await this.navigate(
              component.get('page'),
              component.get('path'),
            )
            return pageObject
          },
        },
      ],
    })
  }

  observeClient() {
    // When noodl-ui emits this it expects a new "child" instance. To keep memory usage
    // to a minimum, keep the root references the same as the one in the parent instance
    // Currently this is used by components of type: page
    // NUI.on(noodluiEvent.NEW_PAGE_REF, async (ref: NOODLUI) => {
    //   await this.noodl.initPage(ref.page)
    //   log.func(`[observeClient][${noodluiEvent.NEW_PAGE_REF}]`)
    //   log.grey(`Initiated page: ${ref.page}`)
    // })
  }

  // Cleans ac (used for debugging atm)
  observeInternal() {
    // this.mainPage.on(noodluiEvent.SET_PAGE, () => {
    //   if (typeof window !== 'undefined' && 'ac' in window) {
    //     Object.keys(window.ac).forEach((key) => {
    //       delete window.ac[key]
    //     })
    //   }
    // })
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

    const { aspectRatio, width, height } = computeViewportSize({
      width: innerWidth,
      height: innerHeight,
      previousWidth: innerWidth,
      previousHeight: innerHeight,
    })

    setViewportSize({ width, height })
    this.noodl.aspectRatio = aspectRatio

    on(
      'resize',
      function onResize(
        this: App,
        { aspectRatio, width, height }: ReturnType<typeof computeViewportSize>,
      ) {
        log.func('on resize [viewport]')
        this.noodl.aspectRatio = aspectRatio
        document.body.style.width = `${width}px`
        document.body.style.height = `${height}px`
        this.mainPage.rootNode.style.width = `${width}px`
        this.mainPage.rootNode.style.height = `${height}px`
        this.mainPage.components =
          this.noodl?.root?.[this.mainPage.page]?.components || []
        this.ndom.render(this.mainPage)
      }.bind(this),
    )
  }

  observePages() {
    this.mainPage
      .on(
        eventId.page.on.ON_BEFORE_RENDER_COMPONENTS as any,
        async function onBeforeRenderComponents(
          this: App,
          { requesting: pageName, ref, ...rest }: any,
        ) {
          log.func('onBeforeRenderComponents')
          console.log({ pageName, ref })

          // if (ref.request.name !== pageName) {
          //   log.red(
          //     `Skipped rendering the DOM for page "${pageName}" because a more recent request to "${ref.request.name}" was instantiated`,
          //     { requesting: pageName, ref, ...rest },
          //   )
          //   return 'old.request'
          // }
          log.grey(`Rendering the DOM for page: "${pageName}"`, {
            requesting: pageName,
            ref,
            ...rest,
          })

          if (
            /videochat/i.test(this.mainPage.page) &&
            !/videochat/i.test(pageName)
          ) {
            this.meeting.leave()
            log.func('before-page-render')
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

          // isStale
          if (pageName !== this.mainPage.page) {
            // Load the page in the SDK
            const pageObject = await this.#preparePage(pageName)
            // isStale
            const noodluidomPageSnapshot = this.mainPage.snapshot()
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

              // Initialize the noodl-ui client (parses components) if it
              // isn't already initialized
              if (!this.initialized) {
                log.func('before-page-render')
                log.grey('Initializing noodl-ui client', {
                  noodl: this.noodl,
                  pageSnapshot,
                })

                // .catch((err) => console.error(`[${err.name}]: ${err.message}`))
                const config = this.noodl.getConfig()
                const plugins = [] as ComponentObject[]
                if (config.headPlugin) {
                  plugins.push({
                    type: 'pluginHead',
                    path: config.headPlugin,
                  } as any)
                }
                if (config.bodyTopPplugin) {
                  plugins.push({
                    type: 'pluginBodyTop',
                    path: config.bodyTopPplugin,
                  } as any)
                }
                if (config.bodyTailPplugin) {
                  plugins.push({
                    type: 'pluginBodyTail',
                    path: config.bodyTailPplugin,
                  } as any)
                }
                this.mainPage.page = pageName
                this.mainPage.viewport = this.#viewportUtils.viewport
                NUI.use({
                  getAssetsUrl: () => this.noodl.assetsUrl,
                  getBaseUrl: () => this.noodl.cadlBaseUrl || '',
                  getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
                  getPages: () => this.noodl.cadlEndpoint?.page || [],
                  getRoot: () => this.noodl.root,
                  getPlugins: () => plugins,
                })

                // log.func('before-page-render')
                // log.grey('Initialized noodl-ui client', NUI)
              }
              // Refresh the root
              // TODO - Leave root/page auto binded to the lib
              this.mainPage.page = pageName
              // NOTE: not being used atm
              if (
                this.mainPage.rootNode &&
                this.mainPage.rootNode.id !== pageName
              ) {
                this.mainPage.rootNode.id = pageName
              }
              return pageSnapshot
            }
            log.func('before-page-render')
            log.green(`Avoided a duplicate navigate request to "${pageName}"`)

            return pageSnapshot
          }
        }.bind(this),
      )
      .on(
        eventId.page.on.ON_COMPONENTS_RENDERED,
        async ({ requesting: pageName, components }) => {
          log.func('onComponentsRendered')
          log.grey(`Done rendering DOM nodes for ${pageName}`, components)
          window.pcomponents = components
          // Cache to rehydrate if they disconnect
          // TODO
          this.cachePage(pageName)
          log.grey(`Cached page: "${pageName}"`)
        },
      )
      .on(
        eventId.page.on.ON_NAVIGATE_ERROR,
        function onNavigateError(this: App, { error }) {
          console.error(error)
          log.func('page.onError')
          log.red(error.message, error)
          // alert(error.message)
          // TODO - narrow the reasons down more
        },
      )
  }

  /**
   * Callback invoked when Meeting.joinRoom receives the room instance.
   * Initiates participant tracks as well as register listeners for state changes on
   * the room instance.
   * @param { Room } room - Room instance
   */
  observeMeetings(meeting: IMeeting) {
    /* -------------------------------------------------------
    ---- BINDS NODES/PARTICIPANTS TO STREAMS WHEN NODES ARE CREATED
  -------------------------------------------------------- */

    this.ndom.register({
      name: 'chart',
      cond: 'chart',
      resolve(node: HTMLDivElement, component) {
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
          node.style.width = component.getStyle('width') as string
          node.style.height = component.getStyle('height') as string
          const myChart = echarts.init(node)
          const option = dataValue
          option && myChart.setOption(option)
        }
      },
    } as RegisterOptions)

    this.ndom.register({
      name: 'map',
      cond: 'map',
      resolve(node: HTMLDivElement, component) {
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
          console.log('test map1', dataValue)
          const parent = component.parent
          mapboxgl.accessToken =
            'pk.eyJ1IjoiamllamlleXV5IiwiYSI6ImNrbTFtem43NzF4amQyd3A4dmMyZHJhZzQifQ.qUDDq-asx1Q70aq90VDOJA'
          if (dataValue.mapType == 1) {
            dataValue.zoom = dataValue.zoom ? dataValue.zoom : 9
            let flag = !dataValue.hawsOwnProperty('data')
              ? false
              : dataValue.data.length != 0
              ? false
              : true
            let initcenter = flag ? dataValue.data[0] : [-117.9086, 33.8359]
            let map = new mapboxgl.Map({
              container: parent?.id,
              style: 'mapbox://styles/mapbox/streets-v11',
              center: initcenter,
              zoom: dataValue.zoom,
            })
            map.addControl(new mapboxgl.NavigationControl())
            if (flag) {
              let features: any[] = []
              dataValue.data.forEach((element: any) => {
                let item = {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: element,
                  },
                }
                features.push(item)
              })
              console.log('test map2', features)
              //start
              map.on('load', function () {
                // Add an image to use as a custom marker
                map.loadImage(
                  'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
                  function (error: any, image: any) {
                    if (error) throw error
                    map.addImage('custom-marker', image)
                    // Add a GeoJSON source with 2 points
                    map.addSource('points', {
                      type: 'geojson',
                      data: {
                        type: 'FeatureCollection',
                        features,
                      },
                    })
                    // Add a symbol layer
                    map.addLayer({
                      id: 'symbols',
                      type: 'symbol',
                      source: 'points',
                      layout: {
                        'icon-image': 'custom-marker',
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top',
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-padding': 0,
                        'text-allow-overlap': true,
                      },
                    })
                  },
                )
              })
              //end
            }
          }
        }
      },
    } as RegisterOptions)

    this.ndom.register({
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
                    component: NUIComponent.Instance
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
                  component: NUIComponent.Instance
                  ref: typeof ref
                }) => {
                  this.noodl.editDraft(
                    (draft: WritableDraft<{ [key: string]: any }>) => {
                      const seconds = get(draft, dataKey, 0)
                      set(draft, dataKey, seconds + 1)
                      const updatedSecs = get(draft, dataKey)
                      if (
                        updatedSecs !== null &&
                        typeof updatedSecs === 'number'
                      ) {
                        if (seconds === updatedSecs) {
                          // Not updated
                          log.func('text=func timer [ndom.register]')
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

    this.ndom.page.on(
      eventId.page.on.ON_REDRAW_BEFORE_CLEANUP,
      (node, component) => {
        console.log('Removed from component cache: ' + component.id)
        NUI.cache.component.remove(component)
        publish(component, (c) => {
          console.log('Removed from component cache: ' + component.id)
          NUI.cache.component.remove(c)
        })
      },
    )

    this.ndom.register({
      name: 'meeting',
      cond: (node: any, component: any) => !!(node && component),
      resolve: function onMeetingComponent(
        this: App,
        node: any,
        component: any,
      ) {
        // Dominant/main participant/speaker
        if (identify.stream.video.isMainStream(component.blueprint)) {
          const mainStream = this.streams.getMainStream()
          if (!mainStream.isSameElement(node)) {
            mainStream.setElement(node, { uxTag: 'mainStream' })
            log.func('onCreateNode')
            log.green('Bound an element to mainStream', { mainStream, node })
          }
        }
        // Local participant
        else if (identify.stream.video.isSelfStream(component.blueprint)) {
          const selfStream = this.streams.getSelfStream()
          if (!selfStream.isSameElement(node)) {
            selfStream.setElement(node, { uxTag: 'selfStream' })
            log.func('onCreateNode')
            log.green('Bound an element to selfStream', { selfStream, node })
          }
        }
        // Remote participants container
        else if (
          /(vidoeSubStream|videoSubStream)/i.test(component.contentType || '')
        ) {
          let subStreams = this.streams.getSubStreamsContainer()
          if (!subStreams) {
            subStreams = this.streams.createSubStreamsContainer(node, {
              blueprint: component.original?.children?.[0],
              resolver: NUI.resolveComponents.bind(NUI),
            })
            log.func('onCreateNode')
            log.green('Initiated subStreams container', subStreams)
          } else {
            // If an existing subStreams container is already existent in memory, re-initiate
            // the DOM node and blueprint since it was reset from a previous cleanup
            log.red(`BLUEPRINT`, component.blueprint)
            subStreams.container = node
            subStreams.blueprint = component.original?.children?.[0]
            subStreams.resolver = NUI.resolveComponents.bind(NUI)
          }
        }
        // Individual remote participant video element container
        else if (identify.stream.video.isSubStream(component.blueprint)) {
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
      }.bind(this),
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
    const pageHistory = localStorage.getItem(CACHED_PAGES)
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
    localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
    //
  }

  get onAuthStatus() {
    return this.#onAuthStatus
  }

  set onAuthStatus(fn) {
    this.#onAuthStatus = fn
  }
}

export default App
