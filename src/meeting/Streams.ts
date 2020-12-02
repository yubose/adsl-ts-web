import _ from 'lodash'
import { ProxiedComponent } from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import { RoomParticipant } from '../app/types'
import Stream from '../meeting/Stream'
import Substreams from '../meeting/Substreams'

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
    props: ProxiedComponent,
  ) {
    this.#subStreams = new Substreams(container, props)
    return this.#subStreams
  }

  isSubStreaming(participant: RoomParticipant) {
    return this.#subStreams?.participantExists(participant)
  }
}

export default MeetingStreams
