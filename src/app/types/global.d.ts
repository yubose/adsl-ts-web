import NOODL, { Account } from '@aitmed/cadl'
import { Room, Participant, LocalParticipant } from 'twilio-video'

declare global {
  interface Window {
    cadl: NOODL
    noodl: NOODL
    account: typeof Account
    env: string | undefined
    twilio: any
    room: Room | null
  }
}
