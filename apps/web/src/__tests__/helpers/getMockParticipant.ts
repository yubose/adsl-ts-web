import { RemoteParticipant } from 'twilio-video'
import { getRandomKey } from '../../utils/common'

export class MockParticipant {
  sid = getRandomKey()
  identity = 'mike'
  tracks = new Map()
  audioTracks = new Map()
  videoTracks = new Map()
  on() {}
  once() {}
  off() {}
}

function getMockParticipant() {
  // @ts-expect-error
  return new MockParticipant() as RemoteParticipant
}

export default getMockParticipant
