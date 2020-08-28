import NOODL, { Account } from '@aitmed/cadl'
import { Room, Participant, LocalParticipant } from 'twilio-video'
import Modal from 'components/NOODLModal'
import { App } from '../../app'

declare global {
  interface Window {
    cadl: NOODL
    modal: Modal
    noodl: NOODL
    noodlui: App
    account: typeof Account
    env: string | undefined
    twilio: any
    room: Room | null
    getDataValues: any
  }
}
