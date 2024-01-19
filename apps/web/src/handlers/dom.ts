import * as u from '@jsmanifest/utils'
import log from '../log'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import tippy, { MultipleTargets } from 'tippy.js'
import formatDate from 'date-fns/format'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import set from 'lodash/set'
import has from 'lodash/has'
import QRCode from 'qrcode'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import { excludeIteratorVar } from 'noodl-utils'
import {
  asHtmlElement,
  ComponentPage,
  findByDataKey,
  findFirstByElementId,
  isTextFieldLike,
  NDOMElement,
  NDOMPage,
  findIteratorVar,
  findListDataObject,
  NUIActionChain,
  NuiComponent,
  Resolve,
  eventId,
} from 'noodl-ui'
import App from '../App'
import { hide } from '../utils/dom'
// import Swiper from 'swiper';
// import '../../node_modules/swiper/swiper-bundle.css';
import flatpickr from 'flatpickr'
// import "../../node_modules/flatpickr/dist/flatpickr.min.css"
import '../../node_modules/flatpickr/dist/themes/material_blue.css'
import * as c from '../constants'
import { cloneDeep, debounce, wrap } from 'lodash'
import moment from 'moment'
import { createHash } from 'crypto'
import { editorHtml, styleText } from './editor/editorHtml'
import { Boot, createEditor, createToolbar, i18nChangeLanguage, i18nGetResources, IDomEditor, t } from "@wangeditor/editor"
import editorConfig from "./editor/editor"
// import toolbarConfig from "./editor/toolbar"
import { matchBlock } from './editor/utils/matchChar'
import getYaml from './editor/getYaml/getYaml'
import keypress from "@atslotus/keypress"
import searchPopUp from './editor/utils/search'
import { CalculateInit } from './editor/utils/calculate'
import registerToolbar, { DynamicFields } from './editor/toolbar'
import Recorder from 'mic-recorder-to-mp3'
import { editorBlockCss } from './editor/utils/utils'
import { store } from '@aitmed/cadl'
import { Square } from '../app/config'
import { ok } from 'assert'
// import moment from "moment"
// import * as echarts from "echarts";
type ToolbarInput = any
// import { isArray } from 'lodash'
function addListener(node: NDOMElement, event: string, callback: any) {
  node.addEventListener(event, callback)
  return {
    event,
    callback: () => {
      node.removeEventListener(event, callback)
    },
  }
}
const host = JSON.parse(localStorage.getItem("config") as string)?.["apiHost"].startsWith("test")
?"testgateway.aitmed.io":"gateway.aitmed.io";
const jwt = JSON.parse(localStorage.getItem("config") as string)?.["jwt"]||"";
async function get_lists(params: {}){
  let myHeaders = new Headers();
  myHeaders.append("GatewayAuthorization", `${host} ${jwt}`);
  myHeaders.append("Content-Type", "application/json");
  console.log(host,jwt)
  let raw = JSON.stringify({
    // "locationId": "YLbf0gAAAAAD2gAAAA AAAA==",
    [params["type"]]: params["value"],
    "limit": 1000
  });
  let requestOptions:RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  return fetch(`https://${host}/elastic/search/${params["url"]}`, requestOptions)
    .then(response => response.json())
    // .then(result =>result)
    .catch(error => console.log('error', error));
}
const createExtendedDOMResolvers = function (app: App) {
  const getNodeOnChange = function _getNodeOnChangeFn(args: {
    component: NuiComponent.Instance
    dataKey: string
    node: NDOMElement
    evtName: string
    iteratorVar: string
    page: ComponentPage | NDOMPage
    initialCapital?: boolean
  }) {
    let {
      component,
      dataKey,
      node,
      evtName,
      iteratorVar = '',
      page,
      initialCapital,
    } = args
    let pageName = page.page

    async function onChange(event: Event) {
      pageName !== page.page && (pageName = page.page)

      let value = (event.target as any)?.value || ''

      if (iteratorVar) {
        const dataObject = findListDataObject(component)
        if (initialCapital) {
          value = value.slice(0, 1).toUpperCase() + value.slice(1)
            ; (node as HTMLInputElement).value = value
        }
        if (dataObject) {
          set(
            dataObject,
            excludeIteratorVar(dataKey, iteratorVar) as string,
            value,
          )
          node.dataset.value = value
        } else {
          log.error(
            `A ${component.type} component from a "${evtName}" handler tried ` +
            `to update its value but a dataObject was not found`,
            { component, dataKey, pageName },
          )
        }
        // TODO - Come back to this to provide more robust functionality
      } else {
        if (dataKey) {
          app.updateRoot((draft) => {
            if (!has(draft?.[pageName], dataKey)) {
              const paths = dataKey.split('.')
              const property = paths.length ? paths[paths.length - 1] : ''
              let warningMsg = 'Warning: The'
              warningMsg += property ? ` property "${property}" in the ` : ' '
              warningMsg += `dataKey path "${dataKey}" did not exist `
              warningMsg += `in the local root object. `
              warningMsg += `If this is intended then ignore this message.`
              // log.orange(warningMsg, { component, dataKey, pageName, value })
            }

            if (initialCapital) {
              value = value.slice(0, 1).toUpperCase() + value.slice(1)
                ; (node as HTMLInputElement).value = value
            }

            if (u.isStr(dataKey) && dataKey.startsWith('Global')) {
              let newDataKey = u.cloneDeep(dataKey)
              newDataKey = newDataKey.replace('Global.', '')
              set(draft?.['Global'], newDataKey, value)
            } else if (u.isStr(dataKey) && dataKey.startsWith('BaseBLEData')) {
              let newDataKey = u.cloneDeep(dataKey)
              newDataKey = newDataKey.replace('BaseBLEData.', '')
              set(draft?.['BaseBLEData'], newDataKey, value)
            } else {
              set(draft?.[pageName], dataKey, value)
            }
            node.dataset.value = value

            /** TEMP - Hardcoded for SettingsUpdate page to speed up development */
            if (/settings/i.test(pageName)) {
              if (node.dataset?.name === 'code') {
                const pathToTage = 'verificationCode.response.edge.tage'
                if (has(app.root?.[pageName], pathToTage)) {
                  app.updateRoot(`${pageName}.${pathToTage}`, value)
                }
              }
            }

            if (!iteratorVar) {
              u.array(asHtmlElement(findByDataKey(dataKey)))?.forEach(
                (node) => {
                  // Since select elements have options as children, we should not edit by innerHTML or we would have to unnecessarily re-render the nodes
                  if (node && node.tagName !== 'SELECT') {
                    if (isTextFieldLike(node)) node.dataset.value = value
                    else node.innerHTML = `${value || ''}`
                  }
                },
              )
            }
          })
        }
      }
    }

    return onChange
  }
  /**
   * Creates an onChange function which should be used as a handler on the
   * addEventListener of a DOM element. This is the first thing that happens
   * when the entire process is called, so updating DOM values happens here.
   * Calls from the SDK/noodl will be invoked at the end of this function call
   *
   * @param args
   * @returns onChange function
   */
  const getOnChange = function _getOnChangeFn(args: {
    component: NuiComponent.Instance
    dataKey: string
    node: NDOMElement
    evtName: string
    iteratorVar: string
    page: ComponentPage | NDOMPage
    initialCapital?: boolean
  }) {
    let {
      component,
      dataKey,
      node,
      evtName,
      iteratorVar = '',
      page,
      initialCapital,
    } = args
    let actionChain = component.get(evtName) as NUIActionChain | undefined
    let pageName = page.page

    async function onChange(event: Event) {
      pageName !== page.page && (pageName = page.page)

      let value = (event.target as any)?.value || ''
      if(component.contentType == "strictNumber"){
        const numericOnly = value.replace(/\D/g, '');
        value = numericOnly;
        (event.target as any).value = numericOnly
      }
      if (component?.has('richtext')) value = (event.target as any)?.textContent || ''

      if (iteratorVar) {
        const dataObject = findListDataObject(component)
        if (initialCapital) {
          value = value.slice(0, 1).toUpperCase() + value.slice(1)
            ; (node as HTMLInputElement).value = value
        }
        if (dataObject) {
          set(
            dataObject,
            excludeIteratorVar(dataKey, iteratorVar) as string,
            value,
          )

          component.edit('data-value', value)
          node.dataset.value = value
        } else {
          log.error(
            `A ${component.type} component from a "${evtName}" handler tried ` +
            `to update its value but a dataObject was not found`,
            { component, dataKey, pageName },
          )
        }
        // TODO - Come back to this to provide more robust functionality
        if (component.blueprint?.onInput) {
          await actionChain?.execute?.(event)
        }
      } else {
        if (dataKey) {
          app.updateRoot((draft) => {
            if (!has(draft?.[pageName], dataKey)) {
              const paths = dataKey.split('.')
              const property = paths.length ? paths[paths.length - 1] : ''
              let warningMsg = 'Warning: The'
              warningMsg += property ? ` property "${property}" in the ` : ' '
              warningMsg += `dataKey path "${dataKey}" did not exist `
              warningMsg += `in the local root object. `
              warningMsg += `If this is intended then ignore this message.`
              // log.orange(warningMsg, { component, dataKey, pageName, value })
            }

            if (initialCapital) {
              value = value.slice(0, 1).toUpperCase() + value.slice(1)
                ; (node as HTMLInputElement).value = value
            }

            if (u.isStr(dataKey) && dataKey.startsWith('Global')) {
              let newDataKey = u.cloneDeep(dataKey)
              newDataKey = newDataKey.replace('Global.', '')
              set(draft?.['Global'], newDataKey, value)
            } else if (u.isStr(dataKey) && dataKey.startsWith('BaseBLEData')) {
              let newDataKey = u.cloneDeep(dataKey)
              newDataKey = newDataKey.replace('BaseBLEData.', '')
              set(draft?.['BaseBLEData'], newDataKey, value)
            } else {
              set(draft?.[pageName], dataKey, value)
            }
            component.edit('data-value', value)
            node.dataset.value = value

            /** TEMP - Hardcoded for SettingsUpdate page to speed up development */
            if (/settings/i.test(pageName)) {
              if (node.dataset?.name === 'code') {
                const pathToTage = 'verificationCode.response.edge.tage'
                if (has(app.root?.[pageName], pathToTage)) {
                  app.updateRoot(`${pageName}.${pathToTage}`, value)
                }
              }
            }

            if (!iteratorVar) {
              u.array(asHtmlElement(findByDataKey(dataKey)))?.forEach(
                (node) => {
                  // Since select elements have options as children, we should not edit by innerHTML or we would have to unnecessarily re-render the nodes
                  if (node && node.tagName !== 'SELECT') {
                    if (isTextFieldLike(node)) node.dataset.value = value
                    else node.innerHTML = `${value || ''}`
                  }
                },
              )
            }
          })
        }
        // const startMark = app.ecosLogger.createMemoryUsageMetricStartMark(
        //   c.perf.memoryUsage.onChange,
        // )
        await actionChain?.execute?.(event)
        // const endMark = app.ecosLogger.createMemoryUsageMetricEndMark(
        //   c.perf.memoryUsage.onChange,
        // )
        // await app.ecosLogger.createMemoryUsageMetricDocument({
        //   metricName: c.perf.memoryUsage.onChange,
        //   start: startMark,
        //   end: endMark,
        // })
      }
    }

    return onChange
  }

    ; (function () {
      let beforeUnload_time = 0,
        gap_time = 0
      window.onunload = function () {
        gap_time = new Date().getTime() - beforeUnload_time
        if (gap_time <= 2) {
          //浏览器关闭判断
          clearCookie()
        }
      }
      window.onbeforeunload = function () {
        beforeUnload_time = new Date().getTime()
      }
      function clearCookie() {
        //清除localstorage
        window.localStorage.clear()
      }
    })()

  const antiShake = (fn, wait) => {
    let timer
    return function () {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, arguments)
      }, wait)
    }
  }
  let audioT = "40%";
  let audioL = "85%";

  const domResolvers: Record<string, Resolve.Config> = {
    '[App] chart': {
      cond: 'chart',
      // resource: [
      //   // The css/js script should be lazy-loaded (loaded to DOM only when a component type "chart" is being rendered)
      //   // TODO - Check to make sure these aren't loaded multiple times
      //   {
      //     type: 'css',
      //      // Identifier used as regex when testing if/else conditional rendering for components (see "resolve.onResource.fullCalendar" below)
      //     name: 'fullCalendar',
      //     href: 'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.css',
      //     lazyLoad: true,
      //   },
      //   {
      //     type: 'js',
      //      // Identifier used as regex when testing if/else conditional rendering for components (see "resolve.onResource.fullCalendar" below)
      //     name: 'fullCalendar',
      //     src: 'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.js',
      //     lazyLoad: true,
      //   },
      // ],
      resolve({ node, component, page }) {
        const pageName = page.page
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
          node.style.width = component.style.width as string
          node.style.height = component.style.height as string
          if (dataValue.chartType || component.get('chartType')) {
            let chartType =
              component.get('chartType') || dataValue.chartType.toString()
            switch (chartType) {
              case 'graph': {
                try {
                  function getSmartDate(
                    s = Intl.DateTimeFormat('en-US', {
                      weekday: 'short',
                    }).format(new Date()),
                    list = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  ): string[] {
                    const index = list.indexOf(s)
                    list.unshift(...list.splice(index + 1))
                    return list
                  }
                  const dataType = {
                    '371201': ['Blood Pressure', 'mmHg', '', 300],
                    '373761': ['Heart Rate', 'bpm', 'heartRateData', 500],
                    '376321': [
                      'Respiratory Rate',
                      'breaths/min',
                      'respiratoryRateData',
                      300,
                    ],
                    '378881': [
                      'Pulse Oximetry',
                      'O₂%',
                      'pulseOximetryData',
                      300,
                    ],
                    '381441': ['Temperature', '℉/℃', 'temperatureData', 300],
                    '384001': [
                      'Blood Glucose Levels',
                      'mg/dl',
                      'bloodGlucoseLevelsData',
                      300,
                    ],
                    '386561': [
                      'Height',
                      'ft.,in.',
                      ['heightFt', 'heightIn'],
                      3,
                    ],
                    '389121': ['Weight', 'lbs', 'weightData', 300],
                    '391681': ['BMI', 'kg/㎡', 'bmiData', 300],
                  }
                  let setting = null
                  let _dateTempObj: { [key in string]: {} } = {}
                  if (dataValue.dateType === 'week') {
                    let settingWeek = {
                      title: {
                        show: true,
                        text: '',
                        x: 'center', //'5' | '5%'，title 组件离容器左侧的距离
                        // right: 'auto',//'title 组件离容器右侧的距离
                        top: '8%', //title 组件离容器上侧的距离
                        // bottom: 'auto',//title 组件离容器下侧的距离
                        textStyle: {
                          color: ' #000', //字体颜色
                          fontStyle: 'bold', //字体风格
                          fontWeight: 'normal', //字体粗细
                          fontFamily: 'sans-serif', //文字字体
                          fontSize: 18, //字体大小
                        },
                      },
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                          type: 'cross',
                          axis: 'auto',
                          snap: true,
                          showContent: true,
                        },
                        textStyle: {
                          color: '#000', // 文字的颜色
                          fontStyle: 'normal', // 文字字体的风格（'normal'，无样式；'italic'，斜体；'oblique'，倾斜字体）
                          fontWeight: 'normal', // 文字字体的粗细（'normal'，无样式；'bold'，加粗；'bolder'，加粗的基础上再加粗；'lighter'，变细；数字定义粗细也可以，取值范围100至700）
                          // fontSize: '20',    // 文字字体大小
                          // lineHeight: '50',    // 行高
                        },
                      },
                      grid: {
                        show: true,
                        top: '20%',
                        left: '0',
                        // right: '15%',
                        // bottom: '3%',
                        containLabel: true,
                      },
                      legend: {
                        orient: 'horizontal',
                        x: 'left',
                        y: 'top',
                        data: [],
                      },
                      xAxis: {
                        type: 'category',
                        name: 'Time',
                        axisLine: {
                          show: true,
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                        axisLabel: {
                          rotate: 45,
                          interval: 0,
                        },
                        boundaryGap: false,
                        data: null,
                        splitLine: {
                          //网格线
                          lineStyle: {
                            type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
                          },
                          show: true, //隐藏或显示
                        },
                      },
                      yAxis: {
                        name: '',
                        type: 'value',
                        min: 0,
                        max: 500,
                        splitNumber: 10,
                        axisLine: {
                          show: true,
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                        axisLabel: {
                          color: 'rgb(51, 102, 204)',
                        },
                      },
                      series: [],
                    }
                    settingWeek.xAxis.data = getSmartDate() as any
                    if (dataValue.dataType == '371201') {
                      settingWeek.title.text = 'Blood Pressure'
                      settingWeek.yAxis.name = 'mmHg'
                      settingWeek.yAxis.max = dataType[dataValue.dataType][3]

                      settingWeek.yAxis.axisLabel.color = function (v) {
                        if (v == 80 || v == 120) {
                          return '#48aaff'
                        } else {
                          return 'rgb(51, 102, 204)'
                        }
                      } as any
                      //@ts-expect-error
                      settingWeek.legend.data.push('Systolic', 'Diastolic')
                      //@ts-expect-error
                      settingWeek.series.push(
                        {
                          name: 'Systolic',
                          type: dataValue.type,
                          symbolSize: 8,
                          data: [],
                          connectNulls: true,
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                          markLine: {
                            //设置标记线
                            symbol: ['none', 'none'], // 去掉箭头
                            label: {
                              show: false,
                            },
                            data: [
                              {
                                // type: 'average',
                                name: '阈值',
                                yAxis: 80,
                                //设置标记点的样式
                                lineStyle: {
                                  normal: { type: 'solid', color: '#48aaff' },
                                },
                              },
                            ],
                          },
                        },
                        {
                          name: 'Diastolic',
                          type: dataValue.type,
                          symbol: 'circle',
                          symbolSize: 8,
                          // "smooth": 0.5,
                          connectNulls: true,
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                          markLine: {
                            //设置标记线
                            symbol: ['none', 'none'], // 去掉箭头
                            label: {
                              show: false,
                            },
                            data: [
                              {
                                // type: 'average',
                                name: '阈值',
                                yAxis: 120,
                                //设置标记点的样式
                                lineStyle: {
                                  normal: { type: 'solid', color: '#48aaff' },
                                },
                              },
                            ],
                          },
                          data: [],
                        },
                      )
                        ; (settingWeek.xAxis.data as any).forEach((element) => {
                          _dateTempObj[element] = {}
                          _dateTempObj[element]['Systolic'] = []
                          _dateTempObj[element]['Diastolic'] = []
                        })
                      dataValue.dataSource.forEach((item) => {
                        let _stamp = get(item, 'deat')
                        let signal = Intl.DateTimeFormat('en-US', {
                          weekday: 'short',
                        }).format(_stamp * 1000)
                        _dateTempObj[signal]['Systolic']?.push(
                          get(item, 'name.data.heightBloodPressure'),
                        )
                        _dateTempObj[signal]['Diastolic']?.push(
                          get(item, 'name.data.lowBloodPressure'),
                        )
                      })
                      Object.values(_dateTempObj).forEach((item) => {
                        if (item['Systolic'].length > 0) {
                          // @ts-expect-error
                          settingWeek.series[0]['data'].push(
                            (
                              item['Systolic']?.reduce((e, f) => +e + +f) /
                              item['Systolic'].length
                            ).toFixed(),
                          )
                          // @ts-expect-error
                          settingWeek.series[1]['data'].push(
                            (
                              item['Diastolic']?.reduce((e, f) => +e + +f) /
                              item['Diastolic'].length
                            ).toFixed(),
                          )
                        } else {
                          ; (settingWeek.series[0]['data'] as any[]).push(
                            undefined,
                          )
                            ; (settingWeek.series[1]['data'] as any[]).push(
                              undefined,
                            )
                        }
                      })

                      setting = settingWeek as any
                    } else {
                      settingWeek.title.text = dataType[dataValue.dataType][0]
                      settingWeek.yAxis.name = dataType[dataValue.dataType][1]
                      settingWeek.yAxis.max = dataType[dataValue.dataType][3]
                      if (dataValue.dataType == '373761') {
                        settingWeek.yAxis.axisLabel.color = function (v) {
                          if (v == 100) {
                            return '#48aaff'
                          } else {
                            return 'rgb(51, 102, 204)'
                          }
                        } as any
                      }
                      //@ts-expect-error
                      settingWeek.series.push({
                        name: dataType[dataValue.dataType][0],
                        type: dataValue.type,
                        symbolSize: 8,
                        data: [],
                        connectNulls: true,
                        itemStyle: {
                          normal: {
                            label: {
                              show: true,
                            },
                            lineStyle: {
                              width: 2,
                              type: 'solid',
                            },
                          },
                        },
                        markLine: {
                          //设置标记线
                          symbol: ['none', 'none'], // 去掉箭头
                          label: {
                            show: false,
                          },
                          data: [
                            {
                              // type: 'average',
                              name: '阈值',
                              // show: false,
                              yAxis: 100,
                              //设置标记点的样式
                              lineStyle: {
                                normal: { type: 'solid', color: '#48aaff' },
                              },
                            },
                          ],
                        },
                      })
                        ; (settingWeek.xAxis.data as any).forEach((element) => {
                          _dateTempObj[element] = {}
                          _dateTempObj[element][
                            `${dataType[dataValue.dataType][0]}`
                          ] = []
                        })
                      dataValue.dataSource.forEach((item) => {
                        let _stamp = get(item, 'deat')
                        let signal = Intl.DateTimeFormat('en-US', {
                          weekday: 'short',
                        }).format(_stamp * 1000)
                        if (dataValue.dataType == '386561') {
                          _dateTempObj[signal][
                            `${dataType[dataValue.dataType][0]}`
                          ]?.push(
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2][0]}`,
                            ) +
                            '.' +
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2][1]
                              }`,
                            ),
                          )
                        } else {
                          _dateTempObj[signal][
                            `${dataType[dataValue.dataType][0]}`
                          ]?.push(
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2]}`,
                            ),
                          )
                        }
                      })
                      Object.values(_dateTempObj).forEach((item) => {
                        if (
                          item[`${dataType[dataValue.dataType][0]}`].length > 0
                        ) {
                          let cum =
                            item[`${dataType[dataValue.dataType][0]}`].reduce(
                              (e, f) => +e + +f,
                            ) /
                            item[`${dataType[dataValue.dataType][0]}`].length
                          if (dataValue.dataType == '381441') {
                            // @ts-expect-error
                            settingWeek.series[0]['data'].push(cum.toFixed(1))
                          } else {
                            // @ts-expect-error
                            settingWeek.series[0]['data'].push(cum.toFixed())
                          }
                        } else {
                          ; (settingWeek.series[0]['data'] as any[]).push(
                            undefined,
                          )
                        }
                      })

                      setting = settingWeek as any
                    }
                    //@ts-expect-error

                    setting.yAxis.max =
                      Math.max(
                        ...settingWeek.series[0]['data'].filter((x) => x),
                      ) + 50

                    // settingWeek.xAxis.data = Object.keys(_dateTempObj) as any;
                  } else if (dataValue.dateType === 'day') {
                    let settingDay = {
                      title: {
                        show: true,
                        text: 'Blood Pressure',
                        x: 'center', //'5' | '5%'，title 组件离容器左侧的距离
                        // right: 'auto',//'title 组件离容器右侧的距离
                        top: '8%', //title 组件离容器上侧的距离
                        // bottom: 'auto',//title 组件离容器下侧的距离
                        textStyle: {
                          color: ' #000', //字体颜色
                          fontStyle: 'bold', //字体风格
                          fontWeight: 'normal', //字体粗细
                          fontFamily: 'sans-serif', //文字字体
                          fontSize: 18, //字体大小
                        },
                      },
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                          type: 'cross',
                          axis: 'auto',
                          snap: true,
                          showContent: true,
                        },
                        textStyle: {
                          color: '#000', // 文字的颜色
                          fontStyle: 'normal', // 文字字体的风格（'normal'，无样式；'italic'，斜体；'oblique'，倾斜字体）
                          fontWeight: 'normal', // 文字字体的粗细（'normal'，无样式；'bold'，加粗；'bolder'，加粗的基础上再加粗；'lighter'，变细；数字定义粗细也可以，取值范围100至700）
                          // fontSize: '20',    // 文字字体大小
                          // lineHeight: '50',    // 行高
                        },
                      },
                      grid: {
                        show: true,
                        top: '20%',
                        left: '0',
                        // right: '15%',
                        // bottom: '3%',
                        containLabel: true,
                        // width: "820px",
                        // height: "280px"
                      },
                      legend: {
                        orient: 'horizontal',
                        x: 'left',
                        y: 'top',
                        data: [],
                      },
                      xAxis: {
                        type: 'category',
                        // type: "time",
                        show: true,
                        // min: 0,
                        // max: 24,
                        name: 'Time',
                        axisLine: {
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                        // splitNumber: 2,
                        axisLabel: {
                          formatter: null,
                          // "rotate": 45,
                          // "interval": 0
                        },
                        boundaryGap: false,
                        data: [],
                        splitLine: {
                          //网格线
                          lineStyle: {
                            type: 'dashed',
                          },
                          show: true,
                        },
                      },
                      yAxis: {
                        name: '',
                        type: 'value',
                        min: 0,
                        max: 300,
                        splitNumber: 10,
                        axisLine: {
                          show: true,
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                      },
                      series: [],
                    }

                    if (dataValue.dataType == '371201') {
                      settingDay.yAxis.name = 'mmHg'
                      settingDay.title.text = 'Blood Pressure'
                      settingDay.yAxis.max = dataType[dataValue.dataType][3]
                      //@ts-expect-error
                      settingDay.legend.data.push('Systolic', 'Diastolic')
                      //@ts-expect-error
                      settingDay.series.push(
                        {
                          name: 'Systolic',
                          type: dataValue.type,
                          symbolSize: 8,
                          data: [],
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                        },
                        {
                          name: 'Diastolic',
                          type: dataValue.type,
                          symbol: 'circle',
                          symbolSize: 8,
                          // "smooth": 0.5,
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                          data: [],
                        },
                      )
                      dataValue.dataSource.forEach((item) => {
                        let _stamp = get(item, 'deat')
                        let signal = moment(_stamp * 1000).format('HH:mm')
                        if (!_dateTempObj[signal]) {
                          _dateTempObj[signal] = {}
                          _dateTempObj[signal]['Systolic'] = []
                          _dateTempObj[signal]['Diastolic'] = []
                        }
                        _dateTempObj[signal]['Systolic']?.push(
                          get(item, 'name.data.heightBloodPressure'),
                        )
                        _dateTempObj[signal]['Diastolic']?.push(
                          get(item, 'name.data.lowBloodPressure'),
                        )
                      })
                      Object.values(_dateTempObj).forEach((item) => {
                        // @ts-expect-error
                        settingDay.series[0]['data'].push(...item['Systolic'])
                        // @ts-expect-error
                        settingDay.series[1]['data'].push(...item['Diastolic'])
                      })
                    } else {
                      try {
                        //@ts-expect-error
                        settingDay.title.text = dataType[dataValue.dataType][0]
                        settingDay.yAxis.name = dataType[dataValue.dataType][1]
                        settingDay.yAxis.max = dataType[dataValue.dataType][3]
                        //@ts-expect-error
                        settingDay.series.push({
                          name: dataType[dataValue.dataType][0],
                          type: dataValue.type,
                          symbolSize: 8,
                          data: [],
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                        })
                        dataValue.dataSource.forEach((item) => {
                          let _stamp = get(item, 'deat')
                          let signal = moment(_stamp * 1000).format('HH:mm')
                          if (!_dateTempObj[signal]) {
                            _dateTempObj[signal] = {}
                            _dateTempObj[signal][
                              `${dataType[dataValue.dataType][0]}`
                            ] = []
                          }
                          if (dataValue.dataType == '386561') {
                            _dateTempObj[signal][
                              `${dataType[dataValue.dataType][0]}`
                            ]?.push(
                              get(
                                item,
                                `name.data.${dataType[dataValue.dataType][2][0]
                                }`,
                              ) +
                              '.' +
                              get(
                                item,
                                `name.data.${dataType[dataValue.dataType][2][1]
                                }`,
                              ),
                            )
                          } else {
                            _dateTempObj[signal][
                              `${dataType[dataValue.dataType][0]}`
                            ]?.push(
                              get(
                                item,
                                `name.data.${dataType[dataValue.dataType][2]}`,
                              ),
                            )
                          }
                        })
                        Object.values(_dateTempObj).forEach((item) => {
                          if (
                            item[`${dataType[dataValue.dataType][0]}`].length >
                            0
                          ) {
                            // @ts-expect-error
                            settingDay.series[0]['data'].push(
                              ...item[`${dataType[dataValue.dataType][0]}`],
                            )
                          }
                        })
                      } catch (error) {
                        log.error(error)
                      }
                    }
                    let _date: Date
                    if (dataValue.dataSource.length == 0) {
                      _date = new Date()
                    } else {
                      _date = new Date(dataValue.dataSource[0]['deat'] * 1000)
                    }
                    settingDay.xAxis.data = Object.keys(_dateTempObj).map(
                      (item: any) => {
                        const date = moment({
                          year: _date.getFullYear(),
                          month: _date.getMonth(),
                          day: _date.getDate(),
                          hour: item.split(':')[0],
                          minute: item.split(':')[1],
                        })
                        let showD = date.format('MM-DD')
                        let showH = date.format('HH:mm')
                        return showD + '\n' + showH
                      },
                    ) as any
                    console.log(settingDay.series[0])
                    //@ts-expect-error
                    settingDay.yAxis.max =
                      Math.max(...settingDay.series[0]['data']) + 50

                    setting = settingDay as any
                  } else if (dataValue.dateType === 'month') {

                    let settingMonth = {
                      title: {
                        show: true,
                        text: '',
                        x: 'center', //'5' | '5%'，title 组件离容器左侧的距离
                        // right: 'auto',//'title 组件离容器右侧的距离
                        top: '8%', //title 组件离容器上侧的距离
                        // bottom: 'auto',//title 组件离容器下侧的距离
                        textStyle: {
                          color: ' #000', //字体颜色
                          fontStyle: 'bold', //字体风格
                          fontWeight: 'normal', //字体粗细
                          fontFamily: 'sans-serif', //文字字体
                          fontSize: 18, //字体大小
                        },
                      },
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                          type: 'cross',
                          axis: 'auto',
                          snap: true,
                          showContent: true,
                        },
                        textStyle: {
                          color: '#000', // 文字的颜色
                          fontStyle: 'normal', // 文字字体的风格（'normal'，无样式；'italic'，斜体；'oblique'，倾斜字体）
                          fontWeight: 'normal', // 文字字体的粗细（'normal'，无样式；'bold'，加粗；'bolder'，加粗的基础上再加粗；'lighter'，变细；数字定义粗细也可以，取值范围100至700）
                          // fontSize: '20',    // 文字字体大小
                          // lineHeight: '50',    // 行高
                        },
                      },
                      grid: {
                        show: true,
                        top: '20%',
                        left: '0',
                        // right: '15%',
                        // bottom: '3%',
                        containLabel: true,
                      },
                      legend: {
                        orient: 'horizontal',
                        x: 'left',
                        y: 'top',
                        data: [],
                      },
                      xAxis: {
                        type: 'category',
                        name: 'Time',
                        axisLine: {
                          show: true,
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                        axisLabel: {
                          rotate: 45,
                          interval: 0,
                        },
                        // boundaryGap: false,
                        data: null,
                        splitLine: {
                          //网格线
                          lineStyle: {
                            type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
                          },
                          show: true, //隐藏或显示
                        },
                      },
                      dataZoom: [
                        {
                          type: 'inside',
                          startValue: 0,
                          endValue: 6,
                          smooth: true,
                          // handleSize: '100%', // 设置滑动条的宽度，使其覆盖整个区域
                          realtime: true, // 实时更新图表显示
                          xAxisIndex: [0],
                          // minSpan: 5, // 设置最小缩放程度为1个数据点
                          moveOnMouseMove: true,
                          moveOnMouseWheel: false,
                          zoomOnMouseWheel: true
                        },
                      ],
                      yAxis: {
                        name: '',
                        type: 'value',
                        min: 0,
                        max: 500,
                        splitNumber: 10,
                        axisLine: {
                          show: true,
                          symbol: ['none', 'arrow'],
                          lineStyle: {
                            color: '#3366CC',
                          },
                        },
                        axisLabel: {
                          color: 'rgb(51, 102, 204)',
                        },
                      },
                      // height: "80%",
                      series: [],
                    }
                    const getDateX = () => {
                      const arr: string[] = [];
                      // for (let index = 0; index < 6; index++) {
                      //   arr.unshift(moment().subtract(index ===5 ?30: index*7,"days").format("MM-DD"))
                      // }
                      for (let index = 0; index < 31; index++) {
                        arr.unshift(moment().subtract(index, "days").format("MM-DD"))
                      }
                      return arr
                    }
                    // settingMonth.xAxis.data =  getSmartDate() as any
                    settingMonth.xAxis.data = getDateX() as any
                    if (dataValue.dataType == '371201') {
                      settingMonth.title.text = 'Blood Pressure'
                      settingMonth.yAxis.name = 'mmHg'
                      settingMonth.yAxis.max = dataType[dataValue.dataType][3]

                      settingMonth.yAxis.axisLabel.color = function (v) {
                        if (v == 80 || v == 120) {
                          return '#48aaff'
                        } else {
                          return 'rgb(51, 102, 204)'
                        }
                      } as any
                      //@ts-expect-error
                      settingMonth.legend.data.push('Systolic', 'Diastolic')
                      //@ts-expect-error
                      settingMonth.series.push(
                        {
                          name: 'Systolic',
                          type: dataValue.type,
                          symbolSize: 8,
                          data: [],
                          connectNulls: true,
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                                position: 'top',
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                          markLine: {
                            //设置标记线
                            symbol: ['none', 'none'], // 去掉箭头
                            label: {
                              show: false,
                            },
                            data: [
                              {
                                // type: 'average',
                                name: '阈值',
                                yAxis: 80,
                                //设置标记点的样式
                                lineStyle: {
                                  normal: { type: 'solid', color: '#48aaff' },
                                },
                              },
                            ],
                          },
                        },
                        {
                          name: 'Diastolic',
                          type: dataValue.type,
                          symbol: 'circle',
                          symbolSize: 8,
                          // "smooth": 0.5,
                          connectNulls: true,
                          itemStyle: {
                            normal: {
                              label: {
                                show: true,
                                position: 'top',
                              },
                              lineStyle: {
                                width: 2,
                                type: 'solid',
                              },
                            },
                          },
                          markLine: {
                            //设置标记线
                            symbol: ['none', 'none'], // 去掉箭头
                            label: {
                              show: false,
                            },
                            data: [
                              {
                                // type: 'average',
                                name: '阈值',
                                yAxis: 120,
                                //设置标记点的样式
                                lineStyle: {
                                  normal: { type: 'solid', color: '#48aaff' },
                                },
                              },
                            ],
                          },
                          data: [],
                        }
                      )
                        ; (settingMonth.xAxis.data as any).forEach((element) => {
                          _dateTempObj[element] = {}
                          _dateTempObj[element]['Systolic'] = []
                          _dateTempObj[element]['Diastolic'] = []
                        })
                      dataValue.dataSource.forEach((item) => {
                        let _stamp = get(item, 'deat')
                        let signal = moment(_stamp * 1000).format("MM-DD");
                        _dateTempObj[signal]['Systolic']?.push(
                          get(item, 'name.data.heightBloodPressure'),
                        )
                        _dateTempObj[signal]['Diastolic']?.push(
                          get(item, 'name.data.lowBloodPressure'),
                        )
                      })
                      Object.values(_dateTempObj).forEach((item) => {
                        if (item['Systolic'].length > 0) {
                          // @ts-expect-error
                          settingMonth.series[0]['data'].push(
                            (
                              item['Systolic']?.reduce((e, f) => +e + +f) /
                              item['Systolic'].length
                            ).toFixed(),
                          )
                          // @ts-expect-error
                          settingMonth.series[1]['data'].push(
                            (
                              item['Diastolic']?.reduce((e, f) => +e + +f) /
                              item['Diastolic'].length
                            ).toFixed(),
                          )
                        } else {
                          ; (settingMonth.series[0]['data'] as any[]).push(
                            undefined,
                          )
                            ; (settingMonth.series[1]['data'] as any[]).push(
                              undefined,
                            )
                        }
                      })

                      setting = settingMonth as any
                    } else {
                      settingMonth.title.text = dataType[dataValue.dataType][0]
                      settingMonth.yAxis.name = dataType[dataValue.dataType][1]
                      settingMonth.yAxis.max = dataType[dataValue.dataType][3]
                      if (dataValue.dataType == '373761') {
                        settingMonth.yAxis.axisLabel.color = function (v) {
                          if (v == 100) {
                            return '#48aaff'
                          } else {
                            return 'rgb(51, 102, 204)'
                          }
                        } as any
                      }
                      //@ts-expect-error
                      settingMonth.series.push({
                        name: dataType[dataValue.dataType][0],
                        type: dataValue.type,
                        symbolSize: 8,
                        data: [],
                        connectNulls: true,
                        itemStyle: {
                          normal: {
                            label: {
                              show: true,
                              position: 'center',
                            },
                            lineStyle: {
                              width: 2,
                              type: 'solid',
                            },
                          },
                        },
                        markLine: {
                          //设置标记线
                          symbol: ['none', 'none'], // 去掉箭头
                          label: {
                            show: false,
                          },
                          data: [
                            {
                              // type: 'average',
                              name: '阈值',
                              // show: false,
                              yAxis: 100,
                              //设置标记点的样式
                              lineStyle: {
                                normal: { type: 'solid', color: '#48aaff' },
                              },
                            },
                          ],
                        },
                      })
                        ;
                      (settingMonth.xAxis.data as any).forEach((element) => {
                        _dateTempObj[element] = {}
                        _dateTempObj[element][
                          `${dataType[dataValue.dataType][0]}`
                        ] = []
                      })

                      dataValue.dataSource.forEach((item) => {
                        let _stamp = get(item, 'deat')
                        let signal = moment(_stamp * 1000).format("MM-DD");
                        if (dataValue.dataType == '386561') {
                          _dateTempObj[signal][
                            `${dataType[dataValue.dataType][0]}`
                          ]?.push(
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2][0]}`,
                            ) +
                            '.' +
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2][1]
                              }`,
                            ),
                          )
                        } else {
                          _dateTempObj[signal][
                            `${dataType[dataValue.dataType][0]}`
                          ]?.push(
                            get(
                              item,
                              `name.data.${dataType[dataValue.dataType][2]}`,
                            ),
                          )
                        }
                      })

                      Object.values(_dateTempObj).forEach((item) => {
                        if (
                          item[`${dataType[dataValue.dataType][0]}`].length > 0
                        ) {
                          let cum =
                            item[`${dataType[dataValue.dataType][0]}`].reduce(
                              (e, f) => +e + +f,
                            ) /
                            item[`${dataType[dataValue.dataType][0]}`].length
                          if (dataValue.dataType == '381441') {
                            // @ts-expect-error
                            settingMonth.series[0]['data'].push(cum.toFixed(1))
                          } else {
                            // @ts-expect-error
                            settingMonth.series[0]['data'].push(cum.toFixed())
                          }
                        } else {
                          ; (settingMonth.series[0]['data'] as any[]).push(
                            undefined,
                          )
                        }
                      })
                      setting = settingMonth as any
                    }
                    //@ts-expect-error
                    setting.yAxis.max =
                      Math.max(
                        ...settingMonth.series[0]['data'].filter((x) => x),
                      ) + 50

                  }
                  //@ts-expect-error
                  // setting.height =  "80%";
                  setting!.grid!.left = "3%";
                  setting!.grid!.bottom = "2%";
                  let myChart = echarts.init(node)
                  dataValue && myChart.setOption(setting)
                } catch (error) {
                  log.error(error)
                }
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
                option.dataObject?.forEach?.((item: any) => {
                  let dataArray: any = []
                  let push = (key: string) =>
                    dataArray.push(
                      u.isArr(item[key]) ? item[key].toString() : item[key],
                    )
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
                component.addEventListeners({
                  event: 'click',
                  callback: () => {
                    gridPages?.removeEventListener('click', stopProp)
                    gridSearch?.removeEventListener('click', stopProp)
                  },
                })
                break
              }
              case 'calendarTable':
                {
                  // const script = document.createElement('script')
                  // script.onload = () => {
                  //   log.log('APPENDED js to body')

                  let headerBar: ToolbarInput = {
                    left: 'prev next',
                    center: 'title',
                    right: 'timeGridDay,timeGridWeek',
                  }
                  let defaultData = dataValue.chartData
                  defaultData = defaultData.filter((element) => {
                    if (!(+element.etime - +element.stime === 86400))
                      return element
                  })
                  if (u.isArr(defaultData)) {
                    defaultData.forEach((element) => {
                      let duration = element.etime - element.stime
                      if (duration / 60 <= 15) {
                        // display min: 15min
                        element.etime = element.stime + 900
                      }
                      element.start = new Date(element.stime * 1000)
                      element.end = new Date(element.etime * 1000)
                      element.timeLength = duration / 60
                      element.title = element.patientName
                      element.name = element.visitReason
                      if (((element.subtype & 0xf0000) >> 16) % 2 === 0) {
                        element.eventColor = '#FDE7C0'
                        element.textColor = '#EB9C0C'
                      } else if (
                        ((element.subtype & 0xf0000) >> 16) % 2 ===
                        1
                      ) {
                        element.eventColor = '#DDEFC8'
                        element.textColor = '#2FB355'
                      }

                      if ((element.tage & 0xf00) >> 8 == 1) {
                        element.eventColor = '#f9d9da'
                        element.textColor = '#e24445'
                      }
                      element.backgroundColor = element.eventColor
                      element.borderColor = element.eventColor
                      if ((element.tage & 0xf000) >> 12 === 3) {
                        element.coverageType = 'Personal Injury'
                      } else if ((element.tage & 0xf000) >> 12 === 1) {
                        element.coverageType = 'Medical Insurance'
                      } else if ((element.tage & 0xf000) >> 12 === 2) {
                        element.coverageType = 'Workers Comp'
                      } else if ((element.tage & 0xf000) >> 12 === 4) {
                        element.coverageType = 'Self Pay'
                      } else if ((element.tage & 0xf000) >> 12 === 0) {
                        element.coverageType = 'No Selected'
                      }
                      delete element.stime
                      delete element.etime
                      delete element.visitReason
                      delete element.eventColor
                    })
                  } else {
                    defaultData = []
                  }
                  let initialView = 'timeGridDay'
                  if (dataValue.dataWeek == 'week') {
                    if (dataValue.dataDay === 'day') {
                      initialView = 'timeGridDay'
                    } else {
                      initialView = 'timeGridWeek'
                    }
                  }
                  let calendar = new Calendar(node, {
                    plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
                    dayHeaderClassNames: 'fc.header',
                    headerToolbar: headerBar,
                    height: '77.9vh',
                    allDaySlot: false, // 是否显示表头的全天事件栏
                    initialView: initialView,
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
                    // slotLabelInterval : "00:10:00",
                    displayEventTime: false,
                    views: {
                      timeGridFourDay: {
                        type: 'timeGrid',
                        buttonText: '2 day',
                      },
                    },
                    viewDidMount(mountArg) { },
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
                      let t_time = new Date(
                        info.event._instance.range.start,
                      );
                      tippy(info.el, {
                        content:
                          '<div >\
                                        <div style="padding-top:2px">Patient Name ：' +
                          info.event._def.extendedProps.patientName +
                          '</div>\
                                        <div style="padding-top:2px">Appointment Type ：' +
                          info.event._def.extendedProps.visitType +
                          '</div>\
                                        <div style="padding-top:3px">Reason ：' +
                          (info.event._def.extendedProps.name ??
                            info.event._def.extendedProps.Reason) +
                          '</div>\
                                        <div style="padding:4px 0">StartTime：' +
                          formatDate(
                            t_time.getTime() +
                            t_time.getTimezoneOffset() * 60 * 1000,
                            'HH:mm:ss',
                          ) +
                          '<div  style="padding-top:3px">Duration：' +
                          info.event._def.extendedProps.timeLength +
                          ' minutes' +
                          '</div>' +
                          '<div  style="padding-top:3px">Coverage Type: ' +
                          info.event._def.extendedProps.coverageType +
                          '</div>',
                        allowHTML: true,
                        //theme: 'translucent',
                        interactive: true,
                        placement: 'top',
                        // followCursor: true,
                        appendTo: () => node,
                        // plugins: [followCursor],
                        // duration: [0, 0],
                      })
                    },
                    //eventColor: 'red',
                    eventClick: function (event: {
                      event: { _def: { publicId: any } }
                    }) {
                      if (event.event._def) {
                        dataValue.response = event.event._def.publicId
                      }
                    },
                  })
                  app.instances.FullCalendar = {
                    inst: calendar,
                    page: pageName,
                  }
                  if (dataValue.start && dataValue.end) {
                    if (dataValue.currentDate) {
                      if (dataValue.dataWeek == 'week') {
                        calendar.gotoDate(dataValue.start * 1000)
                      } else {
                        calendar.gotoDate(dataValue.currentDate * 1000)
                      }
                    } else if (dataValue.end - dataValue.start > 86400) {
                      calendar.gotoDate(new Date().getTime())
                    } else {
                      calendar.gotoDate(dataValue.start * 1000)
                    }
                  }
                  calendar.render()
                  component.addEventListeners({
                    event: 'calendar',
                    callback: () => {
                      const timer = setTimeout(() => {
                        calendar.destroy()
                        clearTimeout(timer)
                      }, 10000)
                    },
                  })
                  window.setTimeout(() => {
                    ; (
                      document.querySelectorAll(
                        'tbody .fc-timegrid-now-indicator-line',
                      )[0] as HTMLDivElement
                    )?.scrollIntoView({ behavior: 'smooth' })
                    let docEventPrevClick: HTMLButtonElement =
                      document.querySelectorAll(
                        '.fc-prev-button',
                      )[0] as HTMLButtonElement
                    let docEventNextClick: HTMLButtonElement =
                      document.querySelectorAll(
                        '.fc-next-button',
                      )[0] as HTMLButtonElement
                    let docEventDayClick: HTMLButtonElement =
                      document.querySelectorAll(
                        '.fc-timeGridDay-button',
                      )[0] as HTMLButtonElement
                    let docEventWeekClick: HTMLButtonElement =
                      document.querySelectorAll(
                        '.fc-timeGridWeek-button',
                      )[0] as HTMLButtonElement
                    let timeTable = document.querySelector(
                      '[data-name=timeTable]',
                    ) as HTMLElement
                    let titleTime =
                      document.getElementsByClassName('fc-toolbar-title')[0]
                    let months = [
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ]
                    let abbMonths = [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ]
                    const timeClick = (e) => {
                      dataValue.data = ''
                    }
                    timeTable?.addEventListener('click', timeClick, true)
                    component.addEventListeners({
                      event: 'click',
                      callback: () => {
                        timeTable.removeEventListener('click', timeClick)
                      },
                    })
                    function getEventTime() {
                      let getMonth = titleTime.textContent?.split(
                        ' ',
                      )[0] as string
                      let getDay = titleTime.textContent
                        ?.split(' ')[1]
                        ?.split(',')[0] as string
                      let getYear = titleTime.textContent?.split(
                        ',',
                      )[1] as string
                      let getTimeNow = new Date(
                        +getYear,
                        +months.indexOf(getMonth),
                        +getDay,
                      ).getTime()
                      if (dataValue.currentDate !== dataValue.start) {
                        dataValue.start = dataValue.currentDate
                        dataValue.end = dataValue.currentDate + 86400
                      } else {
                        dataValue.start = getTimeNow / 1000
                        dataValue.end = getTimeNow / 1000 + 86400
                      }
                    }
                    function getEventTimeWeek() {
                      let getMonth,getDay,getYear;
                      getMonth = titleTime.textContent?.split(
                        ' '
                      )[0] as string
                      if(/.*,.*,/.test(titleTime?.textContent as string)){
                        getDay = titleTime.textContent
                          ?.split('–')[0]
                          ?.split(',')[0]
                          ?.split(' ')[1] as string
                        getYear = titleTime.textContent
                        ?.split('–')[0] 
                        ?.split(',')[1] as string
                        console.log(getMonth,"sss",getDay,"ssss",getYear,"sss",titleTime.textContent
                        ?.split('–')[0] )
                      }else{
                        getDay = titleTime.textContent
                          ?.split('–')[0]
                          ?.split(' ')[1] as string
                        getYear = titleTime.textContent?.split(
                          ','
                        )[1] as string
                      }
                      let getTimeNow = new Date(
                        +getYear,
                        +abbMonths.indexOf(getMonth),
                        +getDay,
                      ).getTime()

                      dataValue.start = getTimeNow / 1000
                      dataValue.end = getTimeNow / 1000 + 604800
                      if (!dataValue.currentDate) {
                        dataValue.currentDate =
                          new Date(new Date().toLocaleDateString()).getTime() /
                          1000
                      }
                    }
                    const prevClick = (e) => {
                      if (
                        !dataValue.dataWeek &&
                        dataValue.dataWeek !== 'week'
                      ) {
                        getEventTime()
                      } else {
                        getEventTimeWeek()
                      }
                      if (
                        !(dataValue.dataDay || dataValue.dataWeek) ||
                        (dataValue.dataDay == 'day' && dataValue.dataWeek == '')
                      ) {
                        dataValue.currentDate = dataValue.start
                      }
                      dataValue.data = 'prev'
                    }
                    const nextClick = (e) => {
                      if (
                        !dataValue.dataWeek &&
                        dataValue.dataWeek !== 'week'
                      ) {
                        getEventTime()
                      } else {
                        getEventTimeWeek()
                      }
                      if (
                        !(dataValue.dataDay || dataValue.dataWeek) ||
                        (dataValue.dataDay == 'day' && dataValue.dataWeek == '')
                      ) {
                        dataValue.currentDate = dataValue.start
                      }
                      dataValue.data = 'next'
                    }
                    docEventPrevClick.addEventListener('click', prevClick)
                    component.addEventListeners({
                      event: 'click',
                      callback: () => {
                        docEventPrevClick.removeEventListener(
                          'click',
                          prevClick,
                        )
                      },
                    })
                    docEventNextClick.addEventListener('click', nextClick)
                    component.addEventListeners({
                      event: 'click',
                      callback: () => {
                        docEventNextClick.removeEventListener(
                          'click',
                          nextClick,
                        )
                      },
                    })
                    const dayClick = (e) => {
                      getEventTime()
                      dataValue.data = 'day'
                      dataValue.dataDay = 'day'
                      dataValue.dataWeek = ''
                      titleTime.textContent = ''
                    }
                    const weekClick = (e) => {
                      getEventTimeWeek()
                      dataValue.data = 'week'
                      dataValue.dataWeek = 'week'
                      dataValue.dataDay = ''
                    }
                    docEventDayClick.addEventListener('click', dayClick)
                    component.addEventListeners({
                      event: 'click',
                      callback: () => {
                        docEventDayClick.removeEventListener('click', dayClick)
                      },
                    })
                    docEventWeekClick.addEventListener('click', weekClick)
                    component.addEventListeners({
                      event: 'click',
                      callback: () => {
                        docEventWeekClick.removeEventListener(
                          'click',
                          weekClick,
                        )
                      },
                    })
                  }, 0)
                  // This is to fix the issue of calendar being blank when switching back from
                  // display: none to display: block
                  Object.defineProperty(calendar.el.style, 'display', {
                    set(value) {
                      if (value === 'none') return
                      this.display = value
                    },
                  })
                }

                // script.src =
                //   'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.js'
                // document.body.appendChild(script)

                // const link = document.createElement('link')
                // link.rel = 'stylesheet'
                // link.href =
                //   'https://cdn.jsdelivr.net/npm/fullcalendar@5.7.2/main.min.css'
                // link.onload = () => {
                //   log.log('APPENDED css to head')
                // }
                // document.head.appendChild(link)

                break
            }
          } else {
            // default echart
            log.log(`not define`)

            // let myChart = echarts.init(node)
            // let option = dataValue
            // option && myChart.setOption(option)
          }
        }
      },
    },
    '[App] data-value': {
      cond: ({ node, component }) => isTextFieldLike(node) || component.has('richtext'),
      before({ node, component }) {
        ; (node as HTMLInputElement).value = component.get('data-value') || ''
        node.dataset.value = component.get('data-value') || ''
        if (node.tagName === 'SELECT') {
          if ((node as HTMLSelectElement).length) {
            // Put the default value to the first option in the list
            ; (node as HTMLSelectElement)['selectedIndex'] = 0
          }
        }
      },
      resolve({ node, component, page }) {
        const iteratorVar = findIteratorVar(component)
        const dataKey =
          component.get('data-key') || component.blueprint?.dataKey || ''
        const maxLen = component.get('maxLength') || ''
        const showFocus = component.get('showSoftInput') || ''
        const initialCapital = component.get('initialCapital') || ''
        if (maxLen) {
          node?.setAttribute('maxlength', maxLen)
        }
        if (dataKey) {
          if (
            component?.type == 'textField' &&
            component?.contentType == 'password'
          ) {
            const executeFunc = getOnChange({
              component,
              dataKey,
              evtName: 'onInput',
              node: node as NDOMElement,
              iteratorVar,
              page,
            })
            // node.addEventListener(
            //   'input',
            //   executeFunc,
            // )
            const listener = addListener(node, 'input', executeFunc)
            component.addEventListeners(listener)
          } else {
            const executeFunc = getOnChange({
              component,
              dataKey,
              evtName: 'onChange',
              node: node as NDOMElement,
              iteratorVar,
              page,
            })
            // node.addEventListener(
            //   'change',
            //   getOnChange({
            //     component,
            //     dataKey,
            //     evtName: 'onChange',
            //     node: node as NDOMElement,
            //     iteratorVar,
            //     page,

            //   }),
            // )
            const listener = addListener(node, 'change', executeFunc)
            component.addEventListeners(listener)

            if (component?.type == 'textField') {
              const executeFunc = component.blueprint.debounce
                ? antiShake(
                  getOnChange({
                    component,
                    dataKey,
                    evtName: 'onInput',
                    node: node as NDOMElement,
                    iteratorVar,
                    page,
                    initialCapital,
                  }),
                  component.blueprint.debounce,
                )
                : getOnChange({
                  component,
                  dataKey,
                  evtName: 'onInput',
                  node: node as NDOMElement,
                  iteratorVar,
                  page,
                  initialCapital,
                })
              const listener = addListener(node, 'input', executeFunc)
              component.addEventListeners(listener)
              // node.addEventListener(
              //   'input',
              //   component.blueprint.debounce
              //     ? antiShake(
              //         getOnChange({
              //           component,
              //           dataKey,
              //           evtName: 'onInput',
              //           node: node as NDOMElement,
              //           iteratorVar,
              //           page,
              //           initialCapital
              //         }),
              //         component.blueprint.debounce,
              //       )
              //     : getOnChange({
              //         component,
              //         dataKey,
              //         evtName: 'onInput',
              //         node: node as NDOMElement,
              //         iteratorVar,
              //         page,
              //         initialCapital
              //       }),
              // )
            }
            if (component?.type == 'textView') {
              const executeFunc = getOnChange({
                component,
                dataKey,
                evtName: 'onInput',
                node: node as NDOMElement,
                iteratorVar,
                page,
              })
              const listener = addListener(node, 'input', executeFunc)
              component.addEventListeners(listener)
              // node.addEventListener(
              //   'input',

              //   getOnChange({
              //     component,
              //     dataKey,
              //     evtName: 'onInput',
              //     node: node as NDOMElement,
              //     iteratorVar,
              //     page,
              //     initialCapital
              //   }),
              // )
            }
            if (component.has('richtext')) {
              const executeFunc = getOnChange({
                component,
                dataKey,
                evtName: 'onBlur',
                node: node as NDOMElement,
                iteratorVar,
                page,
              })
              const listener = addListener(node, 'blur', executeFunc)
              component.addEventListeners(listener)
            }

          }
        }
        if (component.blueprint?.onBlur) {
          const executeFunc = getOnChange({
            component,
            dataKey,
            evtName: 'onBlur',
            node: node as NDOMElement,
            iteratorVar,
            page,
          })
          const listener = addListener(node, 'blur', executeFunc)
          component.addEventListeners(listener)
          // node.addEventListener(
          //   'blur',
          //   getOnChange({
          //     node: node as NDOMElement,
          //     component,
          //     dataKey,
          //     evtName: 'onBlur',
          //     iteratorVar,
          //     page,
          //   }),
          // )
        }
      },
    },
    '[App] image': {
      cond: 'image',
      async resolve({ node, component }) {
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
          u.entries(component.style)?.forEach?.(([k, v]) => onEntry(k, v))
          parent && findFirstByElementId(parent)?.appendChild?.(iframeEl)
        }
      },
    },
    '[App] Hover': {
      cond: ({ component }) => component.has('hover'),
      resolve({ node, component }) {
        if (component?.blueprint?.hover) {
          node?.addEventListener('mouseover', () => {
            u.entries(component?.blueprint?.hover)?.forEach?.(
              ([key, value]) => {
                value = String(value).substring?.(2)
                node.style[key] = '#' + value
              },
            )
          })
          node?.addEventListener('mouseout', function (e) {
            u.entries(component?.blueprint?.hover)?.forEach?.(
              ([key, value]) => {
                let realvalue = component.style[key]
                if (
                  typeof realvalue == 'undefined' &&
                  key == 'backgroundColor'
                ) {
                  realvalue = '#ffffff'
                }
                if (typeof realvalue == 'undefined' && key == 'fontColor') {
                  realvalue = '#000000'
                }
                node.style[key] = realvalue
              },
            )
          })
        }
      },
    },
    '[App] BubbleCaptureEvent': {
      cond: ({ component }) =>
        component.has('bubble') || component.has('defaultEvent'),
      resolve({ node, component }) {
        if (
          component?.blueprint?.bubble &&
          component?.blueprint?.bubble === true
        ) {
          node?.addEventListener(
            'click',
            (e) => {
              e.stopPropagation()
            },
            false,
          )
        }
        if (
          component?.blueprint?.defaultEvent &&
          component?.blueprint?.defaultEvent === true
        ) {
          node?.addEventListener(
            'click',
            (e) => {
              e.preventDefault()
            },
            false,
          )
        }
      },
    },
    '[App] QRCode': {
      cond: 'image',
      resolve({ node, component }) {
        if (node && component && component.contentType === 'QRCode') {
          const dataValue = component.get('data-value') || '' || 'dataKey'
          let text = dataValue
          if (u.isObj(dataValue)) {
            text = JSON.stringify(dataValue)
          }

          let opts: any = {
            errorCorrectionLevel: 'H',
            type: 'svg',
            quality: 0.3,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
            scale: 8,
          }

          QRCode.toDataURL(text, opts, function (err, url) {
            // if (err) throw err
            ; (node as HTMLImageElement).src = url
          })
        }
      },
    },
    '[App] highLight': {
      cond: 'label',
      resolve({ node, component }) {
        if (component.has('highlightKey') && component.has('highlightStyle')) {
          function heightLight(string, keyword) {
            let reg = new RegExp(keyword, 'gi')
            string = string.replace(reg, function (txt) {
              return `<span class="highlight">${txt}</span>`
            })
            return string
          }

          const highlightKey = component.get('highlightKey')
          const pageName = app.currentPage
          const localhighlightValue = get(app.root[pageName], highlightKey)
          const remotehighlightValue = get(app.root, highlightKey)
          const highlightValue = localhighlightValue
            ? localhighlightValue
            : remotehighlightValue
          if (highlightValue) {
            const highlightStyle = component.get('highlightStyle')

            let originalValue = node.innerHTML

            node.innerHTML = ''
            node.innerHTML = heightLight(originalValue, highlightValue)

            let currentSpans = node.getElementsByClassName('highlight')
            // let domObj:any = document.getElementsByClassName('highlight')
            for (let i = 0; i < currentSpans.length; i++) {
              let currentSpan = currentSpans[i] as HTMLElement
              u.entries(highlightStyle)?.forEach?.(([key, value]) => {
                currentSpan.style[key] = value
              })
            }
          }
        }
      },
    },
    '[App] dropDown': {
      cond: 'textField',
      resolve({ node, component }) {
        if (component.contentType === 'dropDown') {
          const iteratorVar = findIteratorVar(component)
          const dataKey =
            component.get('data-key') || component.blueprint?.dataKey || ''
          const originalParent = node?.parentNode as HTMLDivElement
          let pageName = app.currentPage
          let json1 = [
            {
              id: 1,
              disabled: false,
              groupName: 'Condition',
              groupId: 1,
              selected: false,
              name: 'Primary Care Physician (PCP)',
            },
            {
              id: 2,
              disabled: false,
              groupName: 'Condition',
              groupId: 1,
              selected: false,
              name: 'OB-GYN (Obstetrician-Gynecologist)',
            },
            {
              id: 3,
              disabled: false,
              groupName: 'procedure',
              groupId: 2,
              selected: false,
              name: 'Dermatologist',
            },
            {
              id: 4,
              disabled: false,
              groupName: 'procedure',
              groupId: 2,
              selected: false,
              name: 'Dentist',
            },
            {
              id: 5,
              disabled: false,
              groupName: 'doctor',
              groupId: 3,
              selected: false,
              name: 'Ear, Nose & Throat Doctor (ENT / Otolaryngologist)',
            },
            {
              id: 6,
              disabled: false,
              groupName: 'doctor',
              groupId: 3,
              selected: false,
              name: 'Eye Doctor',
            },
          ]

          if (node) {
            let ul = document.createElement('ul')
            let top = parseFloat(node.style.top.replace('px', ''))
            let height = parseFloat(node.style.height.replace('px', ''))
            let newTop = top + height
            ul.style.display = 'none'
            ul.style.width = node.style.width
            ul.style.zIndex = '100'
            ul.style.background = '#ffffff'
            ul.style.overflowY = 'auto'
            ul.style.overflowX = 'hidden'
            ul.style.padding = '0'
            ul.style.margin = '0'
            ul.style.top = newTop + 'px'
            ul.style.left = node.style.left
            ul.style.position = 'absolute'
            ul.style.alignItems = 'center'

            node.addEventListener('focus', function (e) {
              ul.innerHTML = ''
              ul.style.display = 'block'
              json1.forEach((element) => {
                let li = document.createElement('li')
                li.style.width = node.style.width
                li.style.height = '40px'
                li.style.listStyleType = 'none'
                li.style.fontWeight = '400'
                li.style.fontSize = '14px'
                li.style.fontFamily =
                  'Helvetica Neue,Helvetica,Arial,sans-serif'
                li.innerHTML = element.name
                li.style.cursor = 'point'
                ul.style.border = 'solid 1px #A5A5A5'

                li.addEventListener('mouseover', function (e) {
                  li.style.background = '#efefef'
                })
                li.addEventListener('mouseout', function (e) {
                  li.style.background = '#ffffff'
                })

                li.onclick = function () {
                  log.log(li.innerHTML)
                  node.innerHTML = li.innerHTML
                  node.setAttribute('data-value', li.innerHTML)
                  ul.innerHTML = ''
                  ul.style.display = 'none'
                  app.updateRoot((draft) => {
                    set(draft?.[pageName], dataKey, li.innerHTML)
                  })
                }
                ul.appendChild(li)
              })
              ul.style.height = json1.length * 40 + 'px'
            })

            node.addEventListener('input', function (e) {
              ul.innerHTML = ''
              ul.style.display = 'block'
              // log.log(node.value)
              let count = 0
              json1.forEach((element) => {
                let name = element.name.toLowerCase()
                let key = node.innerHTML.toLowerCase()
                if (name.indexOf(key) != -1) {
                  count = count + 1
                  let li = document.createElement('li')
                  li.style.width = node.style.width
                  li.style.height = '40px'
                  li.style.listStyleType = 'none'
                  li.style.fontWeight = '400'
                  li.style.fontSize = '14px'
                  li.style.fontFamily =
                    'Helvetica Neue,Helvetica,Arial,sans-serif'
                  li.setAttribute(':hover', '')
                  li.innerHTML = element.name
                  li.style.cursor = 'point'
                  ul.style.border = 'solid 1px #A5A5A5'

                  li.addEventListener('mouseover', function (e) {
                    li.style.background = '#efefef'
                  })
                  li.addEventListener('mouseout', function (e) {
                    li.style.background = '#ffffff'
                  })

                  li.onclick = function () {
                    log.log(li.innerHTML)
                    node.innerHTML = li.innerHTML
                    node.setAttribute('data-value', li.innerHTML)
                    ul.innerHTML = ''
                    ul.style.display = 'none'
                    app.updateRoot((draft) => {
                      set(draft?.[pageName], dataKey, li.innerHTML)
                    })
                  }
                  ul.appendChild(li)
                }
              })
              ul.style.height = count * 40 + 'px'
            })

            // node.addEventListener("mouseout",function(e){
            //   ul.style.display = "none"
            // })

            originalParent.appendChild(ul)
          }
        }
      },
    },
    '[App] Map': {
      cond: 'map',
      resolve({ node, component }) {
        const dataValue = component.get('data-value') || '' || 'dataKey'
        if (node) {
          const parent = component.parent
          mapboxgl.accessToken =
            'pk.eyJ1IjoiamllamlleXV5IiwiYSI6ImNrbTFtem43NzF4amQyd3A4dmMyZHJhZzQifQ.qUDDq-asx1Q70aq90VDOJA'
          // let script = document.createElement("script")
          // script.type = "text/javascript"
          // script.appendChild(document.createTextNode("https://cdn.bootcdn.net/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.js"))
          // document.head.appendChild(script)
          let link = document.createElement('link')
          //Austin Yu 8/6/2021
          // link.href = 'https://cdn.bootcdn.net/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.css'
          // link.href = 'https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/2.1.1/mapbox-gl.css'
          link.href =
            'https://cdn.jsdelivr.net/npm/mapbox-gl@2.1.1/dist/mapbox-gl.css'
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
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
              }),
            )
            if (flag) {
              let featuresData: any[] = []
              dataValue.data.forEach((element: any) => {
                let str = ''
                let showName = ''
                let specialityArr = element.information.speciality
                let Name = element.information.name
                str = specialityArr
                if (Name == 'undefined undefined') {
                  showName = 'No Name'
                } else {
                  showName = Name
                }
                let item = {
                  type: 'Feature',
                  properties: {
                    name: showName,
                    speciality: str,
                    phoneNumber: element.information.phoneNumber,
                    address: element.information.address,
                  },
                  geometry: { type: 'Point', coordinates: element.data },
                }
                featuresData.push(item)
              })
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
                  let coordinates = e.features[0].geometry.coordinates.slice()
                  let Name = e.features[0].properties.name
                  let Speciality = e.features[0].properties.speciality
                  // let Title = e.features[0].properties.Title
                  let phoneNumber = e.features[0].properties.phoneNumber
                  let address = e.features[0].properties.address
                  new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(
                      '<span style="font-size: 1vh;">' +
                      Name +
                      ' </span><br> <span style="font-size: 1vh;">' +
                      Speciality +
                      '</span><br> <span style="font-size: 1vh;">' +
                      phoneNumber +
                      '</span><br> <span style="font-size: 1vh;">' +
                      address +
                      '</span>',
                    )
                    .addTo(map)
                })

                map.on('mouseenter', 'clusters', function () {
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
            canvasContainer['style']['width'] = '100%'
            canvasContainer['style']['height'] = '100%'
          }
        }
      },
    },
    '[App] Meeting': {
      cond: ({ node, component }) => !!(node && component),
      resolve: function onMeetingComponent({ node, component }) {
        const viewTag = component.blueprint?.viewTag || ''
        const setImportantStream = (label: 'mainStream' | 'selfStream') => {
          if (!app[label].isSameElement(node)) {
            app[label].setElement(node)
            log.debug(
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
            log.debug(
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
              log.error(
                `Attempted to add an element to a subStream but it ` +
                `already exists in the subStreams container`,
                app.subStreams.snapshot(),
              )
            }
          } else {
            log.error(
              `Attempted to create "subStreams" but a container (DOM element) ` +
              `was not available`,
              { node, component, ...app.streams.snapshot() },
            )
          }
        }
      },
    },
    // TODO - Move to default noodl-ui-dom lib implementation
    '[App] Page component': {
      cond: ({ component, elementType }) =>
        elementType === 'IFRAME' &&
        String(component?.blueprint?.path)?.endsWith('.html'),
      resolve({ component, node, findPage }) {
        // const iframeEl = node as HTMLIFrameElement
        // const componentPage = findPage(component) as ComponentPage
        // try {
        //   iframeEl.addEventListener('message', function (msg) {
        //     const postMessage = component.get('postMessage') as NUIActionChain
        //     const dataObject = msg.data
        //     log.func('postMessage (iframeEl)')
        //     log.green(`%cReceived message in page component`, {
        //       dataObject,
        //       message: msg,
        //       postMessage,
        //     })
        //     postMessage.data.set('someData', dataObject)
        //     postMessage?.execute?.(msg)
        //   })
        // } catch (error) {
        //   log.error(error)
        // }
        // iframeEl.addEventListener('load', function (evt) {
        //   log.func('load')
        //   log.debug(`Entered onload event for page remote (http) component`)
        //   log.debug('', this)
        //   log.green(
        //     `[ComponentPage] Attaching MutationObserver to body element`,
        //     { componentPage, thisValue: this, window: this.contentWindow },
        //   )
        // const obs = new MutationObserver((mutations) => {
        //   log.log(`[ComponentPage] Mutations`, mutations)
        // })
        // obs.observe(this, {
        //   attributes: true,
        //   childList: true,
        //   subtree: true,
        //   characterData: true,
        // })
        // this.contentWindow.addEventListener('message', function (msg) {
        //   const postMessage = component.get('postMessage') as NUIActionChain
        //   const dataObject = msg.data
        //   log.func('postMessage (parent)')
        //   log.green(`%cReceived message in page component`, {
        //     dataObject,
        //     message: msg,
        //     postMessage,
        //   })
        //   postMessage.data.set('someData', dataObject)
        //   postMessage?.execute?.(msg)
        // })
        // })
      },
    },
    '[App] Password textField': {
      cond: 'textField',
      resolve({ node, component }) {
        // Password inputs
        if (component.contentType === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            const timer = setTimeout(() => {
              const assetsUrl = app.nui.getAssetsUrl() || ''
              const eyeOpened = assetsUrl + 'makePasswordVisiableEye.svg'
              const eyeClosed = assetsUrl + 'makePasswordInvisibleEye.svg'
              const originalParent = node?.parentNode as HTMLDivElement
              const newParent = document.createElement('div')
              const eyeContainer = document.createElement('button')
              const eyeIcon = document.createElement('img')
              // const eyeIcon = originalParent.getElementsByTagName("img")[0] as HTMLImageElement||document.createElement('img')

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
              // newParent.style.background = 'none'
              // newParent.style.borderBottom = '1px solid #767676'

              node && (node.style.width = '100%')
              node && (node.style.height = '100%')

              eyeContainer.style.top = '0px'
              eyeContainer.style.bottom = '0px'
              eyeContainer.style.right = '6px'
              eyeContainer.style.background = 'none'
              eyeContainer.style.border = '0px'
              eyeContainer.style.display = 'flex'
              eyeContainer.style.alignItems = 'center'
              eyeContainer.style.outline = 'none'
              eyeContainer.style.marginLeft = '8px'
              eyeContainer.style.marginRight = '16px'

              // eyeIcon.style.width = '100%'
              // eyeIcon.style.height = '100%'
              eyeIcon.style.width = '18px'
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
              // node.appendChild(eyeContainer);
              // newParent.appendChild(img)
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
              clearTimeout(timer)
            })
          }
        } else if(component.contentType!=='strictNumber'){
          const contentType = component?.contentType || ''
          // Default === 'text'
          node.setAttribute(
            'type',
            /number|integer/i.test(contentType)
              ? 'number'
              : u.isStr(contentType)
                ? contentType
                : 'text',
          )
        }
      },
    },
    // '[App] strictNumber textField': {
    //   cond: 'textField',
    //   resolve({ node, component }) {
    //   }
    // },
    '[App] strictLength textField': {
      cond: 'textField',
      resolve({ node, component }) {
        if (component.contentType === 'strictLength') {
          let strictLength = {
            max: Number.MAX_VALUE,
            min: 1
          }
          if (component.props.strictLength) {
            if (component.props.strictLength.max >= 0) {
              strictLength.max = component.props.strictLength.max
            }
            if (component.props.strictLength.min >= 0) {
              strictLength.min = component.props.strictLength.min
            }
          }
          const parentNode = node.parentElement as HTMLElement;
          let oldValue = ''
          let borderColor = (node as HTMLInputElement).style.borderColor

          let tips = document.createElement("div")
          tips.innerText = `${strictLength.min} characters minimum`
          tips.style.cssText = `
            position: absolute;
            top: ${node.offsetTop + node.offsetHeight}px;
            left: ${node.offsetLeft}px;
            font-size: 12px;
            color: #ff0000;
            display: none;
          `
          const strict = () => {
            const value = (node as HTMLInputElement).value
            if (value.length < strictLength.min) {
              (node as HTMLInputElement).style.borderColor = "#ff0000";
              tips.style.display = "block"
              oldValue = value;
            } else if (value.length > strictLength.max) {
              (node as HTMLInputElement).value = oldValue;
            } else {
              (node as HTMLInputElement).style.borderColor = borderColor
              tips.style.display = "none"
              oldValue = value
            }
          }
          let isFocus = false
          parentNode.appendChild(tips)
          node.addEventListener('focus', () => {
            isFocus = true
          })
          node.addEventListener('blur', () => {
            if (isFocus) {
              strict()
              isFocus = false
            }
          })
          node.addEventListener('input', strict)

          const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
              if (mutation.type == "attributes" && mutation.attributeName == "style") {
                strict()
              }
            });
          })

          observer.observe(node, {
            attributes: true,
            attributeFilter: ['style']
          })

        } else if(component.contentType!=='strictNumber') {
          const contentType = component?.contentType || ''
          // Default === 'text'
          node.setAttribute(
            'type',
            /number|integer/i.test(contentType)
              ? 'number'
              : u.isStr(contentType)
                ? contentType
                : 'text',
          )
        }
      }
    },
    '[App] strictLength textView': {
      cond: 'textView',
      resolve({ node, component }) {
        if (component.contentType === 'strictLength') {
          let strictLength = {
            max: Number.MAX_VALUE,
            min: 1
          }
          if (component.props.strictLength) {
            if (component.props.strictLength.max >= 0) {
              strictLength.max = component.props.strictLength.max
            }
            if (component.props.strictLength.min >= 0) {
              strictLength.min = component.props.strictLength.min
            }
          }
          const parentNode = node.parentElement as HTMLElement;
          let oldValue = ''
          let borderColor = (node as HTMLInputElement).style.borderColor

          let tips = document.createElement("div")
          tips.innerText = `${strictLength.min} characters minimum`
          tips.style.cssText = `
            position: absolute;
            top: ${node.offsetTop + node.offsetHeight}px;
            left: ${node.offsetLeft}px;
            font-size: 12px;
            color: #ff0000;
            display: none;
          `
          const strict = () => {
            const value = (node as HTMLInputElement).value
            if (value.length < strictLength.min) {
              (node as HTMLInputElement).style.borderColor = "#ff0000";
              tips.style.display = "block"
              oldValue = value;
            } else if (value.length > strictLength.max) {
              (node as HTMLInputElement).value = oldValue;
            } else {
              (node as HTMLInputElement).style.borderColor = borderColor
              tips.style.display = "none"
              oldValue = value
            }
          }
          let isFocus = false
          parentNode.appendChild(tips)
          node.addEventListener('focus', () => {
            isFocus = true
          })
          node.addEventListener('blur', () => {
            if (isFocus) {
              strict()
              isFocus = false
            }
          })
          node.addEventListener('input', strict)

          const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
              if (mutation.type == "attributes" && mutation.attributeName == "style") {
                strict()
              }
            });
          })

          observer.observe(node, {
            attributes: true,
            attributeFilter: ['style']
          })

        } else {
          const contentType = component?.contentType || ''
          // Default === 'text'
          node.setAttribute(
            'type',
            /number|integer/i.test(contentType)
              ? 'number'
              : u.isStr(contentType)
                ? contentType
                : 'text',
          )
        }
      }
    },
    '[App] VideoChat Timer': {
      cond: ({ component: c }) =>
        c.has('text=func') && c.contentType === 'timer',
      resolve: ({ node, component }) => {
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
              const seconds = get(draft, dataKey) ? get(draft, dataKey) : 0
              set(draft, dataKey, seconds + 1)
              const updatedSecs = get(draft, dataKey)
              if (!Number.isNaN(updatedSecs) && u.isNum(updatedSecs)) {
                if (seconds === updatedSecs) {
                  // Not updated
                  log.error(
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
        component.emit('timer:init', initialValue)
      },
    },
    '[App] Rotation': {
      cond: 'rotation',
      resolve({ node, component }) {
        if (node && component.get('data-value').length) {
          type optionSetting = {
            borderRadius?: number
            direction?: 'horizontal' | 'vertical'
            spaceBetween?: number
            autoplay?:
            | boolean
            | {
              delay: number
              stopOnLastSlide?: boolean
              disableOnInteraction?: boolean
            }
            slidesPerView?: number
            effect?: 'coverflow' | 'cube' | 'fade' | 'flip' | 'slide'
            pagination?:
            | boolean
            | {
              type?: 'bullets' | 'custom' | 'fraction' | 'progressbar'
              clickable?: boolean
            }
            navigation?: boolean
            childStyle?: {
              width?: number | string
              height?: number | string
              objectFit?:  string
            }
            loop?: boolean
          }

          const dataValue = component.get('data-value') as (
            | string
            | { [key in string]: any }
          )[]
          const videoData = component.get('video-option')
          const option: optionSetting = component.get('data-option') as {
            [key in string]: any
          }
          node.setAttribute('class', 'swiper-container')
          let listDom: HTMLUListElement = document.createElement('ul')
          listDom.setAttribute('class', 'swiper-wrapper')
          listDom.style.listStyleType = 'none'
          for (let index = 0; index < dataValue.length; index++) {
            let liDom: HTMLLIElement = document.createElement('li')
            if (typeof dataValue[index] === 'object') {
              if ((dataValue[index] as object)['type'].includes('video')) {
                let videoDom: HTMLVideoElement = document.createElement('video')
                videoDom.src = dataValue[index]?.['path']
                videoDom.setAttribute('controls', 'controls')
                videoDom.setAttribute('preload', 'auto')
                videoDom.setAttribute('poster', videoData)
                videoDom.setAttribute('width', node.style.width)
                videoDom.setAttribute('height', node.style.height)
                liDom.appendChild(videoDom)
                listDom.appendChild(liDom)
              } else if (
                (dataValue[index] as object)['type'].includes('image')
              ) {
                let img: HTMLImageElement = document.createElement('img')

                img.src = dataValue[index]?.['path']
                img.style.width = option.childStyle?.width + ''
                img.style.height = option.childStyle?.height + ''
                img.style.objectFit = option.childStyle?.objectFit + ''
                // img.style.cursor = "pointer" ;
                liDom.appendChild(img)
                listDom.appendChild(liDom)
              }
            } else {
              if ((dataValue[index] as string).endsWith('mp4')) {
                let videoDom: HTMLVideoElement = document.createElement('video')
                videoDom.src = dataValue[index] as string
                videoDom.setAttribute('controls', 'controls')
                videoDom.setAttribute('preload', 'auto')
                videoDom.setAttribute('poster', videoData[0])
                videoDom.setAttribute('width', node.style.width)
                videoDom.setAttribute('height', node.style.height)
                liDom.appendChild(videoDom)
                listDom.appendChild(liDom)
              } else {
                let img: HTMLImageElement = document.createElement('img')
                img.src = dataValue[index] as string
                img.style.width = option.childStyle?.width + ''
                img.style.height = option.childStyle?.height + ''
                img.style.objectFit = option.childStyle?.objectFit + ''
                // img.style.cursor = "pointer" ;
                liDom.appendChild(img)
                listDom.appendChild(liDom)
              }
            }
          }
          for (let index = 0; index < listDom.childElementCount; index++) {
            ; (listDom.children[index] as HTMLLIElement).setAttribute(
              'class',
              'swiper-slide',
            )
              ; (listDom.children[index] as HTMLLIElement).style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
            `
          }
          node.appendChild(listDom)
          let prevBtn: HTMLDivElement = document.createElement('div')
          prevBtn.setAttribute('class', 'swiper-button-prev')
          let nextBtn: HTMLDivElement = document.createElement('div')
          nextBtn.setAttribute('class', 'swiper-button-next')
          let pagination: HTMLDivElement = document.createElement('div')
          pagination.setAttribute('class', 'swiper-pagination')
          node.appendChild(prevBtn)
          node.appendChild(nextBtn)
          node.appendChild(pagination)
          prevBtn.style.opacity = '0'
          nextBtn.style.opacity = '0'
          prevBtn.style.transition = 'opacity 0.3s'
          nextBtn.style.transition = 'opacity 0.3s'
          node.style
          node.style.cssText = `
              width: ${node.style.width};
              height: ${node.style.height};
              borderRadius: ${option.borderRadius}px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0;
              padding: 0;
            `
          let videoBor = document.getElementsByClassName('swiper-container')[0]
          let videolist = videoBor.getElementsByTagName('video')
          let v = videolist[0]

          let mySwiper: Swiper = new Swiper('.swiper-container', {
            // 内部元素之间的空隙
            spaceBetween: option.spaceBetween,
            // 垂直或水平切换选项
            // direction: 'horizontal',
            // 循环模式选项
            // loop: option.loop,
            // 自动切换选项
            autoplay: option.autoplay && {
              // delay: 2000,
              // 鼠标置于swiper时暂停自动切换，鼠标离开时恢复自动切换
              pauseOnMouseEnter: true,
              // 触发时，是否以后停止自动切换，默认true
              disableOnInteraction: false,
              ...(option.autoplay as {}),
            },
            // slide的切换效果，默认为"slide"（位移切换），可设置为'slide'（普通切换、默认）,"fade"（淡入）"cube"（方块）"coverflow"（3d流）"flip"（3d翻转）。
            effect: option.effect || 'slide',
            // 设置slider容器能够同时显示的slides数量(carousel模式)
            slidesPerView: option.slidesPerView,
            // 设定为true时，active slide会居中，而不是默认状态下的居左。
            centeredSlides: true,
            // coverflowEffect: {
            //     rotate: 0,
            //     stretch: 70, // 指的时后面一张图片被前一张图片遮挡的部分
            //     depth: 160, // 图片缩小的部分
            //     modifier: 2
            // }
            pagination: option.pagination && {
              el: '.swiper-pagination',
              ...(option.pagination as {}),
            },
            navigation: option.navigation && {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            },
            on: {
              slideChangeTransitionStart: function () {
                if (v) {
                  // @ts-expect-error
                  if (this.activeIndex !== 0) {
                    v.pause()
                  }
                  v.addEventListener('play', () => {
                    mySwiper.autoplay.stop()
                  })
                }
              },
            },
            // observer:true,//修改swiper自己或子元素时，自动初始化swiper
            // observeParents:true//修改swiper的父元素时，自动初始化swiper
          })
          if (v) {
            // v.addEventListener("click",()=>{
            //   log.log("vvvv",v);

            //   v.play();

            // })
            v.load()
            v.addEventListener('click', () => {
              if (!v.played) {
                v.play()
              }
            })
            if (option.autoplay) {
              v.addEventListener('pause', () => {
                mySwiper.autoplay.start()
              })
            }
          }
          if (option.navigation) {
            node.addEventListener('mouseenter', () => {
              prevBtn.style.opacity = '1'
              nextBtn.style.opacity = '1'
            })
            node.addEventListener('mouseleave', () => {
              prevBtn.style.opacity = '0'
              nextBtn.style.opacity = '0'
            })
          }
        } else {
        }
      },
    },
    '[App] audioView': {
      cond: 'audioView',
      resolve({ node, component }) {
        if (node) {
          const fragment = document.createDocumentFragment()
          const assetsUrl = app.nui.getAssetsUrl() || ''
          const dataValue = component.get('data-value');
          const dataOptions = component.get('data-option');
          const width = node.style.width
          //container box
          const element_div = document.createElement('div')
          element_div.style.cssText = `
              display: flex;
              justify-content: space-around;
              align-items: left;
              background-color: #F0F2F4;
              border-radius: 8;
              min-height: 60px;
              width: 100%;
              flex-direction: column;
          `
          fragment.append(element_div)

          //title top box
          const element_top_box = document.createElement('div')
          element_top_box.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
          `
          const element_title_img_box = document.createElement('div')
          const element_title_img = document.createElement('img')
          element_title_img.setAttribute('src',`${assetsUrl}editAudio.svg`)
          element_title_img_box.style.cssText = `
            width: 32px;
            max-width: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          `
          element_title_img.style.cssText = `
            width: 50%;
            object-fit: cover;
          `
          element_title_img_box.append(element_title_img)
          const element_title_text = document.createElement('div')
          element_title_text.style.cssText = `
            display: flex;
            align-items: center;
            margin-left: 5px;
            overflow:hidden;
            text-overflow:ellipsis;
            width: ${parseInt(width) - 32}px;
            font-weight: 600;
            white-space: nowrap;
            max-height: 1.2em;
          `
          element_top_box.append(element_title_img_box)
          element_top_box.append(element_title_text)
          element_div.append(element_top_box)

          //middle box
          const element_middle_box = document.createElement('div')
          element_middle_box.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
          `
          let transaction
          let isError:boolean = false
          let nonce
          if (dataValue["type"] === 545281) {
            const element_audio = document.createElement('audio')
            element_audio.setAttribute('controlslist','nofullscreen nodownload noplaybackrate noremoteplayback')
            element_audio.id = 'audio_c'
            element_audio.style.cssText = `
              margin: 0;
              padding: 0;
              width: ${(parseInt(width) - 32)*0.7 + 32}px;
              height: 35px;
            `
            let data
            if(u.isObj(dataValue["name"]["data"])){
              data = dataValue["name"]["data"]
            }else if(u.isStr(dataValue["name"]["data"])){
              if (dataValue["name"]["data"] === "") {
                data = {}
              } else {
                data = JSON.parse(dataValue["name"]["data"])
              }
            }
            const url = data["audioUrl"].split('?')[0]
            const title = dataValue["name"]['title']
            isError = dataValue["tage"]===10
            nonce = dataValue["name"]['nonce']
            transaction = data['transaction']
            element_audio.src = url
            element_audio.controls = true
            element_title_text.innerHTML = title?title:`${moment(dataValue["ctime"]*1000).format("L hh:mm A")}`
            element_middle_box.append(element_audio)

          } else if (dataValue["type"] === 540161) {
            const element_text_img_box = document.createElement("div")
            const element_text_img = document.createElement("img")
            const element_text_text = document.createElement("div")
            element_text_text.style.cssText =`
              // display: flex;
              // align-items: center;
              margin-left: 5px;
              max-height: 1.2em;
              width: ${(parseInt(width) - 32)*0.7}px;
              overflow:hidden;
              text-overflow:ellipsis;
              white-space: nowrap;
            `
            element_text_img_box.style.cssText = `
              width: 32px;
              height: 32px;
              max-width: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            `
            transaction = dataValue["name"]["data"]["transaction"]
            const title = dataValue["name"]["title"]
            isError = dataValue["tage"]===10
            nonce = dataValue["name"]['nonce']
            element_text_img.setAttribute('src',`${assetsUrl}texticon.svg`)
            element_text_img.style.cssText = `
              width: 50%;
              object-fit: cover;
            `
            element_text_text.innerHTML = transaction;
            element_title_text.innerHTML = title?title:`${moment(dataValue["ctime"]*1000).format("L hh:mm A")}`
            element_text_img_box.append(element_text_img)
            element_middle_box.append(element_text_img_box)
            element_middle_box.append(element_text_text)
            element_text_text.addEventListener("click",(e)=>{
              setTimeout(()=>{
                // @ts-ignore
                component.get("onTextClick")?.execute()
              })
            },{once: true})
          }

          const element_op_box = document.createElement('div')
          element_op_box.style.cssText = `
            display: flex;
            width: ${(parseInt(width) - 32)*0.3}px;
            justify-content: flex-end;
          `
          const element_btn = document.createElement("button");
          const element_img = document.createElement("img")
          element_btn.textContent = "Generate"
          element_btn.style.cssText = `
            margin-left: 10%;
            width: 70%;
            height: 32px;
            border: 1px solid #30b354;
            border-radius: 20px;
            padding: 5%;
            color: #30b354;
            font-size: 13px;
            font-weight: 600;
            overflow: hidden;
          `
          element_img.setAttribute("src",`${assetsUrl}opentranscription.svg`)
          element_img.style.cssText = `
            width: 15%;
            margin-left: 5%;
          `

          element_op_box.append(element_img)
          element_op_box.append(element_btn)
          element_middle_box.append(element_op_box)
          element_div.append(element_middle_box)

          //bottom time
          const element_bottom_box = document.createElement("div")
          const element_time_box = document.createElement("div")
          const element_time = document.createElement("div")
          element_time.textContent = `${moment(dataValue["ctime"]*1000).format("L hh:mm A")}`
          element_time.style.cssText = `
            display: flex;
            align-items: center;
            width: ${(parseInt(width) - 32)*0.6}px;
            font-size: 14px;
            color: #333333;
          `
          element_time_box.style.cssText = `
            width: 32px;
            max-width: 32px;
            margin-left: 5px;
          `
          element_bottom_box.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
          `
          element_bottom_box.append(element_time_box)
          element_bottom_box.append(element_time)

          element_div.append(element_bottom_box)
          node.append(fragment)
          if(isError){
            const element_error_box = document.createElement('div')
            const element_error_img = document.createElement('img')
            const element_error_text = document.createElement('div')
            element_error_img.setAttribute('src',`${assetsUrl}error.svg`)
            element_error_text.innerHTML = 'Generate Failed'
            element_error_text.style.cssText = `
              display: flex;
              align-items: center;
              font-size: 14px;
              margin-left: 10px;
              color: #FB5051;
            `
            element_error_box.style.cssText = `
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              width: ${(parseInt(width) - 32)*0.4}px;
            `
            element_error_box.append(element_error_img)
            element_error_box.append(element_error_text)
            element_bottom_box.append(element_error_box)

            const element_error_message = document.createElement('div')
            element_error_message.innerHTML = nonce
            element_error_message.style.cssText = `
              display: flex;
              align-items: center;
              font-size: 14px;
              padding-left: 11px;
              color: #FB5051;
            `
            node.append(element_error_message)
          }
            
          // 增加transcription的按钮
            // component.get("onGenerateClick")?.["actions"].shift()
          if (dataValue["type"] === 545281) {
            element_img.addEventListener("click",(e)=>{
              setTimeout(()=>{
                // @ts-ignore
                component.get("onVoiceClick")?.execute()
              })
            },{once: true})
          }else if (dataValue["type"] === 540161) { 
            element_img.addEventListener("click",(e)=>{
              setTimeout(()=>{
                // @ts-ignore
                component.get("onTextClick")?.execute()
              })
            },{once: true})
          }
            
            
          element_btn.addEventListener("click",(e)=>{
              set(dataOptions,"selectDoc",dataValue)
              set(dataOptions,"transcriptionContent",transaction)
              setTimeout(()=>{
                // @ts-ignore
                component.get("onGenerateClick")?.execute()
              },100)
              
            })
            
          element_top_box.addEventListener('click',(e)=>{
            setTimeout(()=>{
              // @ts-ignore
              component.get('onEditClick')?.execute()
            },100)
          })
        }
      }
    },
    '[App] Checkbox': {
      cond: 'checkbox',
      resolve({ node, component }) {
        if (node) {
          let pageName = app.currentPage
          const dataKey =
            component.get('data-key') || component.blueprint?.dataKey || ''
          const dataValue = (component.get('data-option') as {})['reason'] as {}
          const dataOptions = component.get('data-option') as {}
          let fragment: DocumentFragment | null =
            document.createDocumentFragment()
          // let childrenConta = document.createElement('div')
          node.textContent = ''
          if (get(app.root.Global, dataOptions['checkName']).length) {
            dataValue['selectedData'] = cloneDeep(
              get(app.root.Global, dataOptions['checkName']),
            )
          }
          const styleCheckBox = dataOptions['classStyle']
          let A = `{
              position: relative;
              background: wheat;
              border-radius: 50%;
          }`
          let chechedA = `{
              content: "";
              background: orange;
              position: absolute;
              top: 25%;
              left: 25%;
              width: 50%;
              height: 50%;
              border: none;
              border-radius: 50%;
          }`
          let B = `{
            appearance: none;
            background: #fff;
            width: 100%;
            position: relative;
            height: 100%;
            border: 2px solid #d9d9d9;
            border-radius: 50%;
        }`
          let chechedB = `{
            content: "";
            background-color: #fff;
            position: absolute;
            top: -2px;
            left: -1px;
            width: 100%;
            height: 100%;
            border: 2px solid #800080;
            border-radius: 50%;
            color: #7d7d7d;
            // font-size: 20px;
            font-weight: bold;
            text-align: center;
            line-height: 5vw;
        }`
          let C = `{
            appearance: none;
        }`
          // let cadlVersion = JSON.parse(localStorage.getItem('config') as string)
          //   .web.cadlVersion.stable
          // let cadlConfigUrl = JSON.parse(
          //   localStorage.getItem('config') as string,
          // ).cadlBaseUrl as string
          const assetsUrl = app.nui.getAssetsUrl() || ''
          let chechedC = `{
          content: "";
          display: inline-block;
          vertical-align: middle;
          width: 13px;
          height: 13px;
          background-image: url(${assetsUrl}selectGray.svg);
          background-size: 100%;
        }`
          let chechedCheck = `{
          background-image: url(${assetsUrl}selectGrayBlue.svg);
        }`
          switch (styleCheckBox) {
            case 'A': {
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]${A}`,
                0,
              )
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]:checked::before${chechedA}`,
                0,
              )
              break
            }
            case 'B': {
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]${B}`,
                0,
              )
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]:checked::before${chechedB}`,
                0,
              )
              break
            }
            case 'C': {
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]${C}`,
                0,
              )
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]::before${chechedC}`,
                0,
              )
              document.styleSheets[0].insertRule(
                `input[class=${styleCheckBox}]:checked::before${chechedCheck}`,
                0,
              )
              break
            }
            default: {
              break
            }
          }
          // const arrData: number[] = []
          for (let i = 0; i < dataValue['allData'].length; i++) {
            let childInput = document.createElement('input')
            let spanDom = document.createElement('div')
            let contanierDiv = document.createElement('div')

            if (dataOptions['module'] === 'radio') {
              childInput.type = 'radio'
              childInput.name = 'radio'
            } else {
              childInput.type = 'checkbox'
            }
            childInput.value = i + ''

            spanDom.textContent = get(
              dataValue['allData'][i],
              dataValue['path'],
            )
            if (
              dataValue['selectedData'] == get(dataValue['allData'][i], dataValue['path'])
            ) {
              childInput.checked = true
              app.updateRoot((draft) => {
                set(draft?.[pageName], dataKey, [i])
              })
            }
            childInput.setAttribute('class', dataOptions['classStyle'])
            for (
              let index = 0;
              index < Object.keys(dataOptions['inputStyle']).length;
              index++
            ) {
              let styleKey = `${Object.keys(dataOptions['inputStyle'])[index]}`
              let styleValue =
                dataOptions['inputStyle'][
                `${Object.keys(dataOptions['inputStyle'])[index]}`
                ]
              childInput.style[styleKey] = styleValue
            }
            for (
              let index = 0;
              index < Object.keys(dataOptions['textStyle']).length;
              index++
            ) {
              let styleKey = `${Object.keys(dataOptions['textStyle'])[index]}`
              let styleValue =
                dataOptions['textStyle'][
                `${Object.keys(dataOptions['textStyle'])[index]}`
                ]
              spanDom.style[styleKey] = styleValue
            }
            for (
              let index = 0;
              index < Object.keys(dataOptions['containerStyle']).length;
              index++
            ) {
              let styleKey = `${Object.keys(dataOptions['containerStyle'])[index]
                }`
              let styleValue =
                dataOptions['containerStyle'][
                `${Object.keys(dataOptions['containerStyle'])[index]}`
                ]
              contanierDiv.style[styleKey] = styleValue
            }
            contanierDiv.appendChild(childInput)
            contanierDiv.appendChild(spanDom)

            fragment.appendChild(contanierDiv)
          }
          node.append(fragment)
          fragment = null
          node.addEventListener('click', (e) => {
            let dataInput = +(e.target as HTMLInputElement).value
            if ((e.target as HTMLInputElement).nodeName == 'INPUT') {
              let selected = dataValue['selectedData'] as any
              if (dataOptions['module'] === 'radio') {
                selected = []
                selected[0] = dataInput
              } else {
                !selected.includes(dataInput)
                  ? selected?.push(dataInput)
                  : selected?.splice(selected.indexOf(dataInput), 1)
              }
              // let text =
              // selected.forEach((val)=>{
              //   arrReturnNew.push(dataValue["allData"][val-1]);
              // })
              app.updateRoot((draft) => {
                set(draft?.[pageName], dataKey, selected)
              })
              if (dataOptions['data']) {
                const keys = Object.keys(dataOptions['data'])
                const values = Object.values(dataOptions['data'])

                for (let i = 0; i < keys.length; i++) {
                  app.updateRoot((draft) => {
                    if (values[i] === '$') {
                      set(
                        draft?.[pageName],
                        keys[i],
                        dataValue['allData'][dataInput],
                      )
                    } else {
                      set(
                        draft?.[pageName],
                        keys[i],
                        get(dataValue['allData'][dataInput], `${values[i]}`),
                      )
                    }
                  })
                }
              }
              // app.root.Global.checkboxArr = selected
              set(
                app.root.Global,
                dataOptions['checkName'],
                dataValue['allData'][selected].name.data.category,
              )
              localStorage.setItem('Global', JSON.stringify(app.root.Global))
            }
          })
          // node.appendChild(childrenConta)
        }
      },
    },
    // '[App] Calendar': {
    //   cond: 'calendar',
    //   resolve({ node, component }) {
    //     const inputTarget = document.createElement('input')
    //     inputTarget.style.width = node.style.width
    //     inputTarget.style.height = node.style.height
    //     // inputTarget.setAttribute("class","latpickr form-control input")
    //     flatpickr(inputTarget, {
    //       // altInput: true,
    //       // enableTime: true,
    //       appendTo: node,
    //       dateFormat: 'Y-m-d',
    //       // altFormat: "DD-MM-YYYY",
    //       allowInput: true,
    //       // inline: true,
    //       // parseDate: (datestr, format) => {
    //       //   return moment(datestr, format, true).toDate();
    //       // },
    //       // formatDate: (date, format, locale) => {
    //       //   // locale can also be used
    //       //   return moment(date).format(format);
    //       // }
    //       // onChange: function(selectedDates, dateStr, instance){
    //       //   log.log(selectedDates, dateStr, instance)

    //       //   instance.calendarContainer.style.visibility = "visible"
    //       // }
    //     })
    //     node.append(inputTarget)

    //     // if (node && Object.keys(component.get('data-value'))) {
    //     // }
    //   },
    // },
    '[App] chatList': {
      cond: 'chatList',
      resolve({ node, component }) {
        
        const assetsUrl = app.nui.getAssetsUrl() || ""
        interface PdfCss {
          pdfContentWidth: number
          pdfContentHeight: number
          pdfIconWidth: number
          pdfIconHeight: number
        }
        interface BoxCss {
          width: string
          height: string
        }
        const scrollChange = debounce((node,scrollH)=>{
          node.scrollTop =
            scrollH == 0 ? node.scrollHeight : node.scrollHeight - scrollH
        },200)
        class liveChat {
          protected chatBox: HTMLElement
          public dataSource: Array<any>
          private pdfCss: PdfCss
          private boxCss: BoxCss
          private _events: any[]
          constructor(dataSource: Array<any>) {
            // dataSource = removeRepeat(dataSource)
            this.pdfCss = {
              pdfContentWidth: 200,
              pdfContentHeight: 60,
              pdfIconWidth: 40,
              pdfIconHeight: 40,
            }
            this.boxCss = {
              width: node.style.width,
              height: node.style.height,
            }
            this.dataSource = dataSource

            this.chatBox = document.createElement('div')
            this.chatBox.id = 'chatBox'
            this._events = []
            
            this.setBox()
            for (let i = 0; i < this.dataSource.length; i++) {
              const isLast = (i === this.dataSource.length-1)
              const itemData = this.dataSource[i]
              if(itemData?.name?.title){
                this.chatBox.appendChild(this.judgeType(itemData,isLast))
              }   
            }
          }

          public addNewChat(data: Array<any>){
            for (let i = 0; i < data.length; i++) {
              const isLast = (i === data.length-1)
              const itemData = data[i]
              if(itemData?.name?.title){
                this.chatBox.appendChild(this.judgeType(itemData,isLast))
              }   
            }
            // this.dataSource = this.dataSource.concat(data)
            // console.log('test8',this.dataSource)
            node.scrollTop = node.scrollHeight
          }
          

          public addOldChat(data: Array<any>){
            const oldHeight = node.scrollHeight
            for (let i = data.length-1; i >=0; i--) {
              const isLast = false
              const itemData = data[i]
              if(itemData?.name?.title){
                this.chatBox.insertBefore(this.judgeType(itemData,isLast),this.chatBox.firstChild)
              }   
            }
            node.scrollTop = node.scrollHeight - oldHeight

            // this.dataSource = data.concat(this.dataSource)
            // console.log('test8',this.dataSource)
          }

          private setBox() {
            this.chatBox.style.cssText = `
              position: relative;
              width: ${this.boxCss.width};
              height: ${this.boxCss.height};
              overflow: auto;
              scroll-behavior: smooth;
            `
          }

          public dom() {
            return this.chatBox
          }

          private caculateTime(timestamp: number) {
            const date = new Date(timestamp*1000)
            const time = ''
            let hour: string|number = date.getHours()
            let minute: string|number = date.getMinutes()
            const AP = hour > 12 ? "PM" : "AM"
            hour = hour > 12 ? `${hour - 12}` : `${hour}`
            minute = minute < 10 ? `0${minute}` : `${minute}`
            return `${hour}:${minute} ${AP}`
          }

          private createTextNode(Msg: any): DocumentFragment {
            const fragment = document.createDocumentFragment()
            let domNode = this.createChatNode()
            fragment.appendChild(domNode)
            let domNodeContent: HTMLElement
            let chatBackground: string
            let color: string
              ;[domNode, domNodeContent, chatBackground, color] = this.judgeIsOwner(
                domNode,
                this.IsOwner(Msg.bsig),
                Msg,
              )
            const urlRegex =
              /(\b((https?|ftp|file|http):\/\/)?((?:[\w-]+\.)+[a-z0-9]+)[-A-Z0-9+&@#%?=~_|!:,.;/]*[-A-Z0-9+&@#%=~_|/])/gi
            // const urlRegex = /\b(?:(http|https|ftp):\/\/)?((?:[\w-]+\.)+[a-z0-9]+)((?:\/[^/?#]*)+)?(\?[^#]+)?(#.+)?$/ig;
            try {
              let data = Msg.name.data
              if (typeof data == 'string') {
                data = JSON.parse(data)
              }
              const xss_remove = data.text.replace(/<(\S*?)[^>]*>.*?|<.*? \/>/g, '')
              let messageInfo = xss_remove.replace(urlRegex, (url) => {
                // return `<a href="${url}" target="_blank">${url}</a>`
                return `<a style="
                  text-decoration: underline;
                  color: rgb(0, 0, 238);
                " onclick="(()=>{
                  if(/(https?|ftp|file|http):\\/\\//.test('${url}')) {
                    window.open('${url}')
                  } else {
                    window.open('http://${url}')
                  }
                })()">${url}</a>`
              })
              let timeContent = document.createElement("div")
              timeContent.innerText = this.caculateTime(Msg.ctime)
              timeContent.style.cssText = `
                color: #999999;
              `
              let textContent = document.createElement('div')
              // textContent.innerHTML = Msg.message.info
              textContent.innerHTML = messageInfo
              textContent.style.cssText = `
                max-width: 100%;
                width: fit-content;
                border-radius: 8px;
                line-height: 21px;
                padding: 8px 15px 6px 12px;
                background-color: ${chatBackground};
                color: ${color};
                word-wrap: break-word;
                white-space: pre-wrap;
                font-size: 14px;
              `
              domNodeContent.append(timeContent, textContent)
            } catch (error) {
              
            }
            return fragment
          }

          private createPdfNode(Msg: any): DocumentFragment {
            const fragment = document.createDocumentFragment()
            let domNode = this.createChatNode()
            fragment.appendChild(domNode)
            let domNodeContent: HTMLElement
              ;[domNode, domNodeContent] = this.judgeIsOwner(
                domNode,
                this.IsOwner(Msg.bsig),
                Msg
              )
            let pdfInfo = this.judgePdfIsOwner(
              domNodeContent,
              this.IsOwner(Msg.bsig),
            )
            pdfInfo.innerHTML = `
                <div>${Msg.name.data.text}</div>
                <div style='font-size: 12pxcolor: grey;'>${Msg.name.data.text}</div>
            `
            return fragment
          }
          private addListener(node: HTMLElement, event: string, callback: any) {
            node.addEventListener(event, callback)
            return {
              event,
              callback: ()=>{
                node.removeEventListener(event,callback)
              }
            }
          }

          public removeListener(){
            if(u.isArr(this._events)){
              for(let i=0;i<this._events.length;i++){
                const item = this._events[i]
                if(u.isFnc(item.callback)){
                  item.callback?.()
                }
              }
              this._events = []
            }
          }
          private createImageNode(Msg:any,isLast:boolean): DocumentFragment{
            const fragment = document.createDocumentFragment()
            let domNode = this.createChatNode()
            fragment.appendChild(domNode)
            let domNodeContent: HTMLElement
            let chatBackground: string
            let color: string
              ;[domNode, domNodeContent, chatBackground, color] = this.judgeIsOwner(
                domNode,
                this.IsOwner(Msg.bsig),
                Msg,
              )
            let timeContent = document.createElement("div")
            timeContent.innerText = this.caculateTime(Msg.ctime || Msg?.name?.chatData?.time)
            timeContent.style.cssText = `
              color: #999999;
            `
            const imageContainer = document.createElement('div')
            imageContainer.style.cssText = `
              width: 100%;
              position: relative;
            `
            const imageData = Msg.tage === 2 ? Msg?.name?.chatData.localData:Msg?.name?.data
            const id = Msg?.id
            const func = app.root.builtIn.utils.prepareDocToPath
            const image = document.createElement('img')
            image.src = './chatDefaultImage.svg'
            image.loading = 'lazy'
            image.decoding = 'async'
            image.style.cssText = `
              max-width: 100%;
              max-height: 23vh;
              width: fit-content;
              line-height: 21px;
              padding: 8px 15px 6px 12px;
              word-wrap: break-word;
              white-space: pre-wrap;
              font-size: 14px;
              padding: 0;
              border-radius: 4px;
              border: 1px solid #DEDEDE;
            `
            if(id){
              if(imageData instanceof Blob){
                const func = app.root.builtIn.utils.prepareChatDocToPath
                func(id,imageData).then(res=>{
                  if(res){
                    res?.url && (image.src = res?.url)
                  }
                })
              }else if(u.isStr(imageData) && imageData.length > 32768){
                func(id,Msg?.name).then(res=>{
                  if(res){
                    res?.url && (image.src = res?.url)
                  }
                })
              }else{
                func(id).then(res=>{
                  if(res){
                    res?.url && (image.src = res?.url)
                  }
                })
              }
              
            }else if(!id && imageData instanceof Blob){
              func(id,imageData).then(res=>{
                if(res){
                  res?.url && (image.src = res?.url)
                }
              })
            }
            const listener = this.addListener(image,'load',(e)=>{
              scrollChange(node,scrollH)
            })
            this._events.push(listener)
            imageContainer.appendChild(image)
            if(isLast && Msg.tage === 2){
              const fragment = app.uploadProgress.generateProgress(id)
              //@ts-expect-error
              fragment.childNodes[0].style.visibility = 'visibility'
              imageContainer.appendChild(fragment)
            }
            imageContainer.addEventListener('click',()=>{
              const imageClicks = component.get("imageClick")
              if(imageClicks){
                imageClicks?.queue.forEach(imageClick=>{
                  if(imageClick?.dataKey){
                    imageClick.dataKey = {let: Msg}
                  }
                })
                imageClicks?.execute?.()
              }
 
            })
            domNodeContent.append(timeContent,imageContainer)
            return fragment
          }

          private judgeType(Msg: any,isLast:boolean): DocumentFragment | HTMLElement {
            let domNode: DocumentFragment | HTMLElement
            switch (Msg.name.title) {
              case 'textMessage':
                domNode = this.createTextNode(Msg)
                return domNode
              case 'pdfMessage':
                domNode = this.createPdfNode(Msg)
                return domNode
              case 'imageMessage':
                domNode = this.createImageNode(Msg,isLast)
                return domNode
              default:
                return document.createElement("div")
            }
          }

          private createChatNode(): HTMLElement {
            let domNode = document.createElement('div')
            domNode.style.cssText = `
              width: 100%;
              height: auto;
              margin: 18px 0px 18px 0px;
              display: flex;
            `
            return domNode
          }

          private createChatNodeContent(isOwner: boolean): HTMLElement {
            let domNodeContent = document.createElement('div')
            domNodeContent.style.cssText = `
                max-width: 60%;
                width: auto;
                height: auto;
            `
            if(isOwner) {
              domNodeContent.style.cssText += `
                display: flex;
                flex-direction: column;
                align-items: end;
              `
            }
            return domNodeContent
          }

          private createChatNodeAvatar(isOwner: boolean, Msg: any): HTMLElement {
            let data = Msg.name.data
            if (typeof data == 'string' && Msg.name.title !== 'imageMessage') {
              data = JSON.parse(data)
            }
            let domNodeAvatar = document.createElement('img')
            let avatarId = data?.avatar
            if(Msg.name.title === 'imageMessage'){
              avatarId = Msg.name.chatData.avatar
            }
            // console.log("AVATAR", avatarId)
            if(data?.capacity === "provider") 
              domNodeAvatar.src = `${assetsUrl}providerImage.svg`
            else if(data?.capacity === "patient")
              domNodeAvatar.src = `${assetsUrl}patientImage.svg`
            else 
              domNodeAvatar.src = `${assetsUrl}patientImage.svg`
            if(avatarId) {
              app.root.builtIn.utils.prepareDocToPath(avatarId).then((value) => {
                domNodeAvatar.setAttribute("src", value.url)
              })
            }
            
            let ML = ''
            let MR = ''
            if(isOwner) {
              ML = '12px'
              MR = '15px'
            } else {
              ML = "15px"
              MR = "12px"
            }
            domNodeAvatar.style.cssText = `
                width: 50px;
                height: 50px;
                border-radius: 5px;
                margin: 0 ${MR} 0 ${ML};
            `
            return domNodeAvatar
          }

          private IsOwner(ovid: string|null): boolean {
            let judgeOvid = localStorage.getItem('user_vid')
            return ovid === judgeOvid || !ovid
          }

          private judgeIsOwner(
            domNode: HTMLElement,
            isOwner: boolean,
            Msg: any,
          ): [HTMLElement, HTMLElement, string, string] {
            let domNodeContent = this.createChatNodeContent(isOwner)
            let domNodeAvatar = this.createChatNodeAvatar(isOwner, Msg)
            let chatBackground = '#FFFFFF'
            let color = '#000000'
            if (isOwner) {
              domNode.style.justifyContent = 'end'
              domNode.appendChild(domNodeContent)
              domNode.appendChild(domNodeAvatar)
              chatBackground = '#2988E6'
              color = "#ffffff"
            } else {
              domNode.style.justifyContent = 'start'
              domNode.appendChild(domNodeAvatar)
              domNode.appendChild(domNodeContent)
              chatBackground = '#F0F2F4'
              color = "#333333"
            }
            return [domNode, domNodeContent, chatBackground, color]
          }

          private judgePdfIsOwner(
            domNodeContent: HTMLElement,
            isOwner: boolean,
          ): HTMLElement {
            let pdfContent = document.createElement('div')
            pdfContent.style.cssText = `
                width: ${this.pdfCss.pdfContentWidth}px;
                height: ${this.pdfCss.pdfContentHeight}px;
                border-radius: 10px;
                display: flex;
                background-color: #FFFFFF;
            `
            let pdfIcon = document.createElement('img')
            pdfIcon.src = './assert/pdf.png'
            pdfIcon.style.cssText = `
              width: ${this.pdfCss.pdfIconWidth}px;
              height: ${this.pdfCss.pdfIconHeight}px;
              margin: ${(this.pdfCss.pdfContentHeight - this.pdfCss.pdfIconHeight) / 2
              }px 10px ${(this.pdfCss.pdfContentHeight - this.pdfCss.pdfIconHeight) / 2
              }px 10px;
            `
            let pdfInfo = document.createElement('div')
            pdfInfo.style.cssText = `
                width: ${this.pdfCss.pdfContentWidth - this.pdfCss.pdfIconWidth - 40
              }px;
                height: auto;
                margin: 5px 10px 5px 10px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            `
            domNodeContent.appendChild(pdfContent)
            if (isOwner) {
              pdfContent.appendChild(pdfIcon)
              pdfContent.appendChild(pdfInfo)
            } else {
              pdfContent.appendChild(pdfInfo)
              pdfContent.appendChild(pdfIcon)
            }
            return pdfInfo
          }
        }

        const data = component.get('listObject')
        const scrollH = component.get('data-value') || '' || 'dataKey'
        // const scrollH = component
        const globalListChat = store.globalListChat
        if(globalListChat){
          const oldData = globalListChat.dataSource
          const newData = data
          if(!u.isArr(oldData) || !u.isArr(newData)) return
          const oldDataLen = oldData.length
          const newDataLen = newData.length
          if(oldDataLen === newDataLen) return
          if(oldDataLen === 0){
            //perform upload
            const latestData = newData.slice(oldDataLen)
            globalListChat.addNewChat(latestData)
            // globalListChat.dataSource = u.cloneDeep(newData)
            globalListChat.dataSource = globalListChat.dataSource.concat(latestData)
          }else{
            const isPull = oldData[0]['id'] === newData[0]['id']?false:true
            if(isPull){
              //perform onPull
              const latestData = newData.slice(0,newDataLen-oldDataLen)
              globalListChat.addOldChat(latestData)
              // globalListChat.dataSource = u.cloneDeep(newData)
              globalListChat.dataSource = latestData.concat(globalListChat.dataSource)
            }else{
              //perform upload
              const latestData = newData.slice(oldDataLen)
              globalListChat.addNewChat(latestData)
              // globalListChat.dataSource = u.cloneDeep(newData)
              globalListChat.dataSource = globalListChat.dataSource.concat(latestData)
            }
          }
          
        }else{
          const liveChatObject = new liveChat(u.cloneDeep(data))
          store.globalListChat = liveChatObject
          let liveChatBox = liveChatObject.dom()
          node.innerHTML = ""
          node.append(liveChatBox)
          // node.innerHTML = liveChatBox.innerHTML
          node.setAttribute("class", "scroll-view")
          scrollChange(node,scrollH)
          node.addEventListener('wheel',(e)=>{
            liveChatObject.removeListener()
          })
        }
        
        
      },
    },
    '[App] navBar': {
      cond: 'navBar',
      resolve({ node, component }) {
        // console.error(component.get('dataKey'))
        let currentPage = app.currentPage
        const menuBarInfo = get(app.root, component.get('data-key'))
        let width = Number(node.style.width.replace('px', ''))
        let height = Number(node.style.height.replace('px', ''))

        const assetsUrl = app.nui.getAssetsUrl() || ''
        let style = component.get('style')
        const sprites = `${assetsUrl}sprites.png`
        const up = `${assetsUrl}arrowUp.svg`
        const down = `${assetsUrl}arrowDown.svg`

        const img = new Image()
        img.src = sprites

        let originIconWidth, originIconHeight

        const draw = () => {
          originIconWidth = img.width
          originIconHeight = img.height
          const originWidth = 278.25
          let ratio = Math.floor(100 * (width / originWidth)) / 100

          let ulCss = {
            width: width + 'px',
            height: height + 'px',
            left: '0px',
            top: '0px',
            margin: '0px',
            position: 'absolute',
            outline: 'none',
            display: 'block',
            'list-style': 'none',
          }

          let liCss = {
            left: '0px',
            'margin-top': '0px',
            width: width + 'px',
            position: 'relative',
            outline: 'none',
            height: 'auto',
            'list-style': 'none',
            'border-style': 'none',
            'border-radius': '0px',
          }

          let divCss = {
            // "background-color": "#005795",
            //@ts-expect-error
            height:
              Math.ceil((5 / Number(style?.height)) * height) / 100 + 'px',
            position: 'relative',
            outline: 'none',
            'margin-top': '0px',
          }

          let imgCss = {
            // @ts-expect-error
            width: Math.ceil((0.7 / Number(style?.width)) * width) / 100 + 'px',
            // @ts-expect-error
            top: Math.ceil((2 / Number(style?.height)) * height) / 100 + 'px',
            // @ts-expect-error
            left: Math.ceil((14.5 / Number(style?.width)) * width) / 100 + 'px',
            display: 'block',
            cursor: 'pointer',
            position: 'absolute',
            outline: 'none',
            'object-fit': 'contain',
            'margin-top': '0px',
          }

          let title1Css = {
            // @ts-expect-error
            width: Math.ceil((10 / Number(style?.width)) * width) / 100 + 'px',
            top: '0',
            // @ts-expect-error
            left: Math.ceil((4 / Number(style?.width)) * width) / 100 + 'px',
            // @ts-expect-error
            height:
              Math.ceil((5 / Number(style?.height)) * height) / 100 + 'px',
            // @ts-expect-error
            // "line-height": Math.ceil((5/Number(style?.height))*height)/100 + 'px',
            'box-sizing': 'border-box',
            color: '#ffffff',
            'font-size': '13.5px',
            cursor: 'pointer',
            position: 'absolute',
            outline: 'none',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'flex-start',
            'margin-top': '0px',
          }

          let optsList: Map<string, LIOpts> = new Map()
          let childMap: Map<string, string> = new Map()
          let extendMap: Map<string, string> = new Map()
          // let extendSet = new Set()

          const hash = createHash('sha256')
            .update(JSON.stringify(get(app.root, component.get('list'))))
            .digest('hex')

          // @ts-expect-error
          if (!!window.navBar && window.navBar.hash === hash) {
            // @ts-expect-error
            optsList = window.navBar.list
            // @ts-expect-error
            childMap = window.navBar.linkMap
            // @ts-expect-error
            extendMap = window.navBar.extendMap
          } else {
            console.warn('REFRESH')
            // const list = component.get('test')
            const list = get(app.root, component.get('list'))
            const len = list.length
            // @ts-expect-error
            window.navBar = {
              selectedPage: currentPage,
              extendSet: new Set(),
              hash: hash,
            }
            for (let i = 0; i < len; i++) {
              let child = list[i]
              let children: Array<LIOpts> = []
              let hasChildren = false
              let isExtend = false
              if (child.hasChildren === 'block') {
                let l = child.childList.length
                let t = 0
                for (t = 0; t < l; t++) {
                  let c = child.childList[t]
                  if (c.pageName === currentPage) {
                    isExtend = true
                  }
                  if (c.children instanceof Array) {
                    c.children.forEach((item) => {
                      childMap.set(item, c.pageName + '|' + child.pageName)
                    })
                  }
                  children.push({
                    isIcon: false,
                    title: c.title,
                    pageName: c.pageName,
                    level: c.level,
                    background: c.backgroundColor.replace('0x', '#'),
                    hasChildren: false,
                    withDot: c.childList instanceof Array
                  })
                  extendMap.set(c.pageName, child.pageName)
                  if(c.childList instanceof Array) {
                    c.childList.forEach(list => {
                      if (list.pageName === currentPage) {
                        isExtend = true
                      }
                      children.push({
                        isIcon: false,
                        title: list.title,
                        pageName: list.pageName,
                        level: list.level,
                        background: list.backgroundColor.replace('0x', '#'),
                        hasChildren: false,
                        hasDot: true
                      })
                      extendMap.set(list.pageName, child.pageName)
                    })
                  }
                }
                hasChildren = true
              }
              if (child.pageName === currentPage || isExtend) {
                optsList.set(child.pageName, {
                  isIcon: false,
                  isExtend: true,
                  title: child.title,
                  pageName: child.pageName,
                  level: child.level,
                  background: child.backgroundColor.replace('0x', '#'),
                  hasChildren: hasChildren,
                  logoPath: child.logoPath,
                  children: children,
                })
                if (hasChildren) {
                  // @ts-expect-error
                  window.navBar.extendSet.add(child.pageName)
                }
              } else {
                optsList.set(child.pageName, {
                  isIcon: false,
                  isExtend: false,
                  title: child.title,
                  pageName: child.pageName,
                  level: child.level,
                  background: child.backgroundColor.replace('0x', '#'),
                  hasChildren: hasChildren,
                  logoPath: child.logoPath,
                  children: children,
                })
              }
            }
            // @ts-expect-error
            window.navBar.list = optsList
            // @ts-expect-error
            window.navBar.linkMap = childMap
            // @ts-expect-error
            window.navBar.extendMap = extendMap
          }
          // @ts-expect-error
          let navBar = window.navBar
          let navList = navBar.list

          const toStr = (obj: Object): string => {
            return JSON.stringify(obj)
              .replace(new RegExp(',', 'g'), ';')
              .replace(new RegExp('"', 'g'), '')
              .replace('{', '')
              .replace('}', '')
          }

          interface LIOpts {
            hasChildren?: boolean
            level?: number
            isIcon: boolean
            title?: string
            pageName?: string
            logoPath?: string
            background?: string
            isExtend?: boolean
            children?: Array<LIOpts>
            hasDot?: boolean
            withDot?: boolean
          }

          class ul {
            dom: HTMLUListElement
            constructor(
              css: string,
              opts: Array<LIOpts> | Map<string, LIOpts>,
            ) {
              this.dom = document.createElement('ul')
              this.dom.style.cssText = css
              opts.forEach((child) => {
                // console.log("CHILD", child)
                this.dom.appendChild(new li(toStr(liCss), child).dom)
              })
            }
          }

          class li {
            dom: HTMLLIElement
            constructor(css: string, opts: LIOpts) {
              this.dom = document.createElement('li')
              this.dom.style.cssText = css
              let divDom = new div(
                toStr(
                  Object.assign({ ...divCss }, { background: opts.background }),
                ),
                opts,
              ).dom
              // if(opts.level === 2)
              if (!opts.hasChildren && !opts.withDot) divDom.id = `_${opts.pageName}_`
              this.dom.appendChild(divDom)
              if (opts.hasChildren) {
                let level2UlCss = {}
                if (opts.isExtend) {
                  level2UlCss = Object.assign(
                    { ...ulCss },
                    {
                      height: 'auto',
                      position: 'relative',
                      display: 'block',
                    },
                  )
                } else {
                  level2UlCss = Object.assign(
                    { ...ulCss },
                    {
                      height: 'auto',
                      position: 'absolute',
                      display: 'none',
                    },
                  )
                }
                let ulD = new ul(
                  toStr(level2UlCss),
                  opts.children as Array<LIOpts>,
                ).dom
                ulD.id = `_${opts.pageName}`
                this.dom.appendChild(ulD)
              }
            }
          }

          class div {
            dom: HTMLElement
            constructor(css: string, opts: LIOpts) {
              this.dom = document.createElement('div')
              this.dom.style.cssText = css
              if (!opts.isIcon) {
                this.dom.setAttribute('data-key', opts.title as string)
                if (opts.level === 1) {
                  const logoPathLeft =
                    Number(opts.logoPath?.split('px')[0]) * ratio
                  const logoPathRight =
                    Number(opts.logoPath?.split('px')[1]) * ratio
                  let iconCss = Object.assign(
                    { ...divCss },
                    {
                      // @ts-expect-error
                      width: 0.1 * Number(width) + 'px',
                      // @ts-expect-error
                      height:
                        Math.ceil((2.5 / Number(style?.height)) * height) /
                        100 +
                        'px',
                      // @ts-expect-error
                      left:
                        Math.ceil((1.5 / Number(style?.width)) * width) / 100 +
                        'px',
                      // @ts-expect-error
                      top:
                        Math.ceil((1.5 / Number(style?.height)) * height) /
                        100 +
                        'px',
                      position: 'absolute',
                      background: `url(${sprites}) ${logoPathLeft}px ${logoPathRight}px no-repeat`,
                      'background-size': `${ratio * originIconWidth}px ${ratio * originIconHeight
                        }px`,
                    },
                  )
                  this.dom.appendChild(
                    new div(toStr(iconCss), { isIcon: true }).dom,
                  )
                }
                let label = document.createElement('div')
                label.innerHTML = 
                  opts.hasDot ? 
                  `<svg style='margin-right: 5px;' xmlns="http://www.w3.org/2000/svg" width="5" height="5" viewBox="0 0 5 5">
                    <circle id="椭圆_1105" data-name="椭圆 1105" cx="2.5" cy="2.5" r="2.5" fill="#fff"/>
                  </svg>
                  ${opts.title}` : 
                  opts.title as string
                label.style.cssText = toStr(title1Css)
                label.setAttribute('title-value', `${opts.pageName}`)
                this.dom.appendChild(label)
                if (opts.hasChildren) {
                  let imageDom = document.createElement('img')
                  imageDom.src = opts.isExtend ? up : down
                  imageDom.style.cssText = toStr(imgCss)
                  imageDom.setAttribute('title-value', `${opts.pageName}`)
                  imageDom.id = `__${opts.pageName}`
                  this.dom.appendChild(imageDom)
                }
              }
            }
          }
          const ulDom = new ul(toStr(ulCss), optsList).dom

          node.appendChild(ulDom)

          ulDom.addEventListener('click', (event) => {
            let dom = event.target as HTMLImageElement
            app.updateRoot((draft) => {
              set(draft, component.get('data-key'), {
                pageName: 'ScheduleManagement',
                isGoto: false,
                status: true
              })
            })
            if (dom.tagName === 'DIV') {
              try {
                const action = (value: string) => {
                  // @ts-expect-error
                  navBar.selectedPage = value
                  // @ts-expect-error
                  document.getElementById(
                    `_${navBar.selectedPage}_`,
                  ).style.background = '#1871b3'
                  try {
                    let isExtend = navList.get(value).isExtend
                    if (!isExtend) {
                      extendSet.forEach((v) => {
                        if (navList.get(v).hasChildren) {
                          ; (
                            document.getElementById(`_${v}`) as HTMLUListElement
                          ).style.position = 'absolute'
                            ; (
                              document.getElementById(`_${v}`) as HTMLUListElement
                            ).style.display = 'none'
                            ; (
                              document.getElementById(
                                `__${v}`,
                              ) as HTMLImageElement
                            ).src = down
                          navList.get(v).isExtend = false
                        }
                      })
                      extendSet.clear()
                    }
                    if (navList.get(value).hasChildren) {
                      extendSet.add(value)
                      navList.get(value).isExtend = true
                    }
                  } catch (error) { }
                  app.updateRoot((draft) => {
                    set(draft, component.get('data-key'), {
                      pageName: value,
                      isGoto: true,
                      status: true
                    })
                  })
                }
                let value = dom.getAttribute('title-value') as string
                let img = document.getElementById(
                  `__${value}`,
                ) as HTMLImageElement
                if (img) {
                  let value = dom.getAttribute('title-value')
                  // @ts-expect-error
                  let isExtend = navList.get(value).isExtend
                  let ul = document.getElementById(
                    `_${value}`,
                  ) as HTMLUListElement
                  if (!isExtend) {
                    ul.style.position = 'relative'
                    ul.style.display = 'block'
                    img.src = up
                  }
                }
                action(value)
              } catch (error) { }
            } else if (dom.tagName === 'IMG') {
              let value = dom.getAttribute('title-value')
              // @ts-expect-error
              let isExtend = navList.get(value).isExtend
              let ul = document.getElementById(`_${value}`) as HTMLUListElement
              // @ts-expect-error
              window.app.root.Global.pageName = ''
              if (isExtend) {
                ul.style.position = 'absolute'
                ul.style.display = 'none'
                dom.src = down
                extendSet.delete(value)
                navList.get(value).isExtend = false
              } else {
                ul.style.position = 'relative'
                ul.style.display = 'block'
                dom.src = up
                extendSet.add(value)
                navList.get(value).isExtend = true
              }
            }
          })

          let extendSet = navBar.extendSet

          if (menuBarInfo.remainName !== '') {
            currentPage = menuBarInfo.remainName
            app.updateRoot(dratf => {
              set(dratf, component.get('data-key'), {
                isGoto: menuBarInfo.isGoto,
                pageName: menuBarInfo.pageName,
                remainName: ''
              })
            })
          }

          if (childMap.has(currentPage)) {
            // console.log("AAAABC")
            let info = childMap.get(currentPage)
            let PAGE = info?.split('|')[0]
            let BLOCK = info?.split('|')[1]
            if (navBar.selectedPage !== PAGE) {
              extendSet.forEach((v) => {
                if (navList.get(v).hasChildren) {
                  ; (
                    document.getElementById(`_${v}`) as HTMLUListElement
                  ).style.position = 'absolute'
                    ; (
                      document.getElementById(`_${v}`) as HTMLUListElement
                    ).style.display = 'none'
                    ; (document.getElementById(`__${v}`) as HTMLImageElement).src =
                      down
                  navList.get(v).isExtend = false
                }
              })
              extendSet.clear()
              extendSet.add(BLOCK)
              navList.get(BLOCK).isExtend = true
                ; (
                  document.getElementById(`_${BLOCK}`) as HTMLUListElement
                ).style.position = 'relative'
                ; (
                  document.getElementById(`_${BLOCK}`) as HTMLUListElement
                ).style.display = 'block'
              if (navList.get(BLOCK).hasChildren) {
                ; (
                  document.getElementById(`__${BLOCK}`) as HTMLImageElement
                ).src = up
              }
              // @ts-expect-error
              navBar.selectedPage = PAGE
              // @ts-expect-error
              // document.getElementById(`_${navBar.selectedPage}_`).style.background = '#1871b3'
            }
          }

          if (extendMap.has(currentPage)) {
            let extendPage = extendMap.get(currentPage)
            extendSet.forEach((v) => {
              if (navList.get(v).hasChildren) {
                ; (
                  document.getElementById(`_${v}`) as HTMLUListElement
                ).style.position = 'absolute'
                  ; (
                    document.getElementById(`_${v}`) as HTMLUListElement
                  ).style.display = 'none'
                  ; (document.getElementById(`__${v}`) as HTMLImageElement).src =
                    down
                navList.get(v).isExtend = false
              }
            })
            extendSet.clear()
            extendSet.add(extendPage)
            navList.get(extendPage).isExtend = true
              ; (
                document.getElementById(`_${extendPage}`) as HTMLUListElement
              ).style.position = 'relative'
              ; (
                document.getElementById(`_${extendPage}`) as HTMLUListElement
              ).style.display = 'block'
            if (navList.get(extendPage).hasChildren) {
              ; (
                document.getElementById(`__${extendPage}`) as HTMLImageElement
              ).src = up
            }
            // @ts-expect-error
            window.navBar.selectedPage = currentPage
          }

          if (
            optsList.has(currentPage) &&
            !optsList.get(currentPage)?.hasChildren
          ) {
            extendSet.forEach((v) => {
              if (navList.get(v).hasChildren) {
                ; (
                  document.getElementById(`_${v}`) as HTMLUListElement
                ).style.position = 'absolute'
                  ; (
                    document.getElementById(`_${v}`) as HTMLUListElement
                  ).style.display = 'none'
                  ; (document.getElementById(`__${v}`) as HTMLImageElement).src =
                    down
                navList.get(v).isExtend = false
              }
              extendSet.clear()
              // @ts-expect-error
              window.navBar.selectedPage = currentPage
            })
          }

          // @ts-expect-error
          if (navBar.selectedPage) {
            try {
              // @ts-expect-error
              document.getElementById(
                `_${navBar.selectedPage}_`,
              ).style.background = '#1871b3'
            } catch (error) { }
          }
        }

        if (img.complete) {
          draw()
        } else {
          img.onload = () => {
            draw()
            img.onload = null
          }
        }

      }
    },
    '[App editor]': {
      cond: "editor",
      resolve({ node, component }) {
        let style = document.createElement("style") as HTMLStyleElement
        const ROOT_CHILD = document.getElementById("root")?.children[0] as HTMLDivElement
        style.innerHTML =
          styleText
            .replace("@[SWAL_WIDTH]", `${ROOT_CHILD.clientWidth}px`)
            .replace("@[SWAL_LEFT]", `${0.16 * ROOT_CHILD.clientWidth}px`)
        document.body.appendChild(style)
        node.style.width = "100%"
        node.style.height = "100%"
        node.style.display = "flex"
        node.style.justifyContent = "center"
        node.style.alignItems = "center"
        node.innerHTML = editorHtml;

        // uuidMap.clear()

        // node.innerHTML = editorHtml.replace(/@\[\w+\]/g, `${node.clientHeight-82}px`)

        const assetsUrl = app.nui.getAssetsUrl() || ""
        const expend = `${assetsUrl}expend.svg`
        const contract = `${assetsUrl}contract.svg`
        const img = document.createElement("img") as HTMLImageElement
        img.src = expend
        img.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          cursor: pointer;
          z-index: 2;
        `
        node.appendChild(img)

        CalculateInit()

        const kp = new keypress()
        let isUseHotKey = false;
        let kpIsDisabled = false
        const id = node.id

        kp.clean()
        kp.listen({
          type: "keydown",
          key: ' ',
          callback: () => {
            // console.log(document.getElementById(id))
            if (!kpIsDisabled) {
              if (document.getElementById(id) !== null)
                isUseHotKey = true
              else {
                kp.clean()
              }
            }
          }
        })

        kp.listen({
          type: "keydown",
          skip: [
            ' ',
            'shift@'
          ],
          callback: (event) => {
            if (isUseHotKey) isUseHotKey = false
          }
        })

        kp.listen({
          type: 'keydown',
          key: '@',
          useCombination: 'shift',
          callback: () => {
            if (isUseHotKey) {
              const editor: IDomEditor = window.app.root.editor
              const selection = editor.selection
              searchPopUp({
                editor,
                selection,
                isUseHotKey
              })
              isUseHotKey = false
              // editor.insertText(`-editing-@[]-editing-`)
              // searchPopUp(editor)
            }
          }
        })

        let isExpend = true

        img.addEventListener("click", () => {
          if (isExpend) {
            img.src = contract;
            (document.getElementById("preViewBox") as HTMLElement).style.display = "none";
            (document.getElementById("editor—wrapper") as HTMLElement).style.width = "100%";
            isExpend = false
          } else {
            img.src = expend;
            (document.getElementById("preViewBox") as HTMLElement).style.display = "block";
            (document.getElementById("editor—wrapper") as HTMLElement).style.width = "45%";
            isExpend = true
          }
        })

        let oldSHA = ''
        const change = (editor: IDomEditor) => {
          const str = editor.getHtml()
          let newSHA = createHash('sha256').update(str).digest('hex')
          if (newSHA !== oldSHA) {
            // const oldTemplateInfo = get(app.root, component.get('data-key'))
            // const html = matchChar(str)
            const html = matchBlock(str).replace(/__replace__/g, assetsUrl)
            app.updateRoot(draft => {
              set(draft, component.get("data-key"), {
                html: str,
                yaml: getYaml(editor)
              })
            });
            (document.getElementById("preView") as HTMLDivElement).innerHTML = html
            oldSHA = newSHA
          }
        }
        editorConfig.onChange = change

        const editor = createEditor({
          content: [],
          selector: '#editor-container',
          html: '<p><br></p>',
          config: editorConfig,
          mode: 'default', // or 'simple'
        })

        const toolbarRegister = registerToolbar()

        const toolbar = createToolbar({
          editor,
          selector: '#toolbar-container',
          config: toolbarRegister.toolbarConfig,
          mode: 'default', // or 'simple'
        })

        let timer
        const calculateHeight = () => {
          let toolbarDom = document.getElementById("toolbar-container") as HTMLDivElement
          if (toolbarDom.clientHeight) {
            const height = `${node.clientHeight - toolbarDom.clientHeight - 2}px`;
            (document.getElementById("editor-container") as HTMLDivElement).style.height = height;
            (document.getElementById("preViewTilte") as HTMLDivElement).style.height = `${toolbarDom.clientHeight}px`;
            (document.getElementById("preView") as HTMLDivElement).style.height = height;
            node.removeEventListener("load", calculateHeight)
            const templateInfo = get(app.root, component.get('data-key'))
            if (templateInfo.title && templateInfo.title !== '') {
              editor.focus()
              // editor.dangerouslyInsertHtml(templateInfo.html)
              editor.setHtml(templateInfo.html)
              app.updateRoot(draft => {
                set(draft, component.get("data-key"), {
                  html: editor.getHtml(),
                  yaml: getYaml(editor)
                })
              })
            }
            if (!timer) {
              clearTimeout(timer)
            }
            editor.focus(true)
          } else {
            timer = setTimeout(calculateHeight, 0)
          }
        }
        calculateHeight()

        // node.addEventListener("load", calculateHeight)

        const adaptHeight = () => {
          const toolbarDom = document.getElementById("toolbar-container") as HTMLDivElement
          const editorDom = document.getElementById("editor-container") as HTMLDivElement
          // console.log(height);
          console.log(`${editorDom.clientHeight}px`);
          (document.getElementById("preView") as HTMLDivElement).style.height = `${editorDom.clientHeight}px`;
          (document.getElementById("preViewTilte") as HTMLDivElement).style.height = `${toolbarDom.clientHeight}px`;
        }

        editor.on("fullScreen", () => {
          let editorClass = (document.getElementById("editor—wrapper") as HTMLElement).getAttribute("class") as string;
          let previewClass = (document.getElementById("preViewBox") as HTMLElement).getAttribute("class") as string;
          if (!editorClass) editorClass = '';
          if (!previewClass) previewClass = '';
          (document.getElementById("editor—wrapper") as HTMLElement).setAttribute("class", editorClass + " w-e_full-editor");
          (document.getElementById("preViewBox") as HTMLElement).setAttribute("class", previewClass + "w-e-full-screen-container w-e_full-preView");
          img.style.display = "none";
          adaptHeight()
        })

        editor.on("unFullScreen", () => {
          let editorClass = (document.getElementById("editor—wrapper") as HTMLElement).getAttribute("class") as string;
          let previewClass = (document.getElementById("preViewBox") as HTMLElement).getAttribute("class") as string;
          if (!editorClass) editorClass = '';
          if (!previewClass) previewClass = '';
          (document.getElementById("editor—wrapper") as HTMLElement).setAttribute("class", editorClass.replace("w-e_full-editor", ""));
          (document.getElementById("preViewBox") as HTMLElement).setAttribute("class", previewClass.replace("w-e-full-screen-container w-e_full-preView", ""))
          img.style.display = "block";
          adaptHeight()
        })

        i18nChangeLanguage("en")

        app.updateRoot(draft => {
          set(draft, "editor", editor);
          set(draft, 'toolbar', toolbar);
        })

        const resource = i18nGetResources("en")
        resource.fontSize["default"] = "Font Size"

        app.mainPage.once(eventId.page.on.ON_DOM_CLEANUP, () => {
          // console.log("TEST")
          node.remove()
          kp.clean()
          editor.destroy()
          toolbar.destroy()
          app.updateRoot(draft => {
            set(draft, "editor", null);
            set(draft, 'toolbar', null);
          })
        })

        document.getElementById('editor—wrapper')?.addEventListener('click', (event) => {
          try {
            // @ts-ignore
            const isDisabled = editor.getFragment()[0].type === "table"
            kpIsDisabled = isDisabled
            toolbarRegister.templateSelect.disabled = isDisabled
            toolbarRegister.InfoSelect.disabled = isDisabled
            DynamicFields.disabled = isDisabled
          } catch (error) {

          }
        })

        document.getElementById('editor—wrapper')?.addEventListener('copy', (e) => {
          e.clipboardData && e.clipboardData.setData('text/plain', JSON.stringify(editor.getFragment()))
        })

        let cutData
        document.getElementById('editor—wrapper')?.addEventListener('cut', (e) => {
          cutData = editor.getFragment()
        }, true)

        document.getElementById('editor—wrapper')?.addEventListener('cut', (e) => {
          e.clipboardData && e.clipboardData.setData('text/plain', JSON.stringify(cutData))
        })


        window.addEventListener('resize', () => {
          app.updateRoot(draft => {
            set(draft, component.get("data-key"), {
              title: ' ',
              html: editor.getHtml(),
              yaml: getYaml(editor)
            })
          })
        }, true)

        // document.getElementById('editor—wrapper')?.addEventListener('')

      }
    },
    '[App templateView]': {
      cond: "templateView",
      resolve({ node, component }) {
        const html = get(app.root, component.get('data-key'))
        const assetsUrl = app.nui.getAssetsUrl() || ""
        node.setAttribute("class", "w-e-preView")
        const style = `
          <style>
            p {
              margin: 15px 0;
            }
            
            table {
              border-collapse: collapse;
              margin: 15px 0;
              table-layout: fixed;
            }

            th {
              min-width: 24px;
              height: ${editorBlockCss.height};
              padding: 3px 5px;
              border: 1px solid #ccc;
              background: #f5f2f0;
            }

            td {
              min-width: 24px;
              height: ${editorBlockCss.height};
              padding: 3px 5px;
              border: 1px solid #ccc;
            }

            .w-e_select_option {
              z-index: 10;
              width: 100%;
              min-height: ${editorBlockCss.height};
              padding: 0 10px;
              box-sizing: border-box;
            }
            .w-e_select_option:hover {
              background: #1e90ff !important;
              color: #ffffff !important;
            }

            .w-e-preView img {
              height: auto !important;
              max-width: 100%;  
            }
          </style>
        `
        // node.innerHTML = style + matchChar(html)
        node.innerHTML = style + matchBlock(html).replace(/__replace__/g, assetsUrl)
      }
    },
    '[App horizontalScroll]': {
      cond: "horizontalScroll",
      resolve({ node, component }) {

        node.style.display = 'flex'
        const assetsUrl = app.nui.getAssetsUrl() || ''

        let listStyle = {
          color: "#005795",
          background: "#f0f0f0",
          textDecoration: "underline",
          marginLeft: 10,
          marginRight: 0,
          buttonWidth: 40
        }

        let liStyle = component.get("listStyle")

        // console.log(liStyle, document.getElementById("root")?.clientWidth)
        if (liStyle) {
          const fullWidth = document.getElementById("root")?.children[0].clientWidth as number
          const floatReg = /^0.[0-9]*$/
          const pxReg = /^[1-9][0-9]*px$/
          if ("marginLeft" in liStyle) {
            if (floatReg.test(liStyle["marginLeft"]))
              liStyle["marginLeft"] = parseFloat(liStyle["marginLeft"]) * fullWidth
            else if (pxReg.test((liStyle["marginLeft"])))
              liStyle["marginLeft"] = liStyle["marginLeft"].replace("px", "")
            else
              delete liStyle["marginLeft"]
          }
          if ("margin-left" in liStyle) {
            if (floatReg.test(liStyle["margin-left"]))
              liStyle["marginLeft"] = parseFloat(liStyle["margin-left"]) * fullWidth
            else if (pxReg.test((liStyle["margin-left"])))
              liStyle["marginLeft"] = liStyle["margin-left"].replace("px", "")
            else
              delete liStyle["margin-left"]
          }
          if ("marginRight" in liStyle) {
            if (floatReg.test(liStyle["marginRight"]))
              liStyle["marginRight"] = parseFloat(liStyle["marginRight"]) * fullWidth
            else if (pxReg.test((liStyle["marginRight"])))
              liStyle["marginRight"] = liStyle["marginRight"].replace("px", "")
            else
              delete liStyle["marginRight"]
          }
          if ("margin-right" in liStyle) {
            if (floatReg.test(liStyle["margin-right"]))
              liStyle["marginRight"] = parseFloat(liStyle["margin-right"]) * fullWidth
            else if (pxReg.test((liStyle["margin-right"])))
              liStyle["marginRight"] = liStyle["margin-right"].replace("px", "")
            else
              delete liStyle["margin-right"]
          }
          if ("buttonWidth" in liStyle) {
            if (floatReg.test(liStyle["buttonWidth"]))
              liStyle["buttonWidth"] = parseFloat(liStyle["buttonWidth"]) * fullWidth
            else if (pxReg.test((liStyle["buttonWidth"])))
              liStyle["buttonWidth"] = liStyle["buttonWidth"].replace("px", "")
            else
              delete liStyle["buttonWidth"]
          }
          if ("button-width" in liStyle) {
            if (floatReg.test(liStyle["button-width"]))
              liStyle["buttonWidth"] = parseFloat(liStyle["button-width"]) * fullWidth
            else if (pxReg.test((liStyle["button-width"])))
              liStyle["buttonWidth"] = liStyle["button-width"].replace("px", "")
            else
              delete liStyle["button-width"]
          }
          listStyle = Object.assign(listStyle, liStyle)
        }

        const currentPage = app.currentPage

        const MenuShowNumber = 5
        const MenuItemHeight = 40

        const MENU = document.createElement("div")
        MENU.style.cssText = `
          width: ${listStyle.buttonWidth + listStyle.marginLeft + listStyle.marginRight}px;
          height: inherit;
          flex-shrink: 0;
          border-radius: 6px;
          cursor: pointer;
          box-sizing: border-box;
          background: url(${assetsUrl}menuIcon.svg) no-repeat;
          background-size: 50% 50%;
          background-position: center;
        `
        // MENU.innerHTML = `<img src="${assetsUrl}menuIcon.svg" width="${0.5 * listStyle.buttonWidth}" height="${0.5 * listStyle.buttonWidth}">`

        const MENULIST = document.createElement("div")
        MENULIST.style.cssText = `
          width: 300px;
          height: ${MenuShowNumber * MenuItemHeight}px;
          background: #ffffff;
          position: absolute;
          top: 2px;
          left: 0;
          border-radius: 10px;
          overflow-x: hidden;
          overflew-y: scroll;
          scroll-behavior: smooth;
          box-shadow: 0px 2px 5px #cccccc
        `
        // MENU.appendChild(MENULIST)

        const horizontalScroll = document.createElement('div')
        // const BTWidth = 100;
        horizontalScroll.style.cssText = `
          width: calc(100% - ${3 * (listStyle.buttonWidth + listStyle.marginLeft + listStyle.marginRight)}px);
          height: inherit;
          display: flex;
          overflow-x: scroll;
          overflow-y: hidden;
          scroll-behavior: smooth;
          flex-shrink: 0;
        `
        const list = get(app.root?.[currentPage], component.get('list'))
        const titlePath = component.get("titlePath")
        const dataKey = component.get("data-key")

        const Items = new Array<HTMLDivElement>()
        const MenuItems = new Array<HTMLDivElement>()
        const ALLWIDTHS = new Array<number>()
        const SHOWWIDTHS = new Array<number>()
        const SHOWITEM = new Map<number, HTMLDivElement>()

        let currentItem = {}
        let currentIndex = 0
        if (dataKey.startsWith(currentPage) || dataKey.startsWith("Global")) {
          currentItem = get(app.root, dataKey)
        } else {
          currentItem = get(app.root?.[currentPage], dataKey)
        }

        list.forEach((item, index) => {
          const Item = document.createElement("div")
          Item.innerText = `${get(item, titlePath)}`
          Item.style.cssText = `
            background: ${listStyle.background};
            text-decoration: underline;
            color: ${listStyle.color};
            text-align: center;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            padding: 0px 30px;
            border-top-left-radius: 7px;
            border-top-right-radius: 7px;
            margin-left: ${listStyle.marginLeft}px;
            margin-right: ${listStyle.marginRight}px;
            cursor: pointer;
            box-sizing: border-box;
          `
          Item.setAttribute("class", "horizontal")
          Item.setAttribute("alt", `${index}`)
          // if(index !== 0) Item.style.marginLeft = "4px"
          Items.push(Item)
          horizontalScroll.appendChild(Item)
          const MENUItem = document.createElement("div")
          MENUItem.setAttribute("class", "li")
          MENUItem.setAttribute("alt", `${index}`)
          MENUItem.innerText = `${get(item, titlePath)}`
          MENUItem.style.cssText = `
            background: #ffffff;
            width: inherit;
            height: ${MenuItemHeight}px;
            display: flex;
            justify-content: left;
            align-items: center;
            text-align: left;
            text-indent: 1em;
          `
          MenuItems.push(MENUItem)
          MENULIST.appendChild(MENUItem)
          // 校验ID, 无ID
          if (currentItem
            && get(currentItem, "id")
            && get(currentItem, "id") === get(item, "id")) {
            currentIndex = index
          }
        })
        const style = document.createElement("style")
        style.innerText = `
          ::-webkit-scrollbar {
            display: none;
          }
          .li:hover {
            background: ${listStyle.background} !important;
            font-weight: 700;
          }
          .horizontal:hover{
            background: ${listStyle.color} !important;
            color: #ffffff !important;
            font-weight: 700;
          }
        `
        node.appendChild(style)
        node.appendChild(MENU)
        node.appendChild(horizontalScroll)
        const BT = document.createElement("div")
        BT.style.cssText = `
          width: ${2 * (listStyle.buttonWidth + listStyle.marginLeft + listStyle.marginRight)}px;
          height: inherit;
          display: flex;
          justify-content: space-around;
          flex-shrink: 0;
        `
        const LEFT = document.createElement("div")
        LEFT.style.cssText = `
          width: ${listStyle.buttonWidth}px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        `
        LEFT.innerHTML = `<img src="${assetsUrl}leftBarIcon.svg" />`
        const RIGHT = document.createElement("div")
        RIGHT.style.cssText = `
          width: ${listStyle.buttonWidth}px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all .1;
        `
        RIGHT.innerHTML = `<img src="${assetsUrl}rightBarIcon.svg" />`
        BT.appendChild(LEFT)
        BT.appendChild(RIGHT)
        // node.appendChild(BT)

        // dom渲染监听
        let timer
        const getAllWidths = () => {
          if (horizontalScroll.clientWidth) {
            const WIDTH = horizontalScroll.clientWidth
            const MAXWIDTH = Math.floor(parseFloat(node.style.maxWidth.includes("px")
              ? node.style.maxWidth.replace("px", "")
              : node.style.maxWidth) - 3 * (listStyle.buttonWidth + listStyle.marginLeft + listStyle.marginRight))
            const HEIGHT = horizontalScroll.clientHeight
            Items.forEach(item => {
              ALLWIDTHS.push(item.clientWidth + listStyle.marginLeft + listStyle.marginRight)
            })
            if (WIDTH >= MAXWIDTH) {
              const blank = document.createElement("div")
              blank.style.cssText = `
                width: ${WIDTH}px;
                height: inherit;
                flex-shrink: 0;
              `
              horizontalScroll.appendChild(blank)
              node.appendChild(BT)
            } else {
              // horizontalScroll.style.width = `${WIDTH + 3 * listStyle.buttonWidth}px`
              horizontalScroll.style.width = "100%"
            }
            MENULIST.style.marginTop = `${HEIGHT}px`
            if (!timer) {
              clearTimeout(timer)
            }
          } else {
            timer = setTimeout(getAllWidths, 0)
          }
        }
        getAllWidths()
        const refreshAllWidth = () => {
          ALLWIDTHS.length = 0
          Items.forEach(item => {
            ALLWIDTHS.push(item.clientWidth + listStyle.marginLeft + listStyle.marginRight)
          })
        }

        const sum = (arr: Array<number>) => {
          let res = 0
          arr.forEach(item => {
            res += item
          })
          return res
        }

        const getShowWidths = (start: number) => {
          let count = 0
          const WIDTH = horizontalScroll.clientWidth
          SHOWWIDTHS.length = 0
          SHOWITEM.clear()
          do {
            if (ALLWIDTHS[start]) {
              SHOWWIDTHS.push(ALLWIDTHS[start])
              SHOWITEM.set(start, Items[start])
              count += ALLWIDTHS[start]
              start++
            } else {
              break
            }
          } while (count < WIDTH);
          if (sum(SHOWWIDTHS) > WIDTH) {
            SHOWITEM.delete(start - 1)
          }
        }
        let index = 0
        let selectIndex = 0
        getShowWidths(index)
        let lastIndex = index + SHOWWIDTHS.length - 1
        const calculateRight = () => {
          refreshAllWidth()
          getShowWidths(index)
          if (lastIndex < ALLWIDTHS.length) {
            horizontalScroll.scrollLeft += ALLWIDTHS[index]
            index++
            lastIndex = index + SHOWWIDTHS.length - 1
          }
          changBT()
        }
        const calculateLeft = () => {
          refreshAllWidth()
          getShowWidths(index)
          if (index > 0) {
            horizontalScroll.scrollLeft -= ALLWIDTHS[index - 1]
            index--
            lastIndex = index + SHOWWIDTHS.length - 1
          }
          changBT()
        }

        const changBT = () => {
          if (index === 0) {
            LEFT.style.filter = "grayscale(100%)"
          } else {
            LEFT.style.filter = "none"
          }
          refreshAllWidth()
          getShowWidths(index)
          const WIDTH = horizontalScroll.clientWidth
          // if(sum(SHOWWIDTHS) >= WIDTH) {
          if (lastIndex < ALLWIDTHS.length) {
            RIGHT.style.filter = "none"
          } else {
            RIGHT.style.filter = "grayscale(100%)"
          }
        }
        changBT()

        const delay_frame = (delay: number) => {
          let count = 0;
          return new Promise(function (resolve, reject) {
            (function raf() {
              count++;
              let id = window.requestAnimationFrame(raf);
              if (count > delay) {
                window.cancelAnimationFrame(id);
                resolve(true);
              }
            }())
          })
        }

        const gotoIndex = async (target: number) => {
          selectIndex = target
          app.updateRoot(draft => {
            if (dataKey.startsWith(currentPage) || dataKey.startsWith("Global")) {
              set(draft, dataKey, list[target])
            } else {
              set(draft?.[currentPage], dataKey, list[target])
            }
          })
          if (target >= lastIndex) {
            while (!SHOWITEM.has(target)) {
              calculateRight()
              await delay_frame(20)
            }
          } else if (target < index) {
            const step = index - target
            for (let i = 0; i < step; i++) {
              calculateLeft()
              await delay_frame(20)
            }
          }
          const targetDom = Items[target]
          Items.forEach(item => {
            if (item === targetDom) {
              item.style.background = listStyle.color
              item.style.color = "#ffffff"
              item.style.fontWeight = "700"
            } else {
              item.style.background = listStyle.background
              item.style.color = listStyle.color
              item.style.fontWeight = "normal"
            }
          })
        }

        function debounce(fn, delay = 500) {
          // timer 是在闭包中的
          let timer: NodeJS.Timeout | null = null;

          return function (...args) {
            const context = this
            if (timer) {
              clearTimeout(timer)
            }
            timer = setTimeout(() => {
              fn.apply(context, args)
              timer = null
            }, delay)
          }
        }

        horizontalScroll.addEventListener("wheel", debounce((event: WheelEvent) => {
          event.preventDefault()
          try {
            MENU.removeChild(MENULIST)
            isShow = false
          } catch { }
          // const WIDTH = horizontalScroll.clientWidth
          refreshAllWidth()
          getShowWidths(index)
          if (event.deltaY > 0) {
            calculateRight()
          } else {
            calculateLeft()
          }
        }, 200))

        LEFT.addEventListener("click", (e) => {
          e.stopPropagation()
          debounce(() => {
            calculateLeft()
          }, 200)()
        })

        RIGHT.addEventListener("click", (e) => {
          e.stopPropagation()
          debounce(() => {
            calculateRight()
          }, 200)()
        })

        horizontalScroll.addEventListener("click", (event: MouseEvent) => {
          const target = event.target as HTMLDivElement
          // const WIDTH = horizontalScroll.clientWidth
          const idx = parseInt(target.getAttribute("alt") as string)
          try {
            MENU.removeChild(MENULIST)
            isShow = false
          } catch { }
          if (!Number.isNaN(idx)) {
            selectIndex = idx
            refreshAllWidth()
            getShowWidths(index)
            if (!SHOWITEM.has(idx)) {
              calculateRight()
            }
            app.updateRoot(draft => {
              if (dataKey.startsWith(currentPage) || dataKey.startsWith("Global")) {
                set(draft, dataKey, list[idx])
              } else {
                set(draft?.[currentPage], dataKey, list[idx])
              }
            })
            Items.forEach(item => {
              if (item === target) {
                item.style.background = listStyle.color
                item.style.color = "#ffffff"
                item.style.fontWeight = "700"
              } else {
                item.style.background = listStyle.background
                item.style.color = listStyle.color
                item.style.fontWeight = "normal"
              }
            })
          } else {
            event.stopPropagation()
          }
        })

        let isShow = false
        MENU.addEventListener("click", (event: MouseEvent) => {
          if (event.target === MENU)
            event.stopPropagation()
          isShow = !isShow
          if (isShow) {
            MENU.appendChild(MENULIST)
            if (selectIndex > MenuShowNumber - 1) {
              const step = selectIndex - (MenuShowNumber - 1)
              MENULIST.scrollTop += step * MenuItemHeight
            }
            const target = MenuItems[selectIndex]
            MenuItems.forEach(item => {
              if (item === target) {
                item.style.background = listStyle.background
                // item.style.color = "#ffffff"
                item.style.fontWeight = "700"
              } else {
                item.style.background = "#ffffff"
                // item.style.color = listStyle.color
                item.style.fontWeight = "normal"
              }
            })
          } else {
            MENU.removeChild(MENULIST)
          }
          const target = event.target as HTMLDivElement
          // const WIDTH = horizontalScroll.clientWidth
          const idx = parseInt(target.getAttribute("alt") as string)
          if (!Number.isNaN(idx)) {
            gotoIndex(idx)
          }
        })

        document.body.addEventListener("click", (event) => {
          if (event.target !== MENU && !(new Set(MenuItems).has(event.target as HTMLDivElement)) && isShow) {
            isShow = !isShow
            MENU.removeChild(MENULIST)
          }
        }, { capture: true })

        // MENULIST.addEventListener("click", (event) => {

        // })

        const listenLoad = async () => {
          if (horizontalScroll.clientWidth) {
            await delay_frame(20)
            gotoIndex(currentIndex)
            if (!timer) {
              clearTimeout(timer)
            }
          } else {
            timer = setTimeout(listenLoad, 0)
          }
        }
        listenLoad()

      }
    },
    '[App] Audio': {
      cond: ({ component: c }) => ["textField", "textView"].includes(c.type),
      resolve({ node, component }) {
        if (!(component.blueprint.audio === false)) {
          const assetsUrl = app.nui.getAssetsUrl() || ''
          let pageName = app.currentPage;
          const dataKey =
            component.get('data-key') || component.blueprint?.dataKey || '';
          const img = document.createElement("img");
          img.id = "target_img"
          img.src = `${assetsUrl}audio_start.svg`
          img.style.cssText = `
            position: fixed;
            cursor: pointer;
            z-index: 99999999
          `;
          const recorder = new Recorder({
            bitRate: 128
          });
          let offsetX = 0;
          let offsetY = 0;
          let proccess_fun = true;
          let isDragging = false;
          const device_is_web = (() => {
            try {
              document.createEvent("TouchEvent"); return false;
            } catch (e) {
              return true;
            }
          })();
          img.addEventListener(device_is_web ? 'mousedown' : "touchstart", onMouseDown);
          function onMouseDown(e) {
            device_is_web && e.preventDefault();
            offsetX = (e.clientX || e.touches[0].clientX) - img.offsetLeft;
            offsetY = (e.clientY || e.touches[0].clientY) - img.offsetTop;
            document.addEventListener(device_is_web ? 'mousemove' : "touchmove", onMouseMove);
            document.addEventListener(device_is_web ? 'mouseup' : "touchend", onMouseUp);
          }
          function onMouseMove(e) {
            isDragging = true;
            const newLeft = (e.clientX || e.touches[0].clientX) - offsetX;
            const newTop = (e.clientY || e.touches[0].clientY) - offsetY;
            const offW = document.documentElement.clientWidth - img.offsetWidth;
            const offH = document.documentElement.clientHeight - img.offsetHeight;
            if (newLeft < 0) {
              img.style.left = "0"
            } else if (offW <= newLeft) {
              img.style.left = offW + "px"
            } else {
              img.style.left = newLeft + "px"
            }
            if (newTop < 0) {
              img.style.top = "0"
            } else if (offH <= newTop) {
              img.style.top = offH + "px"
            } else {
              img.style.top = newTop + "px"
            }
            audioL = img.style.left;
            audioT = img.style.top;
          }
          function onMouseUp(e) {
            img.removeEventListener('click', stopRecording);
            img.removeEventListener('click', startRecording);
            if (!isDragging) {
              img.addEventListener('click', proccess_fun ? startRecording : stopRecording);
            }
            isDragging = false;
            document.removeEventListener(device_is_web ? 'mousemove' : "touchmove", onMouseMove);
            document.removeEventListener(device_is_web ? 'mouseup' : "touchend", onMouseUp);
          }
          function startRecording() {
            recorder.start().then(() => {
              img.src = `${assetsUrl}audio_loading.svg`
              img.removeEventListener('click', startRecording);
              proccess_fun = false;
              img.addEventListener('click', stopRecording);

            }).catch((e) => {
              console.error(e);
            });
          }
          function stopRecording() {
            img.removeEventListener('click', stopRecording);
            proccess_fun = true;
            recorder.stop().getMp3().then(async ([buffer, blob]) => {
              img.src = `${assetsUrl}audio_start.svg`;
              const chun_size_sample_rates = 16000*20; 
              const chunks:any[] = [];
              const size_ws = blob.size>=5242880;
              let baseUrl = JSON.parse(localStorage.getItem("config") as string).whisperBaseUrl||'http://8.140.148.116:9006';
              let audio_url = `${baseUrl}/upload/`;
              if(size_ws){
                for (let i = 0; i < blob.size; i += chun_size_sample_rates) {
                  const chunk = blob.slice(i, i + chun_size_sample_rates);
                  const mp3Header = new Uint8Array([
                    0x49, 0x44, 0x33, 0x03,
                    0x00, 0x00, 0x00, 0x00
                  ]);
                  const combinedBlob = new Blob([mp3Header, chunk], { type: 'audio/mp3' });
                  chunks.push(combinedBlob)
                }
              }else{
                chunks.push(blob)
                audio_url =  `${baseUrl}/smallUpload/`
              }
                const rand = new Date().getTime().toString(36)+(Math.random()).toString(36).substring(2);
              const chunks_map = chunks.map((v,i)=>new Promise((res,rej)=>{

                  let xhr = new XMLHttpRequest();
                  xhr.withCredentials = true;
                  xhr.addEventListener("readystatechange", function () {
                    if (this.readyState === 4) {
                      res(JSON.parse(this.response))
                    }
                  });
                    xhr.open("POST",audio_url);
                    let data = new FormData();
                    
                    data.append("audio", v, "123.mp3");
                    size_ws&&data.append("code", `${rand}-${i+1}`);
                    xhr.send(data);
                })
              )
              const _upload_respose =  ():Promise<any>=>{
                return new Promise((res,rej)=>{
                  let xhr = new XMLHttpRequest();
                  xhr.withCredentials = true;
                  xhr.addEventListener("readystatechange", function () {
                    if (this.readyState === 4) {
                      this.status
                      try{
                        res(JSON.parse(this.response))
                      }catch(e){
                        console.error(`Unable to parse returned data`)
                      }
                    }else{
                      if(this.status==502){
                        rej("errorcode502")
                      }else{
                        new Error("request Failed")
                      }
                    }
                  });
                    xhr.open("POST",`${baseUrl}/success/`);
                    let data = new FormData();
                    data.append("code", `${rand}`);
                    data.append("size", `${chunks.length}`);
                    data.append("providerId", localStorage.getItem('user_vid') as string);
                    data.append("host", app.config.apiHost+":"+app.config.apiPort as string);
                    if (app.root.Global?.["roomInfo"]?.["edge"]?.["id"]) {
                      data.append("appointmentId",app.root.Global?.["roomInfo"]?.["edge"]?.["id"] as string);
                    } else {
                      data.append("appointmentId",app.root.Global?.["rootNotebookID"] as string);
                    }
                    xhr.send(data);
                })
              }
              const text = await Promise.all(chunks_map);
              let val = size_ws?(await _upload_respose())?.text:text[0]?.text
             app.updateRoot(draft => {
              set(draft?.[pageName], dataKey, val);
                  const end_w = /(,|\.|\?|\!|;)$/g.test(node?.value);
                  const end_p = node.selectionEnd;
                  const currentValue = node.value;
                  if(end_p!==currentValue.length){
                    node.value = currentValue.slice(0, end_p) + val + currentValue.slice(end_p);
                    node.setSelectionRange(val.length+end_p, val.length+end_p)
                  }else{
                    node.value = (end_w) ? ` ${node.value}${val}` : node.value ? `${node.value}.${val}` : `${node.value}${val}`;
                  }
                  if(val){
                    node.dispatchEvent(new Event('input', {
                      bubbles: false, 
                      cancelable: false, 
                      composed: false 
                    }));
                  }
            })
              img.removeEventListener('click', stopRecording);
              img.addEventListener('click', startRecording);
            }).catch((e) => {
              console.error(e);
            });
          
          }
          const appendEle = (e) => {
            node.parentNode?.appendChild(img);
            img.style.left = audioL;
            img.style.top = audioT;
          }
          node.addEventListener("click", appendEle);
          document.addEventListener(device_is_web ? 'mousedown' : "touchstart", (e) => {
            if (node.parentNode?.contains(img) && !["target_img", node.id].includes(e.target?.id as string)) {
              img.removeEventListener("click", appendEle);
              recorder.stop();
              img.src = `${assetsUrl}audio_start.svg`
              proccess_fun = true;
              img.removeEventListener('click', stopRecording);
              img.addEventListener('click', startRecording);

              node.parentNode?.removeChild(img);
              img.remove()
            } else {
              if (node.parentNode?.contains(img) && !device_is_web) {
                node.focus();
              }
            }
          })
        } else {
        }
      },
    },
    '[App] Canvas': {
      cond: 'imgCanvas',
      resolve({ node, component }) {
        if (node) {
          let pageName = app.currentPage
          const dataKey =
            component.get('data-key') || component.blueprint?.dataKey || ''
          const dataOptions = component.get('data-option') as {}
          const assetsUrl = app.nui.getAssetsUrl() || ''
          const device_is_web = (() => {
            try {
              document.createEvent("TouchEvent"); return false;
            } catch (e) {
              return true;
            }
          })();
          dataOptions["status"] = false
          app.updateRoot((draft) => {
            set(draft?.[pageName], dataKey, "")
          })
          const [file_name, path] = ["image", dataOptions["imgPath"]];
          const canvas_box = document.createElement('div')
          const canvas_con = document.createElement("canvas");
          const color_picker = document.createElement("input");
          const line_width_input = document.createElement("input");
          const edit_btn = document.createElement("img");
          const clear_btn = document.createElement("img");
          const undo_btn = document.createElement("img");
          const redo_btn = document.createElement("img");
          const save_btn = document.createElement("button");
          const btns_container = document.createElement("div");
          const options_container = document.createElement("div");
          const components_img_container = document.createElement("div");
          const edit_btn_container = document.createElement("div");
          const left_btn_container = document.createElement("div");
          const ctx = canvas_con.getContext("2d", {
            willReadFrequently: true,
          }) as CanvasRenderingContext2D;
          const image = new Image();
          image.src = ((path as string).startsWith("blob")) ? path : `${assetsUrl}${path}`;

          let lineWidth: number = 2; // 默认线条粗细为2
          let drawColor = "#ff0000"; // 默认绘制颜色为红色
          let drawHistory: ImageData[] = []; // 用于存储绘制历史
          let redoHistory: ImageData[] = []; // 添加redoHistory数组
          let flag = true;
          let move_flag = false;
          image.onload = function () {
            // canvas_con.width = canvas_con.getBoundingClientRect().width;
            // canvas_con.height = canvas_con.getBoundingClientRect().height;
            // ctx.drawImage(image, 0, 0, canvas_con.getBoundingClientRect().width, canvas_con.getBoundingClientRect().height);
            canvas_box.style.cssText = `
              width: ${node.getBoundingClientRect().width}px;
              height: ${node.getBoundingClientRect().height - 40}px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 10px 0;
              background-color:  #f4f8fa;
            `

            components_img_container.style.cssText = `
              background-color: #ffffff;
              width: ${node.getBoundingClientRect().width}px;
              height: ${node.getBoundingClientRect().height}px;
            `

            const setWidthFull = () => {
              image.height = (node.getBoundingClientRect().width / image.width) * image.height
              image.width = node.getBoundingClientRect().width
            }

            const setHeightFull = () => {
              image.width = (node.getBoundingClientRect().height / image.height) * image.width
              image.height = node.getBoundingClientRect().height - 40;
            }

            if (image.width > image.height) {
              const compare_height = node.getBoundingClientRect().height - 40
              // image.height = (node.getBoundingClientRect().width / image.width) * image.height
              // image.width = node.getBoundingClientRect().width
              setWidthFull()
              if(image.height > compare_height) {
                setHeightFull()
              }
            } else {
              const compare_width = node.getBoundingClientRect().width
              setHeightFull()
              if(image.width > compare_width) {
                setWidthFull()
              }
              // image.width = (node.getBoundingClientRect().height / image.height) * image.width
              // image.height = node.getBoundingClientRect().height - 80;
            }
            // image.width = node.getBoundingClientRect().width
            // image.height = node.getBoundingClientRect().height - 80;
            canvas_con.width = image.width;
            canvas_con.height = image.height;
            ctx.drawImage(image, 0, 0, image.width, image.height);


          };
          line_width_input.type = "range";
          line_width_input.min = "1"
          line_width_input.max = "15"
          line_width_input.value = lineWidth + ""
          color_picker.type = "color";
          color_picker.value = drawColor
          edit_btn.src = assetsUrl + "editImg.svg";
          clear_btn.src = assetsUrl + "clearEditImgPre.svg";
          undo_btn.src = assetsUrl + "undoEditPre.svg";
          redo_btn.src = assetsUrl + "redoEditPre.svg";

          edit_btn.draggable = false;
          clear_btn.draggable = false;
          undo_btn.draggable = false;
          redo_btn.draggable = false;
          save_btn.textContent = "Confirm"
          canvas_con.draggable = false;

          line_width_input.style.cssText = `
            width: 60px;
            height: 10px;
            margin-right: 1%;
            flex-grow: 0;
          `
          color_picker.style.cssText = `

          width: 40px;
          margin-right: 1%;
          flex-grow: 0;

          `
          btns_container.style.cssText = `
            height: auto;
            width: 100%;
            display: flex;
            padding-top: 2vh;
            // padding-bottom: 1vh;
            justify-content: flex-start;
            align-items: center;
          `
          edit_btn_container.style.cssText = `
          height: auto;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `
        left_btn_container.style.cssText = `
          height: auto;
          width: ${device_is_web?"40%":"70%"};
          display: flex;
          justify-content: space-between;
          align-items: center;
        `
          options_container.style.cssText = `
            height: auto;
            width: 100%;
          `
          redo_btn.style.cssText = `
          cursor: not-allowed;
          user-select: none;
          padding: ${device_is_web?"0":"0 5px"};


          `
          undo_btn.style.cssText = `
          cursor: not-allowed;
          user-select: none;
          padding: ${device_is_web?"0":"0 5px"};
          `
          clear_btn.style.cssText = `
            padding: 0 15px;
            border-left: 1px solid #cdcdcd;
            user-select: none;
            border-right: 1px solid #cdcdcd; 
            cursor: not-allowed;
          `
          save_btn.style.cssText = `
            border: none;
            color: #fff;
            height: 3.5vh;
            border-radius: 5px;
            width: ${device_is_web?"10%":"20%"};
            padding: ${device_is_web?"5px 8px":"0"};
            font-size: 1rem;
            background-color: #005795;
          `
          edit_btn.style.cssText = `
          user-select: none;
          cursor: pointer;
          padding: 5px 0;
          height: 2.5vh;
          display: block;

        `
          left_btn_container.append(color_picker, line_width_input, clear_btn, undo_btn, redo_btn)
          edit_btn_container.append(left_btn_container,save_btn)
          !dataOptions["isReadOnly"] && btns_container.append(edit_btn, edit_btn_container);
          canvas_box.append(canvas_con)
          components_img_container.append(canvas_box, btns_container)
          node.append(components_img_container)
          edit_btn_container.style.display = "none";
          edit_btn.addEventListener("click", () => {
            edit_btn.style.display = "none";
            edit_btn_container.style.display = "flex";
            btns_container.style.justifyContent = "flex-start";

            canvas_con.addEventListener(device_is_web ? "mousedown" : "touchstart", device_is_web ? start_web as any : start, false)

          })
          save_btn.addEventListener("click", () => {
            edit_btn.style.display = "block";
            edit_btn_container.style.display = "none";
            canvas_con.removeEventListener(device_is_web ? "mousedown" : "touchstart", device_is_web ? start_web as any : start)
          })
          function getParentsCompute(ele: HTMLElement) {
            let [left,top] = [ele.offsetLeft,ele.offsetTop];
            const ele_get_top = (ele_p: HTMLElement) => {
              top += ele_p.offsetTop;
              left += ele_p.offsetLeft;
              if (ele_p.offsetParent) {
                ele_get_top(ele_p.offsetParent);
              }
            }
            ele_get_top(ele.offsetParent)
            return {left,top};
          }
          function start(e: TouchEvent) {
            let touch = e.targetTouches[0];
            ctx.beginPath();
            // console.log(getParentsCompute(canvas_con),"kkkkkkkk",touch.clientY,touch.clientY -  (canvas_con.offsetParent?.offsetParent?.offsetTop as number)- (canvas_con.offsetParent?.offsetTop as number)-canvas_con.offsetTop)
            ctx.moveTo(touch.clientX - getParentsCompute(canvas_con)["left"] + document.scrollingElement?.scrollLeft, touch.clientY - getParentsCompute(canvas_con)["top"] + document.scrollingElement?.scrollTop);
            // ctx.moveTo(touch.clientX - canvas_con.offsetLeft, touch.offsetY);
            canvas_con.addEventListener('touchmove', move, false)
            canvas_con.addEventListener('touchend', end, false)

          }
          function move(e) {
            if (e.targetTouches.length === 1) {
              e.preventDefault()
              let touch = e.targetTouches[0];
              ctx.strokeStyle = drawColor;
              ctx.lineWidth = lineWidth;
              //现在的坐标减去原来的坐标
              ctx.lineTo(touch.clientX - getParentsCompute(canvas_con)["left"] + document.scrollingElement?.scrollLeft, touch.clientY - getParentsCompute(canvas_con)["top"] + document.scrollingElement?.scrollTop);
              ctx.stroke();

            }
          }
          function end(e) {
            ctx.closePath();
            // history
            const imageData: ImageData = ctx.getImageData(0, 0, canvas_con.width, canvas_con.height);
            drawHistory.push(imageData);
            undo_btn.src = assetsUrl + "undoEdit.svg";
            
            redoHistory = []; // 每次绘制新内容时，清空已撤销历史

            undo_btn.src = assetsUrl + "undoEdit.svg";
            undo_btn.addEventListener("click", undo_fun);
            undo_btn.style.cursor = "pointer"
            redo_btn.src = assetsUrl + "redoEditPre.svg";
            redo_btn.removeEventListener("click", redo_fun);
            redo_btn.style.cursor = "not-allowed"
            clear_btn.src = assetsUrl + "clearEditImg.svg";
            clear_btn.addEventListener("click", clear_fun);
            clear_btn.style.cursor = "pointer"
            move_flag = false
          }
          let domRect = canvas_con.getBoundingClientRect()
          function start_web(e: MouseEvent) {
            flag = false;
            domRect = canvas_con.getBoundingClientRect()
            ctx.beginPath();
            // ctx.moveTo(e.clientX - canvas_con.offsetLeft, e.clientY - canvas_con.offsetTop);
            // ctx.moveTo(e.clientX - canvas_con.offsetLeft, e.offsetY);
            ctx.moveTo(e.clientX - domRect.left, e.clientY - domRect.top)
            canvas_con.addEventListener('mousemove', move_web, true)
            canvas_con.addEventListener('mouseup', end_web, false)
            canvas_con.addEventListener('mouseleave', end_web)
          }
          function move_web(e) {
            if (flag) {
              return false;
            }
            move_flag = true;
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = lineWidth;
            // ctx.lineTo(e.clientX - canvas_con.offsetLeft, e.clientY - canvas_con.offsetTop);
            // ctx.lineTo(e.clientX - canvas_con.offsetLeft, e.offsetY);
            ctx.lineTo(e.clientX - domRect.left, e.clientY - domRect.top)
            ctx.stroke();


          }
          function end_web(e) {
            if (flag) return
            flag = true;
            e.stopPropagation();
            if(move_flag){
              ctx.closePath();
              // history
              const imageData: ImageData = ctx.getImageData(0, 0, canvas_con.width, canvas_con.height);
              drawHistory.push(imageData);
              redoHistory = []; // 每次绘制新内容时，清空已撤销历史
              // saveData()
              // const dataURL = canvas_con.toDataURL();
              // // let arr = dataURL.split(","),
              // //   mime = arr[0].match(/:(.*?);/)?.[1],
              // //   bin_str = atob(arr[1]),
              // //   index = bin_str.length,
              // //   u8_arr = new Uint8Array(index);
              // // while (index--) {
              // //   u8_arr[index] = bin_str.charCodeAt(index);
              // // }
              // app.updateRoot((draft) => {
              //   // set(draft?.[pageName], dataKey, new File([u8_arr], file_name, { type: mime }))
              //   set(draft?.[pageName], dataKey, dataURL)
              // })
            undo_btn.src = assetsUrl + "undoEdit.svg";
            undo_btn.addEventListener("click", undo_fun);
            undo_btn.style.cursor = "pointer"
            redo_btn.src = assetsUrl + "redoEditPre.svg";
            redo_btn.removeEventListener("click", redo_fun);
            redo_btn.style.cursor = "not-allowed"
            clear_btn.src = assetsUrl + "clearEditImg.svg";
            clear_btn.addEventListener("click", clear_fun);
            clear_btn.style.cursor = "pointer"
            move_flag = false
            }
           
          }
          // color
          color_picker.addEventListener("change", () => {
            drawColor = color_picker.value;
          });
          line_width_input.addEventListener("change", () => {
            lineWidth = +line_width_input.value;
          });
          // clear
          const clear_fun = () => {
            // ctx.drawImage(image, 0, 0, image.width, image.height);
            ctx.clearRect(0, 0, canvas_con.width, canvas_con.height);
            ctx.drawImage(image, 0, 0, canvas_con.getBoundingClientRect().width, canvas_con.getBoundingClientRect().height);
            // drawHistory.push(drawHistory.at(-1) as ImageData); 
            redoHistory = []; // 删除到已撤销历史
            drawHistory = []; //删除到已前进历史
            redo_btn.src = assetsUrl + "redoEditPre.svg";
            redo_btn.removeEventListener("click", redo_fun);
            redo_btn.style.cursor = "not-allowed"
            undo_btn.src = assetsUrl + "undoEditPre.svg";
            undo_btn.removeEventListener("click", undo_fun);
            undo_btn.style.cursor = "not-allowed"
            clear_btn.src = assetsUrl + "clearEditImgPre.svg";
            clear_btn.removeEventListener("click", undo_fun);
            clear_btn.style.cursor = "not-allowed"
            // saveData()
          }
          // clear_btn.addEventListener("click", clear_fun);
          // undo
          const undo_fun  =() => {
            if (drawHistory.length > 0) {
              const lastDraw = drawHistory.pop() as ImageData; // 移除最后一步绘制历史
              redoHistory.push(lastDraw); // 添加到已撤销历史
              redo_btn.src = assetsUrl + "redoEdit.svg";
              redo_btn.addEventListener("click", redo_fun);
              redo_btn.style.cursor = "pointer"

              // 清除Canvas并恢复上一步绘制历史
              ctx.clearRect(0, 0, canvas_con.width, canvas_con.height);
              if (drawHistory.length > 0) {
                ctx.putImageData(drawHistory[drawHistory.length - 1], 0, 0);
              } else {
                // 如果没有历史记录，则重新绘制原始图片
                // ctx.drawImage(image, 0, 0, image.width, image.height);
                ctx.drawImage(image, 0, 0, canvas_con.getBoundingClientRect().width, canvas_con.getBoundingClientRect().height);
                undo_btn.src = assetsUrl + "undoEditPre.svg";
                undo_btn.removeEventListener("click", undo_fun);
                undo_btn.style.cursor = "not-allowed"
                clear_btn.src = assetsUrl + "clearEditImgPre.svg";
                clear_btn.removeEventListener("click", clear_fun);
                clear_btn.style.cursor = "not-allowed"
              }
              // saveData()
            }
          }
          // redo
          const redo_fun = () => {
            if (redoHistory.length > 0) {
              const nextDraw = redoHistory.pop() as ImageData; // 取出下一步绘制历史
              drawHistory.push(nextDraw); // 添加到绘制历史
              undo_btn.src = assetsUrl + "undoEdit.svg";
              undo_btn.addEventListener("click", undo_fun);
              undo_btn.style.cursor = "pointer"

              clear_btn.src = assetsUrl + "clearEditImg.svg";
              clear_btn.addEventListener("click", clear_fun);
              clear_btn.style.cursor = "pointer"

              // 清除Canvas并恢复下一步绘制历史
              ctx.clearRect(0, 0, canvas_con.width, canvas_con.height);
              ctx.putImageData(nextDraw, 0, 0);
              if(redoHistory.length == 0){
                redo_btn.src = assetsUrl + "redoEditPre.svg";
                redo_btn.removeEventListener("click", redo_fun);
                redo_btn.style.cursor = "not-allowed"

              }
              // saveData()
            }
          }
          const saveData = () => {
            const dataURL = canvas_con.toDataURL();
            const arr = dataURL.split(',') as Array<string>
            const data = store.level2SDK.utilServices.base64ToBlob(
              arr[1],
              arr[0].match(/:(.*?);/)?.[1]
            )
            app.updateRoot((draft) => {
              set(draft?.[pageName], dataKey, data)
            })
            dataOptions["status"] = true
          }

          save_btn.addEventListener("click", () => {
            // const dataURL = canvas_con.toDataURL();
            // let arr = dataURL.split(","),
            //   mime = arr[0].match(/:(.*?);/)?.[1],
            //   bin_str = atob(arr[1]),
            //   index = bin_str.length,
            //   u8_arr = new Uint8Array(index);
            // while (index--) {
            //   u8_arr[index] = bin_str.charCodeAt(index);
            // }
            // app.updateRoot((draft) => {
            //   set(draft?.[pageName], dataKey, new File([u8_arr], file_name, { type: mime }))
            // })
            saveData()
            // node.removeChild(btns_container);
            // node.removeChild(canvas_con);
            // node.removeChild(options_container);
            // options_container.remove()
            // canvas_con.remove()
            // btns_container.remove()
          })
        }
      },
    },
    '[App] Progress':{
      cond: 'progressBar',
      resolve({ node, component }) {
        const div = document.createElement('div')
        const viewTag = component.get('viewTag')
        const progressColor = component.style.progressColor
        div.id = `${viewTag}-progressLinear`
        div.style.height = 'inherit'
        div.style.background = progressColor
        div.style.width = `0%`
        div.style.transition = `width .2s linear`
        div.style.borderRadius = `4px 0px 0px 4px`
        node.appendChild(div)
        node.style.borderRadius = `4px`
      }
    },
    '[App] Dictation': {
      cond: 'dictation',
      resolve({ node, component }) {
        const assetsUrl = app.nui.getAssetsUrl() || ''
        let pageName = app.currentPage;
        const dataKey =
            component.get('data-key') || component.blueprint?.dataKey || '';
        let height = 50
        let root = document.getElementById("root") as HTMLDivElement

        let timer
        const calculateHeight = () => {
          if (node.clientHeight) {
            root = document.getElementById("root") as HTMLDivElement
            height = 0.05 * root.clientHeight
            if (!timer) {
              clearTimeout(timer)
            }
          } else {
            timer = setTimeout(calculateHeight, 0)
          }
        }
        calculateHeight()

        const audio_box = document.createElement('div')
        audio_box.style.cssText = `
          width: 50%;
          height: ${height}px;
          margin: auto;
        `
        node.append(audio_box)

        const start_button = document.createElement('div')
        start_button.style.cssText = `
          width: 100%;
          height: 100%;
          border-radius: ${height}px;
          background: #2988E6;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
        `

        const recording = document.createElement('div')
        recording.style.cssText = `
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: space-around;
          align-items: center;
        `

        const end_button = document.createElement('div')
        end_button.style.cssText = `
          width: 60%;
          height: 100%;
          border-radius: ${height}px;
          background: #2988E6;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
        `
        
        const audio_start = document.createElement('img')
        audio_start.src = `${assetsUrl}audio_white.svg`
        const text_start = document.createElement('div')
        text_start.style.cssText = `margin-left: 10px`
        text_start.innerText = `Start`
        text_start.style.cssText = `
          font-size: 16px;
          margin-left: 6px;
        
        `
        start_button.append(audio_start, text_start)

        const audio_end = document.createElement('img')
        audio_end.src = `${assetsUrl}audio_orange.svg`
        const text_end = document.createElement('div')
        text_end.style.cssText = `margin-left: 10px`
        text_end.innerText = `End`
        text_end.style.cssText = `
        font-size: 16px;
        margin-left: 6px;
      
      `
        end_button.append(audio_end, text_end)

        let status = 'undefined'
        const audio_status_box = document.createElement('div')
        audio_status_box.style.cssText = `
          width: ${height}px;
          height: ${height}px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #2988E6;
          border-radius: 50%;
        `
        const audio_status_img = document.createElement('img')
        audio_status_img.src = `${assetsUrl}audio_pause.svg`
        audio_status_box.appendChild(audio_status_img)
        recording.append(end_button, audio_status_box)
        audio_box.appendChild(start_button)
        // const device_is_web = (() => {
        //   try {
        //     document.createEvent("TouchEvent"); return false;
        //   } catch (e) {
        //     return true;
        //   }
        // })()
        const recorder = new Recorder({
          bitRate: 128
        })

        let timestamp = Date.now()
        let audioTime = 0
        let complete = false
        start_button.addEventListener("click", () => {
          timestamp = Date.now()
          audio_box.removeChild(start_button)
          audio_box.appendChild(recording)
          audio_status_img.src = `${assetsUrl}audio_pause.svg`
          status = 'recording'
          startRecording()
          setTimeout(()=> {
            complete = true
          })
          setTimeout(()=> {
            // @ts-ignore
            component.get("startRecord")?.execute()
          })
        })

        const isInterrupt = component.get("isInterrupt")
        if(isInterrupt && isInterrupt !== "") {
          const arr = isInterrupt.split('.')
          const key = arr.pop()
          let target = app.root?.[pageName]
          arr.forEach(str => {
            target = target?.[str]
          })
          let t = target[key]
          Object.defineProperty(target, key, {
            get: function reactiveGetter() {
              return t
            },
            set: function reactiveSetter(v) {
              t = v
              if(t === "false") {
                translate()
              }
            }
          })
          target[key] = true
        }
        
        const translate = () => {
          setTimeout(()=> {
            // @ts-ignore
            component.get("finishRecord")?.execute()
          })
          
          stopRecording()
        }

        end_button.addEventListener("click", () => {
          
          audio_box.removeChild(recording)
          audio_status_img.src = `${assetsUrl}audio_pause.svg`
          if(status === "recording")
            audioTime += Date.now() - timestamp
            status = "end"
          if(component.get("beforeFinish")) {
            if(audioTime/1000 < 20){
              // @ts-ignore
              component.get("beforeFinish")?.execute()
              pauseRecording()
            } else {
              translate()
            }
          } else {
            translate()
          }
          complete = false
        })

        audio_status_box.addEventListener("click", () => {
          if(status === "recording") {
            audioTime += Date.now() - timestamp
            audio_status_img.src = `${assetsUrl}audio_resume.svg`
            status = "pausing"
            pauseRecording()
            setTimeout(()=> {
              // @ts-ignore
              component.get("pauseRecord")?.execute()
            })
          } else if(status === "pausing") {
            timestamp = Date.now()
            audio_status_img.src = `${assetsUrl}audio_pause.svg`
            status = "recording"
            resumeRecording()
            setTimeout(()=> {
              // @ts-ignore
              component.get("resumeRecord")?.execute()
            })
          }
        })

        let recordData = new Array<Int8Array>()
        function startRecording() {
          recorder.start().then(() => {
            
          }).catch((e) => {
            console.error(e);
          });
        }
        function stopRecording() {
          let val;
          try {
              pauseRecording();
              setTimeout(()=> {
                // @ts-ignore
                (async () => {
                  const mp3Header = new Uint8Array([
                    0x49, 0x44, 0x33, 0x03,
                    0x00, 0x00, 0x00, 0x00
                  ]);
                  // const blobFile = await fetch("Dr.Bhalla-22-原始录音.m4a").then(async res=>new Blob([await res.blob()],{type: "audio/mp3"}))
                  const blobFile = new Blob(recordData, { type: "audio/mp3" })
                  const chun_size_sample_rates = 16000*20*5; 
                  const chunks:any[] = [];
                  const             size_ws = blobFile.size>=5242880;
                  app.updateRoot(draft => {
                    set(draft?.[pageName], component.get("audioFile"), blobFile);
                  })
                  let baseUrl = JSON.parse(localStorage.getItem("config") as string).whisperBaseUrl;
                  let audio_url = `${baseUrl}/upload/`;
                  if(size_ws){
                    for (let i = 0; i < blobFile.size; i += chun_size_sample_rates) {
                      const chunk = blobFile.slice(i, i + chun_size_sample_rates);
                      
                      const combinedBlob = new Blob([mp3Header, chunk], { type: 'audio/mp3' });
                      chunks.push(combinedBlob)
                    }
                  }else{
                    chunks.push(blobFile)
                    audio_url =  `${baseUrl}/smallUpload/`
                  }
                  // 处理 生成ai report的文件
                  let aiReqBody = app.root.AiVoice.formData.postBody
                  aiReqBody['notification']['platform'] = 'web'
                  aiReqBody['notification']['token'] = JSON.parse(localStorage.getItem('Global') || '{}')['firebaseToken']
                  let aiReq = JSON.stringify(aiReqBody)
                  const rand = new Date().getTime().toString(36)+(Math.random()).toString(36).substring(2);
                  const chunks_map = chunks.map((v,i)=>new Promise((res,rej)=>{
                      let xhr = new XMLHttpRequest();
                      setTimeout(()=>{
                        const unsubscribe = document.querySelector(`[data-viewtag=unsubscribe_t]`) as any;
                        // unsubscribe.aud = controller;
                        if(unsubscribe) {
                          unsubscribe.addEventListener("click",(e)=>{
                              xhr.abort()
                            })
                        }
                          
                      },1000)
                      xhr.withCredentials = true;
                      xhr.addEventListener("readystatechange", function () {
                        if (this.readyState === 4) {
                          res(JSON.parse(this.response))
                        }
                      });
                        xhr.open("POST",audio_url);
                        let data = new FormData();
                        data.append("audio", v, "123.mp3");
                        // console.log(app.root.Global?.["roomInfo"]?.["edge"]?.["id"], localStorage.getItem('user_vid'),"mmmmmmmmm")
                        if (app.root.Global?.["roomInfo"]?.["edge"]?.["id"]) {
                          data.append("appointmentId",app.root.Global?.["roomInfo"]?.["edge"]?.["id"] as string);
                        } else {
                          data.append("appointmentId",app.root.Global?.["rootNotebookID"] as string);
                        }
                        
                        data.append("providerId", localStorage.getItem('user_vid') as string);
                        data.append("host", app.config.apiHost+":"+app.config.apiPort as string);
                        data.append("aiReq", aiReq);
                        size_ws&&data.append("code", `${rand}-${i+1}`);
                        xhr.send(data);
                    })
                  
                  )
                  const _upload_respose =  ():Promise<any>=>{
                    return new Promise((res,rej)=>{
                      let xhr = new XMLHttpRequest();
                      setTimeout(()=>{
                        const unsubscribe = document.querySelector(`[data-viewtag=unsubscribe_t]`) as any;
                        // unsubscribe.aud = controller;
                        if(unsubscribe) {
                          unsubscribe.addEventListener("click",(e)=>{
                              xhr.abort()
                            })
                        }
                      },1000)
                        
                      xhr.withCredentials = true;
                      xhr.addEventListener("readystatechange", function () {
                        if (this.readyState === 4) {
                          try{
                            res(JSON.parse(this.response))
                          }catch(e){
                            console.error(`Unable to parse returned data`)
                          }
                        }else{
                          if(this.status==502){
                            rej("errorcode502")
                          }else{
                            new Error("request Failed")
                          }
                        }
                      });
                        xhr.open("POST",`${baseUrl}/success/`);
                        
                        let data = new FormData();
                        data.append("code", `${rand}`);
                        data.append("size", `${chunks.length}`);
                        if (app.root.Global?.["roomInfo"]?.["edge"]?.["id"]) {
                          data.append("appointmentId",app.root.Global?.["roomInfo"]?.["edge"]?.["id"] as string);
                        } else {
                          data.append("appointmentId",app.root.Global?.["rootNotebookID"] as string);
                        }
                        data.append("providerId", localStorage.getItem('user_vid') as string);
                        data.append("aiReq", aiReq);
                        data.append("host", app.config.apiHost+":"+app.config.apiPort as string);
                        // const controller = new AbortController();
                        xhr.send(data);
                    })
                  }
                    const text = await Promise.all(chunks_map);
                    console.error(text);
                    let textVal = ''
                    let sourceid = ''
                    if (size_ws) {
                      let resp = await _upload_respose()
                      textVal = resp.text
                      sourceid = resp.sourceId
                    } else {
                      //@ts-ignore
                      textVal = text[0]?.text
                      //@ts-ignore
                      sourceid = text[0]?.sourceId
                    }
                    let resp = ''
                      app.updateRoot(draft => {
                        set(draft?.[pageName], dataKey, textVal);
                        set(draft?.[pageName], component.get("sourceId"), sourceid);
                      })
                      recordData = []
                      setTimeout(()=> {
                        // @ts-ignore
                        component.get("endRecord")?.execute()
                      })
                
                })();
              })
            
          } catch (error) {
            val = ""
            app.updateRoot(draft => {
              set(draft?.[pageName], dataKey, val);
            })
            recordData = []
            setTimeout(()=> {
              // @ts-ignore
              component.get("errorRecord")?.execute()
            })
          }
        } 
        function pauseRecording() {
          recorder.stop().getMp3().then(([buffer, blob]) => {
            recordData = recordData.concat(buffer)
          })
        }
        function resumeRecording() {
          recorder.start().then(() => {
            
          }).catch((e) => {
            console.error(e);
          });
        }

        app.mainPage.once(eventId.page.on.ON_DOM_CLEANUP, () => {
          recorder.stop()
        })

      }
    },
    '[App] Search':{
      cond: ({ component: c }) => c.contentType === 'search',
      resolve({ node, component, page }) {
        if(node){
          const isdeleteAble = component.get('isdeleteAble')
          const inputlimit = component.get('inputlimit') ? component.get('inputlimit') : 3
          const assetsUrl = app.nui.getAssetsUrl() || ''
          const fragment = document.createDocumentFragment()
          const iteratorVar = findIteratorVar(component)
          const pageName = app.initPage
          const dataKey = component.get('searchDataKey') || component.blueprint?.searchDataKey || ''
          let value
          if(iteratorVar && dataKey.startsWith(iteratorVar)){
            const dataObject = findListDataObject(component)
            if (dataObject) {
              value = get(
                dataObject,
                excludeIteratorVar(dataKey, iteratorVar) as string,
              )
            }
          }else{
            if(pageName && dataKey){
              app.updateRoot((draft) => {
                if (u.isStr(dataKey) && dataKey.startsWith('Global')) {
                  let newDataKey = u.cloneDeep(dataKey)
                  newDataKey = newDataKey.replace('Global.', '')
                  value = get(draft?.['Global'], newDataKey)
                } else if (u.isStr(dataKey) && dataKey.startsWith('BaseBLEData')) {
                  let newDataKey = u.cloneDeep(dataKey)
                  newDataKey = newDataKey.replace('BaseBLEData.', '')
                  value = get(draft?.['BaseBLEData'], newDataKey)
                } else {
                  value = get(draft?.[pageName], dataKey)
                }
              })
            }
            
          }

          const searchImagePath = component.get('searchImagePath') || component.blueprint?.searchImagePath || ''
          const deleteImagePath = component.get('deleteImagePath') || component.blueprint?.deleteImagePath || ''
          const placeholder = component.get('placeholder') || component.blueprint?.placeholder || ''

          const searchImage = document.createElement('img')
          searchImage.className = 'search-searchImage'
          searchImagePath ?
                searchImage.setAttribute('src',`${assetsUrl}${searchImagePath}`):
                searchImage.setAttribute('src',`${assetsUrl}searchGray.svg`)

          const searchInput = document.createElement('input')
          searchInput.placeholder = placeholder
          searchInput.className = 'search-searchInput'
          value && (searchInput.value = value)
          fragment.appendChild(searchImage)
          fragment.appendChild(searchInput)
          if(dataKey){
            const executeFunc = getNodeOnChange({
              component,
              dataKey,
              evtName: 'onInput',
              node: searchInput as NDOMElement,
              iteratorVar,
              page,
            })
            // searchInput.addEventListener('input',executeFunc)
            const listener = addListener(searchInput, 'input', executeFunc)
            component.addEventListeners(listener)
          }
          
          if(isdeleteAble){
            const searchCancelImage = document.createElement('img')
            searchCancelImage.className = 'search-searchCancelImage'
            deleteImagePath ? 
                      searchCancelImage.setAttribute('src',`${assetsUrl}${deleteImagePath}`):
                      searchCancelImage.setAttribute('src',`${assetsUrl}searchCancel.svg`)
            fragment.appendChild(searchCancelImage)
            searchInput.addEventListener('input',async function(){
              console.log('test99',this.value)
              if(this.value && this.value.length>0){
                searchCancelImage.style.visibility = 'visible'
                if(this.value.length >= inputlimit){
                  await component.get('onInput')?.execute()
                }
              }else{
                await component.get('onInput')?.execute()
                searchCancelImage.style.visibility = 'hidden'
              }
            })

            searchCancelImage.addEventListener('click',async function(){
              await component.get('deleteCallBack')?.execute()
            })
          }
          node.className = 'search-contrainer'
          node.append(fragment)
        }
      }
    },
    '[App] OpenApp':{
      cond: ({ component: c }) => c.contentType === 'openApp',
      resolve({ node, component }) {
        if(node){
          // const fragment = document.createDocumentFragment()
          const androidLink = component.get('androidLink')
          const storeLink = component.get('storeLink')
          const isPcHidden = u.isBool(component.get('isPcHidden'))?component.get('isPcHidden'):true
          const isInitLoad = u.isBool(component.get('isInitLoad'))?component.get('isInitLoad'):true
          let timer
          if (/(iPhone|iPad|iPod|iOS|Android)/i.test(navigator.userAgent)) {
            //ios
            if(androidLink){
              if(isInitLoad){
                setTimeout(()=>{
                  window.location.href = androidLink
                },500)
              }
          
              node.addEventListener('click',()=>{
                window.location.href = androidLink
                clearTimeout(timer)
                if(storeLink){
                  timer = setTimeout(()=>{
                    window.location.href = storeLink
                  },2000)
                }
                
              })
            }
            
            document.addEventListener('visibilitychange',()=>{
              //@ts-expect-error
              if (document?.hidden || document?.webkitHidden) {
                clearTimeout(timer)
              }
            })

          } else {
            //pc
            isPcHidden && (node.style.visibility = 'hidden')
          }
          
        }
      }
    },
    '[App] CreditCard': {
      cond: ({ component: c }) => c.contentType === 'creditCard',
      resolve({ node, component }) {
        if(node){
          const { appId,locationId } = Square
          async function initializeCard (payments) {
            const card = await payments.card();
            await card.attach(`#${node.id}`);
            return card;
          }
          if (!window.Square) {
            throw new Error('Square.js failed to load properly');
          }
          const payments = window.Square.payments(appId, locationId);
          try {
            setTimeout(async ()=>{
              const card = await initializeCard(payments);
              Object.defineProperties(app, {
                paymentMethod: { configurable: true, get: () => card },
              })
            },0)
          } catch (e) {
            console.error('Initializing Card failed', e);
            return;
          }
        }
      }
    },
    '[App] calendar': {
      cond: ({component }) => component.has('calendarView'),
      resolve({ node, component, page }) {
        const assetsUrl = app.nui.getAssetsUrl() || ''
        const calendarView =
          component.get('calendarView') || component.blueprint?.calendarView || '';
        const defaultDate =
          component.get('default-date') || component.blueprint?.defaultDate || '';
          
        const pastDayClickAble =
          component.get('pastDayClickAble') ?? component.blueprint?.pastDayClickAble ?? true;
        const futureDayClickAble =
          component.get('futureDayClickAble')  ?? component.blueprint?.futureDayClickAble  ?? true;
        const showActionButton =
          component.get('showActionButton') || component.blueprint?.showActionButton || '';
        const dataKey =
          component.get('dataKey') || component.blueprint?.dataKey || '';
        const dataType =
          component.get('dataType') || component.blueprint?.dataType || '';
        const calendarStyle =
          component.get('calendarStyle') || component.blueprint?.calendarStyle || '';
          // const newTop = app.nui?.getSize?.(`50vw`,'height')
          let styleSheet = document.createElement('style');
          styleSheet.innerText = `
          :root {
            --calendar-width: calc(${node.style.width} - ${node.style.paddingLeft} - ${node.style.paddingRight});
            --border-width: clamp(30px,12%,60px);
          }
            .xs-date-title {
              display: flex;
              justify-content: space-between;
              text-align: center;
              cursor: pointer;
              color: #606266;
              font-size: 16px;
            }
            .Disable, .item-time{
              display: flex;
              user-select: none;
              justify-content: center;
              font-size: 17px;
              font-family: -apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              align-items: center;
            }
            .date-prev {
              font-weight: bold;
              width: 10%;
              font-family: cursive;
              user-select: none;
            }
            .date-next {
              width: 10%;
              font-weight: bold;
              user-select: none;
              font-family: cursive;
            }
            .xs-date-week {
              width: 100%;
              display: ${calendarView==="month"?"flex": calendarView==="week"?"none":""};
              justify-content: center;
              margin: 15px 0;
              font-weight: 600;
              padding-bottom: 5px;
              border-bottom: 1px solid #e4e7ed;
            }
            .xs-date-week div {
              list-style: none;
              width: calc(var(--calendar-width)/7);
              text-align: center;
              color: #606266;
              font-size: 14px;
            }
            .xs-date-day {
              width: 100%;
              display: ${calendarView==="month"?"flex": calendarView==="week"?"none":""};
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
            }
            .xs-date-day-week {
              width: 100%;
              display: ${calendarView==="week"?"flex": calendarView==="month"?"none":""};
              flex-wrap: wrap;
              align-items: center;
              justify-content: space-between;
              margin-top: 15px;
            }
            .btn-container {
              width: 100%;
              display: ${(calendarView==="month"&&showActionButton==true)?"flex": calendarView==="week"?"none":"none"};
              flex-wrap: wrap;
              height: 60px;
              align-items: center;
              justify-content: space-between;
              ${Object.keys(calendarStyle.buttonContainerStyle||{}).map(k=>`${k}: ${calendarStyle.buttonContainerStyle[k]};\n`).join("")}
          }
            .calender_cancel_btn{
              width: 45%;
              border: none;
              background-color: rgb(193, 193, 193);
              border-color: rgb(193, 193, 193);
              height: 55%;
              color: #fff;
              border-radius: 4px;
              ${Object.keys(calendarStyle?.cancelStyle||{}).map(k=>`${k}: ${calendarStyle?.cancelStyle[k]};\n`).join("")}
            }
            .calender_confirm_btn{
              width: 45%;
              background-color: rgb(41, 136, 230);
              border: none;
              border-color: rgb(193, 193, 193);
              color: #fff;
              border-radius: 4px;
              height: 55%;
              ${Object.keys(calendarStyle?.confirmStyle||{}).map(k=>`${k}: ${calendarStyle?.confirmStyle[k]};\n`).join("")}
            }
            .week-time {
              display: flex;
              flex-wrap: wrap;
              width: 80%;
              justify-content: space-between;
              align-items: center;
            }
            .week-time>div{
              padding: 6px 0;
            }
            .week-next{
              width: clamp(25px,2vh,25px);
              height: clamp(25px,2vh,25px);
              box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
              background: #fff;
              border-radius: 50%;    
              cursor: pointer;
              display: flex;
              font-weight: 800;
              justify-content: center;
              align-items: center;

            }
            .week-prev{
              width: clamp(30px,2vh,30px);
              height: clamp(30px,2vh,30px);
              display: flex;
              font-weight: 800;
              justify-content: center;
              align-items: center;
              box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
              background: #fff;
              cursor: pointer;
              border-radius: 50%;
            }
            .xs-date-day div {
              width: calc(var(--calendar-width) /7);
              height: calc(var(--calendar-width) /7);
              text-align: center;
              color: #606266;
              font-size: 14px;
              cursor: pointer;
            }
            .date-prev:hover,
            .date-next:hover,
            .xs-date-day div:hover {
              color: #409eff;
            }
            .active {
              color: #fff !important;
              user-select: none;
              border-radius: ${calendarView==="week"?"var(--border-width)":"50%"};
              background: ${calendarStyle?.selectStyle?.background||"linear-gradient(180deg, #629efe, #2988e6)"};
              color: ${calendarStyle?.selectStyle?.color||"#fff"};
            }
            .Disable {
              color: #c0c4cc !important;
            }
            .date-time{
              border-radius: 4px;
              width: clamp(60px,20%,100px);
              height: 30px;              
              flex-grow: unset;
              border: 1px solid rgb(222, 222, 223);
              background-color: ${node.style.backgroundColor};
            }
            .year-time{
              border-radius: 4px;
              width: clamp(60px,20%,100px);
              height: 30px;
              flex-grow: unset;
              border: 1px solid rgb(222, 222, 223);
              background-color: ${node.style.backgroundColor};
            }
            .month-container{
              display: flex;
              width: 40%;
              justify-content: space-between;
              align-items: center;
            }
          }
          `;
          document.head.appendChild(styleSheet);
          // node.innerHTML = `
          //   <div class="xs-date-title">
          //     <div class="month-container">
          //       <div class="date-prev"> < </div>
          //       <select class="date-time"></select>
          //       <div class="date-next"> > </div>
          //     </div>
          //     <select class="year-time"></select>
          //   </div>
          //   <div class="xs-date-week">
          //     <div>Su</div>
          //     <div>Mo</div>
          //     <div>Tu</div>
          //     <div>We</div>
          //     <div>Th</div>
          //     <div>Fr</div>
          //     <div>Sa</div>
          //   </div>
          //   <div class="xs-date-day" >
          //   </div>
          //   <div class="xs-date-day-week">
          //     <div class="week-prev"> < </div>
          //       <div class="week-time"></div>
          //     <div class="week-next"> > </div>
          //   </div>
          //   <div class="btn-container">
          //     <button class="calender_cancel_btn">Cancel</button>
          //     <button class="calender_confirm_btn">Confirm</button>
          //   </div>
          // `;
          let div1 = document.createElement('div');
          div1.className = 'xs-date-title';

          let div2 = document.createElement('div');
          div2.className = 'month-container';

          let prev = document.createElement('div');
          prev.className = 'date-prev';
          prev.textContent = ' < ';

          let date_time = document.createElement('select');
          date_time.className = 'date-time';

          let next = document.createElement('div');
          next.className = 'date-next';
          next.textContent = ' > ';

          div2.append(prev,date_time,next);
          // div2.appendChild(select1);
          // div2.appendChild(div4);

          let year_time = document.createElement('select');
          year_time.className = 'year-time';

          div1.append(div2,year_time);
          // div1.appendChild(year_time);

          let div5 = document.createElement('div');
          div5.className = 'xs-date-week';

          let days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
          for (let i = 0; i < days.length; i++) {
            let div = document.createElement('div');
            div.textContent = days[i];
            div5.appendChild(div);
          }

          let date_day = document.createElement('div');
          date_day.className = 'xs-date-day';

          let div7 = document.createElement('div');
          div7.className = 'xs-date-day-week';

          let week_prev = document.createElement('div');
          week_prev.className = 'week-prev';
          week_prev.textContent = ' < ';

          let week_time = document.createElement('div');
          week_time.className = 'week-time';

          let week_next = document.createElement('div');
          week_next.className = 'week-next';
          week_next.textContent = ' > ';

          div7.append(week_prev,week_time,week_next);
          // div7.appendChild(div9);
          // div7.appendChild(div10);

          let div11 = document.createElement('div');
          div11.className = 'btn-container';

          let cancel_btn = document.createElement('button');
          cancel_btn.className = 'calender_cancel_btn';
          cancel_btn.textContent = 'Cancel';

          let confirm_btn = document.createElement('button');
          confirm_btn.className = 'calender_confirm_btn';
          confirm_btn.textContent = 'Confirm';

          div11.appendChild(cancel_btn);
          div11.appendChild(confirm_btn);

          // 将创建的元素添加到node元素中
          node.append(div1,div5,date_day,div7,div11);
          // node.appendChild(div5);
          // node.appendChild(div6);
          // node.appendChild(div7);
          // node.appendChild(div11);
          let pageName = app.currentPage;
          // let date_time = document.querySelector(".date-time") as HTMLSelectElement;
          // let year_time = document.querySelector(".year-time") as HTMLSelectElement;
					// let prev = document.querySelector(".date-prev") as any;
					// let next = document.querySelector(".date-next") as any;
          // let week_prev = document.querySelector(".week-prev") as any;
					// let week_next = document.querySelector(".week-next") as any;
					// let date_day = document.querySelector(".xs-date-day") as any;
          // let week_time = document.querySelector(".week-time") as any;
          // let cancel_btn = document.querySelector(".calender_cancel_btn") as any;
          // let confirm_btn = document.querySelector(".calender_confirm_btn") as any;
          let date = defaultDate === "today"?new Date():new Date(defaultDate); //当前时间
          let require_day = new Date(date.getFullYear(),date.getMonth(),date.getDate());
          let color_day = new Date(date.getFullYear(),date.getMonth(),date.getDate());
          let current_time = new Date(date.getFullYear(),date.getMonth(),date.getDate());
					let get_day = require_day.getDay();
          let ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
          let ws = ['Su','Mo','Tu','We','Th','Fr','Sa'];
          ms.map(e=>date_time.options.add(new Option(e)));
          ((last = 121, next = 10)=>{
            let currentYear = new Date().getFullYear()
            let startYear:number = currentYear - last
            for (let i = 0; i < last + next; i++) {
              year_time.options.add(new Option(startYear.toString()))
              startYear++
            }
          })();
          app.updateRoot(draft => {
            // set(draft?.[pageName], dataKey,dataType.toLowerCase()=="date"?current_time.toLocaleString("en-US", { day: "2-digit",year: "numeric",month: "2-digit" }):dataType.toLowerCase()=="timestamp"?current_time.getTime()/1000:"");
            node.firstChild.nodeValue&&(node.firstChild.nodeValue = ``)
          })
					function updateTime() {
						let year = date.getFullYear(); //当前年份
						let month = date.getMonth() + 1 + ""; //当前月
						+month < 10 ? month = "0" + month : month;
						let day = date.getDate()+ ""; //当前天 
						+day < 10 ? day = "0" + day : day;
						date_day.innerHTML = "";
						week_time.innerHTML = "";
            let setDate = new Date(year, +month, 0);
						let setDay = setDate.getDate(); //这个月天数
            if(calendarView==="month"){
              //渲染头部
              let setWeek = new Date(year, +month - 1, 1).getDay(); //上个月星期几
              let setDayEM = new Date(year, +month - 1, 0).getDate(); //上个月天数
              // let current_month_date =new Date(year, +month, 0).getDay(); //本月最后一天所在的星期
						  setWeek <= 0 ? setWeek = 7 : setWeek;
              for (let i = (setDayEM - setWeek) + 1; i <= setDayEM; i++) {
                let EmptyDiv = document.createElement('div')  as any;
                EmptyDiv.innerText = i;
                EmptyDiv.className = "Disable";
                date_day.appendChild(EmptyDiv);
              }
              // 渲染日期
              for (let i = 1; i <= setDay; i++) {
                let TimeDiv = document.createElement('div')  as any;
                TimeDiv.innerText = i;
                TimeDiv.className = "item-time";
                if(new Date(date.getFullYear(),date.getMonth(),date.getDate()).setDate(i)<require_day.setHours(0, 0, 0, 0)){
                  if(pastDayClickAble==true){
                    TimeDiv.className = "item-time"
                  }else if(pastDayClickAble==false){
                    TimeDiv.className = "Disable"
                  }
                }else if(new Date(date.getFullYear(),date.getMonth(),date.getDate()).setDate(i)>require_day.setHours(0, 0, 0, 0)){
                  if(futureDayClickAble==true){
                    TimeDiv.className = "item-time"
                  }else if(futureDayClickAble==false){
                    TimeDiv.className = "Disable"
                  }
                }
                if (current_time.toDateString()==date.toDateString()&&i == +day) {
                  TimeDiv.classList.add("active");
                }
                date_day.appendChild(TimeDiv);
              }
              // 渲染尾部
              for (let i = 1; i <= (42 - setWeek - setDay); i++) {
              // for (let i = 1; i <= (6- current_month_date); i++) {
                let DisDiv = document.createElement('div')  as any;
                DisDiv.innerText = i;
                DisDiv.className = "Disable";
                date_day.appendChild(DisDiv);
              }
              date_time.value = ms[date.getMonth()];
              year_time.value = date.getFullYear()+ "";
            }else if(calendarView==="week"){
              let i = 0;
              let fragment = document.createDocumentFragment();
              while (i <= 6) {
                let TimeDiv = document.createElement('div')  as any;
                let TimeDivWeek = document.createElement('div')  as any;
                let TimeDivText = document.createElement('div')  as any;
                  let times = new Date(date.getTime());
                  times.setDate(times.getDate() - get_day + i);
                  if (times.setHours(0, 0, 0, 0) == color_day.setHours(0, 0, 0, 0)) {
                    TimeDiv.className = "item-time";
                    TimeDiv.classList.add("active");
                  }else if(times.setHours(0, 0, 0, 0)==require_day.setHours(0, 0, 0, 0)){
                      TimeDiv.className = "item-time"
                  }else if(times.setHours(0, 0, 0, 0)<require_day.setHours(0, 0, 0, 0)){
                    if(pastDayClickAble==true){
                      TimeDiv.className = "item-time"
                    }else if(pastDayClickAble==false){
                      TimeDiv.className = "Disable"
                    }
                  }else {
                    if(futureDayClickAble==true){
                      TimeDiv.className = "item-time"
                    }else if(futureDayClickAble==false){
                      TimeDiv.className = "Disable"
                    }
                  }
                  TimeDivText.innerText = times.getDate();
                  TimeDivText.className = `text_day`
                  TimeDivWeek.innerText = ws[i];
                  TimeDiv.style.cssText = `
                    display: flex;
                    cursor: pointer;
                    flex-wrap: nowrap;
                    flex-direction: column;
                    width: 11%;
                  `;
                  TimeDivWeek.style.cssText = `
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 5px;
                  `
                  TimeDiv.append(TimeDivWeek,TimeDivText)
                  fragment.append(TimeDiv)
                  if(i==6){
                    date_time.value = ms[times.getMonth()];
                    year_time.value = times.getFullYear()+ "";
                  }
                  i++;
                }
                week_time.appendChild(fragment);
              }
						itemClick(year,month);
					}
					updateTime();
          date_time.onchange = (e)=>{
            if(calendarView==="month"){
              date.setMonth(ms.indexOf(date_time.value));
            }else{
              date = new Date(date.getFullYear(),ms.indexOf(date_time.value),1);
              get_day = date.getDay();
            }
						updateTime();
          }
					prev.onclick = function() {
						date.setMonth(date.getMonth() - 1);
						updateTime();
					};
					next.onclick = function() {
						date.setMonth(date.getMonth() + 1);
						updateTime();
					};
					year_time.onchange = function() {
            if(calendarView==="month"){
              date.setFullYear(+year_time.value); 
            }else{
              date = new Date(+year_time.value,date.getMonth(),1);
              get_day = date.getDay();
            }
						updateTime();
					};
          week_prev.onclick = function() {
            date.setDate(date.getDate() + date.getDay() - 8);
            get_day = date.getDay();
            updateTime();
					};
					week_next.onclick = function() {
            date.setDate(date.getDate() - date.getDay() + 8 );
            get_day = date.getDay();
            updateTime();
					};

          if(showActionButton==true){
            cancel_btn.onclick = function() {
              setTimeout(()=>{
                // @ts-ignore
                component.get("onCancelClick")?.execute()
              })
            };
            confirm_btn.onclick = function() {
              app.updateRoot(draft => {
                set(draft?.[pageName], dataKey,dataType.toLowerCase()=="date"?current_time.toLocaleString("en-US", { day: "2-digit",year: "numeric",month: "2-digit" }):dataType.toLowerCase()=="timestamp"?color_day.getTime()/1000:"");
              })
              setTimeout(()=>{
                // @ts-ignore
                component.get("onSelectClick")?.execute()
              })
            };
          }
					function itemClick(year,month) {
						let item_time = document.querySelectorAll(`.item-time`);
						for (let i = 0; i < item_time.length; i++) {
							(item_time[i] as HTMLElement).onclick = function() {
								for (let i = 0; i < item_time.length; i++) {
									(item_time[i] as HTMLElement).classList.remove("active");
								}
								(item_time[i] as HTMLElement).classList.add("active");
                if(calendarView==="month"){
                  date = new Date(year,month-1,+(item_time[i] as HTMLElement).innerText)
                  current_time = new Date(year,month-1,+(item_time[i] as HTMLElement).innerText)
                  if(showActionButton==false){
                    app.updateRoot(draft => {
                      set(draft?.[pageName], dataKey,dataType.toLowerCase()=="date"?current_time.toLocaleString("en-US", { day: "2-digit",year: "numeric",month: "2-digit" }):dataType.toLowerCase()=="timestamp"?current_time.getTime()/1000:"");
                    })
                    console.log()
                  }
                }else if(calendarView==="week"){
                  color_day = new Date(year,month-1,+(item_time[i].querySelector(`.text_day`) as HTMLElement).innerText)
                  current_time = color_day;
                  app.updateRoot(draft => {
                    set(draft?.[pageName], dataKey,dataType.toLowerCase()=="date"?current_time.toLocaleString("en-US", { day: "2-digit",year: "numeric",month: "2-digit" }):dataType.toLowerCase()=="timestamp"?current_time.getTime()/1000:"");
                  })
                }
                  setTimeout(()=>{
                    // @ts-ignore
                    component.get("onDateClick")?.execute()
                  })
							}
						}
					}

      },
      

    },
    '[App] scheduleSlot': {
      cond: 'scheduleSlot',
     resolve({ node, component }) {
        let pageName = app.currentPage;
        const providerId =
          component.get('providerId') || component.blueprint?.providerId || '';
        const facilityId =
          component.get('facilityId') || component.blueprint?.facilityId || '';
          
        const locationId =
          component.get('locationId') || component.blueprint?.locationId || "";
        const timeSlot =
          component.get('data-timeSlot')  ||  "";
        const dataKey =
          component.get('data-value') || component.blueprint?.dataKey || {};
        let data:any = timeSlot;
        // if(providerId){
        //   data = ( get_lists({type: "providerId",value: providerId,url: "getDoctorInFacility"}))["data"];
        // }else if(facilityId){
        //   data = ( get_lists({type: "facilityId",value: providerId,url: "getDoctorInFacility"}))["data"];
        // }else if(locationId){
        //   data =( get_lists({type: "locationId",value: providerId,url: "getRoomInFacility"}))["data"];
        // }else if(timeSlot){
        //   data = timeSlot;
        // }
      // get_lists({type: "locationId",value: "YLbf0gAAAAAD2gAAAAAAAA==",url: "getRoomInFacility"}).then(res=>{
      //   data =  res?.["data"]||[]
      //   console.log(data)
      //   // return ;
      //   },rej=>{
      //     rej("ddd")
      //   });    
        data = timeSlot;
        const len:any = Array.isArray(data)?data.length:undefined;
        let i = 0;
        let con_coc:any= {
          status: 0,
          timeMessage: "",
          nextTime: 0,
          new_arr: []
        } 
        if(!data){
          con_coc.status = 3;
          // con_coc.timeMessage = "No available, contact to book";
        }else if(len>0){
          let index_m_n = 0;
          con_coc.new_arr = Array.from({length: 5},()=>{
            let date = new Date().setHours(24*i,0,0,0);
            let obj = {
              week: new Intl.DateTimeFormat("en-US", {weekday: "short"}).format(date),
              mday: new Intl.DateTimeFormat("en-US", {month: "short",day: "numeric"}).format(date),
              back_color: "a",
              date
            };
            i++;
            return obj;
          });
          for (let index = 0; index < con_coc.new_arr.length; index++) {
            const element:any = con_coc.new_arr[index];
            for (let index_m = index_m_n; index_m < timeSlot.length; index_m++) {
              const ele = timeSlot[index_m];
              const index_time = new Date().setHours(24*index,0,0,0);
              const ele_time = new Date(+ele?.gte*1000).setHours(0,0,0,0);
              if(ele_time==index_time){
                element.back_color = "back_color"
                index_m_n = index_m+1;
                break;
              }
              if(index ==0&&index_m==timeSlot.length - 1&&ele_time<index_time){
                con_coc.timeMessage = "No available, contact to book";
                con_coc.status = 2
                break;
              }
              if(index ==4&&con_coc.new_arr.every(e=>e.back_color=='a')&&ele_time>index_time){
                con_coc.timeMessage = "Next Available " + new Intl.DateTimeFormat("en-US", {weekday: "short",month: "short",day: "2-digit"}).format(+ele?.gte*1000);
                con_coc.status = 1
                con_coc.nextTime = ele_time;
                break;
              }
            }
          }
        }else if(len==0){
          con_coc.status = 2;
          con_coc.timeMessage = "No available, contact to book";
        }
        const container = document.createElement("div");
        let styleSheet = document.createElement('style');
        styleSheet.innerText = `
        @scope (#${node.id}){
          .times_con{
            display: flex;
            justify-content: space-between;
            cursor: pointer;
            border-radius: 5px;
            width: 16%;
            height: 100%;
            padding: 1%;
            flex-wrap: wrap;
            align-items: center;
            font-size: clamp(12px,1vw,16px);
            background: #f0f2f4;
            color: #c1c1c1;
          }
          #con{
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            height: 100%;
          }
          .back_color{
            background: #e9f2fc;
            color: #000;
          }
        }
        `;
        container.id = "con"
        if(con_coc.status ===0){
          con_coc.new_arr.forEach(v=>{
            const ele = document.createElement("div");
            const week_ele = document.createElement("p");
            const mday_ele = document.createElement("p");
            week_ele.textContent = v.week;
            mday_ele.textContent = v.mday;
            ele.setAttribute("date",v.date+"")
            ele.classList.add("times_con",v.back_color);
            week_ele.style.fontWeight = "600";
            ele.append(week_ele,mday_ele)
            container.appendChild(ele)
          });
        }else if(con_coc.status ===1){
          const ele = document.createElement("div");
          ele.className = "times_con"
          ele.classList.add("next")
          ele.setAttribute("nextTime",con_coc.nextTime+"")
          ele.textContent = con_coc.timeMessage;
          container.appendChild(ele)
          styleSheet.innerText = `
          @scope (#${node.id}){
            .times_con {
              display: flex;
              justify-content: center;
              cursor: pointer;
              color: #000;
              border-radius: 5px;
              width: 100%;
              height: 100%;
              align-items: center;
              font-size: clamp(12px,1vw,16px);
              font-weight: 600;
            }
            #con{
              display: flex;
              justify-content: space-around;
              align-items: center;
              width: 100%;
              height: 100%;
              background: #e9f2fc;
            }
          }
          `;
        }else if(con_coc.status ===2){
          const ele = document.createElement("div");
          ele.className = "times_con"
          ele.classList.add("available")
          ele.textContent = con_coc.timeMessage;
          container.appendChild(ele)
          styleSheet.innerText = `
          @scope (#${node.id}){
            .times_con {
              display: flex;
              justify-content: center;
              cursor: pointer;
              color: #000;
              border-radius: 5px;
              width: 100%;
              height: 100%;
              align-items: center;
              font-size: clamp(12px,1vw,16px);
              font-weight: 600;
            }
            #con{
              display: flex;
              justify-content: space-around;
              align-items: center;
              width: 100%;
              height: 100%;
              background: #fff4e0;
            }
          }
          `;
        }else if(con_coc.status ===3){
          node.style.display = "none";
        }
        node.append(container)
        document.head.appendChild(styleSheet);

        document.querySelectorAll("div.back_color").forEach(e=>{
          e.addEventListener("click",()=>{
            let d = new Date((+e.getAttribute("date")));
              let day = d.getDate();
              let month = d.getMonth()+1;
              let year = d.getUTCFullYear();
              app.updateRoot(draft => {
                set(draft?.[pageName], dataKey,{
                  stime: (+e.getAttribute("date"))/1000,
                  day,
                  month,
                  year,
                  etime:(+e.getAttribute("date"))/1000+86400
                });
              });
              setTimeout(()=>{
                // @ts-ignore
                component.get("onDateClick")?.execute()
              })
          })
        });
        document.querySelectorAll("div.available").forEach(e=>{
          e.addEventListener("click",()=>{
              setTimeout(()=>{
              // @ts-ignore
              component.get("onDateClick")?.execute()
            })
          })
        })
        document.querySelectorAll("div.next").forEach(e=>{
          e.addEventListener("click",()=>{
            let d = new Date((+e.getAttribute("nextTime")));
              let day = d.getDate();
              let month = d.getMonth()+1;
              let year = d.getUTCFullYear();
              app.updateRoot(draft => {
                set(draft?.[pageName], dataKey,{
                  stime: (+e.getAttribute("nextTime"))/1000,
                  day,
                  month,
                  year,
                  etime:(+e.getAttribute("nextTime"))/1000+86400
                });
              });
              setTimeout(()=>{
                // @ts-ignore
                component.get("onDateClick")?.execute()
              })
          })
        })
      },
    }
    
  }

  return u
    .entries(domResolvers)
    .reduce(
      (acc, [name, obj]) => acc.concat({ ...obj, name }),
      [] as Resolve.Config[],
    )
}

export default createExtendedDOMResolvers
