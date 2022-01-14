import Logger from 'logsnap'
import NOODLDOM, {
  BASE_PAGE_URL,
  eventId,
  isPage as isNOODLDOMPage,
  Page as NOODLDOMPage,
} from 'noodl-ui-dom'
import { Account } from '@aitmed/cadl'
import type { CADL } from '@aitmed/cadl'
import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import * as nu from 'noodl-utils'
import { AppConfig, Identify, PageObject, ReferenceString } from 'noodl-types'
import { NUI, Page as NUIPage, Viewport as VP } from 'noodl-ui'
import { CACHED_PAGES, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from './constants'
import { AuthStatus, CachedPageObject } from './app/types'
import AppNotification from './app/Notifications'
import actionFactory from './factories/actionFactory'
import createActions from './handlers/actions'
import createBuiltIns from './handlers/builtIns'
import createGoto from './handlers/shared/goto'
import createPlugins from './handlers/plugins'
import createRegisters from './handlers/register'
import createExtendedDOMResolvers from './handlers/dom'
import createElementBinding from './handlers/createElementBinding'
import createMeetingHandlers from './handlers/meeting'
import createMeetingFns from './meeting'
import createNoodlConfigValidator from './modules/NoodlConfigValidator'
import createPickNUIPage from './utils/createPickNUIPage'
import createPickNDOMPage from './utils/createPickNDOMPage'
import createTransactions from './handlers/transactions'
import createMiddleware from './handlers/shared/middlewares'
import parseUrl from './utils/parseUrl'
import Spinner from './spinner'
import { getSdkHelpers } from './handlers/sdk'
import { setDocumentScrollTop, toast } from './utils/dom'
import { isUnitTestEnv } from './utils/common'
import * as c from './constants'
import * as t from './app/types'

const log = Logger.create('App.ts')

class App {
  #state = {
    authStatus: '' as AuthStatus | '',
    initialized: false,
    loadingPages: {} as Record<string, { id: string; init: boolean }[]>,
    spinner: {
      active: false,
      config: {
        delay: c.DEFAULT_SPINNER_DELAY,
        timeout: c.DEFAULT_SPINNER_TIMEOUT,
      },
      page: null,
      timeout: null,
      trigger: null,
    } as t.SpinnerState,
  }
  #instances = {
    FullCalendar: {
      inst: null as null | InstanceType<typeof FullCalendar.Calendar>,
      page: '',
    },
  }
  #meeting: ReturnType<typeof createMeetingFns>
  #notification: t.AppConstructorOptions['notification']
  #noodl: t.AppConstructorOptions['noodl']
  #nui: t.AppConstructorOptions['nui']
  #ndom: t.AppConstructorOptions['ndom']
  #parser: nu.Parser
  #spinner: Spinner
  #sdkHelpers: ReturnType<typeof getSdkHelpers>
  #serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  #worker: Worker | null = null
  // #worker: ReturnType<typeof NoodlWorker>
  actionFactory = actionFactory(this)
  goto: ReturnType<typeof createGoto>
  obs: t.AppObservers = new Map()
  getStatus: t.AppConstructorOptions['getStatus']
  mainPage: NOODLDOM['page']
  pickNUIPage = createPickNUIPage(this)
  pickNDOMPage = createPickNDOMPage(this);

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.#state,
      startPage: this.startPage,
      previousPage: this.previousPage,
      getPreviousPage: this.mainPage.getPreviousPage(this.startPage),
      currentPage: this.currentPage,
      requestingPage: this.mainPage.requesting,
      aspectRatio: this.aspectRatio,
      cachedPages: this.getCachedPages(),
      roomParticipants: this.getRoomParticipants(),
      sdkParticipants: this.getSdkParticipants(),
      viewport: {
        width: this.viewport.width,
        height: this.viewport.height,
      },
    }
  }

  static id = `aitmed-noodl-web`

  constructor({
    getStatus,
    meeting,
    noodl,
    notification,
    nui = NUI,
    ndom = new NOODLDOM(),
    viewport = new VP(),
  }: t.AppConstructorOptions = {}) {
    this.getStatus = getStatus
    this.mainPage = ndom.createPage(
      nui.cache.page.length ? nui.getRootPage() : nui.createPage({ viewport }),
    )
    this.#meeting =
      (meeting && u.isFnc(meeting) ? meeting(this) : meeting) ||
      createMeetingFns(this)
    this.#notification = notification
    this.#ndom = ndom
    this.#nui = nui
    this.#sdkHelpers = getSdkHelpers(this)
    this.#spinner = new Spinner()
    this.goto = createGoto(this)

    noodl && (this.#noodl = noodl)
    this.#parser = new nu.Parser()
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
    return this.noodl.config
  }

  get cache() {
    return this.nui.cache
  }

  get instances() {
    return this.#instances
  }

  get spinner() {
    return this.#spinner
  }

  get pendingPage() {
    return this.mainPage.requesting || ''
  }

  get currentPage() {
    return this.mainPage.page || ''
  }

  get previousPage() {
    return this.mainPage.getPreviousPage(this.startPage)
  }

  get globalRegister() {
    return this.noodl.root?.Global?.globalRegister
  }

  get loadingPages() {
    return this.#state.loadingPages
  }

  get initialized() {
    return this.#state.initialized
  }

  get meeting() {
    return this.#meeting
  }

  get noodl() {
    return this.#noodl as CADL
  }

  get nui() {
    return this.#nui as typeof NUI
  }

  get ndom() {
    return this.#ndom as NonNullable<t.AppConstructorOptions['ndom']>
  }

  get notification() {
    return this.#notification as AppNotification
  }

  get parse() {
    return this.#parser
  }

  get mainStream() {
    return this.#meeting.mainStream
  }

  get selfStream() {
    return this.#meeting.selfStream
  }

  get serviceWorker() {
    return this.#serviceWorkerRegistration?.active as ServiceWorker
  }

  get serviceWorkerRegistration() {
    return this.#serviceWorkerRegistration
  }

  set serviceWorkerRegistration(reg: ServiceWorkerRegistration | null) {
    this.#serviceWorkerRegistration = reg
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

  get worker() {
    return this.#worker
  }

  getState() {
    return this.#state
  }

  // get worker() {
  //   return this.#worker
  // }

  /**
   * Navigates to a page specified in page.requesting
   * The value set in page.requesting should be set prior to this call unless pageRequesting is provided where it will be set to it automatically
   * If only a page name is provided, by default the main page instance will be used
   * @param { NOODLDOMPage } page
   * @param { string | undefined } pageRequesting
   */
  async navigate(
    page: NOODLDOMPage,
    pageRequesting?: string,
    opts?: { isGoto?: boolean },
  ): Promise<void>
  async navigate(pageRequesting?: string): Promise<void>
  async navigate(
    page?: NOODLDOMPage | string,
    pageRequesting?: string,
    { isGoto }: { isGoto?: boolean } = {},
  ) {
    function getParams(pageName: string) {
      const nameParts = pageName.split('&')
      let params = {}
      if (nameParts.length > 1) {
        for (let i = 1; i < nameParts.length; i++) {
          const partItem = nameParts[i]
          const parts = partItem.split('=')
          params[parts[0]] = parts[1]
        }
      }
      return params
    }

    try {
      let _page: NOODLDOMPage
      let _pageRequesting = ''

      const ls = window.localStorage
      let pageUrl = pageRequesting ? pageRequesting : page

      if (isNOODLDOMPage(pageUrl)) {
        pageUrl = pageUrl.page
      }

      if (pageUrl && pageUrl.includes('&')) {
        if (nu.isOutboundLink(pageUrl)) {
          return void (window.location.href = pageUrl)
        }
        const params = getParams(pageUrl)
        const curretPage = pageUrl.includes('&')
          ? pageUrl.substring(0, pageUrl.indexOf('&'))
          : pageUrl
        if (isNOODLDOMPage(page)) {
          pageRequesting = curretPage
        } else {
          page = curretPage
        }
        ls.setItem('tempParams', JSON.stringify(params))
      }

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
      if (nu.isOutboundLink(_pageRequesting)) {
        _page.requesting = ''
        return void (window.location.href = _pageRequesting)
      }

      if (_page.page && _page.requesting && _page.page !== _page.requesting) {
        // If this is a goto, we must delete the page we are redirecting to if it previously was used in the root object
        if (isGoto) {
          if (_page.requesting in this.noodl.root) {
            if (location.search) {
              // If we are going to a page where we were from before, we must destroy the pages that followed it
              const parts = (
                location.search.startsWith('?')
                  ? location.search.slice(1)
                  : location.search
              ).split('-')

              if (parts.includes(_page.requesting)) {
                let pageToDestroy = parts.pop()

                while (pageToDestroy && pageToDestroy !== _page.requesting) {
                  if (pageToDestroy in this.noodl.root) {
                    delete this.noodl.root[pageToDestroy]
                    console.log(
                      `%cRemoved "${pageToDestroy}" from the page stack`,
                      `color:#00b406;`,
                    )
                  }
                  pageToDestroy = parts.pop()
                }
              }
            }
            if (_page.requesting in this.noodl.root) {
              delete this.noodl.root[_page.requesting]
            }
          }
        } else {
          // Otherwise if this is a goBack we must delete the current page
          delete this.noodl.root[_page.page]
        }
      }

      // Retrieves the page object by using the GET_PAGE_OBJECT transaction registered inside our init() method. Page.components should also contain the components retrieved from that page object
      const req = await this.ndom.request(_page)
      if (req) {
        // @ts-expect-error
        delete window.pcomponents
        const components = await this.render(_page)
        window.pcomponents = components as any
      }
    } catch (error) {
      console.error(error)
      throw new Error(error as any)
    }
  }

  async initialize({
    onInitNotification,
    onSdkInit,
    onWorker,
  }: {
    onInitNotification?: (notification: AppNotification) => Promise<void>
    onSdkInit?: (sdk: CADL) => void
    onWorker?: (worker: Worker) => void
  } = {}) {
    try {
      // if (process.env.NODE_ENV !== 'test' && window.Worker) {
      //   this.#worker = new Worker('worker.js')
      //   onWorker?.(this.worker as Worker)
      // }

      if (!this.getState().spinner.active) this.enableSpinner()
      if (!this.getStatus) this.getStatus = Account.getStatus

      !this.noodl && (this.#noodl = (await import('./app/noodl')).default)

      if (!this.notification) {
        this.#notification = new (await import('./app/Notifications')).default()
        log.grey(`Initialized notifications`, this.#notification)
        onInitNotification && (await onInitNotification?.(this.#notification))
      }

      const lastDOM = localStorage.getItem('__last__') || ''
      if (lastDOM) {
        const renderCachedState = (
          rootEl: HTMLElement,
          lastState: t.StoredDOMState,
        ) => {
          rootEl.innerHTML = lastState.root

          if (u.isNum(lastState.x) && u.isNum(lastState.y)) {
            window.scrollTo({
              behavior: 'auto',
              left: lastState.x,
              top: lastState.y,
            })
          }

          for (const btn of Array.from(rootEl.querySelectorAll('button'))) {
            btn.textContent = 'Loading...'
            btn.style.userSelect = 'none'
            btn.style.pointerEvents = 'none'
          }

          for (const inputEl of [
            ...Array.from(rootEl.querySelectorAll('input')),
            ...Array.from(rootEl.querySelectorAll('select')),
            ...Array.from(rootEl.querySelectorAll('textarea')),
          ]) {
            inputEl.disabled = true
          }
        }

        try {
          const lastState = JSON.parse(lastDOM) as t.StoredDOMState
          if (lastState?.root) {
            const rootEl = document.getElementById('root')
            if (rootEl) {
              if (lastState.page !== lastState.startPage) {
                if (await this.noodl.root.builtIn.SignInOk()) {
                  renderCachedState(rootEl, lastState)
                }
              } else {
                renderCachedState(rootEl, lastState)
              }
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.log(
            `%c[Rehydration] ${err.name}: ${err.message}`,
            'color:tomato',
            err,
          )
        }
      }

      this.noodl.on('QUEUE_START', () => {
        if (!this.getState().spinner.active) this.enableSpinner()
      })

      this.noodl.on('QUEUE_END', () => {
        if (!this.noodl.getState().queue?.length) {
          if (this.getState().spinner.active) this.disableSpinner()
        }
      })

      await this.noodl.init()
      onSdkInit?.(this.noodl)

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

      this.nui.use({
        getAssetsUrl: () => {
          return this.noodl.assetsUrl
        },
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
      const middlewares = createMiddleware(this)
      const transactions = createTransactions(this)

      this.ndom.use(actions)
      this.ndom.use({ builtIn: builtIns })
      this.ndom.use({ plugin: plugins })
      this.ndom.use({ transaction: transactions })
      this.ndom.use({ createElementBinding: createElementBinding(this) })

      u.forEach((obj) => this.ndom.use({ resolver: obj }), doms)
      u.forEach(
        (keyVal) => this.nui._experimental?.['register' as any]?.(...keyVal),
        registers,
      )
      u.entries(middlewares).forEach(([id, fn]) =>
        this.actionFactory.createMiddleware(id, fn),
      )

      this.meeting.onConnected = meetingfns.onConnected
      this.meeting.onAddRemoteParticipant = meetingfns.onAddRemoteParticipant
      this.meeting.onRemoveRemoteParticipant =
        meetingfns.onRemoveRemoteParticipant

      this.observeViewport(this.viewport)
      this.observePages(this.mainPage)

      /**
       * Determining the start page or initial action
       */
      const parsedUrl = parseUrl(
        this.#noodl?.cadlEndpoint as AppConfig,
        window.location.href,
      )

      let startPage = parsedUrl.startPage

      if (parsedUrl.hasParams) {
        this.mainPage.pageUrl = parsedUrl.pageUrl
        if (u.isArr(this.noodl?.cadlEndpoint?.page)) {
          if (!this.noodl?.cadlEndpoint?.page.includes(parsedUrl.startPage)) {
            // Fall back to the original start page if it is an invalid page
            startPage = this.noodl?.cadlEndpoint?.startPage || startPage || ''
            this.mainPage.pageUrl = BASE_PAGE_URL
          }
        }
        this.mainPage.pageUrl = this.mainPage.pageUrl + parsedUrl?.paramsStr
        await this.navigate(this.mainPage, parsedUrl?.currentPage)
      } else {
        startPage = this.noodl.cadlEndpoint?.startPage || ''
      }

      // Override the start page if they were on a previous page
      const cachedPages = this.getCachedPages()
      const cachedPage = cachedPages[0]

      if (cachedPages?.length) {
        if (cachedPage?.name && cachedPage.name !== startPage) {
          startPage = cachedPage.name
        }
      }

      const ls = createNoodlConfigValidator({
        configKey: 'config',
        timestampKey: 'timestamp',
        get: (key: string) => localStorage.getItem(key),
        set: (key: string, value: any) => void localStorage.setItem(key, value),
      })

      if (!ls.getTimestampKey() && ls.configExists()) ls.cacheTimestamp()

      if (this.mainPage && location.href && !parsedUrl.hasParams) {
        let { startPage = '' } = this.noodl.cadlEndpoint || {}
        const urlParts = location.href.split('/')
        const pathname = urlParts[urlParts.length - 1]

        if (!ls.isTimestampEq()) {
          // Set the URL / cached pages to their base state
          localStorage.setItem('CACHED_PAGES', JSON.stringify([]))
          this.mainPage.pageUrl = BASE_PAGE_URL
          await this.navigate(this.mainPage, startPage)
          ls.cacheTimestamp()
        } else if (!pathname?.startsWith(BASE_PAGE_URL)) {
          this.mainPage.pageUrl = BASE_PAGE_URL
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
    } finally {
      if (!this.noodl.getState()?.queue?.length) {
        if (this.getState().spinner?.active) {
          this.disableSpinner()
        }
      }
    }
  }

  async getPageObject(page: NOODLDOMPage): Promise<void | { aborted: true }> {
    if (!this.getState().spinner.active) {
      this.enableSpinner({ target: page?.node || this.mainPage?.node })
    }

    try {
      const pageRequesting = page.requesting
      const currentPage = page.page
      const loadingState = this.#state.loadingPages?.[pageRequesting] || []

      if (!(pageRequesting in this.loadingPages)) {
        this.loadingPages[pageRequesting] = loadingState
      }

      const currentIndex = loadingState.findIndex((o) => o.id === page.id)

      if (currentIndex === -1) {
        loadingState.push({ id: page.id as string, init: true })
      }

      log.func('getPageObject')
      log.teal(`Running noodl.initPage for page "${pageRequesting}"`)

      if (pageRequesting === currentPage) {
        console.log(
          `%cYou are already on the "${pageRequesting}" page. ` +
            `The page is unnecessarily rendering twice to the DOM`,
          `color:#ec0000;`,
        )
      } else {
        // delete this.noodl.root[currentPage]
      }

      let isAborted = false
      let isAbortedFromSDK = false as boolean | undefined

      if (page.previous === page.requesting) page.previous = page.page

      isAbortedFromSDK = (
        await this.noodl?.initPage(pageRequesting, ['listObject', 'list'], {
          ...(page.modifiers?.[pageRequesting] as any),
          builtIn: this.#sdkHelpers.initPageBuiltIns,
          onBeforeInit: (init) => {
            log.func('onBeforeInit')
            log.grey('', { init, page: pageRequesting })
          },
          onInit: async (current, index, init) => {
            log.func('onInit')
            log.grey('', { current, index, init, page: pageRequesting })

            const validateReference = (ref: string) => {
              const datapath = nu.trimReference(ref as ReferenceString)
              const location = ref.startsWith(`=.builtIn`)
                ? 'root'
                : Identify.localKey(datapath)
                ? 'local'
                : 'root'
              if (
                !has(
                  location === 'local' ? this.root[pageRequesting] : this.root,
                  datapath.split('.'),
                )
              ) {
                log.func(`${pageRequesting} init`)
                log.red(
                  `The reference "${ref}" is missing from the ${
                    location === 'local'
                      ? `local root for page "${pageRequesting}"`
                      : 'root'
                  }`,
                  {
                    previous: init[index - 1],
                    current: { value: current, index },
                    next: init[index + 1],
                    datapath,
                    location,
                    page: pageRequesting,
                    snapshot: cloneDeep(
                      location === 'root'
                        ? this.root
                        : this.root[pageRequesting],
                    ),
                  },
                )
              }
            }

            const validateObject = (obj: Record<string, any>) => {
              for (const [key, value] of u.entries(obj)) {
                Identify.reference(key) && validateReference(key)
                Identify.reference(value) && validateReference(value)
                if (u.isObj(value)) validateObject(value)
              }
            }

            u.isObj(current) && validateObject(current)

            if (!isAborted) {
              let currentIndex = this.loadingPages[pageRequesting]?.findIndex?.(
                (o) => o.id === page.id,
              )

              if (currentIndex > -1) {
                if (currentIndex > 0) {
                  isAborted = true
                  this.loadingPages[pageRequesting].splice(currentIndex, 1)
                } else {
                  this.loadingPages[pageRequesting].shift()
                }
              }
            }
          },
          onAfterInit: (err, init) => {
            if (err) throw err
            log.func('onAfterInit')
            log.grey('', { err, init, page: pageRequesting })
            let currentIndex = this.loadingPages[pageRequesting]?.findIndex?.(
              (o) => o.id === page.id,
            )
            if (currentIndex > -1) {
              if (currentIndex > 0) {
                isAborted = true
                this.loadingPages[pageRequesting].splice(currentIndex, 1)
              } else {
                this.loadingPages[pageRequesting].shift()
              }
            }
          },
        })
      )?.aborted

      log.func('createPreparePage')
      log.grey(`Ran noodl.initPage on page "${pageRequesting}"`, {
        pageRequesting,
        pageModifiers: page.modifiers,
        pageObject: this?.root[pageRequesting],
        ...page.snapshot(),
      })

      if (isAbortedFromSDK) {
        log.hotpink(
          `Aborting from ${pageRequesting} due to abort request from lvl3`,
        )
        return { aborted: true }
      }

      if (isAborted) {
        log.hotpink(
          `Aborting from ${pageRequesting} because a newer call was instantiated`,
        )
        return { aborted: true }
      }

      this.emit('onInitPage', this.root[pageRequesting] as PageObject)
      return this.root[pageRequesting]
    } catch (error) {
      console.error(error)
      error instanceof Error && toast(error.message, { type: 'error' })
    } finally {
      this.disableSpinner()
    }
  }

  getRoomParticipants() {
    return this.meeting.room.participants
  }

  getSdkParticipants(root = this.noodl.root): t.RemoteParticipant[] {
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

      if (this.mainPage) {
        if (this.mainPage.aspectRatioMin !== min) {
          this.mainPage.aspectRatioMin = min as number
        }

        if (this.mainPage.aspectRatioMax !== max) {
          this.mainPage.aspectRatioMax = max as number
        }
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
      log.func('onResiz')
      log.grey('Resizing')
      if (
        args.width !== args.previousWidth ||
        args.height !== args.previousHeight
      ) {
        if (this.currentPage === 'VideoChat') return
        this.aspectRatio = aspectRatio
        refreshWidthAndHeight()
        document.body.style.width = `${args.width}px`
        document.body.style.height = `${args.height}px`
        this.mainPage.node.style.width = `${args.width}px`
        this.mainPage.node.style.height = `${args.height}px`
        await this.render(this.mainPage)
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

    const onNavigateStale = (args: {
      previouslyRequesting: string
      newPageRequesting: string
      snapshot: ReturnType<NOODLDOMPage['snapshot']>
    }) => {
      log.func('onNavigateStale')
      if (args.newPageRequesting) {
        log.green(
          `Aborted a previous request to "${args.previouslyRequesting}" for "${args.newPageRequesting}"`,
          args.snapshot,
        )
      } else {
        log.green(
          `Aborted an old/stale request to "${args.previouslyRequesting}"`,
        )
      }
    }

    const onBeforeClearnode = () => {
      if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
        log.func('onBeforeClearnode')
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
      log.grey(`Done rendering DOM nodes for ${page.page}`)
      if (page.page === 'VideoChat') {
        if (this.meeting.isConnected && !this.meeting.calledOnConnected) {
          this.meeting.onConnected(this.meeting.room)
          this.meeting.calledOnConnected = true
          log.grey(`Republishing tracks with meeting.onConnected`)
        }
      }
      // Handle pages that have { viewPort: "top" }
      const pageObjectViewPort =
        this.root[(page.getNuiPage() as NUIPage).page || '']?.viewPort

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
      .on(eventId.page.on.ON_NAVIGATE_STALE, onNavigateStale)
      .on(eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE, onBeforeClearnode)
      .on(eventId.page.on.ON_COMPONENTS_RENDERED, onComponentsRendered)
  }

  async render(page: NOODLDOMPage) {
    try {
      if (!page) {
        if (arguments.length) {
          log.func('render')
          log.red(
            `The page instance passed to App.render is null or undefined. The root page be used instead`,
          )
        }
        page = this.mainPage
      }

      if (this.instances.FullCalendar.inst) {
        this.instances.FullCalendar.inst.destroy()
        this.instances.FullCalendar.inst = null
        this.instances.FullCalendar.page = ''
      }

      return this.ndom.render(page, {
        on: {
          actionChain: {
            // onBeforeInject() {
            //   console.log(`[onBeforeInject]`, this)
            // },
            // onAfterInject() {
            //   console.log(`[onAfterInject]`, this)
            // },
            // onAbortEnd() {
            //   console.log(`[onAbortEnd]`, this)
            // },
            // onAbortStart() {
            //   console.log(`[onAbortStart]`, this)
            // },
            // onAbortError() {
            //   console.log(`[onAbortError]`, this)
            // },
            onExecuteStart: () => {
              // console.log(`[onExecuteStart]`, this)
              // this.enableSpinner({ target: document.body, page: page?.page })
            },
            // onBeforeActionExecute() {
            //   console.log(`[onBeforeActionExecute]`, this)
            // },
            onExecuteError: () => {
              //   console.log(`[onExecuteError]`, this)
              // this.disableSpinner()
            },
            onExecuteEnd: () => {
              // console.log(`[onExecuteEnd]`, this)
              // this.disableSpinner()
            },
          },
          // if: ({ page, value }) => {
          //   if (u.isStr(value) && Identify.reference(value)) {
          //     const datapath = nu.trimReference(value)
          //     if (Identify.localKey(datapath)) {
          //       if (page?.page) {
          //         let value = get(this.root?.[page.page], datapath)
          //         if (Identify.reference(value)) {
          //         }
          //       }
          //       debugger
          //     } else {
          //       debugger
          //       return get(this.root, datapath)
          //     }
          //   }
          // },
          // reference: (args) => {
          //   log.func('on [reference]')
          //   log.grey('', args)
          //   const { page, value } = args
          //   if (Identify.reference(value)) {
          //     const datapath = nu.trimReference(value)
          //     if (Identify.localKey(datapath)) {
          //       if (page?.page) {
          //         return get(this.root?.[page.page], datapath)
          //       }
          //     } else {
          //       return get(this.root, datapath)
          //     }
          //   }
          // },
        },
      })
    } catch (error) {
      console.error(error)
      if (error instanceof Error) toast(`[${error.name}] ${error.message}`)
      else if (error) toast(`[Error] ${String(error)}`)
    }
  }

  reset(soft?: boolean): Promise<void>
  reset(): this
  reset(soft?: boolean) {
    if (soft) {
      //
      // Soft reset (retains the App instance reference as well as the actions/transactions, etc)
      const softAppReset = async () => {
        try {
          const { resetInstance: resetSdk } = await import('./app/noodl')
          const currentRoot = this.root
          const currentPage = this.mainPage.page
          delete currentRoot[currentPage]
          this.#noodl = resetSdk()
          await this.#noodl.init()

          u.assign(this.#noodl.root, currentRoot)
          this.cache.component.clear()
          this.mainPage.page = this.mainPage.getPreviousPage(this.startPage)
          this.mainPage.previous = ''
          this.mainPage.requesting = currentPage
          return this.navigate(this.mainPage)
        } catch (error) {
          console.error(error)
        }
      }
      return softAppReset()
    } else {
      this.streams.reset()
      if (this.ndom) {
        this.ndom.reset()
        this.mainPage = this.ndom.createPage(
          this.cache.page.length
            ? this.nui.getRootPage()
            : this.nui.createPage({ viewport: this.viewport }),
        )
        this.ndom.page = this.mainPage
      }
      has(this.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT) &&
        this.updateRoot((draft) => {
          set(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, [])
        })
      return this
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
      draft: App['noodl']['root'],
      cb?: (root: Record<string, any>) => void,
    ) => void,
  ): void
  updateRoot<P extends string>(
    fn: ((draft: App['noodl']['root']) => void) | P,
    value?: any | (() => void),
    cb?: (root: Record<string, any>) => void,
  ) {
    this.noodl?.editDraft?.(function editDraft(draft: App['noodl']['root']) {
      if (u.isStr(fn)) {
        set(draft, fn, value)
      } else {
        fn(draft)
        u.isFnc(value) && (cb = value)
      }
    })
    cb?.(this.noodl.root)
  }

  listen<Id extends keyof t.AppObserver, Fn extends t.AppObserver[Id]['fn']>(
    id: Id,
    fn: Fn,
  ) {
    const obsList = this.obs.get(id) || []
    !this.obs.has(id) && this.obs.set(id, obsList)
    !obsList.includes(fn) && obsList.push(fn)
    return this
  }

  emit<
    Id extends keyof t.AppObserver,
    P extends t.AppObserver[Id]['params'] = t.AppObserver[Id]['params'],
  >(id: Id, params?: P) {
    const fns = this.obs.has(id) && this.obs.get(id)
    fns && fns.forEach((fn) => u.isFnc(fn) && fn(params as P))
  }

  enableSpinner({
    delay,
    page: pageName,
    target = document.body,
    timeout,
    trigger,
  }: {
    delay?: number
    page?: string
    target?: HTMLElement
    timeout?: number
    trigger?: t.SpinnerState['trigger']
  } = {}) {
    if (this.#state.spinner.ref || this.#state.spinner.timeout) {
      this.disableSpinner()
    }

    if (pageName) this.#state.spinner.page = pageName
    else this.#state.spinner.page = null

    if (trigger) this.#state.spinner.trigger = trigger
    else this.#state.spinner.trigger = null

    this.#state.spinner.ref = setTimeout(
      () => {
        this.#spinner.spin(target)
        this.#state.spinner.active = true
      },
      u.isNum(delay) ? delay : this.#state.spinner.config.delay,
    )

    this.#state.spinner.timeout = setTimeout(
      () => this.disableSpinner(),
      u.isNum(timeout) ? timeout : this.#state.spinner.config.timeout,
    )
  }

  disableSpinner() {
    this.#spinner.stop()

    this.#state.spinner.active = false
    this.#state.spinner.page = null
    this.#state.spinner.timeout = null
    this.#state.spinner.trigger = null

    if (this.#state.spinner.ref) {
      clearTimeout(this.#state.spinner.ref)
      this.#state.spinner.ref = null
    }

    if (this.#state.spinner.timeout) {
      clearTimeout(this.#state.spinner.timeout)
      this.#state.spinner.timeout = null
    }
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
  getCachedPages(): t.CachedPageObject[] {
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
