import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'
import tippy, { followCursor, MultipleTargets } from 'tippy.js'
import formatDate from 'date-fns/format'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import set from 'lodash/set'
import has from 'lodash/has'
import { Identify } from 'noodl-types'
import {
  asHtmlElement,
  findByDataKey,
  getFirstByElementId,
  isTextFieldLike,
  NOODLDOMDataValueElement,
  Resolve,
} from 'noodl-ui-dom'
import { excludeIteratorVar } from 'noodl-utils'
import {
  findIteratorVar,
  findListDataObject,
  NUIActionChain,
  NUIComponent,
} from 'noodl-ui'
import App from '../App'
import { hide } from '../utils/dom'

const log = Logger.create('dom.ts')

const createExtendedDOMResolvers = function (app: App) {
  const getOnChange = function _getOnChangeFn(args: {
    component: NUIComponent.Instance
    dataKey: string
    node: NOODLDOMDataValueElement
    evtName: string
    iteratorVar: string
  }) {
    let { component, dataKey, node, evtName, iteratorVar = '' } = args
    let actionChain = component.get(evtName) as NUIActionChain | undefined
    let pageName = app.currentPage

    async function onChange(event: Event) {
      pageName !== app.currentPage && (pageName = app.currentPage)

      const value = (event.target as any)?.value || ''

      if (iteratorVar) {
        const dataObject = findListDataObject(component)
        if (dataObject) {
          set(
            dataObject,
            excludeIteratorVar(dataKey, iteratorVar) as string,
            value,
          )
          component.edit('data-value', value)
          node.dataset.value = value
        } else {
          log.red(
            `A ${component.type} component from a "${evtName}" handler tried ` +
              `to update its value but a dataObject was not found`,
            { component, dataKey, pageName },
          )
        }

        // TODO - Come back to this to provide more robust functionality
        if (Identify.folds.emit(component.blueprint.dataValue)) {
          await actionChain?.execute?.(event)
        }
      } else {
        if (dataKey) {
          app.updateRoot((draft) => {
            if (!has(draft?.[pageName], dataKey)) {
              const paths = dataKey.split('.')
              const property = paths.length ? paths[paths.length - 1] : ''
              log.orange(
                `Warning: The${
                  property ? ` property "${property}" in the` : ''
                } ` +
                  `dataKey path "${dataKey}" did not exist in the local root object ` +
                  `If this is intended then ignore this message.`,
                {
                  component,
                  dataKey,
                  node,
                  pageName,
                  pageObject: app.root[pageName],
                  value,
                },
              )
            }
            set(draft?.[pageName], dataKey, value)
            component.edit('data-value', value)
            node.dataset.value = value

            /** TEMP - Hardcoded for SettingsUpdate page to speed up development */
            if (/settings/i.test(pageName)) {
              if (node.dataset?.name === 'code') {
                const pathToTage = 'verificationCode.response.edge.tage'
                if (has(app.root?.[pageName], pathToTage)) {
                  app.updateRoot(`${pageName}.${pathToTage}`, value)
                  console.log(`Updated: SettingsUpdate.${pathToTage}`)
                }
              }
            }
            if (!iteratorVar) {
              u.array(asHtmlElement(findByDataKey(dataKey)))?.forEach(
                (node) => {
                  // Since select elements have options as children, we should not
                  // edit by innerHTML or we would have to unnecessarily re-render the nodes
                  if (node && node.tagName !== 'SELECT') {
                    if (isTextFieldLike(node)) node.dataset.value = value
                    else node.innerHTML = `${value || ''}`
                  }
                },
              )
            }
          })
        }
        await actionChain?.execute?.(event)
      }
    }

    return onChange
  }

  const domResolvers: Record<string, Omit<Resolve.Config, 'name'>> = {
    '[App] chart': {
      cond: 'chart',
      resolve(node, component) {
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
          node.style.width = component.style.width as string
          node.style.height = component.style.height as string
          if (dataValue.chartType) {
            let chartType = dataValue.chartType.toString()
            switch (chartType) {
              case 'graph': {
                let myChart = echarts.init(node)
                let option = dataValue
                option && myChart.setOption(option)
                break
              }
              case 'table': {
                let option = dataValue
                let tableData: any = {
                  pagination: { limit: '' },
                  language: {
                    search: { placeholder: '' },
                    pagination: { showing: '' },
                  },
                  chartType: option.chartType,
                  data: [],
                  columns: [],
                  style: { table: { width: '100%' } },
                }
                if (option.style) tableData.style = option.style
                /*if (option.tableHeader) tableData.columns = option.tableHeader */
                // click each cell , return this data , and the index
                option.tableHeader.forEach((element: any) => {
                  if (typeof element == 'string') {
                    let emptyObject = {
                      name: element,
                      attributes: (
                        ...[cell, row, column]: [any, any, { id: any }]
                      ) => {
                        if (cell || row) {
                          function onClick() {
                            option.response = {}
                            option.response.cell = cell
                            option.response.column = column.id
                            let resData = row
                            let dataArray: any[] = []
                            let resArray: any[] = []
                            resData._cells.pop()
                            resData._cells.forEach((item: any) =>
                              dataArray.push(item['data']),
                            )
                            for (const key in option.dataHeader) {
                              if (key in (option.dataHeader || {})) {
                                const element = option.dataHeader[key]
                                resArray[element] = dataArray[parseInt(key)]
                              }
                            }
                            option.response.row = resArray
                          }
                          return {
                            'data-cell-content': cell,
                            onclick: onClick,
                            style: 'cursor: pointer',
                          }
                        }
                      },
                    }
                    tableData.columns.push(emptyObject)
                  } else tableData.columns.push(element)
                })
                if (option.attribute) {
                  let attribute = option.attribute
                  if (attribute.search) {
                    tableData.search = true
                    tableData.language.search.placeholder = attribute.search
                  }
                  attribute.sort && (tableData.sort = true)
                  attribute.pagination &&
                    (tableData.pagination.limit = attribute.pagination)
                }
                if (option.allowOnclick) {
                  function formatter(cell: any, row: any) {
                    const options = {
                      onClick() {
                        let resData = row
                        let dataArray: any[] = []
                        let resArray: any[] = []
                        let push = (item: any) => dataArray.push(item.data)
                        resData._cells.pop()
                        resData._cells.forEach(push)
                        for (const key in option.dataHeader) {
                          if (key in (option.dataHeader || {})) {
                            const element = option.dataHeader[key]
                            resArray[element] = dataArray[parseInt(key)]
                          }
                        }
                        option.response = {}
                        option.response.row = resArray
                      },
                    }
                    return gridjs.h(
                      'button',
                      options,
                      option.allowOnclick.value,
                    )
                  }
                  if (findIndex(tableData.columns, ['name', 'Actions']) == -1) {
                    tableData.columns.push({ name: 'Actions', formatter })
                  }
                }
                option.dataObject.forEach((item: any) => {
                  let dataArray: any = []
                  let push = (key: string) => dataArray.push(item[key])
                  option.dataHeader.forEach(push)
                  tableData.data.push(dataArray)
                })
                new gridjs.Grid(tableData).render(node)
                // stopPropagation
                let gridPages = node.querySelector('.gridjs-pages')
                let gridSearch = node.querySelector('.gridjs-search')
                let stopProp = (e: { stopPropagation: () => void }) => {
                  e.stopPropagation()
                }
                gridPages?.addEventListener('click', stopProp)
                gridSearch?.addEventListener('click', stopProp)
                break
              }
              case 'calendarTable': {
                const script = document.createElement('script')
                script.onload = () => {
                  console.log('APPENDED js to body')

                  let headerBar = {
                    left: 'prev next',
                    center: 'title',
                    right: 'timeGridDay,timeGridWeek',
                  }
                  let defaultData = dataValue.chartData
                  if (u.isArr(defaultData)) {
                    defaultData.forEach((element) => {
                      element.start = new Date(element.stime * 1000)
                      element.end = new Date(element.etime * 1000)
                      element.title = element.visitReason
                      delete element.stime
                      delete element.etime
                      delete element.visitReason
                    })
                  } else {
                    defaultData = {}
                  }

                  let calendar = new FullCalendar.Calendar(node, {
                    headerToolbar: headerBar,
                    height: 'auto',
                    allDaySlot: false, // 是否显示表头的全天事件栏
                    initialView: 'timeGridWeek',
                    //locale: 'zh-cn',             // 区域本地化
                    firstDay: 0, // 每周的第一天： 0:周日
                    nowIndicator: true, // 是否显示当前时间的指示条
                    slotLabelFormat: [
                      {
                        hour: 'numeric',
                        minute: '2-digit',
                      },
                    ],
                    buttonText: {
                      week: 'Weeks',
                      day: 'Day',
                    },

                    slotDuration: '00:15:00',
                    // slotLabelInterval : "00:05:00",
                    displayEventTime: false,
                    views: {
                      timeGridFourDay: {
                        type: 'timeGrid',
                        buttonText: '2 day',
                      },
                    },
                    events: defaultData,
                    handleWindowResize: true,
                    eventLimit: true,
                    eventMouseEnter: (info: {
                      el: MultipleTargets
                      event: {
                        _def: { title: string }
                        _instance: { range: { start: any; end: any } }
                      }
                    }) => {
                      //console.log(info);
                      tippy(info.el, {
                        content:
                          '<div >\
                         <div style="border-bottom: 1px solid #CCCCCC;font:18px bold;padding:2px 0">Appointment Information</div>\
                         <div style="padding-top:2px">Appointment Name：' +
                          info.event._def.title +
                          '</div>\
                         <div style="padding:4px 0">startTime：' +
                          formatDate(
                            new Date(
                              info.event._instance.range.start,
                            ).getTime() +
                              new Date().getTimezoneOffset() * 60 * 1000,
                            'yyyy-MM-dd HH:mm:ss',
                          ) +
                          '</div>\
                         <div>endTime： ' +
                          formatDate(
                            new Date(info.event._instance.range.end).getTime() +
                              new Date().getTimezoneOffset() * 60 * 1000,
                            'yyyy-MM-dd HH:mm:ss',
                          ) +
                          '</div>\
   　　　　　　　        　</div>',
                        allowHTML: true,
                        //theme: 'translucent',
                        //interactive: true,
                        //placement: 'right-end',
                        followCursor: true,
                        plugins: [followCursor],
                        duration: [0, 0],
                      })
                    },

                    //eventColor: 'red',

                    eventClick: function (event: {
                      event: { _def: { publicId: any } }
                    }) {
                      if (event.event._def) {
                        dataValue.response = event.event._def.publicId
                      }
                      console.log(event)
                    },
                  })
                  calendar.render()
                }

                script.src =
                  'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.js'
                document.body.appendChild(script)

                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href =
                  'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.css'
                link.onload = () => {
                  console.log('APPENDED css to head')
                }
                document.head.appendChild(link)

                break
              }
            }
          } else {
            // default echart
            let myChart = echarts.init(node)
            let option = dataValue
            option && myChart.setOption(option)
          }
        }
      },
    },
    '[App] data-value': {
      cond: (node) => isTextFieldLike(node),
      before(node, component) {
        ;(node as HTMLInputElement).value = component.get('data-value') || ''
        node.dataset.value = component.get('data-value') || ''
        if (node.tagName === 'SELECT') {
          if ((node as HTMLSelectElement).length) {
            // Put the default value to the first option in the list
            ;(node as HTMLSelectElement)['selectedIndex'] = 0
          }
        }
      },
      resolve(node, component) {
        const iteratorVar = findIteratorVar(component)
        const dataKey =
          component.get('data-key') || component.blueprint?.dataKey || ''
        if (dataKey) {
          node.addEventListener(
            'change',
            getOnChange({
              component,
              dataKey,
              evtName: 'onChange',
              node: node as NOODLDOMDataValueElement,
              iteratorVar,
            }),
          )
        }

        if (component.has('onBlur')) {
          node.addEventListener(
            'blur',
            getOnChange({
              node: node as NOODLDOMDataValueElement,
              component,
              dataKey,
              evtName: 'onBlur',
              iteratorVar,
            }),
          )
        }
      },
    },
    '[App] image': {
      cond: 'image',
      async resolve(node, component) {
        const img = node as HTMLImageElement
        const parent = component.parent
        const pageObject = app.root[app.currentPage || ''] || {}
        if (
          img?.src === get(pageObject, 'docDetail.document.name.data') &&
          get(pageObject, 'docDetail.document.name.type') === 'application/pdf'
        ) {
          img?.style && hide(img)
          const iframeEl = document.createElement('iframe')
          const onEntry = (k: any, v: any) => (iframeEl.style[k] = v)
          iframeEl.setAttribute('src', img.src)
          u.eachEntries(component.style, onEntry)
          parent && getFirstByElementId(parent)?.appendChild?.(iframeEl)
        }
      },
    },
    '[App] Map': {
      cond: 'map',
      resolve(node, component) {
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
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
            console.log('test map', dataValue)
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
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
              }),
            )
            if (flag) {
              let featuresData: any[] = []
              dataValue.data.forEach((element: any) => {
                let item = {
                  type: 'Feature',
                  properties: {
                    name: element.information.name,
                    speciality: element.information.speciality,
                    phoneNumber: element.information.phoneNumber,
                    address: element.information.address,
                  },
                  geometry: { type: 'Point', coordinates: element.data },
                }
                featuresData.push(item)
              })
              console.log('test map2', featuresData)
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
                  let Name = e.features[0].properties.name
                  let Speciality = e.features[0].properties.speciality
                  // let Title = e.features[0].properties.Title
                  let phoneNumber = e.features[0].properties.phoneNumber
                  let address = e.features[0].properties.address
                  new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(
                      Name +
                        ' <br> ' +
                        Speciality +
                        '<br> ' +
                        phoneNumber +
                        '<br> ' +
                        address,
                    )
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
    },
    '[App] Meeting': {
      cond: (node, component) => !!(node && component),
      resolve: function onMeetingComponent(node, component) {
        const viewTag = component.blueprint?.viewTag || ''
        const setImportantStream = (label: 'mainStream' | 'selfStream') => {
          if (!app[label].isSameElement(node)) {
            app[label].setElement(node)
            log.func('[App] onMeetingComponent')
            log.grey(
              `Bound an element to ${label}`,
              app[label],
              app[label].snapshot(),
            )
          }
        }
        if (/mainStream/i.test(viewTag)) setImportantStream('mainStream')
        else if (/selfStream/i.test(viewTag)) setImportantStream('selfStream')
        else if (/(videoSubStream)/i.test(component.contentType || '')) {
          let subStreams = app.subStreams
          if (!subStreams) {
            subStreams = app.streams.createSubStreamsContainer(node, {
              blueprint: component.blueprint?.children?.[0],
              resolver: app.nui.resolveComponents.bind(app.nui),
            })
            log.func('[App] onMeetingComponent')
            log.grey(
              'Initiated subStreams container',
              subStreams,
              subStreams.snapshot(),
            )
          } else {
            // If an existing subStreams container is already existent in memory, re-initiate
            // the DOM node and blueprint since it was reset from a previous cleanup
            subStreams.container = node
            subStreams.blueprint = component.blueprint?.children?.[0]
            subStreams.resolver = app.nui.resolveComponents.bind(app.nui)
          }
        }
        // Individual remote participant video element container
        else if (/subStream/i.test(viewTag)) {
          if (app.subStreams) {
            if (app.subStreams.elementExists(node)) {
              log.func('[App] onMeetingComponent')
              log.red(
                `Attempted to add an element to a subStream but it ` +
                  `already exists in the subStreams container`,
                app.subStreams.snapshot(),
              )
            }
          } else {
            log.func('[App] onMeetingComponent')
            log.red(
              `Attempted to create "subStreams" but a container (DOM element) ` +
                `was not available`,
              { node, component, ...app.streams.snapshot() },
            )
          }
        }
      },
    },
    '[App] Password textField': {
      cond: 'textField',
      resolve(node, component) {
        // Password inputs
        if (component.contentType === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            setTimeout(() => {
              const assetsUrl = app.nui.getAssetsUrl() || ''
              const eyeOpened = assetsUrl + 'makePasswordVisiable.png'
              const eyeClosed = assetsUrl + 'makePasswordInvisible.png'
              const originalParent = node?.parentNode as HTMLDivElement
              const newParent = document.createElement('div')
              const eyeContainer = document.createElement('button')
              const eyeIcon = document.createElement('img')

              // Transfering the positioning/sizing attrs to the parent so we can customize with icons and others
              // prettier-ignore
              const dividedStyleKeys = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height'] as const
              // Transfer styles to the new parent to position our custom elements
              dividedStyleKeys.forEach((styleKey) => {
                newParent.style[styleKey] = component.style?.[styleKey]
                // Remove the transfered styles from the original input element
                node && (node.style[styleKey] = '')
              })

              newParent.style.display = 'flex'
              newParent.style.alignItems = 'center'
              newParent.style.background = 'none'

              node && (node.style.width = '100%')
              node && (node.style.height = '100%')

              eyeContainer.style.top = '0px'
              eyeContainer.style.bottom = '0px'
              eyeContainer.style.right = '6px'
              eyeContainer.style.width = '42px'
              eyeContainer.style.background = 'none'
              eyeContainer.style.border = '0px'
              eyeContainer.style.outline = 'none'

              eyeIcon.style.width = '100%'
              eyeIcon.style.height = '100%'
              eyeIcon.style.userSelect = 'none'

              eyeIcon.setAttribute('src', eyeClosed)
              eyeContainer.setAttribute(
                'title',
                'Click here to reveal your password',
              )
              node && node.setAttribute('type', 'password')
              node && node.setAttribute('data-testid', 'password')

              // Restructing the node structure to match our custom effects with the
              // toggling of the eye iconsf

              originalParent?.contains?.(node) &&
                originalParent.removeChild(node)
              originalParent?.appendChild(newParent)
              eyeContainer.appendChild(eyeIcon)
              newParent.appendChild(node)
              newParent.appendChild(eyeContainer)

              let selected = true

              eyeIcon.dataset.mods = ''
              eyeIcon.dataset.mods += '[password.eye.toggle]'
              eyeContainer.onclick = () => {
                if (selected) {
                  eyeIcon.setAttribute('src', eyeOpened)
                  node?.setAttribute('type', 'text')
                } else {
                  eyeIcon.setAttribute('src', eyeClosed)
                  node?.setAttribute('type', 'password')
                }
                selected = !selected
                eyeContainer.title = !selected
                  ? 'Click here to hide your password'
                  : 'Click here to reveal your password'
              }
            })
          }
        } else {
          // Set to "text" by default
          node.setAttribute('type', 'text')
        }
      },
    },
    '[App] VideoChat Timer': {
      cond: (n, c) => c.has('text=func') && c.contentType === 'timer',
      resolve: (node, component) => {
        const dataKey =
          component.get('data-key') || component.blueprint?.dataKey || ''
        const textFunc = component.get('text=func') || ((x: any) => x)
        const initialTime = startOfDay(new Date())
        // Initial SDK value is set in seconds
        const initialSeconds = get(app.root, dataKey, 0) as number
        // Sdk evaluates from start of day. So we must add onto the start of day
        // the # of seconds of the initial value in the Global object
        let initialValue = add(initialTime, { seconds: initialSeconds })
        initialValue == null && (initialValue = new Date())

        // Look at the hard code implementation in noodl-ui-dom
        // inside packages/noodl-ui-dom/src/resolvers/textFunc.ts for
        // the api declaration
        component.on('timer:ref', (timer) => {
          component.on('timer:interval', (value) => {
            app.updateRoot((draft) => {
              const seconds = get(draft, dataKey, 0)
              set(draft, dataKey, seconds + 1)
              const updatedSecs = get(draft, dataKey)
              if (!Number.isNaN(updatedSecs) && u.isNum(updatedSecs)) {
                if (seconds === updatedSecs) {
                  // Not updated
                  log.func('text=func timer:ref')
                  log.red(
                    `Tried to update the value of ${dataKey} but the value remained the same`,
                    { component, seconds, updatedSecs, timer },
                  )
                }
              }
              node && (node.textContent = textFunc(value))
            })
          })
          timer.start()
        })

        // Set the initial value
        // @ts-expect-error
        component.emit('timer:init', initialValue)
      },
    },
  }

  return u
    .entries(domResolvers)
    .reduce(
      (acc, [name, obj]) => acc.concat({ ...obj, name }),
      [] as Resolve.Config[],
    )
}

export default createExtendedDOMResolvers

if (module.hot) {
  module.hot.accept()

  if (module.hot.status() === 'apply') {
    console.log(
      `%c[apply-dom] Module hot data`,
      `color:#e50087;`,
      module.hot.data,
    )
    module.hot.data.fruits = ['apple']
    console.log(
      `%c[apply-dom] Module hot data now`,
      `color:#e50087;`,
      module.hot.data,
    )
    // module.hot?.data.app.reset()
    // app = module.hot?.data.app
  }

  if (module.hot.status() === 'idle') {
    console.log(
      `%c[idle-dom] Module hot data`,
      `color:#00b406;`,
      module.hot.data,
    )
  }

  if (module.hot.status() === 'prepare') {
    console.log(
      `%c[prepare-dom] Module hot data`,
      `color:#3498db;`,
      module.hot.data,
    )
  }

  if (module.hot.status() === 'watch') {
    console.log(`%c[watch-dom]`, `color:#FF5722;`, module.hot.data)
  }
}
