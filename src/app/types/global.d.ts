import type { NOODL, NOODLComponent, ProxiedComponent } from 'noodl-ui'
import type {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import type HTML2Canvas, { Options } from 'html2canvas'
import type * as jsPDF from 'jspdf'
import type NOODLDOM from 'noodl-ui-dom'
import type echarts from '@types/echarts'
import type { Calendar } from '@fullcalendar/core'
import type Modal from 'components/NOODLModal'
import type Meeting from '../../meeting'
import type { App } from '../../app'
import type { TwilioVideo } from './twilio'

declare global {
  const echarts: echarts
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
    ac: any
    account: any
    addRemoteParticipant: any
    app: any
    build: any
    cache: any
    noodl: any
    env: string | undefined
    FCMOnTokenReceive: any
    getDataValues: any
    components: NOODLComponent[]
    pageObject: any
    pcomponents: ProxiedComponent[]
    meeting: Meeting
    modal: Modal
    nui: NOODL
    ndom: NOODLDOM
    redraw: any
    room: Room | null
    spamToasts: any
    streams: any
    cp: Function
    // noodl-ui
    // twilio-video
    twilio: any
  }
}
