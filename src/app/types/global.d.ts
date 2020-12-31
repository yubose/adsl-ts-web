import { NOODL, NOODLComponent, ProxiedComponent } from 'noodl-ui'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import Modal from 'components/NOODLModal'
import Meeting from '../../meeting'
import { App } from '../../app'

declare global {
  interface Window {
    // client.ts
    // index.ts
    ac: any
    account: any
    app: any
    build: any
    componentCache: any
    noodl: any
    env: string | undefined
    getByDataUX: any
    getDataValues: any
    components: NOODLComponent[]
    pcomponents: ProxiedComponent[]
    meeting: Meeting
    modal: Modal
    noodlui: NOODL
    noodluidom: any
    redraw: any
    room: Room | null
    streams: any
    cp: Function
    // noodl-ui
    // twilio-video
    twilio: any
  }
}
