import { inspect } from '../../utils/common'
import {
  RoomParticipant,
  RoomParticipantTrackPublication,
  RoomTrack,
  StreamType,
} from '../../app/types'
import MeetingStream from '../../meeting/Stream'

export class MockStream extends MeetingStream {
  #node: HTMLElement | null = null
  #participant = null as RoomParticipant | null
  previous: { sid?: string; identity?: string } = {}
  type: StreamType | null = null
  events = new Map<string, ((...args: any[]) => any)[]>();

  [inspect]() {
    return this.snapshot()
  }

  constructor(type: StreamType, { node }: { node?: HTMLElement } = {}) {
    super(type, { node })
    if (node) this.#node = node
    this.type = type
    if (!type) console.log({ this: this, node })
  }

  // getElement() {
  //   return this.#node
  // }
  // hasElement() {
  //   return !!this.#node
  // }
  // setElement(node: HTMLElement | null) {
  //   this.#node = node
  //   return this
  // }
  // removeElement() {
  //   return this
  // }
  // isSameElement(node: HTMLElement | null) {
  //   return this.#node === node
  // }
  reloadTracks(only?: 'audio' | 'video') {
    const audioElem = document.createElement('audio')
    const videoElem = document.createElement('video')
    this.#node?.appendChild(audioElem)
    this.#node?.appendChild(videoElem)
    return this
  }
}

function getMockStream(...args: ConstructorParameters<typeof MockStream>) {
  return new MockStream(...args)
}

export default getMockStream
