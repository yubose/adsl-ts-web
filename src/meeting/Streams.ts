import { inspect } from 'util'
import { ComponentObject } from 'noodl-types'
import { NUI } from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { RoomParticipant } from '../app/types'
import Stream from '../meeting/Stream'
import Substreams from '../meeting/Substreams'

class MeetingStreams {
  #mainStream: Stream
  #selfStream: Stream
  #subStreams: Substreams | null = null;

  [inspect.custom]() {
    return {
      ...this.snapshot(),
    }
  }

  constructor() {
    this.#mainStream = new Stream('mainStream')
    this.#selfStream = new Stream('selfStream')
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

  getMainStream() {
    return this.#mainStream
  }

  getSelfStream() {
    return this.#selfStream
  }

  isMainStreaming(participant: RoomParticipant) {
    return this.#mainStream.isSameParticipant(participant)
  }

  isSelfStreaming(participant: RoomParticipant) {
    return this.#selfStream.isSameParticipant(participant)
  }

  getSubStreamsContainer() {
    return this.#subStreams
  }

  subStreamsContainerExists() {
    return this.#subStreams instanceof Substreams
  }

  createSubStreamsContainer(
    container: NOODLDOMElement,
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

  snapshot() {
    const getSubstreamsSnapshot = () => ({
      items:
        this.#subStreams?.getSubstreamsCollection().map((subStream, index) => {
          return {
            index,
            hasElement: subStream.hasElement(),
            hasParticipant: subStream.isAnyParticipantSet(),
          }
        }) || [],
    })

    const snapshot = {
      mainStream: {
        hasElement: this.mainStream.hasElement(),
        hasParticipant: this.mainStream.isAnyParticipantSet(),
      },
      selfStream: {
        hasElement: this.selfStream.hasElement(),
        hasParticipant: this.selfStream.isAnyParticipantSet(),
      },
      get subStreams() {
        return getSubstreamsSnapshot()
      },
    }

    return snapshot
  }
}

export default MeetingStreams
