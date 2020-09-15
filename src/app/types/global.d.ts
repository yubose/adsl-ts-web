import CADL, { Account } from '@aitmed/cadl'
import { NOODL, NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import Modal from 'components/NOODLModal'
import Meeting from '../../Meeting'
import { App } from '../../app'
import { IStreams } from './meetingTypes'

declare module 'redux-logger'

declare global {
  interface Window {
    // client.ts
    // index.ts
    account: typeof Account
    noodl: CADL
    env: string | undefined
    getDataValues: any
    components: NOODLComponent[]
    pcomponents: NOODLComponentProps[]
    meeting: Meeting
    modal: Modal
    noodlui: NOODL
    room: Room | null
    streams: IStreams
    // noodl-ui
    // twilio-video
    twilio: any
  }
}
