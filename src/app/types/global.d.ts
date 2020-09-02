import CADL, { Account } from '@aitmed/cadl'
import { NOODL } from 'noodl-ui'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import Modal from 'components/NOODLModal'
import { App } from '../../app'
import Meeting from '../../Meeting'

declare global {
  interface Window {
    // client.ts
    // index.ts
    account: typeof Account
    noodl: CADL
    env: string | undefined
    getDataValues: any
    meeting: Meeting
    modal: Modal
    noodlui: NOODL
    room: Room | null
    // noodl-ui
    // twilio-video
    twilio: any
    // makeParticipants.ts
    addParticipant: (participant: RemoteParticipant) => void
    removeParticipant: (participant: RemoteParticipant) => void
    participant: RemoteParticipant
    lparticipant: LocalParticipant
    participants: {
      primary: null | RemoteParticipant
      secondary: RemoteParticipant[]
    }
  }
}
