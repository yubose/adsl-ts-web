import _ from 'lodash'
import {
  IStreams,
  RoomParticipant,
  StreamNode,
  ParticipantStreamObject,
  ParticipantStreamMap,
} from 'app/types/meetingTypes'
import Logger from 'app/Logger'
import { DOMNode } from 'app/types'

const log = Logger.create('Streams.ts')

class MeetingStreams implements IStreams {
  #mainStream: ParticipantStreamObject = { node: null, participant: null }
  #selfStream: ParticipantStreamObject = { node: null, participant: null }
  #subStreams: ParticipantStreamMap = new Map()
  #subStreamsContainer: DOMNode | null = null

  get mainStream() {
    return this.#mainStream
  }

  setMainStream(obj: ParticipantStreamObject) {
    this.#mainStream = {
      ...this.#mainStream,
      ...obj,
    }
    return this
  }

  get selfStream() {
    return this.#selfStream
  }

  setSelfStream(obj: ParticipantStreamObject) {
    this.#selfStream = {
      ...this.#selfStream,
      ...obj,
    }
    return this
  }

  setSubStreamsContainer(node: DOMNode | null) {
    this.#subStreamsContainer = node
    return this
  }

  getSubStreams() {
    return this.#subStreams
  }
}

export default MeetingStreams
