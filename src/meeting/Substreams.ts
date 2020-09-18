import _ from 'lodash'
import { NOODLElement } from 'app/types/pageTypes'
import { RoomParticipant } from 'app/types'
import Logger from 'app/Logger'
import Stream from './Stream'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'

const log = Logger.create('Substreams.ts')

/** The container for subStreams */
class MeetingSubstreams {
  #recentlyAddedParticipantStream: Stream | null = null
  #subStreams: Stream[] = []
  blueprint: Partial<NOODLComponent> = {} // Experimental
  container: NOODLElement

  constructor(container: NOODLElement, props: NOODLComponentProps) {
    this.container = container
    log.func('constructor')
    log.green('Props', props)
  }

  get length() {
    return this.#subStreams.length
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
   *
   * NOTE: This function assumes that a participant does NOT already exist in
   * the subStreams collection. Therefore be sure to call
   * .participantExists() to check before calling
   * @param { RoomParticipant } participant
   */
  addParticipant(participant: RoomParticipant) {
    if (participant) {
      let stream: Stream | undefined = undefined
      // Check if a stream does not have any participant bound to it
      if (this.hasAvailableParticipantSlot()) {
        // Retrieve the index of the stream that doesn't have a
        // participant bound to it
        const index = this.getEmptyParticipantSlot()
        if (index !== -1) {
          // Bind the participant to it and load their tracks to the DOM
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
          stream = new Stream('subStream')
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
        // Else start a new stream in the subStreams collection and attach this
        // participant to it (it does not have an element associated with it
        // yet unless stream.setElement is called with an element)
        stream = new Stream('subStream')
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
   * Returns true if the element is already bound to a subStream in the
   * collection
   * @param { NOODLElement } node
   */
  elementExists(node: NOODLElement) {
    return _.filter(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameElement(node)
    })
  }

  /**
   * Returns true if the participant is already bound to a subStream in
   * the collection
   * @param { RoomParticipant } participant
   */
  participantExists(participant: RoomParticipant) {
    return _.some(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameParticipant(participant)
    })
  }

  /**
   * Returns true if a subStream in the collection doesn't have any
   * participant bound to it
   */
  hasAvailableParticipantSlot() {
    return _.some(this.#subStreams, (subStream) => {
      return !subStream.hasParticipant()
    })
  }

  /**
   * Returns the index of a subStream in the collection that doesn't have a
   * participant bound to it
   */
  getEmptyParticipantSlot() {
    const fn = (subStream: Stream) => !subStream.hasParticipant()
    return _.findIndex(this.#subStreams, fn)
  }

  /** Returns the stream that a participant was most recently bound to  */
  getLastAddedParticipantStream() {
    return this.#recentlyAddedParticipantStream
  }

  /**
   * Returns the stream from the subStreams collection, null otherwise
   * @param { RoomParticipant } participant
   */
  getSubStream(participant: RoomParticipant) {
    const fn = (subStream: Stream) => subStream.isSameParticipant(participant)
    return _.find(this.#subStreams, fn)
  }

  /**
   * Removes the given stream from the subStreams collection
   * If stream was passed as an index then it is used as the index to remove
   * the stream that is found at that position in the collection
   * @param { Stream | number } stream - Stream or index to remove
   */
  removeSubStream(stream: Stream): this
  removeSubStream(index: number): this
  removeSubStream(stream: Stream | number) {
    if (stream instanceof Stream) {
      const fn = (s: Stream) => s !== stream
      this.#subStreams = _.filter(this.#subStreams, fn)
    } else if (_.isNumber(stream)) {
      const index = stream
      if (_.inRange(index, 0, this.#subStreams.length)) {
        this.#subStreams.splice(index, 1)
      }
    }
    return this
  }

  /** Returns the first subStream in the collection */
  first() {
    return this.#subStreams[0]
  }
}

export default MeetingSubstreams
