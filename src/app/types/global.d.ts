import CADL, { Account } from '@aitmed/cadl'
import {
  Room,
  Participant,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import Modal from 'components/NOODLModal'
import { App } from '../../app'

declare global {
  interface Window {
    // client.ts
    // index.ts
    account: typeof Account
    noodl: CADL
    env: string | undefined
    getDataValues: any
    modal: Modal
    noodlui: App
    room: Room | null
    // noodl-ui
    // twilio-video
    twilio: any
    // makeParticipants.ts
    addParticipant: (participant: RemoteParticipant) => void
    removeParticipant: (participant: RemoteParticipant) => void
    participants: {
      primary: null | RemoteParticipant
      secondary: RemoteParticipant[]
    }
  }
}
