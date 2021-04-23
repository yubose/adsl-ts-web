import Logger from 'logsnap'
import { createToast } from 'vercel-toast'
import NOODLDOM, {
  eventId,
  isPage as isNOODLDOMPage,
  Page as NOODLDOMPage,
} from 'noodl-ui-dom'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { ComponentObject, Identify } from 'noodl-types'
import { NUI, publish, Viewport as VP } from 'noodl-ui'
import { Draft } from 'immer/dist/internal'
import { CACHED_PAGES, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from './constants'
import {
  AuthStatus,
  CachedPageObject,
  FirebaseApp,
  FirebaseMessaging,
} from './app/types'
import createActions from './handlers/actions'
import createBuiltIns, { createVideoChatBuiltIn } from './handlers/builtIns'
import createRegisters from './handlers/register'
import createExtendedDOMResolvers from './handlers/dom'
import createMeetingHandlers from './handlers/meeting'
import createMeetingFns from './meeting'
import createTransactions from './handlers/transactions'
import * as u from './utils/common'
import * as T from './app/types'

const log = Logger.create('App.ts')
const stable = u.isStable()

class App {
  #state = {
    authStatus: '' as AuthStatus | '',
    initialized: false,
    firebase: {
      enabled: true,
    },
  }
  #meeting: ReturnType<typeof createMeetingFns>
  #noodl: T.AppConstructorOptions['noodl']
  #nui: T.AppConstructorOptions['nui']
  #ndom: T.AppConstructorOptions['ndom']
  _store: {
    messaging: {
      serviceRegistration: ServiceWorkerRegistration
      token: string
      vapidKey?: string
    }
  } = {
    messaging: {
      serviceRegistration: {} as ServiceWorkerRegistration,
      token: '',
      vapidKey: '',
    },
  }
  firebase = {} as FirebaseApp
  getStatus: T.AppConstructorOptions['getStatus']
  messaging = null as FirebaseMessaging | null
  mainPage: NOODLDOM['page']

  constructor({
    getStatus,
    meeting,
    noodl,
    nui = NUI,
    ndom = new NOODLDOM(nui),
    viewport = new VP(),
  }: T.AppConstructorOptions = {}) {
    this.getStatus = getStatus
    this.mainPage = ndom.createPage(
      nui.cache.page.length ? nui.getRootPage() : nui.createPage({ viewport }),
    )
    this.#meeting =
      (meeting && u.isFnc(meeting) ? meeting(this) : meeting) ||
      createMeetingFns(this)
    this.#ndom = ndom
    this.#nui = nui

    noodl && (this.#noodl = noodl)
  }

  get authStatus() {
    return this.#state.authStatus
  }

  get initialized() {
    return this.#state.initialized
  }

  get meeting() {
    return this.#meeting
  }

  get noodl() {
    return this.#noodl as NonNullable<T.AppConstructorOptions['noodl']>
  }

  get nui() {
    return this.#nui as NonNullable<T.AppConstructorOptions['nui']>
  }

  get ndom() {
    return this.#ndom as NonNullable<T.AppConstructorOptions['ndom']>
  }

  get mainStream() {
    return this.#meeting.mainStream
  }

  get selfStream() {
    return this.#meeting.selfStream
  }

  get subStreams() {
    return this.meeting.subStreams
  }

  get streams() {
    return this.meeting.streams
  }

  get viewport() {
    return this.mainPage.viewport as VP
  }

  /**
   * Navigates to a page specified in page.requesting
   * The value set in page.requesting should be set prior to this call unless pageRequesting is provided where it will be set to it automatically
   * If only a page name is provided, by default the main page instance will be used
   * @param { NOODLDOMPage } page
   * @param { string | undefined } pageRequesting
   */
  async navigate(page: NOODLDOMPage, pageRequesting?: string): Promise<void>
  async navigate(pageRequesting: string): Promise<void>
  async navigate(page?: NOODLDOMPage | string, pageRequesting?: string) {
    try {
      let _page: NOODLDOMPage
      let _pageRequesting = ''

      if (isNOODLDOMPage(page)) {
        _page = page
        pageRequesting && (_pageRequesting = pageRequesting)
      } else {
        _page = this.mainPage
        u.isStr(page) && (_pageRequesting = page)
      }

      if (_pageRequesting && _page.requesting !== _pageRequesting) {
        _page.requesting = _pageRequesting
      }

      if (u.isOutboundLink(_pageRequesting)) {
        _page.requesting = ''
        return void (window.location.href = _pageRequesting)
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
        window.pcomponents = components
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  async initialize({
    firebase: { client: firebase, vapidKey } = {},
    firebaseSupported = true,
  }: {
    firebase?: { client?: App['firebase']; vapidKey?: string }
    firebaseSupported?: boolean
  } = {}) {
    try {
      !firebaseSupported && (this.#state.firebase.enabled = false)
      vapidKey && (this._store.messaging.vapidKey = vapidKey)

      !this.getStatus &&
        (this.getStatus = (await import('@aitmed/cadl')).Account.getStatus)

      !this.noodl && (this.#noodl = (await import('./app/noodl')).default)

      this.firebase = firebase as T.FirebaseApp
      this.messaging = this.#state.firebase.enabled
        ? this.firebase.messaging()
        : null

      await this.noodl.init()

      this.observeViewport(this.viewport)
      this.observePages(this.mainPage)

      log.func('initialize')
      stable && log.cyan(`Initialized @aitmed/cadl sdk instance`)

      let storedStatus = {} as { code: number }

      if (process.env.NODE_ENV === 'test') {
        storedStatus = { code: 0 }
      } else {
        storedStatus = await this.getStatus()
      }
      // Initialize the user's state before proceeding to decide on how to direct them
      if (storedStatus.code === 0) {
        this.noodl.setFromLocalStorage('user')
        this.#state.authStatus = 'logged.in'
      } else if (storedStatus.code === 1) {
        this.#state.authStatus = 'logged.out'
      } else if (storedStatus.code === 2) {
        this.#state.authStatus = 'new.device'
      } else if (storedStatus.code === 3) {
        this.#state.authStatus = 'temporary'
      }

      const config = this.noodl.getConfig()
      const plugins = [] as ComponentObject[]

      config.headPlugin &&
        plugins.push({ type: 'pluginHead', path: config.headPlugin })
      config.bodyTopPplugin &&
        plugins.push({ type: 'pluginBodyTop', path: config.bodyTopPplugin })
      config.bodyTailPplugin &&
        plugins.push({ type: 'pluginBodyTail', path: config.bodyTailPplugin })

      NUI.use({
        getAssetsUrl: () => this.noodl.assetsUrl,
        getBaseUrl: () => this.noodl.cadlBaseUrl || '',
        getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
        getPages: () => this.noodl.cadlEndpoint?.page || [],
        getRoot: () => this.noodl.root,
      })

      const actions = createActions(this)
      const builtIns = createBuiltIns(this)
      const registers = createRegisters(this)
      const doms = createExtendedDOMResolvers(this)
      const meetingfns = createMeetingHandlers(this)
      const transactions = createTransactions(this)

      this.ndom.use(actions)
      this.ndom.use({ builtIn: builtIns })
      this.ndom.use({ transaction: transactions })
      registers.forEach((obj) => this.ndom.use({ register: obj }))
      doms.forEach((obj) => this.ndom.use({ resolver: obj }))

      this.meeting.onConnected = meetingfns.onConnected
      this.meeting.onAddRemoteParticipant = meetingfns.onAddRemoteParticipant
      this.meeting.onRemoveRemoteParticipant =
        meetingfns.onRemoveRemoteParticipant

      if (this.#state.firebase.enabled) {
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

      /* -------------------------------------------------------
      ---- LOCAL STORAGE
    -------------------------------------------------------- */
      let startPage = this.noodl.cadlEndpoint?.startPage
      stable && log.cyan(`Start page: ${startPage}`)

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
        let { startPage } = this.noodl.cadlEndpoint
        const urlParts = location.href.split('/')
        const pathname = urlParts[urlParts.length - 1]
        const localConfig = JSON.parse(ls.getItem('config') || '{}') || {}
        const tempConfigKey = ls.getItem('tempConfigKey')

        if (
          tempConfigKey &&
          tempConfigKey !== JSON.stringify(localConfig.timestamp)
        ) {
          // Set the URL / cached pages to their base state
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

      this.#state.initialized = true
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getPageObject(page: NOODLDOMPage) {
    try {
      log.func('getPageObject')
      const pageRequesting = page.requesting
      log.grey(
        `Running noodl.initPage for page "${pageRequesting}"`,
        page.snapshot(),
      )

      let self = this
      await this.noodl?.initPage(pageRequesting, [], {
        ...page.modifiers[pageRequesting],
        builtIn: {
          FCMOnTokenReceive: async (options?: any) => {
            const token = await NUI.emit({
              type: 'register',
              args: { name: 'FCMOnTokenReceive', params: options },
            })
            return token
          },
          FCMOnTokenRefresh: this.#state.firebase.enabled
            ? this.messaging?.onTokenRefresh.bind(this.messaging)
            : undefined,
          checkField: self.ndom.builtIns.get('checkField')?.find(Boolean)?.fn,
          goto: self.ndom.builtIns.get('goto')?.find(Boolean)?.fn,
          videoChat: createVideoChatBuiltIn(this),
        },
      })
      log.func('createPreparePage')
      log.grey(`Ran noodl.initPage on page "${pageRequesting}"`, {
        pageRequesting,
        pageModifiers: page.modifiers,
        pageObject: this.noodl?.root[pageRequesting],
        snapshot: page.snapshot(),
      })
      if (this.noodl?.root?.Global?.globalRegister) {
        const { Global } = this.noodl.root
        if (Array.isArray(Global.globalRegister)) {
          if (Global.globalRegister.length) {
            log.grey(
              `Scanning ${Global.globalRegister.length} items found in Global.globalRegister`,
              Global.globalRegister,
            )
            Global.globalRegister.forEach((value: any) => {
              if (u.isObj(value)) {
                if (Identify.component.register(value)) {
                  log.grey(
                    `Found and attached a "register" component to the register store`,
                    value,
                  )
                  NUI.use({
                    register: {
                      name: value.onEvent as string,
                      component: value,
                    },
                  })
                }
              }
            })
          }
        }
      }
      return this.noodl.root[pageRequesting]
    } catch (error) {
      console.error(error)
      createToast(error.message, { type: 'error' })
    }
  }

  getFirebaseState() {
    return this.#state.firebase
  }

  observeViewport(viewport: VP) {
    let aspectRatio = VP.getAspectRatio(innerWidth, innerHeight)
    let min: number | undefined
    let max: number | undefined

    this.noodl.aspectRatio = u.isUnd(aspectRatio)
      ? this.noodl.aspectRatio
      : aspectRatio

    // REMINDER: The viewWidthHeightRatio in cadlEndpoint (app config) overwrites the viewWidthHeightRatio in root config
    const initMinMax = () => {
      const viewWidthHeightRatio =
        this.noodl.cadlEndpoint?.viewWidthHeightRatio ||
        this.noodl.getConfig?.()?.viewWidthHeightRatio

      if (viewWidthHeightRatio) {
        min = Number(viewWidthHeightRatio.min)
        max = Number(viewWidthHeightRatio.max)
      }
    }

    // Should be participating in the 'resize' event
    const refreshWidthAndHeight = (w?: number, h?: number) => {
      if (u.isUnd(w) || u.isUnd(h)) {
        w = innerWidth
        h = innerHeight
      }

      if (min && max) {
        if ((aspectRatio as number) < min) w = min * h
        else if ((aspectRatio as number) > max) w = max * h
        const sizes = VP.applyMinMax({
          aspectRatio,
          min: min,
          max: max,
          width: w,
          height: h,
        })
        viewport.width = sizes.width
        viewport.height = sizes.height
      } else {
        viewport.width = w
        viewport.height = h
      }
    }

    initMinMax()
    refreshWidthAndHeight()

    viewport.onResize = async (args) => {
      if (
        args.width !== args.previousWidth ||
        args.height !== args.previousHeight
      ) {
        console.log('VP changed', args)
        if (this.mainPage.page === 'VideoChat') {
          log.func('onResize')
          return log.grey(
            `Skipping avoiding the page rerender on the VideoChat "onresize" event`,
          )
        }

        this.noodl.aspectRatio = aspectRatio as number
        refreshWidthAndHeight()
        document.body.style.width = `${args.width}px`
        document.body.style.height = `${args.height}px`
        this.mainPage.rootNode.style.width = `${args.width}px`
        this.mainPage.rootNode.style.height = `${args.height}px`
        this.mainPage.components =
          this.noodl?.root?.[this.mainPage.page]?.components || []
        this.ndom.render(this.mainPage)
      }
    }
  }

  observePages(page: NOODLDOMPage) {
    if (
      !this.mainPage.hooks[eventId.page.on.ON_REDRAW_BEFORE_CLEANUP]?.length
    ) {
      this.ndom.page.on(
        eventId.page.on.ON_REDRAW_BEFORE_CLEANUP,
        (node, component) => {
          console.log(
            `Removed a ${component.type} component from cache: ${component.id}`,
          )
          NUI.cache.component.remove(component)
          publish(component, (c) => {
            console.log(`Removed a ${c.type} component from cache: ${c.id}`)
            NUI.cache.component.remove(c)
          })
        },
      )
    }

    page
      .on(
        eventId.page.on.ON_NAVIGATE_START,
        function onNavigateStart(this: App) {
          if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
            log.func('onNavigateStart')
            log.grey(`Removing room listeners...`)
            this.meeting.room?.removeAllListeners?.()
          }
        }.bind(this),
      )
      .on(
        eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE,
        function onBeforeClearRootNode(this: App) {
          if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
            this.meeting.calledOnConnected = false
            // Empty the current participants list since we manage the list of
            // participants ourselves
            let participants = get(
              this.noodl.root,
              PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
            )
            if (participants?.length) {
              let participantsBefore = participants.slice()
              participants.length = 0
              log.grey('Removed participants from SDK', {
                before: participantsBefore,
                after: get(
                  this.noodl.root,
                  PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
                ),
              })
              participantsBefore = null
            }

            if (this.streams.mainStream.hasElement()) {
              const before = this.streams.mainStream.snapshot()
              this.streams.mainStream.reset()
              log.grey('Wiping mainStream state', {
                before,
                after: this.streams.mainStream.snapshot(),
              })
            }
            // if (this.streams.selfStream.hasElement()) {
            //   const before = this.streams.selfStream.snapshot()
            //   this.streams.selfStream.reset()
            //   log.grey('Wiping selfStream state', {
            //     before,
            //     after: this.streams.selfStream.snapshot(),
            //   })
            // }

            if (this.streams.subStreams?.length) {
              const before = this.streams.subStreams
                .getSubstreamsCollection()
                ?.map((stream) => stream?.snapshot?.())

              this.streams.subStreams.reset()

              log.grey('Wiping subStreams state', {
                before,
                after: this.streams.subStreams
                  .getSubstreamsCollection()
                  ?.map((stream) => stream?.snapshot?.()),
              })
            }
          }
        }.bind(this),
      )
      .on(eventId.page.on.ON_COMPONENTS_RENDERED, async (page) => {
        log.func(eventId.page.on.ON_COMPONENTS_RENDERED)
        log.grey(`Done rendering DOM nodes for ${page.page}`, page)

        if (page.page === 'VideoChat') {
          if (
            this.meeting.room?.state === 'connected' &&
            !this.meeting.calledOnConnected
          ) {
            this.meeting.onConnected(this.meeting.room)
            this.meeting.calledOnConnected = true
            log.grey(`Invoked meeting.onConnected for republishing tracks`)
          }
        }

        // Cache to rehydrate if they disconnect
        // TODO
        // this.cachePage(pageName)
        // log.grey(`Cached page: "${page.page}"`)
      })
  }

  reset() {
    this.streams.reset()
    if (this.ndom) {
      this.ndom.reset()
      this.mainPage = this.ndom.createPage(
        this.nui.cache.page.length
          ? this.nui.getRootPage()
          : this.nui.createPage({ viewport: this.viewport }),
      ) as NOODLDOMPage
      this.ndom.page = this.mainPage
    }

    if (has(this.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
      this.updateRoot((draft) => {
        set(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, [])
      })
    }
  }

  /**
   * Update pattern #1:
   *    app.updateRoot('SignIn.verificationCode.response', { edge: {...} }, function onUpdate() {...})
   *
   * Update pattern #2:
   *    app.updateRoot((draft) => {
   *      draft.SignIn.verificationCode.response = { edge: {...}}
   *    }, function onUpdate() {...})
   */
  updateRoot<P extends string>(
    path: P,
    value: any,
    cb?: (root: Record<string, any>) => void,
  ): void
  updateRoot(
    fn: (
      draft: Draft<App['noodl']['root']>,
      cb?: (root: Record<string, any>) => void,
    ) => void,
  ): void
  updateRoot<P extends string>(
    fn: ((draft: Draft<App['noodl']['root']>) => void) | P,
    value?: any | (() => void),
    cb?: (root: Record<string, any>) => void,
  ) {
    this.noodl?.editDraft?.(function editDraft(
      draft: Draft<App['noodl']['root']>,
    ) {
      if (u.isStr(fn)) {
        set(draft, fn, value)
      } else {
        fn(draft)
        u.isFnc(value) && (cb = value)
      }
    })
    cb?.(this.noodl.root)
  }
  /* -------------------------------------------------------
    ---- LOCAL STORAGE HELPERS FOR CACHED PAGES
  -------------------------------------------------------- */
  /**
   * Adds the current page name to the end in the list of cached pages
   * @param { string } name - Page name
   */
  cachePage(name: string) {
    const cacheObj = { name } as CachedPageObject
    const prevCache = this.getCachedPages()
    if (prevCache[0]?.name === name) return
    const cache = [cacheObj, ...prevCache]
    if (cache.length >= 12) cache.pop()
    cacheObj.timestamp = Date.now()
    window.localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
  }

  /** Retrieves a list of cached pages */
  getCachedPages(): T.CachedPageObject[] {
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
}

export default App
