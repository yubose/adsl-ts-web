import _ from 'lodash'
import { NOODLElement } from 'app/types/pageTypes'
import { RoomParticipant } from 'app/types'
import Stream from './Stream'
import Substreams from './Substreams'

class MeetingStreams {
  #mainStream: Stream
  #selfStream: Stream
  #subStreams: Substreams | null = null

  constructor() {
    this.#mainStream = new Stream('mainStream')
    this.#selfStream = new Stream('selfStream')
  }

  getMainStream() {
    return this.#mainStream
  }

  getSelfStream() {
    return this.#selfStream
  }

  isMainStreaming(node: NOODLElement | null) {
    return this.#mainStream.isSame(node)
  }

  isSelfStreaming(node: NOODLElement | null) {
    return this.#selfStream.isSame(node)
  }

  subStreamsContainerExists() {
    return this.#subStreams instanceof Substreams
  }

  createSubStreamsContainer(container: NOODLElement) {
    this.#subStreams = new Substreams(container)
    return this.getSubStreamsContainer()
  }

  getSubStreamsContainer() {
    return this.#subStreams
  }

  addSubStream(node: NOODLElement) {
    if (this.#subStreams) {
      if (!this.#subStreams.has(node)) {
        this.#subStreams.add(node)
      } else {
        //
      }
    } else {
      //
    }
    return this
  }

  isElementSubstreaming(node: NOODLElement) {
    return !!this.#subStreams?.elementExists(node)
  }

  isParticipantSubstreaming(participant: RoomParticipant) {
    return !!this.#subStreams?.participantExists(node)
  }

  getSubStream(participant: RoomParticipant): Stream | null
  getSubStream(participantSid: string): Stream | null
  getSubStream(node: NOODLElement): Stream | null
  getSubStream(node: string | NOODLElement | RoomParticipant) {
    if (_.isString(node)) {
      const sid = node
    } else if (node instanceof Element) {
      //
    } else if (node) {
      const participant = node
    } else {
      //
    }
    return null
  }
}

export default MeetingStreams
