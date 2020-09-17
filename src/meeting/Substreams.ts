import _ from 'lodash'
import { NOODLElement } from 'app/types/pageTypes'
import { RoomParticipant } from 'app/types'
import Logger from 'app/Logger'
import Stream from './Stream'

const log = Logger.create('Substreams.ts')

/** The container for subStreams */
class MeetingSubstreams {
  #recentlyAddedParticipantStream: Stream | null = null
  container: NOODLElement
  #subStreams: Stream[] = []

  constructor(container: NOODLElement) {
    this.container = container
  }

  /**
   * Adds an element to the subStreams collection
   * If index is passed, it will insert the stream at the specified index
   * @param { NOODLElement } node
   * @param { number? } index
   */
  addElement(node: NOODLElement, index?: number) {
    if (node) {
      const stream = new Stream('subStream', node)
      if (_.isNumber(index)) {
        this.#subStreams.splice(index, 0, stream)
      } else {
        this.#subStreams.push(stream)
      }
    } else {
      //
    }
    return this
  }

  /**
   * Adds a participant to the subStreams collection on a stream that has an
   * available participant "slot"
   * NOTE: This function assumes that a participant does NOT already exist in
   *    the subStreams collection. Therefore be sure to call
   *    this.participantExists() to check before calling
   * @param { RoomParticipant } participant
   */
  addParticipant(participant: RoomParticipant) {
    if (participant) {
      let stream: Stream | undefined = undefined
      if (this.hasAvailableParticipantSlot()) {
        const index = this.getEmptyParticipantSlot()
        if (index !== -1) {
          stream = this.#subStreams[index]
          stream.setParticipant(participant)
        } else {
          log.func('addParticipant')
          log.red(
            `A stream was available to bind this participant to but received ` +
              `an invalid index. A new Stream will be created instead`,
            participant,
          )
        }
        if (!stream) {
          stream = new Stream('selfStream')
          stream.setParticipant(participant)
        }
        this.#subStreams.push(stream)
        log.func('addParticipant')
        log.green(`Bound a participant to a subStream`, {
          participant,
          stream,
        })
        this.#recentlyAddedParticipantStream = stream
      } else {
        // Start a new stream in the subStreams collection and attach this
        // participant to it (it does not have an element associated with it yet)
        stream = new Stream('selfStream')
        stream.setParticipant(participant)
        this.#recentlyAddedParticipantStream = stream
        this.#subStreams.push(stream)
      }
    } else {
      // TODO
    }
    return this
  }

  /**
   * Returns true if the element is already in the list of subStreams
   * @param { NOODLElement } node
   */
  elementExists(node: NOODLElement) {
    return _.filter(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameElement(node)
    })
  }

  /**
   * Returns true if the participant is already in the list of subStreams
   * @param { RoomParticipant } participant
   */
  participantExists(participant: RoomParticipant) {
    return _.some(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameParticipant(participant)
    })
  }

  hasAvailableParticipantSlot() {
    return _.some(this.#subStreams, (subStream) => {
      return !subStream.getParticipant()
    })
  }

  getEmptyParticipantSlot() {
    return _.findIndex(
      this.#subStreams,
      (subStream) => !subStream.getParticipant(),
    )
  }

  /** Returns the most recent stream that added a participant */
  getLastAddedParticipantStream() {
    return this.#recentlyAddedParticipantStream
  }
}

export default MeetingSubstreams
