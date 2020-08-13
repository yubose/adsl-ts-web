import NOODL, { Account } from '@aitmed/cadl'
import { Room, Participant, LocalParticipant } from 'twilio-video'

declare global {
  interface Window {
    noodl: NOODL
    account: typeof Account
    env: string | undefined
    twilio: any
    participant: Participant
    lparticipant: LocalParticipant
    room: Room | null
  }
}
