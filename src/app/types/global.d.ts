import NOODL, { Account } from '@aitmed/cadl'
import { Room, Participant, LocalParticipant } from 'twilio-video'
import { App } from '../../app'

declare global {
  interface Window {
    cadl: NOODL
    noodl: NOODL
    noodlui: App
    account: typeof Account
    env: string | undefined
    twilio: any
    room: Room | null
    getDataValues: any
  }
}
