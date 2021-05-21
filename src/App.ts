import Logger from 'logsnap'
import NOODLDOM, {
  eventId,
  isPage as isNOODLDOMPage,
  Page as NOODLDOMPage,
} from 'noodl-ui-dom'
import * as u from '@jsmanifest/utils'
import { RemoteParticipant } from 'twilio-video'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { PageObject } from 'noodl-types'
import { NUI, Page as NUIPage, Viewport as VP } from 'noodl-ui'
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
import createPlugins from './handlers/plugins'
import createRegisters from './handlers/register'
import createExtendedDOMResolvers from './handlers/dom'
import createElementBinding from './handlers/createElementBinding'
import createMeetingHandlers from './handlers/meeting'
import createMeetingFns from './meeting'
import createTransactions from './handlers/transactions'
import { setDocumentScrollTop, toast } from './utils/dom'
import { isStable, isUnitTestEnv, isOutboundLink } from './utils/common'
import * as T from './app/types'

const log = Logger.create('App.ts')
const stable = isStable()

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
  obs: T.AppObservers = new Map()
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

  get aspectRatio() {
    return this.noodl.aspectRatio
  }

  set aspectRatio(aspectRatio) {
    this.noodl.aspectRatio = aspectRatio
  }

  get authStatus() {
    return this.#state.authStatus
  }

  get actions() {
    return this.nui.cache.actions
  }

  get builtIns() {
    return this.nui.cache.actions.builtIn
  }

  get config() {
    return this.noodl.getConfig()
  }

  get cache() {
    return this.nui.cache
  }

  get currentPage() {
    return this.mainPage.page || ''
  }

  get previousPage() {
    return this.mainPage.getPreviousPage(this.startPage)
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

  get startPage(): string {
    return this.noodl?.cadlEndpoint?.startPage || ''
  }

  get root() {
    return this.noodl.root
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
  async navigate(pageRequesting?: string): Promise<void>
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
      if (isOutboundLink(_pageRequesting)) {
        _page.requesting = ''
        return void (window.location.href = _pageRequesting)
      }
      // Retrieves the page object by using the GET_PAGE_OBJECT transaction registered inside
      // our init() method. Page.components should also contain the components retrieved from
      // that page object
      const req = await this.ndom.request(_page)
      if (req) {
        const components = req.render()
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

      if (!this.getStatus) {
        this.getStatus = (await import('@aitmed/cadl')).Account.getStatus
      }

      !this.noodl && (this.#noodl = (await import('./app/noodl')).default)

      this.firebase = firebase as T.FirebaseApp
      this.messaging = this.getFirebaseState().enabled
        ? this.firebase.messaging()
        : null

      await this.noodl.init()

      this.observeViewport(this.viewport)
      this.observePages(this.mainPage)

      log.func('initialize')
      log.grey(`Initialized @aitmed/cadl sdk instance`)

      const storedCode = isUnitTestEnv() ? 0 : (await this.getStatus())?.code
      // Initialize the user's state before proceeding to decide on how to direct them
      if (storedCode === 0) {
        this.noodl.setFromLocalStorage('user')
        this.#state.authStatus = 'logged.in'
      } else if (storedCode === 1) {
        this.#state.authStatus = 'logged.out'
      } else if (storedCode === 2) {
        this.#state.authStatus = 'new.device'
      } else if (storedCode === 3) {
        this.#state.authStatus = 'temporary'
      }

      NUI.use({
        getAssetsUrl: () => this.noodl.assetsUrl,
        getBaseUrl: () => this.noodl.cadlBaseUrl || '',
        getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
        getPages: () => this.noodl.cadlEndpoint?.page || [],
        getRoot: () => this.noodl.root,
      })

      const actions = createActions(this)
      const builtIns = createBuiltIns(this)
      const plugins = createPlugins(this)
      const registers = createRegisters(this)
      const doms = createExtendedDOMResolvers(this)
      const meetingfns = createMeetingHandlers(this)
      const transactions = createTransactions(this)

      this.ndom.use(actions)
      this.ndom.use({ builtIn: builtIns })
      this.ndom.use({ plugin: plugins })
      this.ndom.use({ transaction: transactions })
      this.ndom.use({ createElementBinding: createElementBinding(this) })
      registers.forEach((keyVal) => this.nui._experimental.register(keyVal))
      doms.forEach((obj) => this.ndom.use({ resolver: obj }))

      this.meeting.onConnected = meetingfns.onConnected
      this.meeting.onAddRemoteParticipant = meetingfns.onAddRemoteParticipant
      this.meeting.onRemoveRemoteParticipant =
        meetingfns.onRemoveRemoteParticipant

      if (this.getFirebaseState().enabled) {
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
      const pageRequesting = page.requesting
      log.func('getPageObject')
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
              event: 'FCMOnTokenReceive',
              params: options,
            })
            return token
          },
          FCMOnTokenRefresh: this.getFirebaseState().enabled
            ? this.messaging?.onTokenRefresh.bind(this.messaging)
            : undefined,
          checkField: self.builtIns.get('checkField')?.find(Boolean)?.fn,
          goto: self.builtIns.get('goto')?.find(Boolean)?.fn,
          hide: self.builtIns.get('hide')?.find(Boolean)?.fn,
          show: self.builtIns.get('show')?.find(Boolean)?.fn,
          redraw: self.builtIns.get('redraw')?.find(Boolean)?.fn,
          videoChat: createVideoChatBuiltIn(this),
        },
      })
      log.func('createPreparePage')
      log.grey(`Ran noodl.initPage on page "${pageRequesting}"`, {
        pageRequesting,
        pageModifiers: page.modifiers,
        pageObject: this?.root[pageRequesting],
        snapshot: page.snapshot(),
      })
      this.emit('onInitPage', this.root[pageRequesting] as PageObject)
      return this.root[pageRequesting]
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
    }
  }

  getFirebaseState() {
    return this.#state.firebase
  }

  getRoomParticipants() {
    return this.meeting.room.participants
  }

  getSdkParticipants(root = this.noodl.root): RemoteParticipant[] {
    return get(root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)
  }

  setSdkParticipants(participants: any[]) {
    this.updateRoot(PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, participants)
    return this.getSdkParticipants()
  }

  observeViewport(viewport: VP) {
    let aspectRatio = VP.getAspectRatio(innerWidth, innerHeight)
    let min: number | undefined
    let max: number | undefined

    !u.isUnd(aspectRatio) && (this.aspectRatio = aspectRatio)

    // REMINDER: The viewWidthHeightRatio in cadlEndpoint (app config) overwrites the viewWidthHeightRatio in root config
    const initMinMax = () => {
      const viewWidthHeightRatio =
        this.noodl.cadlEndpoint?.viewWidthHeightRatio ||
        this.config?.viewWidthHeightRatio

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
        if (this.currentPage === 'VideoChat') return
        this.aspectRatio = aspectRatio
        refreshWidthAndHeight()
        document.body.style.width = `${args.width}px`
        document.body.style.height = `${args.height}px`
        this.mainPage.rootNode.style.width = `${args.width}px`
        this.mainPage.rootNode.style.height = `${args.height}px`
        this.mainPage.components =
          this.root?.[this.currentPage]?.components || []
        this.ndom.render(this.mainPage)
      }
    }
  }

  observePages(page: NOODLDOMPage) {
    const onNavigateStart = () => {
      if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
        log.func('onNavigateStart')
        log.grey(`Removing room listeners...`)
        this.meeting.room?.removeAllListeners?.()
      }
    }

    const onBeforeClearRootNode = () => {
      if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
        log.func('onBeforeClearRootNode')
        const _log = (label: 'selfStream' | 'mainStream' | 'subStreams') => {
          const getSnapshot = () => this[label]?.snapshot()
          const before = getSnapshot()
          this[label]?.reset()
          log.grey(`Wiping ${label} state`, { before, after: getSnapshot() })
        }
        this.meeting.calledOnConnected = false
        this.getSdkParticipants()?.length && this.setSdkParticipants([])
        this.mainStream.hasElement() && _log('mainStream')
        this.selfStream.hasElement() && _log('selfStream')
        this.subStreams?.length && _log('subStreams')
      }
    }

    const onComponentsRendered = (page: NOODLDOMPage) => {
      log.func('onComponentsRendered')
      log.grey(`Done rendering DOM nodes for ${page.page}`, page)
      if (page.page === 'VideoChat') {
        if (this.meeting.isConnected && !this.meeting.calledOnConnected) {
          this.meeting.onConnected(this.meeting.room)
          this.meeting.calledOnConnected = true
          log.grey(`Republishing tracks with meeting.onConnected`)
        }
      }
      // Handle pages that have { viewPort: "top" }
      const pageObjectViewPort = (page.getNuiPage() as NUIPage).object?.()
        .viewPort

      if (pageObjectViewPort) {
        if (pageObjectViewPort === 'top') {
          window.scrollY !== 0 && setDocumentScrollTop()
        } else if (/(center|middle)/i.test(pageObjectViewPort)) {
          setDocumentScrollTop('center')
        } else if (pageObjectViewPort === 'bottom') {
          setDocumentScrollTop('bottom')
        }
      }
    }

    page
      .on(eventId.page.on.ON_NAVIGATE_START, onNavigateStart)
      .on(eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE, onBeforeClearRootNode)
      .on(eventId.page.on.ON_COMPONENTS_RENDERED, onComponentsRendered)
  }

  reset(soft?: boolean) {
    if (soft) {
      const reloadApp = async () => {
        try {
          const { resetInstance: resetSdk } = await import('./app/noodl')
          const currentRoot = this.root
          const currentPage = this.mainPage.page
          delete currentRoot[currentPage]
          this.#noodl = resetSdk()
          await this.#noodl.init()
          u.assign(this.#noodl.root, currentRoot)
          this.cache.component.clear()
          this.mainPage.getNuiPage().object().components = []
          this.mainPage.page = this.mainPage.getPreviousPage(this.startPage)
          this.mainPage.setPreviousPage('')
          this.mainPage.requesting = currentPage
          this.mainPage.components = []
          await this.navigate()
        } catch (error) {
          console.error(error)
        }
      }
      reloadApp()
    } else {
      this.streams.reset()
      if (this.ndom) {
        this.ndom.reset()
        this.mainPage = this.ndom.createPage(
          this.cache.page.length
            ? this.nui.getRootPage()
            : this.nui.createPage({ viewport: this.viewport }),
        ) as NOODLDOMPage
        this.ndom.page = this.mainPage
      }
      has(this.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT) &&
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

  listen<Id extends keyof T.AppObserver, Fn extends T.AppObserver[Id]['fn']>(
    id: Id,
    fn: Fn,
  ) {
    const obsList = this.obs.get(id) || []
    !this.obs.has(id) && this.obs.set(id, obsList)
    !obsList.includes(fn) && obsList.push(fn)
    return this
  }

  emit<
    Id extends keyof T.AppObserver,
    P extends T.AppObserver[Id]['params'] = T.AppObserver[Id]['params'],
  >(id: Id, params?: P) {
    const fns = this.obs.has(id) && this.obs.get(id)
    fns && fns.forEach((fn) => u.isFnc(fn) && fn(params as P))
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
