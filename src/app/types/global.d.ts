import { NOODL, NOODLComponent, ProxiedComponent } from 'noodl-ui'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import NOODLDOM from 'noodl-ui-dom'
import echarts from '@types/echarts'
import Modal from 'components/NOODLModal'
import Meeting from '../../meeting'
import { App } from '../../app'

declare global {
  const echarts: echarts
  const gridjs: any
  const mapboxgl: any
  export const self: ServiceWorkerGlobalScope

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
    getByDataUX: any
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
