import log from './log'
import type { ActionChainIteratorResult } from 'noodl-action-chain'
import { Account } from '@aitmed/cadl'
import type { CADL } from '@aitmed/cadl'
import * as u from '@jsmanifest/utils'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import * as nu from 'noodl-utils'
import { AppConfig, PageObject, ReferenceString } from 'noodl-types'
import {
  BASE_PAGE_URL,
  eventId,
  isNDOMPage,
  NDOM,
  NDOMPage,
  NUI,
  NUIActionObject,
  NUITrigger,
  Page as NUIPage,
  resolveAssetUrl,
  Viewport as VP,
} from 'noodl-ui'
import { CACHED_PAGES, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from './constants'
import { CachedPageObject } from './app/types'
import { actionFactory } from './factories/actionFactory'
import AppNotification from './app/Notifications'
import createActions from './handlers/actions'
import createBuiltIns from './handlers/builtIns'
import createPlugins from './handlers/plugins'
import createRegisters from './handlers/register'
import createExtendedDOMResolvers from './handlers/dom'
import createEcosLogger from './modules/ecos/logger'
import createMeetingHandlers from './handlers/meeting'
import createMeetingFns from './meeting'
import createNoodlConfigValidator from './modules/NoodlConfigValidator'
import createPickNUIPage from './utils/createPickNUIPage'
import createPickNDOMPage from './utils/createPickNDOMPage'
import createTransactions from './handlers/transactions'
import getMiddlewares from './handlers/shared/middlewares'
import * as lf from './utils/lf'
import is from './utils/is'
import parseUrl from './utils/parseUrl'
import Spinner from './spinner'
import { getSdkHelpers } from './handlers/sdk'
import { setDocumentScrollTop, toast } from './utils/dom'
import { isUnitTestEnv, sortByPriority } from './utils/common'
import * as c from './constants'
import * as t from './app/types'
import axios from 'axios'
import debounce from 'lodash/debounce'
import SelfDialog from './utils/Dialog'

class App {
  #state: t.AppState = {
    actionEvents: [],
    authStatus: '',
    initialized: false,
    loadingPages: {} as Record<string, { id: string; init: boolean }[]>,
    spinner: {
      active: false,
      config: {
        delay: c.DEFAULT_SPINNER_DELAY,
        timeout: c.DEFAULT_SPINNER_TIMEOUT,
      },
      page: null,
      ref: null,
      timeout: null,
      trigger: null,
    },
    tracking: {},
  }

  #instances = {
    FullCalendar: {
      inst: null as InstanceType<typeof FullCalendar.Calendar> | null,
      page: '',
    },
  }
  #initPage:string|null = null
  #actionFactory = actionFactory(this)
  #electron: ReturnType<NonNullable<Window['__NOODL_SEARCH__']>> | null
  #ecosLogger: ReturnType<typeof createEcosLogger>
  #meeting: ReturnType<typeof createMeetingFns>
  #notification: t.AppConstructorOptions['notification']
  #noodl: t.AppConstructorOptions['noodl']
  #nui: t.AppConstructorOptions['nui']
  #ndom: t.AppConstructorOptions['ndom']
  #parser: nu.Parser
  #spinner: Spinner
  #sdkHelpers: ReturnType<typeof getSdkHelpers>
  #serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  #piBackgroundWorker: Worker | null = null
  obs: t.AppObservers = new Map()
  getStatus: t.AppConstructorOptions['getStatus']
  mainPage: NDOM['page']
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
      roomParticipants: this.getRoomParticipants(),
      sdkParticipants: this.getSdkParticipants(),
      viewport: {
        width: this.viewport.width,
        height: this.viewport.height,
      },
    }
  }

  static id = `aitmed-noodl-web`
  register: any
  constructor({
    getStatus,
    meeting,
    noodl,
    notification,
    nui = NUI,
    ndom = new NDOM(),
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
    const spinner = new Spinner()
    const registers = new createRegisters(this)
    registers?.registerHandlers()
    this.#spinner = spinner
    this.register = registers

    noodl && this.use(noodl)
    this.#parser = new nu.Parser()

    this.#electron = u.isFnc(window.__NOODL_SEARCH__)
      ? window.__NOODL_SEARCH__({
          get sdk() {
            return noodl
          },
          get meeting() {
            return meeting
          },
          get nui() {
            return nui
          },
          get notification() {
            return notification
          },
          get registers() {
            return registers
          },
          get spinner() {
            return spinner
          },
        })
      : null
  }

  get actionFactory() {
    return this.#actionFactory
  }

  get aspectRatio() {
    return this.noodl?.aspectRatio || 1
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

  get electron() {
    return this.#electron
  }

  get ecosLogger() {
    return this.#ecosLogger as ReturnType<typeof createEcosLogger>
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
    return (this.#noodl || null) as CADL
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

  get piBackgroundWorker() {
    return this.#piBackgroundWorker as Worker
  }
  get initPage(){
    return this.#initPage
  }

  getState() {
    return this.#state
  }

  getRegister() {
    return this.register
  }

  async injectScript(url: string) {
    return new Promise((resolve, reject) => {
      if (url.endsWith('js')) {
        const script = document.createElement('script')
        const tempGlobal =
          '__tempModuleLoadingVariable' +
          Math.random().toString(32).substring(2)
        script.type = 'module'
        script.async = true
        script.textContent = `import * as m from "${url}"; window.${tempGlobal} = m;`
        script.onload = () => {
          resolve(window[tempGlobal])
        }
        script.onerror = () => {
          delete window[tempGlobal]
          script.remove()
          reject(new Error('Failed to load module script with URL ' + url))
        }
        document.documentElement.appendChild(script)
      } else if (url.endsWith('css')) {
        let link = document.createElement('link')
        link.href = url
        link.rel = 'stylesheet'
        document.documentElement.appendChild(link)
        link.onload = () => {
          resolve('loaded module script with URL ' + url)
        }
        link.onerror = () => {
          reject(new Error('Failed to load module script with URL ' + url))
          link.remove()
        }
      }
    })
  }

  /**
   * Navigates to a page specified in page.requesting
   * The value set in page.requesting should be set prior to this call unless pageRequesting is provided where it will be set to it automatically
   * If only a page name is provided, by default the main page instance will be used
   * @param { NDOMPage } page
   * @param { string | undefined } pageRequesting
   */
  // @ts-expect-error
  async navigate(
    page: NDOMPage,
    pageRequesting?: string,
    opts?: { isGoto?: boolean },
    play?: boolean,
  ): Promise<void>
  async navigate(pageRequesting?: string): Promise<void>
  async navigate(
    page?: NDOMPage | string,
    pageRequesting?: string,
    { isGoto }: { isGoto?: boolean } = {},
    play?: boolean,
  ) {
    let s = Date.now()
    function getParams(pageName: string) {
      const nameParts = pageName.split('&')
      let params = {}
      if (nameParts.length > 1) {
        for (let i = 1; i < nameParts.length; i++) {
          const partItem = nameParts[i]
          const parts = partItem.split('=')
          params[parts[0]] = partItem.slice(parts[0].length+1)
        }
      }
      return params
    }
    let NDOMPage
    try {
      let _page: NDOMPage
      let _pageRequesting = ''

      let pageUrl = pageRequesting ? pageRequesting : page

      if (isNDOMPage(pageUrl)) {
        pageUrl = pageUrl.page
      }

      if (pageUrl && pageUrl.includes('&')) {
        if (nu.isOutboundLink(pageUrl)) {
          return void (window.location.href = pageUrl)
        }
        const params = getParams(pageUrl)
        const curretPage = (
          pageUrl.includes('&')
            ? pageUrl.substring(0, pageUrl.indexOf('&'))
            : pageUrl
        ).replace(/=/g, '')
        if (isNDOMPage(page)) {
          pageRequesting = curretPage
        } else {
          page = curretPage
        }
        localStorage.setItem('tempParams', JSON.stringify(params))
        // await lf.setItem('tempParams', params)
      } else {
        localStorage.setItem('tempParams', JSON.stringify({}))
      }

      if (isNDOMPage(page)) {
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

        return !play
          ? void (window.location.href = pageUrl as string)
          : window.open(pageUrl, '_self')
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

                while (
                  pageToDestroy &&
                  pageToDestroy !== _page.requesting &&
                  pageToDestroy !== 'VideoChat' &&
                  pageToDestroy !== 'MeetingPage'
                ) {
                  if (pageToDestroy in this.noodl.root) {
                    delete this.noodl.root[pageToDestroy]
                    log.log(
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
      this.#initPage = _page.requesting
      _page.mounted = false
      if(localStorage.getItem('esk')){
        const { globalRegister, ...rest } = this.root.Global
        localStorage.setItem('Global', JSON.stringify(rest))
      }
      const req = await this.ndom.request(_page)
      NDOMPage = _page
      if (req) {
        // @ts-expect-error
        delete window.pcomponents
        const components = await this.render(_page)
        window.pcomponents = components as any
      }

      _page.setStatus(eventId.page.status.RENDERING_COMPONENTS)
      _page.emitSync(eventId.page.on.ON_MOUNTED,_page,)
    } catch (error) {
      throw new Error(error as any)
    }
    if(window.build.nodeEnv == "development"){
      const port = (await fetch("./truthPort.json").then(res=>res.json(),rej=>console.error("error")))?.["port"]
        axios({
          url: `http://127.0.0.1:${port}`,
          method: "POST",
          headers:{
            "Content-Type": "text/plain"
          },
          data:  this.#noodl?.root
        }).catch(e=>console.error(e))
    }
    
    let e = Date.now()
    log.log('%c[timerLog]页面整体渲染', 'color: green;', `${e - s}`)
    
  }

  async initialize({
    onInitNotification,
    onSdkInit,
  }: {
    onInitNotification?: (notification: AppNotification) => Promise<void>
    onSdkInit?: (sdk: CADL) => void
  } = {}) {
    try {
      if (!this.getState().spinner.active) this.enableSpinner()
      if (!this.getStatus) this.getStatus = Account.getStatus

      if (!this.noodl) {
        /**
         * Instantiating the SDK this way will soon be @deprecated
         * The new way to be to import { createInstance } from the same file and instantiate it using that function
         */
        //@ts-expect-error
        if (process.env.NODE_ENV !== 'test') {
          this.use((await import('./app/noodl')).noodl as CADL)
        } else {
          throw new Error(`Level 3 is not provided or instantiated`)
        }
      }
      if (!this.#notification?.initiated) {
        try {
          this.#notification = new AppNotification()
          log.debug(`Initialized notifications`, this.#notification)
          onInitNotification && (await onInitNotification?.(this.#notification))

          this.notification?.on('message', async(message) => {
            const href = window.location.href
            if(/(aitmed|127.0.0.1|localhost)/i.test(href)){
              if (message) {
                const { data } = message
                if (data?.did) {
                  //  call onNewEcosDoc for now  until we propose a more generic approach
                  const onNewEcosDocRegisterComponent = this.globalRegister?.find?.(
                    (obj) => obj?.onEvent === 'onNewEcosDoc' || obj?.eventId === 'onNewEcosDoc',
                  )
                  if(onNewEcosDocRegisterComponent){
                    if(!u.isFnc(onNewEcosDocRegisterComponent?.onEvent))
                      await this.register.registrees?.['onNewEcosDoc'](onNewEcosDocRegisterComponent)
                    onNewEcosDocRegisterComponent?.onEvent?.(data.did)
                  }
                  
                } else {
                  log.log({ message })
                  // debugger
                }
              }
            }
            
          })

          this.notification?.on('click', async(notificationID) => {
            if (notificationID) {
              //  call onNewEcosDoc for now  until we propose a more generic approach
              const onNotificationClickedRegisterComponent = this.globalRegister?.find?.(
                (obj) => obj?.onEvent === 'onNotificationClicked' || obj?.eventId === 'onNotificationClicked',
              )
              if(!u.isFnc(onNotificationClickedRegisterComponent?.onEvent))
                await this.register.registrees?.['onNotificationClicked'](onNotificationClickedRegisterComponent)
              onNotificationClickedRegisterComponent?.onEvent?.(notificationID)
            }
          })
        } catch (error) {
          log.error(error instanceof Error ? error : new Error(String(error)))
        }
      }

      const host = 'http://worldtimeapi.org/api/ip'
      fetch(host).then((response)=>response.json()).then((data) => {
        const selfDialog = new SelfDialog()
        const currentClientUnixTime = Math.ceil(new Date().getTime() / 1000)
        if(data['unixtime'] && Math.abs(data['unixtime'] - currentClientUnixTime)>4*60){
          selfDialog.insert(
            `Sorry, You computer's local time is not accurate, please correct and click refresh button to refresh the page.`,
            {
              confirmButtonCallback: ()=>{
                window.location.reload()
                selfDialog.destroy()
              },
              confirmButtonText: 'Refresh'
            }
          )
        }
        
      })

      this.noodl.on('QUEUE_START', () => {
        if (!this.getState().spinner.active) this.enableSpinner()
      })

      this.noodl.on('QUEUE_END', () => {
        if (!this.noodl.getState().queue?.length) {
          if (this.getState().spinner.active) this.disableSpinner()
        }
        this.disableSpinner()
      })
      if (this.noodl) await this.noodl.init()
      const initInjectScripts = this.noodl.config?.preloadlibInit
      if (u.isArr(initInjectScripts) && initInjectScripts.length > 0) {
        // eslint-disable-next-line
        const loadjs = (url:string)=>{
          return new Promise((resolve,reject)=>{
            const script_ = document.createElement('script')
            script_.onload = () => resolve(true)
            script_.onerror = () => reject()
            script_.type = 'text/javascript'
            script_.async = true
            document.body.append(script_)
            script_.src = url
          })
        }
        await Promise.all(initInjectScripts.map(async (url) => await loadjs(url)))
      }
      onSdkInit?.(this.noodl)
      // console.time('a')

      log.debug(`Initialized @aitmed/cadl sdk instance`)

      const storedCode = isUnitTestEnv() ? 0 : (await this.getStatus())?.code
      // Initialize the user's state before proceeding to decide on how to direct them
      if (storedCode === 0) {
        await this.noodl.setFromLocalStorage('user')
        this.#state.authStatus = 'logged.in'
      } else if (storedCode === 1) {
        this.#state.authStatus = 'logged.out'
      } else if (storedCode === 2) {
        this.#state.authStatus = 'new.device'
      } else if (storedCode === 3) {
        this.#state.authStatus = 'temporary'
      }
      this.nui.use({
        getAssetsUrl: () => this.noodl.assetsUrl,
        getBaseUrl: () => this.noodl.cadlBaseUrl || '',
        getPreloadPages: () => this.noodl.cadlEndpoint?.preload || [],
        getPages: () => this.noodl.cadlEndpoint?.page || [],
        getRoot: () => this.noodl.root,
      })

      const actions = createActions(this)
      const builtIns = createBuiltIns(this)
      const plugins = createPlugins(this)
      // const registers = createRegisters(this)
      const doms = createExtendedDOMResolvers(this)
      const meetingfns = createMeetingHandlers(this)
      const middlewares = getMiddlewares()
      const transactions = createTransactions(this)

      this.#ecosLogger = createEcosLogger(this)

      this.ndom.use(actions)
      this.ndom.use({ builtIn: builtIns })
      this.ndom.use({ plugin: plugins })
      this.ndom.use({ transaction: transactions })
      // TODO - Create composer for createElementBinding
      this.ndom.use({ createElementBinding: meetingfns.createElementBinding })
      this.root.actions = actions
      this.root.getConsumerOptions = this.nui.getConsumerOptions
      this.root.extendedBuiltIn = builtIns
      this.root.localForage = lf
      doms.forEach((obj) => this.ndom.use({ resolver: obj }))
      sortByPriority(middlewares).forEach(this.actionFactory.createMiddleware)

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
        this.noodl?.cadlEndpoint as AppConfig,
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
        startPage = this.noodl.cadlEndpoint?.startPage ?? ''
      }

      // Override the start page if they were on a previous page
      const cachedPages = await this.getCachedPages()
      const cachedPage = cachedPages[0]

      if (cachedPages?.length) {
        if (cachedPage?.name && cachedPage.name !== startPage) {
          startPage = cachedPage.name
        }
      }

      const injectScripts = this.noodl.config?.preloadlib
      if (u.isArr(injectScripts) && injectScripts.length > 0) {
        // eslint-disable-next-line
        Promise.all(injectScripts.map(async (url) => this.injectScript(url)))
      }

      const cfgStore = createNoodlConfigValidator({
        configKey: 'config',
        timestampKey: 'timestamp',
        get: async (key: string) => lf.getItem(key),
        set: async (key: string, value: any) => lf.setItem(key, value),
      })

      const isTimestampCached = !!(await cfgStore.getTimestampKey())
      const isConfigCached = !!(await cfgStore.configExists())

      if (!isTimestampCached && isConfigCached) await cfgStore.cacheTimestamp()

      if (this.mainPage && location.href && !parsedUrl.hasParams) {
        let url = location.href
        if (url.includes('&checkoutId=')) {
          url = parsedUrl.pageUrl
        }
        let { startPage = '' } = this.noodl.cadlEndpoint || {}
        const urlParts = url.split('/')
        const pathname = urlParts[urlParts.length - 1]

        if (!(await cfgStore.isTimestampEq())) {
          // Set the URL / cached pages to their base state
          await lf.setItem(c.CACHED_PAGES, [])
          this.mainPage.pageUrl = BASE_PAGE_URL
          await this.navigate(this.mainPage, startPage)
          await cfgStore.cacheTimestamp()
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

      // subscribeToRefs(({ key, isLocal, parent, path, ref, result }) => {
      //   log.log(`[App] Ref`, { key, isLocal, path, ref, result })
      // })

      this.#state.initialized = true
    } catch (error) {
      log.error(error)
      throw error
    } finally {
      if (!this.noodl?.getState?.()?.queue?.length) {
        if (this.getState().spinner?.active) {
          this.disableSpinner()
        }
      }
    }
  }

  async getPageObject(page: NDOMPage): Promise<{ aborted: true } | void> {
    if (!this.getState().spinner.active) {
      this.enableSpinner({ target: page?.node || this.mainPage?.node })
    }
    let s = Date.now()
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

      log.debug(`Running noodl.initPage for page "${pageRequesting}"`)

      if (pageRequesting === currentPage) {
        log.warn(
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
        await this.noodl?.initPage(pageRequesting, [], {
          onReceive(obj) {
            // debugger
          },
          onFirstProcess(obj) {
            // debugger
          },
          onSecondProcess: (obj) => {
            this.enableSpinner()
            // debugger
          },
          ...(page.modifiers?.[pageRequesting] as any),
          builtIn: this.#sdkHelpers.initPageBuiltIns,
          onBeforeInit: (init) => {
            // log.log(localStorage.getItem("keepingLockState"))
            log.debug('', { init, page: pageRequesting })
            //   if(localStorage.getItem("lockPreUrl")){
            //     history.go(-(history.length-countJumpPage-1))
            // }
          },
          onInit: async (current, index, init) => {
            log.debug('', { current, index, init, page: pageRequesting })

            const validateReference = (ref: string) => {
              const datapath = nu.trimReference(ref as ReferenceString)
              const location = ref.startsWith(`=.builtIn`)
                ? 'root'
                : is.localKey(datapath)
                ? 'local'
                : 'root'
              if (
                !has(
                  location === 'local' ? this.root[pageRequesting] : this.root,
                  datapath.split('.'),
                )
              ) {
                log.error(
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
                is.reference(key) && validateReference(key)
                is.reference(value) && validateReference(value)
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
            let s2 = Date.now()
            if (err) throw err
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
            if (
              localStorage.getItem('lockSelect') === 'true' &&
              localStorage.getItem('sk')
            ) {
              const setTimeBoard = (time: number) => {
                let userTime = time * 60
                let body = document.querySelector('body')
                let objTime = {
                  init: 0,
                  addEvents: function () {
                    body?.addEventListener('click', objTime.eventEnterFun)
                    body?.addEventListener('keydown', objTime.eventEnterFun)
                    body?.addEventListener('mousemove', objTime.eventEnterFun)
                    body?.addEventListener('mousewheel', objTime.eventEnterFun)
                    window?.addEventListener('resize', objTime.eventEnterFun)
                    body?.addEventListener('scroll', objTime.eventEnterFun)
                  },
                  // removeEvents: function () {
                  //   body?.removeEventListener('click', objTime.eventLeaveFun)
                  //   body?.removeEventListener('keydown', objTime.eventLeaveFun)
                  //   body?.removeEventListener('mousemove', objTime.eventLeaveFun)
                  //   body?.removeEventListener('mousewheel', objTime.eventLeaveFun)
                  //   body?.removeEventListener('scroll', objTime.eventLeaveFun)
                  //   window?.removeEventListener('resize', objTime.eventLeaveFun)
                  // },
                  time: function () {
                    if (!localStorage.getItem('sk')) {
                      clearInterval(testUser as NodeJS.Timer)
                    }
                    objTime.init += 1
                    if (objTime.init == userTime) {
                      let lockPageName = localStorage.getItem(
                        'lockPageName',
                      ) as string
                      if (
                        !(
                          window.location.href.slice(-lockPageName?.length) ===
                          lockPageName
                        )
                      ) {
                        clearInterval(testUser as NodeJS.Timer)
                        localStorage.setItem(
                          'lockPreUrl',
                          JSON.stringify(
                            window.location.href.split('?')[1].split('-'),
                          ),
                        )
                        window.location.href =
                          window.location.href.indexOf(lockPageName) > 0
                            ? window.location.href.slice(
                                0,
                                window.location.href.indexOf(lockPageName),
                              ) + lockPageName
                            : window.location.href + `-${lockPageName}`
                      } else {
                        clearInterval(testUser as NodeJS.Timer)
                        return
                      }
                    }
                  },
                  eventEnterFun: function () {
                    clearInterval(testUser as NodeJS.Timer)
                    objTime.init = 0
                    testUser = setInterval(objTime.time, 1000)
                  },
                  // eventLeaveFun: function () {
                  //   testUser&&clearInterval(testUser as NodeJS.Timer);
                  //   objTime.init = 0;
                  //   testUser = setInterval(objTime.time, 1000);
                  // },
                }
                let testUser: NodeJS.Timer | null = setInterval(
                  objTime.time,
                  1000,
                )
                objTime.addEvents()
              }
              // setTimeBoard(0.2)
              setTimeBoard(+(localStorage.getItem('lockTime') as string))
            }
            let e2 = Date.now()
            log.log('%c[timerLog]afterinit', 'color: green;', `${e2 - s2}`)
          },
          // Currently used on list components to re-retrieve listObject by refs
          shouldAttachRef(key, value, parent) {
            return (
              parent?.['type'] === 'list' &&
              key === 'listObject' &&
              is.reference(value)
            )
          },
        })
      )?.aborted

      log.debug(`Ran noodl.initPage on page "${pageRequesting}"`)

      if (isAbortedFromSDK) {
        log.info(
          `Aborting from ${pageRequesting} due to abort request from lvl3`,
        )
        return { aborted: true }
      }

      if (isAborted) {
        log.info(
          `Aborting from ${pageRequesting} because a newer call was instantiated`,
        )
        return { aborted: true }
      }

      this.emit('onInitPage', this.root[pageRequesting] as PageObject)
      let e = Date.now()
      log.log('%c[timerLog]获取页面和init', 'color: green;', `${e - s}`)
      return this.root[pageRequesting]
    } catch (error) {
      log.error(error)
      error instanceof Error && toast(error.message, { type: 'error' })
    } finally {
      this.disableSpinner()
    }
  }

  getRoomParticipants() {
    return this.meeting.room.participants || null
  }

  getSdkParticipants(root = this.noodl?.root): t.RemoteParticipant[] {
    return get(root, this.getPathToRemoteParticipantsInRoot()) || null
  }

  setSdkParticipants(participants: any[]) {
    this.updateRoot(this.getPathToRemoteParticipantsInRoot(), participants)
    return this.getSdkParticipants() || null
  }
  getPathToRemoteParticipantsInRoot(){
    const page = this.initPage?this.initPage:'VideoChat'
    return `${page}listData.participants`
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
        const userAgent = window.navigator.userAgent
        if(/Mobi|Android|iPhone/.test(userAgent)){
          viewport.width = window.innerWidth
          viewport.height = window.innerHeight
        }
        this.#spinner = new Spinner({
          containerWidth: viewport.width,
          containerHeight: viewport.height,
          ...this.spinner.opts
        })
        
      } else {
        viewport.width = w
        viewport.height = h
      }
    }

    initMinMax()
    refreshWidthAndHeight()

    viewport.onResize = debounce(async (args) => {
        log.debug('Resizing')
        if (
          args.width !== args.previousWidth ||
          args.height !== args.previousHeight
        ) {
          // if (this.currentPage === 'VideoChat') return
          this.aspectRatio = aspectRatio
          refreshWidthAndHeight()
          document.body.style.width = `${args.width}px`
          document.body.style.height = `${args.height}px`
          this.mainPage.node.style.width = `${args.width}px`
          this.mainPage.node.style.height = `${args.height}px`
          await this.render(this.mainPage)
        }
      
    },300)
  }

  observePages(page: NDOMPage) {
    const onNavigateStart = () => {
      if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
        log.debug(`Removing room listeners...`)
        // this.meeting.room?.removeAllListeners?.()
      }
    }

    const onNavigateStale = (args: {
      previouslyRequesting: string
      newPageRequesting: string
      snapshot: ReturnType<NDOMPage['snapshot']>
    }) => {
      if (args.newPageRequesting) {
        log.info(
          `Aborted a previous request to "${args.previouslyRequesting}" for "${args.newPageRequesting}"`,
          args.snapshot,
        )
      } else {
        log.info(
          `Aborted an old/stale request to "${args.previouslyRequesting}"`,
        )
      }
    }

    const onBeforeClearnode = () => {
      if ((page.page === 'VideoChat' && page.requesting !== 'VideoChat')||
        (page.page === 'MeetingPage' && page.requesting !== 'MeetingPage')
      ) {
        const _log = (label: 'mainStream' | 'selfStream' | 'subStreams') => {
          const getSnapshot = () => this[label]?.snapshot()
          const before = getSnapshot()
          this[label]?.reset()
          log.debug(`Wiping ${label} state`, { before, after: getSnapshot() })
        }
        this.meeting.calledOnConnected = false
        this.getSdkParticipants()?.length && this.setSdkParticipants([])
        this.mainStream.hasElement() && _log('mainStream')
        this.selfStream.hasElement() && _log('selfStream')
        this.subStreams?.length && _log('subStreams')
      }
      page.previous &&
        page.previous !== page.page &&
        this.nui.cache.component.clear(page.previous)
    }

    const onComponentsRendered = (page: NDOMPage) => {
      log.debug(`Done rendering DOM nodes for ${page.page}`)
      if (page.page === 'VideoChat' || page.page === 'MeetingPage') {
        if (this.meeting.isConnected && !this.meeting.calledOnConnected) {
          this.meeting.onConnected(this.meeting.room)
          this.meeting.calledOnConnected = true
          log.debug(`Republishing tracks with meeting.onConnected`)
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

    const onMounted = (page:NDOMPage)=>{
      //onMounted
      setTimeout(async()=>{
        log.log('execute onMounted')
        let isAborted = false
        const pageObject = this.root[page.page]
        const Mounted = this.root[page.page]?.onMounted
        if (Mounted && pageObject) {
          const onMounted = async (current, index, mounted) => {
            log.debug('', { current, index, mounted, page: page.page })

            const validateReference = (ref: string) => {
              const datapath = nu.trimReference(ref as ReferenceString)
              const location = ref.startsWith(`=.builtIn`)
                ? 'root'
                : is.localKey(datapath)
                ? 'local'
                : 'root'
              if (
                !has(
                  location === 'local' ? this.root[page.page] : this.root,
                  datapath.split('.'),
                )
              ) {
                log.error(
                  `The reference "${ref}" is missing from the ${
                    location === 'local'
                      ? `local root for page "${page.page}"`
                      : 'root'
                  }`,
                  {
                    previous: mounted[index - 1],
                    current: { value: current, index },
                    next: mounted[index + 1],
                    datapath,
                    location,
                    page: page.page,
                    snapshot: cloneDeep(
                      location === 'root' ? this.root : this.root[page.page],
                    ),
                  },
                )
              }
            }

            const validateObject = (obj: Record<string, any>) => {
              for (const [key, value] of u.entries(obj)) {
                is.reference(key) && validateReference(key)
                is.reference(value) && validateReference(value)
                if (u.isObj(value)) validateObject(value)
              }
            }

            u.isObj(current) && validateObject(current)

            if (!isAborted) {
              let currentIndex = this.loadingPages[page.page]?.findIndex?.(
                (o) => o.id === page.id,
              )

              if (currentIndex > -1) {
                if (currentIndex > 0) {
                  isAborted = true
                  this.loadingPages[page.page].splice(currentIndex, 1)
                } else {
                  this.loadingPages[page.page].shift()
                }
              }
            }
          }
          await this.noodl?.runMounted({
            pageObject,
            onMounted: onMounted,
            pageName: page.page,
          })
        }
        if(this.initPage && ['RingToneCallPage','RingTonePage'].includes(this.initPage)){
          window['ringTong']?.play?.()  
        }else{
          window['ringTong']?.stop?.()  
        }
        page.mounted = true
      },0)
    }

    page
      .on(eventId.page.on.ON_NAVIGATE_START, onNavigateStart)
      .on(eventId.page.on.ON_NAVIGATE_STALE, onNavigateStale)
      .on(eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE, onBeforeClearnode)
      .on(eventId.page.on.ON_COMPONENTS_RENDERED, onComponentsRendered)
      .on(eventId.page.on.ON_MOUNTED, onMounted)
  }

  async render(page: NDOMPage) {
    try {
      if (!page) {
        if (arguments.length) {
          log.error(
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

      function onExecuteStart(
        this: NDOMPage,
        { actions, args, data, queue, timeout, trigger },
      ) {
        // for (const el of document.getElementsByClassName('noodl-onclick')) {
        //   if (!el.classList.contains('noodl-onclick-disabled')) {
        //     el.classList.add('noodl-onclick-disabled')
        //   }
        // }
      }

      function onExecuteEnd(this: NDOMPage, { actions, data, trigger }) {
        // for (const el of document.getElementsByClassName('noodl-onclick')) {
        //   if (el.classList.contains('noodl-onclick-disabled')) {
        //     el.classList.remove('noodl-onclick-disabled')
        //   }
        // }
      }

      return this.ndom.render(page, {
        on: {
          actionChain: {
            // onBeforeInject() {
            //   log.log(`[onBeforeInject]`, this)
            // },
            // onAfterInject() {
            //   log.log(`[onAfterInject]`, this)
            // },
            // onAbortEnd() {
            //   log.log(`[onAbortEnd]`, this)
            // },
            // onAbortStart() {
            //   log.log(`[onAbortStart]`, this)
            // },
            // onAbortError() {
            //   log.log(`[onAbortError]`, this)
            // },
            onExecuteStart: onExecuteStart.bind(page),
            // onBeforeActionExecute() {
            //   log.log(`[onBeforeActionExecute]`, this)
            // },
            // onExecuteError: () => {
            //   log.log(`[onExecuteError]`, this)
            // this.disableSpinner()
            // },
            onExecuteEnd: onExecuteEnd.bind(page),
          },
          emit: {
            createActionChain: async ({ actionChain, component, trigger }) => {
              let results: ActionChainIteratorResult<
                NUIActionObject,
                NUITrigger
              >[] = []
              let result: any

              if (/(dataValue|path|placeholder|style)/.test(trigger)) {
                if (trigger === 'path' && component.type === 'image') {
                  result = actionChain?.execute?.()
                  // result = results.find((val) => !!val?.result)?.result
                } else {
                  // @ts-expect-error
                  results = await actionChain?.execute?.()
                  result = results.find((val) => !!val?.result)?.result
                }

                let datasetKey = ''

                if (trigger === 'path') {
                  datasetKey = 'src'
                  if (!is.component.page(component)) {
                    if (!result?.then) {
                      result = result
                        ? resolveAssetUrl(result, this.nui.getAssetsUrl())
                        : ''
                    }
                    component.edit({ src: result })
                    component.edit({ 'data-src': result })
                    component.emit('path', result)
                  }
                } else if (trigger === 'dataValue') {
                  datasetKey = 'value'
                } else if (trigger === 'style') {
                  let style: any = cloneDeep(component.blueprint.style || {})
                  if (result) {
                    for (const k of Object.keys(result)) {
                      style[k] = result[k]
                    }
                  }
                  component.blueprint.style = style
                  component.edit('style', style)
                } else {
                  datasetKey = trigger.toLowerCase()
                }
                component.edit({ [`data-${datasetKey}`]: result })
                component.emit(trigger as any, result)
              }
            },
          },
        },
      })
    } catch (error) {
      log.error(error)
      if (error instanceof Error) toast(`[${error.name}] ${error.message}`)
      else if (error) toast(`[Error] ${String(error)}`)
    }
  }

  reset(soft?: boolean): Promise<void>
  // @ts-expect-error
  reset(): this
  async reset(soft?: boolean) {
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
          await this.noodl.init()
          u.assign(this.#noodl.root, currentRoot)
          this.cache.component.clear()
          this.mainPage.page = this.mainPage.getPreviousPage(this.startPage)
          this.mainPage.previous = ''
          this.mainPage.requesting = currentPage
          return this.navigate(this.mainPage)
        } catch (error) {
          log.error(error)
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
      has(this.noodl.root, this.getPathToRemoteParticipantsInRoot()) &&
        this.updateRoot((draft) => {
          set(draft, this.getPathToRemoteParticipantsInRoot(), [])
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
    fn: P | ((draft: App['noodl']['root']) => void),
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
    trigger?: t.AppSpinnerState['trigger']
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
  async cachePage(name: string) {
    const cacheObj = { name } as CachedPageObject
    const prevCache = await this.getCachedPages()
    if (prevCache[0]?.name === name) return
    const cache = [cacheObj, ...prevCache]
    if (cache.length >= 12) cache.pop()
    cacheObj.timestamp = Date.now()
    await lf.setItem(CACHED_PAGES, cache)
  }

  /** Retrieves a list of cached pages */
  async getCachedPages(): Promise<t.CachedPageObject[]> {
    const pageHistory = await lf.getItem(CACHED_PAGES)
    return (pageHistory as t.CachedPageObject[]) || []
  }

  use(arg: CADL) {
    if (is.lvl3Sdk(arg)) {
      this.#noodl = arg
    }

    return this
  }
}

export default App
