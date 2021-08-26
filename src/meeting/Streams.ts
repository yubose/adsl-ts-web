import { ComponentObject } from 'noodl-types'
import { NUI } from 'noodl-ui'
import { NDOMElement } from 'noodl-ui-dom'
import { RoomParticipant } from '../app/types'
import Stream from '../meeting/Stream'
import Substreams from '../meeting/Substreams'

class MeetingStreams {
  #mainStream: Stream
  #selfStream: Stream
  #subStreams: Substreams | null = null;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
    }
  }

  constructor() {
    this.#mainStream = new Stream('mainStream')
    this.#selfStream = new Stream('selfStream')
  }

  toString() {
    return JSON.stringify(this.snapshot(), null, 2)
  }

  get mainStream() {
    return this.#mainStream
  }

  get selfStream() {
    return this.#selfStream
  }

  get subStreams() {
    return this.#subStreams
  }

  createSubStreamsContainer(
    container: NDOMElement,
    opts?: {
      blueprint?: ComponentObject
      resolver?: typeof NUI.resolveComponents
    },
  ) {
    this.#subStreams = new Substreams(container, opts)
    return this.#subStreams
  }

  isSubStreaming(participant: RoomParticipant) {
    return this.#subStreams?.participantExists(participant)
  }

  reset() {
    this.mainStream.reset()
    this.selfStream.reset()
    this.subStreams?.reset()
  }

  snapshot() {
    return {
      mainStream: this.mainStream.snapshot(),
      selfStream: this.selfStream.snapshot(),
      subStreams:
        this.subStreams
          ?.getSubstreamsCollection()
          .map((stream) => stream.snapshot()) || [],
    }
  }
}

export default MeetingStreams
