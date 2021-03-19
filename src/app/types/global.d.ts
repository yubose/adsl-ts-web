import { NOODL, NOODLComponent, ProxiedComponent } from 'noodl-ui'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import echarts from '@types/echarts'
import Modal from 'components/NOODLModal'
import Meeting from '../../meeting'
import { App } from '../../app'

declare global {
  const echarts: echarts

  interface Window {
    ac: any
    account: any
    addRemoteParticipant: any
    app: any
    build: any
    componentCache: any
    noodl: any
    env: string | undefined
    FCMOnTokenReceive: any
    getByDataUX: any
    getDataValues: any
    components: NOODLComponent[]
    pcomponents: ProxiedComponent[]
    meeting: Meeting
    modal: Modal
    noodlui: NOODL
    ndom: any
    redraw: any
    room: Room | null
    streams: any
    cp: Function
    // noodl-ui
    // twilio-video
    twilio: any
  }
}
