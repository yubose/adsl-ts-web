import type { NUI as nui, NuiComponent, NDOM } from 'noodl-ui'
import type HTML2Canvas from 'html2canvas'
import type * as jsPDF from 'jspdf'
// import type echarts from '@types/echarts'
import type { Calendar } from '@fullcalendar/core'
import type Meeting from '../../meeting'
import type App from '../../app'
import type { TwilioVideo } from './twilio'

declare global {
  // const echarts: echarts
  const gridjs: any
  export const FullCalendar: {
    Calendar: typeof Calendar
  }

  export const html2canvas: typeof HTML2Canvas
  export const jspdf: typeof jsPDF

  const mapboxgl: any
  export const self: DedicatedWorkerGlobalScope

  export const Twilio = {
    Video: TwilioVideo,
  }

  interface Window {
    __NOODL_SDK_SEARCH_CLIENT__: any
    __NOODL_SEARCH_CLIENT__: any
    ac: any
    app: any
    build: any
    local: any
    cache: App['cache']
    chrome: any
    get: () => any
    noodl: any
    env: string | undefined
    FCMOnTokenReceive: any
    getDataValues: any
    components: NuiComponent.Instance[]
    pageObject: any
    pcomponents: NuiComponent.Instance[]
    meeting: typeof Meeting
    nui: typeof nui
    ndom: NDOM
    streams: any
    cp: Function
  }
}
