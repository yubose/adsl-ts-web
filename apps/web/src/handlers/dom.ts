import * as u from '@jsmanifest/utils'
import log from '../log'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import tippy, { followCursor, MultipleTargets } from 'tippy.js'
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
} from 'noodl-ui'
import App from '../App'
import is from '../utils/is'
import { hide } from '../utils/dom'
// import Swiper from 'swiper';
// import '../../node_modules/swiper/swiper-bundle.css';
import flatpickr from 'flatpickr'
// import "../../node_modules/flatpickr/dist/flatpickr.min.css"
import "../../node_modules/flatpickr/dist/themes/material_blue.css"
// import moment from "moment"

type ToolbarInput = any
// import { isArray } from 'lodash'

const createExtendedDOMResolvers = function (app: App) {
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
    page: NDOMPage | ComponentPage
  }) {
    let { component, dataKey, node, evtName, iteratorVar = '', page } = args
    let actionChain = component.get(evtName) as NUIActionChain | undefined
    let pageName = page.page

    async function onChange(event: Event) {
      pageName !== page.page && (pageName = page.page)

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
            set(draft?.[pageName], dataKey, value)
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
        // log.log("test actionChain",actionChain)
        await actionChain?.execute?.(event)
      }
    }

    return onChange
  }

  ;(function () {
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
          if (dataValue.chartType) {
            let chartType = dataValue.chartType.toString()
            switch (chartType) {
              // case 'graph': {
              //   let myChart = echarts.init(node)
              //   let option = dataValue
              //   option && myChart.setOption(option)
              //   break
              // }
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
                  let defaultData = dataValue.chartData;
                  defaultData = defaultData.filter((element)=>{
                    if(!(+element.etime - +element.stime === 86400))return element;
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
                      delete element.stime
                      delete element.etime
                      delete element.visitReason
                      delete element.eventColor
                    })
                  } else {
                    defaultData = []
                  }
                  let initialView = "timeGridDay";
                  if(dataValue.dataWeek == "week"){
                    if(dataValue.dataDay === "day"){
                    initialView = "timeGridDay";
                    }else{
                      initialView = "timeGridWeek";
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
                    viewDidMount(mountArg) {},
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
                          (info.event._def.extendedProps.name??info.event._def.extendedProps.Reason) +
                          '</div>\
                                        <div style="padding:4px 0">Sta rtTime：' +
                          formatDate(
                            new Date(
                              info.event._instance.range.start,
                            ).getTime() +
                              new Date().getTimezoneOffset() * 60 * 1000,
                            'HH:mm:ss',
                          ) +
                          '</div>\
                          <div>Duration：' +
                          info.event._def.extendedProps.timeLength +
                          ' minutes' +
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
                    },
                  })
                  app.instances.FullCalendar = {
                    inst: calendar,
                    page: pageName,
                  }
                  if(dataValue.start&&dataValue.end){
                    if(dataValue.currentDate){
                      if(dataValue.dataWeek == "week"){
                        calendar.gotoDate( dataValue.start*1000)
                      }else{
                        calendar.gotoDate( dataValue.currentDate*1000)
                      }
                    }else if(dataValue.end - dataValue.start>86400){
                    calendar.gotoDate( new Date().getTime())
                    }else{
                    calendar.gotoDate( dataValue.start*1000)
                    }
                  }
                  calendar.render();
                  window.setTimeout(() => {
                    (
                      document.querySelectorAll(
                        'tbody .fc-timegrid-now-indicator-line',
                      )[0] as HTMLDivElement
                    )?.scrollIntoView({ behavior: 'smooth' });
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
                  let timeTable = document.querySelector("[data-name=timeTable]") as HTMLElement;
                  let titleTime = document.getElementsByClassName('fc-toolbar-title')[0];
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
                    ];
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
                    ];
                  timeTable?.addEventListener('click',(e)=>{
                      dataValue.data = ''
                  },true)
                  function getEventTime(){
                    let getMonth =  titleTime.textContent?.split(" ")[0] as string;
                    let getDay =  titleTime.textContent?.split(" ")[1]?.split(",")[0] as string;
                    let getYear=  titleTime.textContent?.split(",")[1] as string;
                    let getTimeNow = new Date(+getYear, (+months.indexOf(getMonth)),+getDay).getTime();
                    if(dataValue.currentDate!==dataValue.start){
                      dataValue.start = dataValue.currentDate;
                    dataValue.end = dataValue.currentDate + 86400;
                    }else{
                      dataValue.start = getTimeNow/1000;
                    dataValue.end = getTimeNow/1000 + 86400;
                    }
                  }
                  function getEventTimeWeek(){
                    let getMonth =  titleTime.textContent?.split(" ")[0] as string;
                    let getDay =  titleTime.textContent?.split("-")[0]?.split(" ")[1] as string;
                    let getYear=  titleTime.textContent?.split(",")[1] as string;
                    let getTimeNow = new Date(+getYear, (+abbMonths.indexOf(getMonth)),+getDay).getTime();
                    dataValue.start = getTimeNow/1000;
                    dataValue.end = getTimeNow/1000 + 604800;
                    if(!dataValue.currentDate){
                      dataValue.currentDate = new Date(new Date().toLocaleDateString()).getTime()/1000;
                    }
                  }
                  docEventPrevClick.addEventListener('click', (e) => {
                    if(!dataValue.dataWeek&&dataValue.dataWeek !== 'week'){
                      getEventTime();
                    }else{
                      getEventTimeWeek()
                    }
                    if(!(dataValue.dataDay||dataValue.dataWeek)||(dataValue.dataDay =="day"&&dataValue.dataWeek == '')){
                      dataValue.currentDate = dataValue.start;
                    }
                    dataValue.data = 'prev';
                  })
                  docEventNextClick.addEventListener('click', (e) => {
                    if(!dataValue.dataWeek&&dataValue.dataWeek !== 'week'){
                      getEventTime();
                    }else{
                      getEventTimeWeek()
                    }
                    if(!(dataValue.dataDay||dataValue.dataWeek)||(dataValue.dataDay =="day"&&dataValue.dataWeek == '')){
                      dataValue.currentDate = dataValue.start;
                    }
                    dataValue.data = 'next';
                  })
                  docEventDayClick.addEventListener('click', (e) => {
                    getEventTime();
                    dataValue.data = 'day'
                    dataValue.dataDay = 'day'
                    dataValue.dataWeek = ''
                    titleTime.textContent =  ""

                  })
                  docEventWeekClick.addEventListener('click', (e) => {
                    getEventTimeWeek();
                    dataValue.data = 'week'
                    dataValue.dataWeek = 'week'
                    dataValue.dataDay = ''
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
      cond: ({ node }) => isTextFieldLike(node),
      before({ node, component }) {
        ;(node as HTMLInputElement).value = component.get('data-value') || ''
        node.dataset.value = component.get('data-value') || ''
        if (node.tagName === 'SELECT') {
          if ((node as HTMLSelectElement).length) {
            // Put the default value to the first option in the list
            ;(node as HTMLSelectElement)['selectedIndex'] = 0
          }
        }
      },
      resolve({ node, component, page }) {
        const iteratorVar = findIteratorVar(component)
        const dataKey =
          component.get('data-key') || component.blueprint?.dataKey || ''
        const maxLen = component.get('maxLength') || '';
        const showFocus = component.get('showSoftInput') || '';
        if (maxLen) {
          node?.setAttribute('maxlength', maxLen)
        }
        if (dataKey) {
          if (
            component?.type == 'textField' &&
            component?.contentType == 'password'
          ) {
            node.addEventListener(
              'input',
              getOnChange({
                component,
                dataKey,
                evtName: 'onInput',
                node: node as NDOMElement,
                iteratorVar,
                page,
              }),
            )
          } else {
            node.addEventListener(
              'change',
              getOnChange({
                component,
                dataKey,
                evtName: 'onChange',
                node: node as NDOMElement,
                iteratorVar,
                page,
              }),
            )

            if (component?.type == 'textField') {
              node.addEventListener(
                'input',
                component.blueprint.debounce
                  ? antiShake(
                      getOnChange({
                        component,
                        dataKey,
                        evtName: 'onInput',
                        node: node as NDOMElement,
                        iteratorVar,
                        page,
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
                    }),
              )
            }
            if (component?.type == 'textView') {
              node.addEventListener(
                'input',

                getOnChange({
                  component,
                  dataKey,
                  evtName: 'onInput',
                  node: node as NDOMElement,
                  iteratorVar,
                  page,
                }),
              )
            }
          }
        }
        if (component.blueprint?.onBlur) {
          node.addEventListener(
            'blur',
            getOnChange({
              node: node as NDOMElement,
              component,
              dataKey,
              evtName: 'onBlur',
              iteratorVar,
              page,
            }),
          )
        }
        if(showFocus){
          node?.setAttribute("showSoftInput","true")
          setTimeout(()=>{
            node?.focus();
          },100)
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
            ;(node as HTMLImageElement).src = url
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
                var str = ''
                var showName = ''
                var specialityArr = element.information.speciality
                var Name = element.information.name
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
            setTimeout(() => {
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
            })
          }
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
      },
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
              const seconds = get(draft, dataKey, 0)
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
            direction?: 'vertical' | 'horizontal'
            spaceBetween?: number
            autoplay?:
              | boolean
              | {
                  delay: number
                  stopOnLastSlide?: boolean
                  disableOnInteraction?: boolean
                }
            slidesPerView?: number
            effect?: 'slide' | 'fade' | 'cube' | 'coverflow' | 'flip'
            pagination?:
              | boolean
              | {
                  type?: 'bullets' | 'fraction' | 'progressbar' | 'custom'
                  clickable?: boolean
                }
            navigation?: boolean
            childStyle?: {
              width?: number | string
              height?: number | string
            }
            loop?: boolean
          }

          const dataValue = component.get('data-value') as (
            | { [key in string]: any }
            | string
          )[]
          const videoData = component.get('video-option')
          // log.log(videoData,"kkkk")
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
                // img.style.cursor = "pointer" ;
                liDom.appendChild(img)
                listDom.appendChild(liDom)
              }
            }
          }
          for (let index = 0; index < listDom.childElementCount; index++) {
            ;(listDom.children[index] as HTMLLIElement).setAttribute(
              'class',
              'swiper-slide',
            )
            ;(listDom.children[index] as HTMLLIElement).style.cssText = `
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
            loop: option.loop,
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
                  // @ts-ignore
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
          log.error('Image array is empty')
        }
      },
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
          let fragment: null | DocumentFragment =
            document.createDocumentFragment()
          // let childrenConta = document.createElement('div')
          node.textContent = "";
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
        let chechedC = `{
          content: "";
          display: inline-block;
          vertical-align: middle;
          width: 13px;
          height: 13px;
          background-image: url(selectGray.svg);
          background-size: 100%;
        }`
        let chechedCheck = `{
          background-image: url(selectGrayBlue.svg);
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
          for (let i = 0; i < dataValue['allData'].length; i++) {
            let childInput = document.createElement('input')
            let spanDom = document.createElement('div')
            let contanierDiv = document.createElement('div')

            if(dataOptions["module"]=== "radio"){
              childInput.type = 'radio';
              childInput.name = "radio";
            }else{
              childInput.type = 'checkbox'
            }
            childInput.value = i + '';

            spanDom.textContent = get(dataValue['allData'][i],dataValue["path"])
            if (dataValue['selectedData'].includes(i)) {
              childInput.checked = true;
              app.updateRoot((draft) => {
                set(draft?.[pageName], dataKey, dataValue['selectedData'])
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
              let styleKey = `${
                Object.keys(dataOptions['containerStyle'])[index]
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
            let dataInput = +(e.target as HTMLInputElement).value;
            if ((e.target as HTMLInputElement).nodeName == 'INPUT') {
              let selected = dataValue['selectedData'] as any
              if(dataOptions["module"]=== "radio"){
                selected = [];
                selected[0] = dataInput;
              }else{
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
              if(dataOptions["data"]){
                const keys = Object.keys(dataOptions["data"]);
                const values = Object.values(dataOptions["data"]);

                for(let i = 0;i<keys.length;i++){
                  app.updateRoot((draft) => {
                    set(draft?.[pageName], keys[i], get(dataValue['allData'][dataInput],`${values[i]}`));
                  })
                }
              }

              // app.root.Global.checkboxArr = selected
              set(app.root.Global,dataOptions["checkName"],selected);
              localStorage.setItem('Global', JSON.stringify(app.root.Global))
            }
          })
          // node.appendChild(childrenConta)
        }
      },
    },
    '[App] Calendar': {
      cond: 'calendar',
      resolve({ node, component }) {
        const inputTarget = document.createElement("input");
        inputTarget.style.width = node.style.width;
        inputTarget.style.height = node.style.height;
        // inputTarget.setAttribute("class","latpickr form-control input")
        flatpickr(inputTarget,{
          // altInput: true,
          // enableTime: true,
          appendTo: node,
          dateFormat: "Y-m-d",
          // altFormat: "DD-MM-YYYY",
          allowInput: true,
          // inline: true,
          // parseDate: (datestr, format) => {
          //   return moment(datestr, format, true).toDate();
          // },
          // formatDate: (date, format, locale) => {
          //   // locale can also be used
          //   return moment(date).format(format);
          // }
          // onChange: function(selectedDates, dateStr, instance){
          //   log.log(selectedDates, dateStr, instance)

          //   instance.calendarContainer.style.visibility = "visible"
          // }
        });
      node.append(inputTarget);

        // if (node && Object.keys(component.get('data-value'))) {
        // }
      },
    },
    '[App] chatList': {
      cond: 'chatList',
      resolve({ node, component }) {
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
        class liveChat {
          protected chatBox: HTMLElement
          private dataSource: Array<any>
          private pdfCss: PdfCss
          private boxCss: BoxCss
          constructor(dataSource: Array<any>) {
            this.dataSource = dataSource
            this.chatBox = document.createElement('div')
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
            this.setBox()
            for (let i = 0; i < this.dataSource.length; i++) {
              this.chatBox.appendChild(this.judgeType(this.dataSource[i]))
            }
          }

          private setBox() {
            this.chatBox.style.cssText = `
              position: absolute;
              width: ${this.boxCss.width};
              height: ${this.boxCss.height};
              overflow: auto;
              background-color: #f2f2f2;
            `
          }

          public dom() {
            return this.chatBox
          }

          private createTextNode(Msg: any): HTMLElement {
            let domNode = this.createChatNode()
            let domNodeContent: HTMLElement
            let chatBackground: string
            ;[domNode, domNodeContent, chatBackground] = this.judgeIsOwner(
              domNode,
              this.IsOwner(Msg.bsig),
            )
            const urlRegex =
              /(\b((https?|ftp|file|http):\/\/)?((?:[\w-]+\.)+[a-z0-9]+)[-A-Z0-9+&@#%?=~_|!:,.;]*[-A-Z0-9+&@#%=~_|])/gi
            // const urlRegex = /\b(?:(http|https|ftp):\/\/)?((?:[\w-]+\.)+[a-z0-9]+)((?:\/[^/?#]*)+)?(\?[^#]+)?(#.+)?$/ig;
            let data = Msg.name.data
            if (typeof data == 'string') {
              data = JSON.parse(data)
            }
            let messageInfo = data.text.replace(urlRegex, (url) => {
              return `<a href = "${url}">${url}</a>`
            })
            let textContent = document.createElement('div')
            // textContent.innerHTML = Msg.message.info
            textContent.innerHTML = messageInfo
            textContent.style.cssText = `
                margin-top: 10px;
                border-radius: 10px;
                padding: 5px 7.5px 5px 7.5px;
                background-color: ${chatBackground};
                word-wrap: break-word;
            `
            domNodeContent.appendChild(textContent)
            return domNode
          }

          private createPdfNode(Msg: any): HTMLElement {
            let domNode = this.createChatNode()
            let domNodeContent: HTMLElement
            ;[domNode, domNodeContent] = this.judgeIsOwner(
              domNode,
              this.IsOwner(Msg.bsig),
            )
            let pdfInfo = this.judgePdfIsOwner(
              domNodeContent,
              this.IsOwner(Msg.bsig),
            )
            pdfInfo.innerHTML = `
                <div>${Msg.name.data.text}</div>
                <div style='font-size: 12pxcolor: grey;'>${Msg.name.data.text}</div>
            `
            return domNode
          }

          private judgeType(Msg: any): HTMLElement {
            let domNode: HTMLElement
            switch (Msg.name.title) {
              case 'textMessage':
                domNode = this.createTextNode(Msg)
                return domNode
              case 'pdfMessage':
                domNode = this.createPdfNode(Msg)
                return domNode
              default:
                return new HTMLElement()
            }
          }

          private createChatNode(): HTMLElement {
            let domNode = document.createElement('div')
            domNode.style.cssText = `
              width: 100%;
              height: auto;
              margin: 10px 0px 10px 0px;
              display: flex;
            `
            return domNode
          }

          private createChatNodeContent(): HTMLElement {
            let domNodeContent = document.createElement('div')
            domNodeContent.style.cssText = `
                max-width: 60%;
                width: auto;
                height: auto;
            `
            return domNodeContent
          }

          private createChatNodeAvatar(): HTMLElement {
            let domNodeAvatar = document.createElement('img')
            domNodeAvatar.src = './assert/avatar.png'
            domNodeAvatar.style.cssText = `
                width: 50px;
                height: 50px;
                border-radius: 5px;
                margin: auto 10px auto 10px;
            `
            return domNodeAvatar
          }

          private IsOwner(ovid: string): boolean {
            let judgeOvid = localStorage.getItem('user_vid')
            return ovid === judgeOvid
          }

          private judgeIsOwner(
            domNode: HTMLElement,
            isOwner: boolean,
          ): [HTMLElement, HTMLElement, string] {
            let domNodeContent = this.createChatNodeContent()
            let domNodeAvatar = this.createChatNodeAvatar()
            let chatBackground = '#FFFFFF'
            if (isOwner) {
              domNode.style.justifyContent = 'end'
              domNode.appendChild(domNodeContent)
              domNode.appendChild(domNodeAvatar)
              chatBackground = '#A9EA7A'
            } else {
              domNode.style.justifyContent = 'start'
              domNode.appendChild(domNodeAvatar)
              domNode.appendChild(domNodeContent)
              chatBackground = '#FFFFFF'
            }
            return [domNode, domNodeContent, chatBackground]
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
              margin: ${
                (this.pdfCss.pdfContentHeight - this.pdfCss.pdfIconHeight) / 2
              }px 10px ${
              (this.pdfCss.pdfContentHeight - this.pdfCss.pdfIconHeight) / 2
            }px 10px;
            `
            let pdfInfo = document.createElement('div')
            pdfInfo.style.cssText = `
                width: ${
                  this.pdfCss.pdfContentWidth - this.pdfCss.pdfIconWidth - 40
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
        // const scrollH = component
        const scrollH = component.get('data-value') || '' || 'dataKey'
        const liveChatObject = new liveChat(component.get('listObject'))
        let liveChatBox = liveChatObject.dom()
        node.innerHTML = liveChatBox.innerHTML
        // node.appendChild(liveChatBox)
        setTimeout(() => {
          node.scrollTop = scrollH == 0 ? node.scrollHeight : node.scrollHeight - scrollH
        }, 0)

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
