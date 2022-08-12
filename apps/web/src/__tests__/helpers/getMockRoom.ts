import * as u from '@jsmanifest/utils'
import { RemoteParticipant, Room } from 'twilio-video'
import { LiteralUnion } from 'type-fest'
import { EventEmitter } from 'events'
import getMockParticipant from './getMockParticipant'

type MockRoomEvent = LiteralUnion<
  'participantConnected' | 'participantDisconnected' | 'disconnected',
  string
>

export class MockRoom extends EventEmitter {
  _isMock = true
  // @ts-expect-error
  localParticipant = null as Room['localParticipant']
  participants = new Map() as Room['participants']
  sid = u.getRandomKey()
  state: 'connected' | 'disconnected' = 'disconnected'

  constructor(opts?: {
    localParticipant?: MockRoom['localParticipant']
    participants?: MockRoom['participants'] | Record<string, RemoteParticipant>
    sid?: string
    state?: MockRoom['state']
  }) {
    super()
    if (opts) {
      opts.localParticipant && (this.localParticipant = opts.localParticipant)
      opts.sid && (this.sid = opts.sid)
      opts.state && (this.state = opts.state)

      if (opts.participants) {
        if (opts.participants instanceof Map) {
          for (const [sid, participant] of opts.participants) {
            this.participants.set(sid, participant)
          }
        } else if (u.isObj(opts.participants)) {
          u.entries(opts.participants).forEach(([sid, participant]) => {
            this.participants.set(sid, participant)
          })
        }
      }
    }
  }

  async join() {
    this.state = 'connected'
    !this.localParticipant &&
      (this.localParticipant = getMockParticipant() as any)
    return this
  }

  async disconnect() {
    this.state = 'disconnected'
  }

  emit<Evt extends MockRoomEvent>(evt: Evt, ...args: any[]) {
    super.emit(evt, ...args)
    return this
  }

  on<Evt extends MockRoomEvent>(evt: Evt, cb: (...args: any[]) => any) {
    super.on(evt, cb)
    return this
  }
}

function getMockRoom(...args: ConstructorParameters<typeof MockRoom>) {
  // @ts-expect-error
  return new MockRoom(...args) as Room
}

export default getMockRoom
