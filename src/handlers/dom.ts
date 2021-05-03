import Logger from 'logsnap'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import formatDate from 'date-fns/format'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import set from 'lodash/set'
import has from 'lodash/has'
import { Identify } from 'noodl-types'
import {
  getFirstByElementId,
  isTextFieldLike,
  NOODLDOMDataValueElement,
  Resolve,
} from 'noodl-ui-dom'
import { excludeIteratorVar, getAllByDataKey } from 'noodl-utils'
import {
  findIteratorVar,
  findListDataObject,
  NUIActionChain,
  NUIComponent,
} from 'noodl-ui'
import App from '../App'
import * as u from '../utils/common'

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
    let pageName = app.mainPage.page

    async function onChange(event: Event) {
      pageName !== app.mainPage.page && (pageName = app.mainPage.page)

      const localRoot = app.noodl?.root?.[pageName]
      const value = (event.target as any)?.value || ''

      if (iteratorVar) {
        const dataObject = findListDataObject(component)
        if (dataObject) {
          set(dataObject, excludeIteratorVar(dataKey, iteratorVar), value)
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
        if (Identify.emit(component.blueprint.dataValue)) {
          await actionChain?.execute?.(event)
        }
      } else {
        if (dataKey) {
          app.updateRoot((draft) => {
            if (!has(draft?.[app.mainPage.page], dataKey)) {
              log.orange(
                `Warning: The dataKey path ${dataKey} does not exist in the local root object ` +
                  `If this is intended then ignore this message.`,
                {
                  component,
                  dataKey,
                  localRoot,
                  node,
                  pageName: app.mainPage.page,
                  pageObject: app.noodl.root[app.mainPage.page],
                  value,
                },
              )
            }
            set(draft?.[app.mainPage.page], dataKey, value)
            component.edit('data-value', value)
            node.dataset.value = value

            /** TEMP - Hardcoded for SettingsUpdate page to speed up development */
            if (/settings/i.test(app.mainPage.page)) {
              if (node.dataset?.name === 'code') {
                const pathToTage = 'verificationCode.response.edge.tage'
                if (has(app.noodl.root?.[app.mainPage.page], pathToTage)) {
                  app.updateRoot(`${app.mainPage.page}.${pathToTage}`, value)
                  console.log(`Updated: SettingsUpdate.${pathToTage}`)
                }
              }
            }

            if (!iteratorVar) {
              /**
               * EXPERIMENTAL - When a data key from the local root is being updated
               * by a node, update all other nodes that are referencing it.
               * Note: This will not work for list items which is fine because they
               * reference their own data objects
               */
              getAllByDataKey(dataKey)?.forEach((node) => {
                // Since select elements have options as children, we should not
                // edit by innerHTML or we would have to unnecessarily re-render the nodes
                if (node.tagName === 'SELECT') {
                } else if (isTextFieldLike(node)) {
                  node.dataset.value = value
                } else {
                  node.innerHTML = `${value || ''}`
                }
              })
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
                    search: {
                      placeholder: '',
                    },
                    pagination: {
                      showing: '',
                    },
                  },
                  chartType: option.chartType,
                  data: [],
                  columns: [],
                  style: {
                    table: {
                      width: '100%',
                    },
                  },
                }
                if (option.style) tableData.style = option.style
                /*if (option.tableHeader) tableData.columns = option.tableHeader */
                // click each cell , return this data , and the index

                option.tableHeader.forEach((element: any) => {
                  if (typeof element == 'string') {
                    let emptyObject = {
                      name: element,
                      attributes: (
                        cell: any,
                        row: any,
                        column: { id: any },
                      ) => {
                        if (cell || row) {
                          return {
                            'data-cell-content': cell,
                            onclick: () => {
                              option.response = {}
                              option.response.cell = cell
                              option.response.column = column.id
                              let resData = row
                              let dataArray: any[] = []
                              let resArray: any[] = []
                              resData._cells.pop()
                              resData._cells.forEach((item: any) => {
                                dataArray.push(item['data'])
                              })
                              for (const key in option.dataHeader) {
                                if (
                                  Object.prototype.hasOwnProperty.call(
                                    option.dataHeader,
                                    key,
                                  )
                                ) {
                                  const element = option.dataHeader[key]
                                  resArray[element] = dataArray[parseInt(key)]
                                }
                              }
                              option.response.row = resArray
                            },
                            style: 'cursor: pointer',
                          }
                        }
                      },
                    }
                    tableData.columns.push(emptyObject)
                  } else {
                    tableData.columns.push(element)
                  }
                })
                if (option.attribute) {
                  let attribute = option.attribute
                  if (attribute.search) {
                    tableData.search = true
                    tableData.language.search.placeholder = attribute.search
                  }
                  if (attribute.sort) tableData.sort = true
                  if (attribute.pagination)
                    tableData.pagination.limit = attribute.pagination
                }
                if (option.allowOnclick) {
                  let onclickFunc = {
                    name: 'Actions',
                    formatter: (cell: any, row: any) => {
                      return gridjs.h(
                        'button',
                        {
                          onClick: () => {
                            let resData = row
                            let dataArray: any[] = []
                            let resArray: any[] = []
                            resData._cells.pop()
                            resData._cells.forEach((item: any) => {
                              dataArray.push(item['data'])
                            })
                            for (const key in option.dataHeader) {
                              if (
                                Object.prototype.hasOwnProperty.call(
                                  option.dataHeader,
                                  key,
                                )
                              ) {
                                const element = option.dataHeader[key]
                                resArray[element] = dataArray[parseInt(key)]
                              }
                            }
                            option.response = {}
                            option.response.row = resArray
                          },
                        },
                        option.allowOnclick.value,
                      )
                    },
                  }
                  if (findIndex(tableData.columns, ['name', 'Actions']) == -1) {
                    tableData.columns.push(onclickFunc)
                  }
                }
                option.dataObject.forEach((item: any) => {
                  let dataArray: any = []
                  option.dataHeader.forEach((key: any) => {
                    dataArray.push(item[key])
                  })
                  tableData.data.push(dataArray)
                })
                new gridjs.Grid(tableData).render(node)
              }
              case 'timeTable': {
                // generateYaxis according to timeAxis
                let generateYaxis = (
                  start: string,
                  end: string,
                  timeSlot: number,
                  split: number,
                ) => {
                  // convert time to minutes, then generate the time array
                  let yAxis: any[] = []
                  let [startH, startM] = start.split(':')
                  let [endH, endM] = end.split(':')
                  let startTime = parseInt(startH) * 60 + parseInt(startM)
                  let endTime = parseInt(endH) * 60 + parseInt(endM)
                  for (
                    let index = startTime;
                    index < endTime;
                    index += timeSlot
                  ) {
                    let item: any[] = []
                    let timeName = { name: '' }
                    let h = Math.floor(index / 60)
                    let m = index % 60
                    timeName.name = m < 10 ? h + ':0' + m : h + ':' + m
                    item.push(timeName, split)
                    yAxis.push(item)
                  }
                  return yAxis
                }
                // let generateData = (obj: { stime: string }[] | undefined,length: Number)=>{

                //   let convertDataobj = dataObj.map((currentValue,index)=>{
                //     currentValue.week = index
                //     return currentValue
                //   })
                // console.error(convertDataobj);

                // for (const i in dataObj) {
                //   if (Object.prototype.hasOwnProperty.call(dataObj, i)) {
                //     dataObj[i].list = []
                //     dataObj[i].week = i
                //   }
                // }

                // Divide the data according to the day of the week

                let divideByWeek = (obj: any[]) => {
                  let dataObj = new Array(7).fill({})
                  obj.forEach(
                    (element: {
                      stime: string
                      etime: string
                      visitReason: string
                      name: string
                    }) => {
                      let startTimestamp = parseInt(element.stime) * 1000
                      let endTimestamp = parseInt(element.etime) * 1000
                      let date = new Date(startTimestamp)
                      let nameObj = {
                        name: '',
                      }
                      // 转换成周几然后 push进data数组
                      let getDay = date.getDay()
                      // 把element变形然后push进数组
                      let startT = formatDate(startTimestamp, 'p')
                      let endT = formatDate(endTimestamp,' p')
                      let itemValue = `${element.visitReason},${startT}-${endT}`
                      element.name = itemValue
                      // element.push()
                      // 如果想占多个时间 ， 保持相邻的相同即可
                      console.error(element)
                    },
                  )
                }
                let timeAxis = dataValue.timeAxis
                // 生成纵坐标
                let courseType = generateYaxis(
                  timeAxis.start,
                  timeAxis.end,
                  timeAxis.timeSlot,
                  timeAxis.split,
                )
                // 横坐标
                let week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
                // 生成坐标数据
                let divideDate = [
                  { week: '1', list: [] },
                  { week: '2', list: [] },
                  { week: '3', list: [] },
                  { week: '4', list: [] },
                  { week: '5', list: [] },
                  { week: '6', list: [] },
                  { week: '7', list: [] },
                ]
                let dataLength = courseType.length * timeAxis.split

                // generateData(dataValue.chartData,dataLength)
                // 根据stime， etime 生成date数据
                divideByWeek(dataValue.chartData)
                let data = []
                let yAxis = []
                function getzf(num: string | number) {
                  if (parseInt(num) < 10) {
                    num = '0' + num
                  }
                  return num
                }
                var ItemList = new Array() //声明一维数组
                for (var x = 0; x < 7; x++) {
                  ItemList[x] = new Array() //声明二维数组
                  for (var y = 0; y < courseType.length; y++) {
                    ItemList[x][y] = '' //数组初始化为0
                  }
                }
                // console.log(ItemList);
                var all = []
                for (let i = 0; i < data.length; i++) {
                  var Address = parseInt(data[i].week)
                  var Lists = data[i].list
                  for (let j = 0; j < Lists.length; j++) {
                    var start =
                      new Date(Lists[j].startTime).getHours() +
                      ':' +
                      getzf(new Date(Lists[j].startTime).getMinutes())
                    var end =
                      new Date(Lists[j].endTime).getHours() +
                      ':' +
                      getzf(new Date(Lists[j].endTime).getMinutes())
                    var name = Lists[j].item
                    all.push({
                      na: name,
                      sta: start,
                      en: end,
                      ad: Address,
                    })
                    var num = new Date(
                      new Date(Lists[j].endTime) - new Date(Lists[j].startTime),
                    )
                    console.log(getzf(num.getHours()) + ':' + num.getMinutes())
                    console.log(start, end, name)
                  }
                  console.log()
                }
                for (let i = 0; i < all.length; i++) {
                  var addr = all[i].ad
                  var user_Name = all[i].na
                  let starttime = all[i].sta
                  let endtime = all[i].en
                  for (let j = 0; j < courseType.length; j++) {
                    // console.log(courseType[j][0].name);
                    let Iname = courseType[j][0].name
                    if (all[i].sta == Iname || all[i].en == Iname) {
                      //Array.prototype.push.call(ItemList[addr-1],j,Iname);
                      ItemList[addr - 1][j] =
                        user_Name + starttime + '-' + endtime
                      console.log('sta=', j)
                    }
                  }
                }
                console.error(ItemList)

                var Timetable = new Timetables({
                  el: `#${node.id}`,
                  timetables: ItemList,
                  week: week,
                  timetableType: courseType,
                  gridOnClick: function (item: any) {
                    console.log(item)
                  },
                  styles: {
                    Gheight: 35,
                  },
                })
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
          component.get('data-key') || component.get('dataKey') || ''
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
        const pageObject = app.nui.getRoot()[app.mainPage?.page || ''] || {}
        if (
          img?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          img?.style && (img.style.visibility = 'hidden')
          const parentNode = parent && getFirstByElementId(parent)
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', img.src)
          if (u.isObj(component.style)) {
            u.entries(component.style).forEach(
              ([k, v]) => (iframeEl.style[k as any] = v),
            )
          }
          parentNode?.appendChild(iframeEl)
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
    },
    '[App] Meeting': {
      cond: (node, component) => !!(node && component),
      resolve: function onMeetingComponent(node, component) {
        const viewTag = component.blueprint?.viewTag || ''
        // Dominant/main participant/speaker
        if (/mainStream/i.test(viewTag)) {
          if (!app.mainStream.isSameElement(node)) {
            app.mainStream.setElement(node)
            log.func('[App] Meeting.resolve')
            log.green('Bound an element to mainStream', app.mainStream)
          }
        }
        // Local participant
        else if (/selfStream/i.test(viewTag)) {
          if (!app.selfStream.isSameElement(node)) {
            app.selfStream.setElement(node)
            log.func('[App] Meeting.resolve')
            log.green('Bound an element to selfStream', app.selfStream)
          }
        }
        // Remote participants container
        else if (/(videoSubStream)/i.test(component.contentType || '')) {
          let subStreams = app.subStreams
          if (!subStreams) {
            subStreams = app.streams.createSubStreamsContainer(node, {
              blueprint: component.blueprint?.children?.[0],
              resolver: app.nui.resolveComponents.bind(app.nui),
            })
            log.func('[App] Meeting.resolve')
            log.green('Initiated subStreams container', subStreams)
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
            if (!app.subStreams.elementExists(node)) {
            } else {
              log.func('[App] Meeting.resolve')
              log.red(
                `Attempted to add an element to a subStream but it ` +
                  `already exists in the subStreams container`,
                { subStreams: app.subStreams, node, component },
              )
            }
          } else {
            log.func('[App] Meeting.resolve')
            log.red(
              `Attempted to create "subStreams" but a container (DOM element) ` +
                `was not available`,
              { node, component, ...app.streams.snapshot() },
            )
          }
        }
      },
    },
    '[App] popUp': {
      cond: (n, c) => c.has('global'),
      resolve(node) {
        const onMutation: MutationCallback = function onMutation(mutations) {
          log.func('<popUp> onMutation')
          log.grey('', mutations)
        }

        const observer = new MutationObserver(onMutation)
        observer.observe(node, { childList: true })
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
              const dividedStyleKeys = [
                'position',
                'left',
                'top',
                'right',
                'bottom',
                'width',
                'height',
              ] as const

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

              if (originalParent) {
                if (originalParent.contains(node))
                  originalParent.removeChild(node)
                originalParent.appendChild(newParent)
              }
              eyeContainer.appendChild(eyeIcon)
              newParent.appendChild(node)
              newParent.appendChild(eyeContainer)

              let selected = false

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
      cond: (n, c) => u.isFnc(c.get('text=func')),
      resolve: (node, component) => {
        const dataKey = component.get('dataKey')

        if (component.contentType === 'timer') {
          component.on(
            'initial.timer',
            (setInitialTime: (date: Date) => void) => {
              const initialTime = startOfDay(new Date())
              // Initial SDK value is set in seconds
              const initialSeconds = get(app.noodl.root, dataKey, 0) as number
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
                    node: HTMLElement
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
                  node: HTMLElement
                  component: NUIComponent.Instance
                  ref: typeof ref
                }) => {
                  app.updateRoot((draft) => {
                    const seconds = get(draft, dataKey, 0)
                    set(draft, dataKey, seconds + 1)
                    const updatedSecs = get(draft, dataKey)
                    if (!u.isNil(updatedSecs) && u.isNum(updatedSecs)) {
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
                  })
                },
              )
              ref.start()
            },
          )
        }
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
