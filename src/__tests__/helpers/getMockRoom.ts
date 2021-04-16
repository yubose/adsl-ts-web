import { Room } from 'twilio-video'
import { LiteralUnion } from 'type-fest'
import { EventEmitter } from 'events'

type MockRoomEvent = LiteralUnion<
  'participantConnected' | 'participantDisconnected' | 'disconnected',
  string
>

export class MockRoom extends EventEmitter {
  state: 'connected' | 'disconnected' = 'disconnected'

  constructor(opts?: { state?: MockRoom['state'] }) {
    super()
    if (opts) {
      opts.state && (this.state = opts.state)
    }
  }

  async join() {
    this.state = 'connected'
    return this
  }

  async disconnect() {
    //
  }

  emit<Evt extends MockRoomEvent>(evt: Evt, ...args) {
    super.emit(evt, ...args)
    return this
  }

  on<Evt extends MockRoomEvent>(evt: Evt, cb: (...args: any[]) => any) {
    super.on(evt, cb)
    return this
  }
}

function getMockRoom(...args) {
  // @ts-expect-error
  return new MockRoom(...args) as Room
}

export default getMockRoom
