import _ from 'lodash'
import {
  IStreams,
  RoomParticipant,
  StreamNode,
  ParticipantStreamObject,
  ParticipantStreamMap,
} from 'app/types/meetingTypes'
import Logger from 'app/Logger'

const log = Logger.create('Streams.ts')

class NOODLStreams implements IStreams {
  #mainStream: ParticipantStreamObject = { node: null, participant: null }
  #selfStream: ParticipantStreamObject = { node: null, participant: null }
  #subStreams: ParticipantStreamMap = new Map()

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

  get subStreams() {
    return this.#subStreams
  }
}

export default NOODLStreams
