import startOfDay from 'date-fns/startOfDay'
import add from 'date-fns/add'
import Logger from 'logsnap'
import { createToast } from 'vercel-toast'
import NOODLDOM, {
  eventId,
  isPage as isNOODLDOMPage,
  NOODLDOMElement,
  Page as NOODLDOMPage,
  RegisterOptions,
} from 'noodl-ui-dom'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { ComponentObject, Identify, PageObject } from 'noodl-types'
import {
  NUIComponent,
  nuiEmitTransaction,
  NUI,
  publish,
  Viewport as VP,
} from 'noodl-ui'
import { Draft, WritableDraft } from 'immer/dist/internal'
import {
  CACHED_PAGES,
  PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
  pageStatus,
} from './constants'
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
import MeetingSubstreams from './meeting/Substreams'
import * as u from './utils/common'
import * as T from './app/types'

const log = Logger.create('App.ts')
const stable = u.isStable()

class App {
  #enabled = {
    firebase: true,
  }
  #meeting: ReturnType<typeof createMeetingFns>
  #noodl: T.AppConstructorOptions['noodl']
  #nui: T.AppConstructorOptions['nui']
  #ndom: T.AppConstructorOptions['ndom']
  #preparePage = {} as (page: NOODLDOMPage) => Promise<PageObject | undefined>
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
  authStatus: AuthStatus | '' = ''
  firebase = {} as FirebaseApp
  getStatus: T.AppConstructorOptions['getStatus']
  initialized = false
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
      !firebaseSupported && (this.#enabled.firebase = false)
      vapidKey && (this._store.messaging.vapidKey = vapidKey)

      !this.getStatus &&
        (this.getStatus = (await import('@aitmed/cadl')).Account.getStatus)

      !this.noodl && (this.#noodl = (await import('./app/noodl')).default)

      this.firebase = firebase as T.FirebaseApp
      this.messaging = this.#enabled.firebase ? this.firebase.messaging() : null

      await this.noodl.init()

      this.observeViewport(this.viewport)
      this.observePages(this.mainPage)

      log.func('initialize')
      stable && log.cyan(`Initialized @aitmed/cadl sdk instance`)

      this.ndom.use({
        transaction: {
          [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: (p: NOODLDOMPage) => {
            return this.#preparePage(p).then(
              (pageObject) => (window.pageObject = pageObject),
            )
          },
        },
      })

      let storedStatus = {} as { code: number }

      if (process.env.NODE_ENV === 'test') {
        storedStatus = { code: 0 }
      } else {
        storedStatus = await this.getStatus()
      }
      // Initialize the user's state before proceeding to decide on how to direct them
      if (storedStatus.code === 0) {
        this.noodl.setFromLocalStorage('user')
        this.authStatus = 'logged.in'
      } else if (storedStatus.code === 1) {
        this.authStatus = 'logged.out'
      } else if (storedStatus.code === 2) {
        this.authStatus = 'new.device'
      } else if (storedStatus.code === 3) {
        this.authStatus = 'temporary'
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
      const domResolvers = createExtendedDOMResolvers(this)
      const meetingfns = createMeetingHandlers(this)

      this.ndom.use(actions)
      this.ndom.use({ builtIn: builtIns })
      registers.forEach((obj) => this.ndom.use({ register: obj }))
      domResolvers.forEach((obj) => this.ndom.use({ resolver: obj }))

      this.meeting.onConnected = meetingfns.onConnected
      this.meeting.onAddRemoteParticipant = meetingfns.onAddRemoteParticipant
      this.meeting.onRemoveRemoteParticipant =
        meetingfns.onRemoveRemoteParticipant

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

      this.#preparePage = async function preparePage(
        this: App,
        page: NOODLDOMPage,
      ) {
        try {
          log.func('#preparePage')
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
              FCMOnTokenRefresh: this.#enabled.firebase
                ? this.messaging?.onTokenRefresh.bind(this.messaging)
                : undefined,
              get checkField() {
                return self.ndom.builtIns.get('checkField')?.find(Boolean)?.fn
              },
              get goto() {
                return self.ndom.builtIns.get('goto')?.find(Boolean)?.fn
              },
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
      }.bind(this)

      this.observeMeetings()

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

      this.initialized = true
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  getEnabledServices() {
    return this.#enabled
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
    page
      .on(
        eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE,
        function onBeforeClearRootNode(this: App) {
          if (page.page === 'VideoChat' && page.requesting !== 'VideoChat') {
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
            if (this.streams.selfStream.hasElement()) {
              const before = this.streams.selfStream.snapshot()
              this.streams.selfStream.reset()
              log.grey('Wiping selfStream state', {
                before,
                after: this.streams.selfStream.snapshot(),
              })
            }
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
      .on(
        eventId.page.on.ON_COMPONENTS_RENDERED,
        async ({ requesting: pageName, components }) => {
          log.func('onComponentsRendered')
          log.grey(`Done rendering DOM nodes for ${pageName}`, components)

          // Cache to rehydrate if they disconnect
          // TODO
          this.cachePage(pageName)
          log.grey(`Cached page: "${pageName}"`)
        },
      )
  }

  /**
   * Callback invoked when Meeting.joinRoom receives the room instance.
   * Initiates participant tracks as well as register listeners for state changes on
   * the room instance.
   * @param { Room } room - Room instance
   */
  observeMeetings() {
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
          let link = document.createElement('link')
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.1.1/mapbox-gl.css'
          link.rel = 'stylesheet'
          document.head.appendChild(link)
          if (dataValue.mapType == 1) {
            dataValue.zoom = dataValue.zoom ? dataValue.zoom : 9
            let flag = !dataValue.hasOwnProperty('data')
              ? false
              : dataValue.data.length == 0
              ? false
              : true
            let initcenter = flag
              ? dataValue.data[0].data
              : [-117.9086, 33.8359]
            let map = new mapboxgl.Map({
              container: parent?.id,
              style: 'mapbox://styles/mapbox/streets-v11',
              center: initcenter,
              zoom: dataValue.zoom,
              trackResize: true,
              dragPan: true,
              boxZoom: false, // 加载地图使禁用拉框缩放
              // attributionControl: false, // 隐藏地图控件链接
              // logoPosition: 'bottom-right' // 设置mapboxLogo位置
              // zoomControl: true,
              // antialias: false, //抗锯齿，通过false关闭提升性能
              // attributionControl: false,
            })

            map.addControl(new mapboxgl.NavigationControl()) //添加放大缩小控件
            map.addControl(
              //添加定位
              new mapboxgl.GeolocateControl({
                positionOptions: {
                  enableHighAccuracy: true,
                },
                trackUserLocation: true,
              }),
            )
            if (flag) {
              let featuresData: any[] = []
              dataValue.data.forEach((element: any) => {
                let item = {
                  type: 'Feature',
                  properties: {
                    Name: element.information.Name,
                    Speciality: element.information.Speciality,
                    Title: element.information.Title,
                    address: element.information.address,
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: element.data,
                  },
                }
                featuresData.push(item)
              })
              console.log('test map2', featuresData)

              //start
              map.on('load', function () {
                // Add a new source from our GeoJSON data and
                // set the 'cluster' option to true. GL-JS will
                // add the point_count property to your source data.
                map.addSource('earthquakes', {
                  type: 'geojson',
                  // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                  // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                  // data:'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
                  data: {
                    type: 'FeatureCollection',
                    features: featuresData,
                  },
                  cluster: true,
                  clusterMaxZoom: 14, // Max zoom to cluster points on
                  clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
                })

                map.addLayer({
                  id: 'clusters',
                  type: 'circle',
                  source: 'earthquakes',
                  filter: ['has', 'point_count'],
                  paint: {
                    // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                    // with three steps to implement three types of circles:
                    //   * Blue, 20px circles when point count is less than 100
                    //   * Yellow, 30px circles when point count is between 100 and 750
                    //   * Pink, 40px circles when point count is greater than or equal to 750
                    'circle-color': [
                      'step',
                      ['get', 'point_count'],
                      '#51bbd6',
                      10,
                      '#f1f075',
                      50,
                      '#f28cb1',
                    ],
                    'circle-radius': [
                      'step',
                      ['get', 'point_count'],
                      20,
                      100,
                      30,
                      750,
                      40,
                    ],
                  },
                })

                map.addLayer({
                  id: 'cluster-count',
                  type: 'symbol',
                  source: 'earthquakes',
                  filter: ['has', 'point_count'],
                  layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': [
                      'DIN Offc Pro Medium',
                      'Arial Unicode MS Bold',
                    ],
                    'text-size': 12,
                  },
                })

                map.addLayer({
                  id: 'unclustered-point',
                  type: 'circle',
                  source: 'earthquakes',
                  filter: ['!', ['has', 'point_count']],
                  paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 10,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff',
                  },
                })

                // inspect a cluster on click
                map.on('click', 'clusters', function (e: any) {
                  let features = map.queryRenderedFeatures(e.point, {
                    layers: ['clusters'],
                  })
                  let clusterId = features[0].properties.cluster_id
                  map
                    .getSource('earthquakes')
                    .getClusterExpansionZoom(
                      clusterId,
                      function (err: any, zoom: any) {
                        if (err) return
                        map.easeTo({
                          center: features[0].geometry.coordinates,
                          zoom: zoom,
                        })
                      },
                    )
                })

                // When a click event occurs on a feature in
                // the unclustered-point layer, open a popup at
                // the location of the feature, with
                // description HTML from its properties.
                map.on('click', 'unclustered-point', function (e: any) {
                  // 'Name': element.Name,
                  // 'Speciality': element.Speciality,
                  // 'Title': element.Title,
                  // 'address'
                  console.log('test map3', e)
                  let coordinates = e.features[0].geometry.coordinates.slice()
                  let Name = e.features[0].properties.Name
                  let Speciality = e.features[0].properties.Speciality
                  // let Title = e.features[0].properties.Title
                  let address = e.features[0].properties.address
                  new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(Name + ' <br> ' + Speciality + '<br> ' + address)
                    .addTo(map)
                })

                map.on('mouseenter', 'clusters', function () {
                  console.log('test map12', 'mouse enter point')
                  map.getCanvas().style.cursor = 'pointer'
                })
                map.on('mouseleave', 'clusters', function () {
                  map.getCanvas().style.cursor = ''
                })
              })
              // let canvasContainer:any = node.parentNode?.children[1]
              let canvasContainer: any = document.querySelector(
                '.mapboxgl-canvas-container',
              )
              console.log('test map show canvas', canvasContainer)
              canvasContainer['style']['width'] = '100%'
              canvasContainer['style']['height'] = '100%'

              // parent.addEvent("click",function(){
              // })
              // let canvasContainer = document.getElementById("mapboxgl-canvas-container")
              //end
            }
          } else if (dataValue.mapType == 2) {
            dataValue.zoom = dataValue.zoom ? dataValue.zoom : 9
            let flag = !dataValue.hasOwnProperty('data')
              ? false
              : dataValue.data.length == 0
              ? false
              : true
            let initcenter = flag
              ? dataValue.data[0].data
              : [-117.9086, 33.8359]
            let map = new mapboxgl.Map({
              container: parent?.id,
              style: 'mapbox://styles/mapbox/streets-v11',
              center: initcenter,
              zoom: dataValue.zoom,
              trackResize: true,
              dragPan: true,
              boxZoom: false, // 加载地图使禁用拉框缩放
              // attributionControl: false, // 隐藏地图控件链接
              // logoPosition: 'bottom-right' // 设置mapboxLogo位置
              // zoomControl: true,
              // antialias: false, //抗锯齿，通过false关闭提升性能
              // attributionControl: false,
            })

            map.addControl(new mapboxgl.NavigationControl()) //添加放大缩小控件
            map.addControl(
              //添加定位
              new mapboxgl.GeolocateControl({
                positionOptions: {
                  enableHighAccuracy: true,
                },
                trackUserLocation: true,
              }),
            )
            new mapboxgl.Marker().setLngLat(initcenter).addTo(map)
            let canvasContainer: any = document.querySelector(
              '.mapboxgl-canvas-container',
            )
            console.log('test map show canvas', canvasContainer)
            canvasContainer['style']['width'] = '100%'
            canvasContainer['style']['height'] = '100%'
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

    this.ndom.register({
      name: 'meeting',
      cond: (node: any, component: any) => !!(node && component),
      resolve: function onMeetingComponent(
        this: App,
        node: any,
        component: any,
      ) {
        // Dominant/main participant/speaker
        if (/mainStream/i.test(String(component.blueprint.viewTag))) {
          const mainStream = this.streams.mainStream
          if (!mainStream.isSameElement(node)) {
            mainStream.setElement(node, { uxTag: 'mainStream' })
            log.func('onCreateNode')
            log.green('Bound an element to mainStream', { mainStream, node })
          }
        }
        // Local participant
        else if (/selfStream/i.test(String(component.blueprint.viewTag))) {
          const selfStream = this.streams.selfStream
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
          let subStreams = this.streams.subStreams
          if (!subStreams) {
            subStreams = this.streams.createSubStreamsContainer(node, {
              blueprint: component.blueprint?.children?.[0],
              resolver: NUI.resolveComponents.bind(NUI),
            })
            log.func('onCreateNode')
            log.green('Initiated subStreams container', subStreams)
          } else {
            // If an existing subStreams container is already existent in memory, re-initiate
            // the DOM node and blueprint since it was reset from a previous cleanup
            subStreams.container = node
            subStreams.blueprint = component.blueprint?.children?.[0]
            subStreams.resolver = NUI.resolveComponents.bind(NUI)
          }
        }
        // Individual remote participant video element container
        else if (/subStream/i.test(String(component.blueprint.viewTag))) {
          const subStreams = this.streams.subStreams as MeetingSubstreams
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
                mainStream: this.streams.mainStream,
                selfStream: this.streams.selfStream,
              },
            )
          }
        }
      }.bind(this),
    })
  }

  reset() {
    this.meeting.streams.mainStream.reset()
    this.meeting.streams.selfStream.reset()
    this.meeting.streams.subStreams?.reset()

    if (this.#ndom) {
      this.#ndom.reset()
      this.mainPage = this.#ndom.createPage(
        this.nui.cache.page.length
          ? this.nui.getRootPage()
          : this.nui.createPage({ viewport: this.viewport }),
      ) as NOODLDOMPage
      this.#ndom.page = this.mainPage
    }

    if (has(this.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
      this.updateRoot((draft) => {
        set(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, [])
      })
    }
  }

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

  /** Sets the list of cached pages */
  setCachedPages(cache: CachedPageObject[]) {
    window.localStorage.setItem(CACHED_PAGES, JSON.stringify(cache))
    //
  }
}

export default App
